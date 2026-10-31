<?php
/**
 * The Grand Royale Palace Hotel & Spa - Billing, Folios & Payments
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

$msg = '';
$err = '';

// Handle recording a payment
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'record_payment') {
    $folioId = intval($_POST['folio_id'] ?? 0);
    $amount = floatval($_POST['amount'] ?? 0);
    $method = $_POST['payment_method'] ?? 'Cash';
    $notes = trim($_POST['transaction_notes'] ?? '');

    if ($folioId <= 0 || $amount <= 0) {
        $err = 'Please enter a valid payment amount.';
    } else {
        $fStmt = $pdo->prepare("SELECT * FROM folios WHERE id = ?");
        $fStmt->execute([$folioId]);
        $folio = $fStmt->fetch();

        if (!$folio) {
            $err = 'Guest folio not found.';
        } else {
            // Insert payment transaction
            $payStmt = $pdo->prepare("INSERT INTO payments (folio_id, amount, payment_method, transaction_ref, notes, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $ref = strtoupper(substr($method, 0, 3)) . '-' . substr(uniqid(), -6);
            $payStmt->execute([$folioId, $amount, $method, $ref, $notes]);

            // Update folio paid amount and balance
            $newPaid = $folio['paid_amount'] + $amount;
            $newBalance = max(0, $folio['total_amount'] - $newPaid);
            $newStatus = ($newBalance <= 0) ? 'Settled' : 'Open';

            $updFolio = $pdo->prepare("UPDATE folios SET paid_amount = ?, balance = ?, status = ? WHERE id = ?");
            $updFolio->execute([$newPaid, $newBalance, $newStatus, $folioId]);

            // Update booking balance
            $updBk = $pdo->prepare("UPDATE bookings SET paid_amount = paid_amount + ?, balance = balance - ? WHERE id = ?");
            $updBk->execute([$amount, $amount, $folio['booking_id']]);

            logAudit($pdo, 'Payment Recorded', "Folio #{$folio['folio_number']}: Received ₹$amount via $method (Ref: $ref)");
            $msg = "Payment of ₹" . number_format($amount, 2) . " ($method) recorded successfully!";
        }
    }
}

// Handle adding manual folio charge (e.g. Minibar, Airport Pickup, Laundry)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_charge') {
    $folioId = intval($_POST['folio_id'] ?? 0);
    $desc = trim($_POST['description'] ?? '');
    $category = $_POST['category'] ?? 'Miscellaneous';
    $amount = floatval($_POST['amount'] ?? 0);

    if ($folioId <= 0 || empty($desc) || $amount <= 0) {
        $err = 'Please provide valid charge details.';
    } else {
        $chargeStmt = $pdo->prepare("INSERT INTO folio_items (folio_id, description, category, amount, created_at) VALUES (?, ?, ?, ?, NOW())");
        $chargeStmt->execute([$folioId, $desc, $category, $amount]);

        // Add to folio total and balance
        $upd = $pdo->prepare("UPDATE folios SET total_amount = total_amount + ?, balance = balance + ?, status = 'Open' WHERE id = ?");
        $upd->execute([$amount, $amount, $folioId]);

        // Add to booking total
        $fRow = $pdo->query("SELECT booking_id FROM folios WHERE id = $folioId")->fetch();
        if ($fRow) {
            $pdo->prepare("UPDATE bookings SET total_amount = total_amount + ?, balance = balance + ? WHERE id = ?")->execute([$amount, $amount, $fRow['booking_id']]);
        }

        logAudit($pdo, 'Folio Charge Added', "Added charge: $desc (₹$amount)");
        $msg = "Charge of ₹" . number_format($amount, 2) . " posted to guest folio.";
    }
}

// Fetch all folios with guest and room info
$folios = $pdo->query("
    SELECT f.*, b.booking_code, b.check_in_date, b.check_out_date, b.status as booking_status,
           g.full_name as guest_name, g.phone as guest_phone,
           r.room_number, r.room_type
    FROM folios f
    JOIN bookings b ON f.booking_id = b.id
    JOIN guests g ON b.guest_id = g.id
    JOIN rooms r ON b.room_id = r.id
    ORDER BY (f.status = 'Open') DESC, f.created_at DESC
")->fetchAll();

$totalBilled = 0;
$totalCollected = 0;
$totalOutstanding = 0;
foreach ($folios as $f) {
    $totalBilled += $f['total_amount'];
    $totalCollected += $f['paid_amount'];
    $totalOutstanding += $f['balance'];
}

$pageTitle = 'Billing, Folios & Payment Accounts';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="card mb-4" style="border-left: 4px solid var(--gold);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
            <h2 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 4px;">Guest Folios & Payment Ledger</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Manage guest accounts, apply room and incidentals charges, log multi-mode payments (Cash, Card, UPI), and print GST Tax Invoices.</p>
        </div>
    </div>
</div>

<?php if ($msg): ?>
    <div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($msg) ?></div>
<?php endif; ?>
<?php if ($err): ?>
    <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> <?= htmlspecialchars($err) ?></div>
<?php endif; ?>

<!-- Financial Summary KPIs -->
<div class="grid grid-3 mb-4">
    <div class="card stat-card">
        <span class="stat-label">Total Billed Revenue</span>
        <div class="stat-value" style="color: #fff;">₹<?= number_format($totalBilled, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Across all active guest folios</span>
    </div>
    <div class="card stat-card">
        <span class="stat-label">Total Realized Collections</span>
        <div class="stat-value" style="color: var(--emerald);">₹<?= number_format($totalCollected, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Cash, Card, UPI & Bank settlements</span>
    </div>
    <div class="card stat-card" style="<?= $totalOutstanding > 0 ? 'border-color: rgba(239, 68, 68, 0.4);' : '' ?>">
        <span class="stat-label">Pending Balance / Receivables</span>
        <div class="stat-value" style="color: <?= $totalOutstanding > 0 ? '#ef4444' : 'var(--emerald)' ?>;">₹<?= number_format($totalOutstanding, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Due from active in-house guests</span>
    </div>
</div>

<!-- Folio Directory Table -->
<div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <h3 style="font-size: 1.15rem; font-weight: 600;">Guest Master Folio Registry</h3>
        <input type="text" id="folioSearch" placeholder="Search folio #, guest, room..." class="form-control" style="max-width: 280px;" onkeyup="searchFolios()">
    </div>

    <div class="table-responsive">
        <table class="table" id="folioTable">
            <thead>
                <tr>
                    <th>Folio Number</th>
                    <th>Guest / Room</th>
                    <th>Stay Dates</th>
                    <th>Total Billed</th>
                    <th>Paid Amount</th>
                    <th>Outstanding Due</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($folios)): ?>
                    <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No folios generated yet.</td></tr>
                <?php else: ?>
                    <?php foreach ($folios as $f): ?>
                        <tr>
                            <td>
                                <strong style="color: var(--gold-light); font-family: monospace; font-size: 0.95rem;"><?= htmlspecialchars($f['folio_number']) ?></strong>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Bk #<?= htmlspecialchars($f['booking_code']) ?></div>
                            </td>
                            <td>
                                <strong style="color: #fff; font-size: 0.95rem;"><?= htmlspecialchars($f['guest_name']) ?></strong>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">
                                    <span class="badge badge-occup" style="padding: 2px 6px; font-size: 0.7rem;">Room <?= htmlspecialchars($f['room_number']) ?></span>
                                    <span><?= htmlspecialchars($f['room_type']) ?></span>
                                </div>
                            </td>
                            <td style="font-size: 0.82rem; color: var(--text-muted);">
                                <div><?= date('d M', strtotime($f['check_in_date'])) ?> &rarr; <?= date('d M Y', strtotime($f['check_out_date'])) ?></div>
                                <div style="font-size: 0.75rem; color: var(--gold-light);"><?= htmlspecialchars($f['booking_status']) ?></div>
                            </td>
                            <td style="font-weight: 600;">₹<?= number_format($f['total_amount'], 2) ?></td>
                            <td style="color: var(--emerald); font-weight: 600;">₹<?= number_format($f['paid_amount'], 2) ?></td>
                            <td>
                                <?php if ($f['balance'] > 0): ?>
                                    <span style="color: #ef4444; font-weight: 700; font-size: 0.95rem;">₹<?= number_format($f['balance'], 2) ?></span>
                                <?php else: ?>
                                    <span style="color: var(--emerald); font-weight: 600;"><i class="fa-solid fa-check"></i> Nil</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($f['status'] === 'Settled'): ?>
                                    <span class="badge" style="background: rgba(16,185,129,0.2); color: #10b981;">SETTLED</span>
                                <?php else: ?>
                                    <span class="badge" style="background: rgba(245,158,11,0.2); color: #f59e0b;">OPEN</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="display: flex; gap: 6px;">
                                    <?php if ($f['balance'] > 0): ?>
                                        <button class="btn btn-primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="openPaymentModal(<?= $f['id'] ?>, '<?= htmlspecialchars($f['folio_number']) ?>', <?= $f['balance'] ?>, '<?= addslashes($f['guest_name']) ?>')">
                                            <i class="fa-solid fa-credit-card"></i> Pay
                                        </button>
                                    <?php endif; ?>
                                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="openAddChargeModal(<?= $f['id'] ?>, '<?= htmlspecialchars($f['folio_number']) ?>')">
                                        <i class="fa-solid fa-plus"></i> Post Charge
                                    </button>
                                    <a href="invoice.php?folio_id=<?= $f['id'] ?>" target="_blank" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" title="View & Print GST Tax Invoice">
                                        <i class="fa-solid fa-file-invoice"></i> Invoice
                                    </a>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Record Payment Modal -->
<div id="paymentModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
    <div class="card" style="max-width: 480px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-heading); color: var(--gold-light);" id="paymentModalTitle">Receive Payment</h3>
            <button onclick="document.getElementById('paymentModal').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;">&times;</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="record_payment">
            <input type="hidden" name="folio_id" id="payFolioId" value="0">
            <div class="form-group mb-3">
                <label>Guest / Folio</label>
                <input type="text" id="payGuestName" class="form-control" readonly style="opacity: 0.8;">
            </div>
            <div class="grid grid-2 mb-3">
                <div class="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" step="0.01" name="amount" id="payAmount" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <select name="payment_method" class="form-control" required>
                        <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                        <option value="Card">Credit / Debit Card (POS)</option>
                        <option value="Cash">Cash (Front Desk)</option>
                        <option value="Bank Transfer">NEFT / RTGS Transfer</option>
                    </select>
                </div>
            </div>
            <div class="form-group mb-4">
                <label>Reference / Transaction ID / Notes</label>
                <input type="text" name="transaction_notes" class="form-control" placeholder="e.g. UPI Ref #4092817291">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('paymentModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-receipt"></i> Submit Payment</button>
            </div>
        </form>
    </div>
</div>

<!-- Add Folio Charge Modal -->
<div id="addChargeModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
    <div class="card" style="max-width: 480px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-heading); color: var(--gold-light);" id="chargeModalTitle">Post Incidental Charge</h3>
            <button onclick="document.getElementById('addChargeModal').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;">&times;</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="add_charge">
            <input type="hidden" name="folio_id" id="chargeFolioId" value="0">
            <div class="form-group mb-3">
                <label>Charge Category</label>
                <select name="category" class="form-control" required>
                    <option value="Minibar">Minibar Consumption</option>
                    <option value="Laundry">Express Guest Laundry</option>
                    <option value="Spa & Wellness">Royal Ayurveda & Spa</option>
                    <option value="Airport Transfer">Luxury Airport Chauffeur</option>
                    <option value="Late Checkout">Late Checkout Surcharge</option>
                    <option value="Damage Fee">Property Damage Fee</option>
                    <option value="Miscellaneous">Miscellaneous Service</option>
                </select>
            </div>
            <div class="form-group mb-3">
                <label>Charge Description *</label>
                <input type="text" name="description" class="form-control" placeholder="e.g. 2x Heineken + 1x Cashews minibar" required>
            </div>
            <div class="form-group mb-4">
                <label>Amount (₹) *</label>
                <input type="number" step="0.01" name="amount" class="form-control" placeholder="0.00" required>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('addChargeModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Post to Folio</button>
            </div>
        </form>
    </div>
</div>

<script>
function openPaymentModal(folioId, folioNum, balance, guestName) {
    document.getElementById('payFolioId').value = folioId;
    document.getElementById('paymentModalTitle').textContent = 'Receive Payment - ' + folioNum;
    document.getElementById('payGuestName').value = guestName + ' (Balance Due: ₹' + balance.toFixed(2) + ')';
    document.getElementById('payAmount').value = balance;
    document.getElementById('paymentModal').style.display = 'flex';
}

function openAddChargeModal(folioId, folioNum) {
    document.getElementById('chargeFolioId').value = folioId;
    document.getElementById('chargeModalTitle').textContent = 'Post Charge - ' + folioNum;
    document.getElementById('addChargeModal').style.display = 'flex';
}

function searchFolios() {
    const q = document.getElementById('folioSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#folioTable tbody tr');
    rows.forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
