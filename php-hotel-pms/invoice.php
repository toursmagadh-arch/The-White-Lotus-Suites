<?php
/**
 * The Grand Royale Palace Hotel & Spa - Printable GST Tax Invoice
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

$folioId = intval($_GET['folio_id'] ?? 0);
if ($folioId <= 0) {
    die('Invalid Folio ID provided.');
}

// Fetch folio details with booking, guest and room
$stmt = $pdo->prepare("
    SELECT f.*, b.booking_code, b.check_in_date, b.check_out_date, b.adults, b.children,
           b.nights, b.room_tariff, b.booking_source,
           g.full_name as guest_name, g.phone as guest_phone, g.email as guest_email,
           g.address as guest_address, g.country as guest_country, g.id_proof_number,
           r.room_number, r.room_type, r.floor
    FROM folios f
    JOIN bookings b ON f.booking_id = b.id
    JOIN guests g ON b.guest_id = g.id
    JOIN rooms r ON b.room_id = r.id
    WHERE f.id = ?
");
$stmt->execute([$folioId]);
$folio = $stmt->fetch();

if (!$folio) {
    die('Folio not found.');
}

// Fetch folio line items
$itemsStmt = $pdo->prepare("SELECT * FROM folio_items WHERE folio_id = ? ORDER BY created_at ASC");
$itemsStmt->execute([$folioId]);
$lineItems = $itemsStmt->fetchAll();

// Fetch payment transactions
$payStmt = $pdo->prepare("SELECT * FROM payments WHERE folio_id = ? ORDER BY created_at ASC");
$payStmt->execute([$folioId]);
$payments = $payStmt->fetchAll();

$settings = getHotelSettings($pdo);
$taxRate = floatval($settings['tax_rate'] ?? 12);
$halfTax = $taxRate / 2;

// Calculate subtotal vs tax
$subtotal = 0;
foreach ($lineItems as $it) {
    $subtotal += $it['amount'];
}
$cgst = round(($subtotal * $halfTax) / 100, 2);
$sgst = round(($subtotal * $halfTax) / 100, 2);
$totalTax = $cgst + $sgst;
$grandTotal = $subtotal + $totalTax;

// Adjust for paid
$totalPaid = 0;
foreach ($payments as $p) {
    $totalPaid += $p['amount'];
}
$balance = max(0, $grandTotal - $totalPaid);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - <?= htmlspecialchars($folio['folio_number']) ?> - <?= htmlspecialchars($settings['hotel_name']) ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --gold: #c8a258;
            --dark: #0f172a;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            padding: 30px 15px;
        }
        .invoice-sheet {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-top: 6px solid var(--gold);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 24px;
            margin-bottom: 24px;
        }
        .brand h1 {
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            color: #0f172a;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .brand p { font-size: 0.85rem; color: #64748b; line-height: 1.4; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { font-size: 1.5rem; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; }
        .invoice-meta p { font-size: 0.85rem; color: #475569; margin-top: 2px; }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
            background: #f8fafc;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .col h3 { font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.5px; }
        .col p { font-size: 0.88rem; line-height: 1.5; color: #334155; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        th {
            background: #0f172a;
            color: #ffffff;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.88rem;
        }
        .summary-box {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
        }
        .summary-table {
            width: 320px;
            font-size: 0.9rem;
        }
        .summary-table div {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .summary-table .grand-total {
            font-size: 1.15rem;
            font-weight: 700;
            color: #0f172a;
            border-top: 2px solid #0f172a;
            border-bottom: none;
            padding-top: 8px;
        }

        .payments-table {
            margin-top: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
        }
        .payments-table th { background: #334155; }

        .footer-terms {
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            font-size: 0.78rem;
            color: #64748b;
            line-height: 1.5;
        }
        .actions-bar {
            max-width: 820px;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: var(--gold);
            color: #000;
            font-weight: 600;
            text-decoration: none;
            border-radius: 6px;
            border: none;
            cursor: pointer;
        }
        .btn-back { background: #334155; color: #fff; }

        @media print {
            body { background: #fff; padding: 0; }
            .invoice-sheet { box-shadow: none; border-radius: 0; padding: 20px; border-top: none; }
            .actions-bar { display: none; }
        }
    </style>
</head>
<body>

<div class="actions-bar">
    <a href="billing.php" class="btn btn-back"><i class="fa-solid fa-arrow-left"></i> Back to Folios</a>
    <button onclick="window.print()" class="btn"><i class="fa-solid fa-print"></i> Print GST Invoice (A4)</button>
</div>

<div class="invoice-sheet">
    <div class="header">
        <div class="brand">
            <h1><?= htmlspecialchars($settings['hotel_name']) ?></h1>
            <p><?= htmlspecialchars($settings['address']) ?></p>
            <p>Phone: <?= htmlspecialchars($settings['phone']) ?> | Email: <?= htmlspecialchars($settings['email']) ?></p>
            <p><strong>GSTIN:</strong> 27AABCT8492Q1Z8 | State Code: 27 (Maharashtra)</p>
        </div>
        <div class="invoice-meta">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice / Folio:</strong> <?= htmlspecialchars($folio['folio_number']) ?></p>
            <p><strong>Date:</strong> <?= date('d M Y') ?></p>
            <p><strong>Booking Ref:</strong> <?= htmlspecialchars($folio['booking_code']) ?></p>
            <p><strong>Status:</strong> <?= $balance <= 0 ? '<span style="color:#10b981; font-weight:700;">PAID IN FULL</span>' : '<span style="color:#ef4444; font-weight:700;">PAYMENT PENDING</span>' ?></p>
        </div>
    </div>

    <div class="details-grid">
        <div class="col">
            <h3>Billed To (Guest Details)</h3>
            <p><strong><?= htmlspecialchars($folio['guest_name']) ?></strong></p>
            <p>Phone: <?= htmlspecialchars($folio['guest_phone']) ?></p>
            <p>Email: <?= htmlspecialchars($folio['guest_email']) ?></p>
            <p><?= htmlspecialchars($folio['guest_address']) ?>, <?= htmlspecialchars($folio['guest_country']) ?></p>
            <?php if ($folio['id_proof_number']): ?>
                <p>Govt ID Ref: <?= htmlspecialchars($folio['id_proof_number']) ?></p>
            <?php endif; ?>
        </div>
        <div class="col">
            <h3>Stay Particulars</h3>
            <p><strong>Suite:</strong> Room <?= htmlspecialchars($folio['room_number']) ?> (<?= htmlspecialchars($folio['room_type']) ?>, Fl. <?= $folio['floor'] ?>)</p>
            <p><strong>Check-In:</strong> <?= date('d M Y', strtotime($folio['check_in_date'])) ?> (14:00)</p>
            <p><strong>Check-Out:</strong> <?= date('d M Y', strtotime($folio['check_out_date'])) ?> (11:00)</p>
            <p><strong>Total Duration:</strong> <?= $folio['nights'] ?> Night(s) (<?= $folio['adults'] ?> Adults, <?= $folio['children'] ?> Children)</p>
            <p><strong>Booking Channel:</strong> <?= htmlspecialchars($folio['booking_source']) ?></p>
        </div>
    </div>

    <!-- Line Items Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 50px;">#</th>
                <th>Item / Service Description</th>
                <th>Category</th>
                <th style="text-align: right;">Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            <?php $i = 1; foreach ($lineItems as $item): ?>
                <tr>
                    <td><?= $i++ ?></td>
                    <td><strong><?= htmlspecialchars($item['description']) ?></strong></td>
                    <td><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;"><?= htmlspecialchars($item['category']) ?></span></td>
                    <td style="text-align: right; font-weight: 600;">₹<?= number_format($item['amount'], 2) ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <!-- Calculations -->
    <div class="summary-box">
        <div class="summary-table">
            <div>
                <span>Taxable Subtotal:</span>
                <span>₹<?= number_format($subtotal, 2) ?></span>
            </div>
            <div>
                <span>CGST (<?= $halfTax ?>%):</span>
                <span>₹<?= number_format($cgst, 2) ?></span>
            </div>
            <div>
                <span>SGST (<?= $halfTax ?>%):</span>
                <span>₹<?= number_format($sgst, 2) ?></span>
            </div>
            <div class="grand-total">
                <span>Grand Total:</span>
                <span>₹<?= number_format($grandTotal, 2) ?></span>
            </div>
            <div style="color: #10b981; font-weight: 600;">
                <span>Total Amount Paid:</span>
                <span>₹<?= number_format($totalPaid, 2) ?></span>
            </div>
            <div style="color: <?= $balance > 0 ? '#ef4444' : '#10b981' ?>; font-weight: 700;">
                <span>Net Balance Due:</span>
                <span>₹<?= number_format($balance, 2) ?></span>
            </div>
        </div>
    </div>

    <!-- Payments Ledger -->
    <?php if (!empty($payments)): ?>
        <h3 style="font-size: 0.9rem; text-transform: uppercase; color: #475569; margin-bottom: 8px;">Settlement History</h3>
        <table class="payments-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Method</th>
                    <th>Transaction Reference</th>
                    <th>Notes</th>
                    <th style="text-align: right;">Amount Received</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($payments as $p): ?>
                    <tr>
                        <td><?= date('d M Y, h:i A', strtotime($p['created_at'])) ?></td>
                        <td><strong><?= htmlspecialchars($p['payment_method']) ?></strong></td>
                        <td><code><?= htmlspecialchars($p['transaction_ref']) ?></code></td>
                        <td><?= htmlspecialchars($p['notes'] ?: '-') ?></td>
                        <td style="text-align: right; font-weight: 600; color: #10b981;">₹<?= number_format($p['amount'], 2) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>

    <div class="footer-terms">
        <p><strong>Terms & Conditions:</strong></p>
        <p>1. This is a computer-generated tax invoice pursuant to Section 31 of the CGST Act, 2017 and does not require a physical signature.</p>
        <p>2. Check-out time is 11:00 AM. Late check-out beyond grace periods will attract standard hourly or half-day tariff charges.</p>
        <p>3. Hotel management reserves right of admission. Disputes, if any, subject to local court jurisdiction.</p>
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
            <p>Thank you for choosing <?= htmlspecialchars($settings['hotel_name']) ?>! We look forward to welcoming you back.</p>
            <div style="text-align: center; border-top: 1px solid #94a3b8; width: 160px; padding-top: 4px; font-size: 0.75rem;">
                Authorized Signatory
            </div>
        </div>
    </div>
</div>

</body>
</html>
