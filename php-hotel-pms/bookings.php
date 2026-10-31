<?php
$pageTitle = 'Reservation Engine';
require_once __DIR__ . '/includes/header.php';

$msg = null;
$error = null;

// Handle Create Booking
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_booking') {
    $roomId = (int)$_POST['room_id'];
    $checkIn = $_POST['check_in_date'];
    $checkOut = $_POST['check_out_date'];
    $adults = (int)($_POST['adults'] ?? 1);
    $children = (int)($_POST['children'] ?? 0);
    $bookingSource = $_POST['booking_source'] ?? 'Walk-in';
    $specialRequests = trim($_POST['special_requests'] ?? '');
    $advancePayment = (float)($_POST['advance_payment'] ?? 0);
    $payMethod = $_POST['payment_method'] ?? 'Cash';

    // Guest Info
    $guestMode = $_POST['guest_mode'] ?? 'new';
    $guestId = null;

    if ($guestMode === 'existing' && !empty($_POST['existing_guest_id'])) {
        $guestId = (int)$_POST['existing_guest_id'];
    } else {
        $fName = trim($_POST['first_name'] ?? '');
        $lName = trim($_POST['last_name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $idType = $_POST['id_type'] ?? 'Aadhaar';
        $idNum = trim($_POST['id_number'] ?? '');
        $city = trim($_POST['city'] ?? 'Mumbai');

        if (!$fName || !$email || !$phone) {
            $error = "Guest first name, corporate email and phone are mandatory.";
        } else {
            $gStmt = $pdo->prepare("INSERT INTO guests (first_name, last_name, email, phone, id_type, id_number, city, country) VALUES (?, ?, ?, ?, ?, ?, ?, 'India')");
            $gStmt->execute([$fName, $lName, $email, $phone, $idType, $idNum, $city]);
            $guestId = $pdo->lastInsertId();
        }
    }

    if (!$error && $guestId) {
        // Prevent Double Booking Check
        $overlapStmt = $pdo->prepare("
          SELECT id FROM bookings
          WHERE room_id = ? 
          AND status IN ('Confirmed', 'Checked-in')
          AND (check_in_date < ? AND check_out_date > ?)
        ");
        $overlapStmt->execute([$roomId, $checkOut, $checkIn]);
        $hasConflict = $overlapStmt->fetch();

        if ($hasConflict) {
            $error = "Double-Booking Prevention Triggered: Room is already booked for these dates.";
        } else {
            // Room rate
            $rStmt = $pdo->prepare("SELECT r.*, rt.base_rate FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = ?");
            $rStmt->execute([$roomId]);
            $room = $rStmt->fetch();

            $d1 = new DateTime($checkIn);
            $d2 = new DateTime($checkOut);
            $nights = max(1, $d1->diff($d2)->days);
            $nightlyRate = $room['base_rate'];
            $roomSubtotal = $nightlyRate * $nights;

            // Taxes & Service Charge
            $taxRate = (float)$settings['tax_rate'];
            $serviceRate = (float)$settings['service_charge_rate'];
            $serviceCharge = ($roomSubtotal * $serviceRate) / 100;
            $taxAmount = (($roomSubtotal + $serviceCharge) * $taxRate) / 100;
            $totalAmount = $roomSubtotal + $serviceCharge + $taxAmount;
            $balance = max(0, $totalAmount - $advancePayment);

            $bookingCode = "GRP-" . date('ym') . "-" . rand(100, 999);

            $bStmt = $pdo->prepare("
              INSERT INTO bookings (booking_code, guest_id, room_id, check_in_date, check_out_date, adults, children, nightly_rate, total_nights, room_subtotal, booking_source, status, special_requests)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
            ");
            $bStmt->execute([$bookingCode, $guestId, $roomId, $checkIn, $checkOut, $adults, $children, $nightlyRate, $nights, $roomSubtotal, $bookingSource, $specialRequests]);
            $bookingId = $pdo->lastInsertId();

            // Create Master Folio
            $fStmt = $pdo->prepare("
              INSERT INTO folios (booking_id, room_charge, service_charge, tax_amount, total_amount, paid_amount, balance_amount, payment_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $payStatus = $balance <= 0 ? 'Settled' : ($advancePayment > 0 ? 'Partially Paid' : 'Unpaid');
            $fStmt->execute([$bookingId, $roomSubtotal, $serviceCharge, $taxAmount, $totalAmount, $advancePayment, $balance, $payStatus]);
            $folioId = $pdo->lastInsertId();

            // If advance payment posted
            if ($advancePayment > 0) {
                $pStmt = $pdo->prepare("INSERT INTO payments (folio_id, amount, payment_method, transaction_ref, notes, recorded_by) VALUES (?, ?, ?, ?, 'Advance Booking Deposit', ?)");
                $pStmt->execute([$folioId, $advancePayment, $payMethod, 'ADV-' . rand(10000, 99999), currentUser()['name']]);
            }

            // If starting today, mark room Reserved
            if ($checkIn === date('Y-m-d')) {
                $pdo->prepare("UPDATE rooms SET status = 'Reserved' WHERE id = ?")->execute([$roomId]);
            }

            logAudit($pdo, currentUser()['name'], 'BOOKING_CREATED', "Reservation $bookingCode created for Room {$room['room_number']}");
            $msg = "Reservation $bookingCode confirmed! <a href='voucher.php?id=$bookingId' target='_blank' style='color:var(--gold-primary);text-decoration:underline;'>Print Guest Voucher</a>";
        }
    }
}

// Cancel Booking
if (isset($_GET['cancel_id'])) {
    $cancelId = (int)$_GET['cancel_id'];
    $stmt = $pdo->prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?");
    $stmt->execute([$cancelId]);
    logAudit($pdo, currentUser()['name'], 'BOOKING_CANCELLED', "Booking ID $cancelId cancelled");
    header("Location: bookings.php");
    exit;
}

// Search & Filter
$search = trim($_GET['search'] ?? '');
$statusFilter = $_GET['status'] ?? 'all';

$sql = "
  SELECT b.*, g.first_name, g.last_name, g.phone, g.email as guest_email,
         r.room_number, rt.name as room_type, f.id as folio_id, f.total_amount, f.paid_amount, f.balance_amount
  FROM bookings b
  JOIN guests g ON b.guest_id = g.id
  JOIN rooms r ON b.room_id = r.id
  JOIN room_types rt ON r.room_type_id = rt.id
  LEFT JOIN folios f ON f.booking_id = b.id
  WHERE 1=1
";
$params = [];
if ($statusFilter !== 'all') {
    $sql .= " AND b.status = ?";
    $params[] = $statusFilter;
}
if ($search) {
    $sql .= " AND (b.booking_code LIKE ? OR g.first_name LIKE ? OR g.last_name LIKE ? OR g.phone LIKE ? OR r.room_number LIKE ?)";
    $q = "%$search%";
    $params = array_merge($params, [$q, $q, $q, $q, $q]);
}
$sql .= " ORDER BY b.id DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$bookingsList = $stmt->fetchAll();

$availableRooms = $pdo->query("SELECT r.*, rt.name as room_type, rt.base_rate FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.status != 'Maintenance' ORDER BY r.room_number ASC")->fetchAll();
$allGuests = $pdo->query("SELECT * FROM guests ORDER BY first_name ASC")->fetchAll();
?>

<?php if ($msg): ?>
  <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:12px;border-radius:8px;font-size:0.8rem;margin-bottom:16px;">
    <?= $msg ?>
  </div>
<?php endif; ?>
<?php if ($error): ?>
  <div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:12px;border-radius:8px;font-size:0.8rem;margin-bottom:16px;">
    <?= htmlspecialchars($error) ?>
  </div>
<?php endif; ?>

<div class="panel-header" style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:10px;margin-bottom:20px;">
  <form method="GET" action="bookings.php" style="display:flex;gap:10px;flex:1;max-width:500px;">
    <input type="text" name="search" class="form-control" placeholder="Search by guest name, phone, code or room..." value="<?= htmlspecialchars($search) ?>">
    <button type="submit" class="btn btn-secondary btn-sm">Search</button>
  </form>

  <div style="display:flex;gap:8px;">
    <div style="display:flex;background:rgba(0,0,0,0.4);border-radius:6px;padding:2px;">
      <?php foreach (['all', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'] as $st): ?>
        <a href="bookings.php?status=<?= $st ?>&search=<?= urlencode($search) ?>" class="btn <?= $statusFilter == $st ? 'btn-primary' : 'btn-secondary' ?> btn-sm" style="font-size:0.7rem;padding:3px 8px;">
          <?= $st === 'all' ? 'All' : $st ?>
        </a>
      <?php endforeach; ?>
    </div>
    <button onclick="openModal('newBookingModal')" class="btn btn-primary btn-sm">
      <i data-feather="plus"></i> Create Reservation
    </button>
  </div>
</div>

<div class="table-panel">
  <table class="pms-table">
    <thead>
      <tr>
        <th>Booking Ref</th>
        <th>Guest Profile</th>
        <th>Room & Type</th>
        <th>Stay Dates</th>
        <th style="text-align:right;">Grand Total</th>
        <th style="text-align:right;">Balance Due</th>
        <th style="text-align:center;">Status</th>
        <th style="text-align:right;">Operations</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($bookingsList as $b): ?>
        <tr>
          <td>
            <strong style="color:var(--gold-primary);"><?= htmlspecialchars($b['booking_code']) ?></strong>
            <div style="font-size:0.68rem;color:var(--text-muted);"><?= $b['booking_source'] ?></div>
          </td>
          <td>
            <strong><?= htmlspecialchars($b['first_name'] . ' ' . $b['last_name']) ?></strong>
            <div style="font-size:0.7rem;color:var(--text-muted);"><?= htmlspecialchars($b['phone']) ?></div>
          </td>
          <td>Room <?= htmlspecialchars($b['room_number']) ?> (<?= htmlspecialchars($b['room_type']) ?>)</td>
          <td>
            <?= $b['check_in_date'] ?> → <?= $b['check_out_date'] ?>
            <div style="font-size:0.7rem;color:var(--gold-accent);"><?= $b['total_nights'] ?> Nights</div>
          </td>
          <td style="text-align:right; font-family:monospace;"><?= $settings['currency_symbol'] ?><?= number_format($b['total_amount'], 2) ?></td>
          <td style="text-align:right; font-family:monospace; font-weight:700; color:<?= $b['balance_amount'] > 1 ? '#f87171' : '#34d399' ?>;">
            <?= $settings['currency_symbol'] ?><?= number_format($b['balance_amount'], 2) ?>
          </td>
          <td style="text-align:center;">
            <span class="badge badge-<?= $b['status'] ?>"><?= $b['status'] ?></span>
          </td>
          <td style="text-align:right;">
            <a href="voucher.php?id=<?= $b['id'] ?>" target="_blank" class="btn btn-secondary btn-sm" title="Print Reservation Voucher">Voucher</a>
            <?php if ($b['folio_id']): ?>
              <a href="invoice.php?id=<?= $b['folio_id'] ?>" target="_blank" class="btn btn-primary btn-sm" title="Print Master Tax Invoice">Folio</a>
            <?php endif; ?>
            <?php if ($b['status'] === 'Confirmed'): ?>
              <a href="bookings.php?cancel_id=<?= $b['id'] ?>" class="btn btn-secondary btn-sm" onclick="return confirm('Cancel reservation <?= $b['booking_code'] ?>?')" style="color:#f87171;">Cancel</a>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<!-- Modal: New Reservation Engine -->
<div id="newBookingModal" class="modal-backdrop">
  <div class="modal-content" style="max-width:700px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="color:var(--gold-primary);font-size:1.15rem;">Create New Guest Reservation</h3>
      <button onclick="closeModal('newBookingModal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;">&times;</button>
    </div>

    <form method="POST" action="bookings.php">
      <input type="hidden" name="action" value="create_booking">

      <div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin-bottom:14px;">
        <h4 style="font-size:0.75rem;color:var(--gold-accent);text-transform:uppercase;margin-bottom:8px;">1. Stay Dates & Suite Selection</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Check-In Date</label>
            <input type="date" name="check_in_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Check-Out Date</label>
            <input type="date" name="check_out_date" class="form-control" value="<?= date('Y-m-d', strtotime('+1 day')) ?>" required>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Assign Available Suite</label>
            <select name="room_id" class="form-control" required>
              <?php foreach ($availableRooms as $ar): ?>
                <option value="<?= $ar['id'] ?>">Room <?= $ar['room_number'] ?> - <?= $ar['room_type'] ?> (<?= $settings['currency_symbol'] ?><?= number_format($ar['base_rate'],0) ?>/nt)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Adults</label>
            <input type="number" name="adults" min="1" max="10" value="2" class="form-control">
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Children</label>
            <input type="number" name="children" min="0" max="8" value="0" class="form-control">
          </div>
        </div>
      </div>

      <div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin-bottom:14px;">
        <h4 style="font-size:0.75rem;color:var(--gold-accent);text-transform:uppercase;margin-bottom:8px;">2. Guest Profile Particulars</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">First Name</label>
            <input type="text" name="first_name" class="form-control" placeholder="e.g. Vikram" required>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Last Name</label>
            <input type="text" name="last_name" class="form-control" placeholder="e.g. Singhania" required>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Email</label>
            <input type="email" name="email" class="form-control" placeholder="guest@domain.com" required>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Mobile Phone</label>
            <input type="tel" name="phone" class="form-control" placeholder="+91 98200..." required>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">ID Proof Type</label>
            <select name="id_type" class="form-control">
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">ID Number</label>
            <input type="text" name="id_number" class="form-control" placeholder="e.g. 5420 1829 4810">
          </div>
        </div>
      </div>

      <div style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin-bottom:16px;">
        <h4 style="font-size:0.75rem;color:var(--gold-accent);text-transform:uppercase;margin-bottom:8px;">3. Source & Advance Payment</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Booking Source</label>
            <select name="booking_source" class="form-control">
              <option value="Walk-in">Walk-in</option>
              <option value="Website">Official Website</option>
              <option value="Phone">Phone</option>
              <option value="OTA">OTA (Booking.com/Expedia)</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Advance Deposit (<?= $settings['currency_symbol'] ?>)</label>
            <input type="number" name="advance_payment" value="0" class="form-control">
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">Payment Mode</label>
            <select name="payment_method" class="form-control">
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Wire</option>
            </select>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" onclick="closeModal('newBookingModal')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Confirm & Book Suite</button>
      </div>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
