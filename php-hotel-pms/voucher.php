<?php
/**
 * The Grand Royale Palace Hotel & Spa - Printable Booking Confirmation Voucher
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

$bookingId = intval($_GET['booking_id'] ?? 0);
if ($bookingId <= 0) {
    die('Invalid Booking ID provided.');
}

$stmt = $pdo->prepare("
    SELECT b.*, g.full_name as guest_name, g.phone as guest_phone, g.email as guest_email,
           g.address as guest_address, g.country as guest_country, g.id_proof_number,
           r.room_number, r.room_type, r.floor, r.amenities
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
");
$stmt->execute([$bookingId]);
$booking = $stmt->fetch();

if (!$booking) {
    die('Booking not found.');
}

$settings = getHotelSettings($pdo);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Voucher - <?= htmlspecialchars($booking['booking_code']) ?> - <?= htmlspecialchars($settings['hotel_name']) ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --gold: #c8a258; --dark: #0f172a; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f1f5f9; color: #1e293b; padding: 30px 15px; }
        .voucher-sheet {
            max-width: 800px;
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
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .brand h1 { font-family: 'Cinzel', serif; font-size: 1.45rem; color: #0f172a; }
        .brand p { font-size: 0.85rem; color: #64748b; line-height: 1.4; }
        .voucher-meta { text-align: right; }
        .voucher-meta h2 { font-size: 1.35rem; font-weight: 700; color: var(--gold); text-transform: uppercase; }
        .voucher-meta p { font-size: 0.85rem; color: #475569; }

        .status-banner {
            background: #ecfdf5;
            border: 1px solid #10b981;
            padding: 12px 16px;
            border-radius: 6px;
            color: #065f46;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .section-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
        }
        .info-card h3 { font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 8px; }
        .info-card p { font-size: 0.88rem; line-height: 1.6; color: #334155; }

        .tariff-box {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .tariff-box table { width: 100%; border-collapse: collapse; }
        .tariff-box td { padding: 6px 0; font-size: 0.9rem; }
        .tariff-box tr.grand-row td {
            font-size: 1.15rem;
            font-weight: 700;
            color: #0f172a;
            border-top: 2px solid #cbd5e1;
            padding-top: 10px;
        }

        .policies {
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            font-size: 0.78rem;
            color: #64748b;
            line-height: 1.6;
        }
        .actions-bar {
            max-width: 800px;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
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
            .voucher-sheet { box-shadow: none; border-radius: 0; padding: 15px; border-top: none; }
            .actions-bar { display: none; }
        }
    </style>
</head>
<body>

<div class="actions-bar">
    <a href="bookings.php" class="btn btn-back"><i class="fa-solid fa-arrow-left"></i> Back to Bookings</a>
    <button onclick="window.print()" class="btn"><i class="fa-solid fa-print"></i> Print Confirmation Voucher (A4)</button>
</div>

<div class="voucher-sheet">
    <div class="header">
        <div class="brand">
            <h1><?= htmlspecialchars($settings['hotel_name']) ?></h1>
            <p><?= htmlspecialchars($settings['address']) ?></p>
            <p>Hotline: <?= htmlspecialchars($settings['phone']) ?> | <?= htmlspecialchars($settings['email']) ?></p>
        </div>
        <div class="voucher-meta">
            <h2>RESERVATION VOUCHER</h2>
            <p><strong>Confirmation #:</strong> <?= htmlspecialchars($booking['booking_code']) ?></p>
            <p><strong>Date Issued:</strong> <?= date('d M Y') ?></p>
        </div>
    </div>

    <div class="status-banner">
        <div>
            <i class="fa-solid fa-circle-check"></i>
            <strong>Booking Confirmed & Guaranteed</strong>
            <span>• Status: <?= htmlspecialchars($booking['status']) ?></span>
        </div>
        <div style="font-family: monospace; font-size: 0.85rem; color: #047857;">
            Channel: <?= htmlspecialchars($booking['booking_source']) ?>
        </div>
    </div>

    <div class="section-grid">
        <div class="info-card">
            <h3>Lead Guest Particulars</h3>
            <p><strong><?= htmlspecialchars($booking['guest_name']) ?></strong></p>
            <p><i class="fa-solid fa-phone" style="width: 16px;"></i> <?= htmlspecialchars($booking['guest_phone']) ?></p>
            <p><i class="fa-solid fa-envelope" style="width: 16px;"></i> <?= htmlspecialchars($booking['guest_email']) ?></p>
            <p><i class="fa-solid fa-location-dot" style="width: 16px;"></i> <?= htmlspecialchars($booking['guest_address']) ?>, <?= htmlspecialchars($booking['guest_country']) ?></p>
            <?php if ($booking['id_proof_number']): ?>
                <p><i class="fa-solid fa-id-card" style="width: 16px;"></i> Govt ID: <?= htmlspecialchars($booking['id_proof_number']) ?></p>
            <?php endif; ?>
        </div>

        <div class="info-card">
            <h3>Accommodations Reserved</h3>
            <p><strong>Suite:</strong> Room <?= htmlspecialchars($booking['room_number']) ?> (Floor <?= $booking['floor'] ?>)</p>
            <p><strong>Category:</strong> <?= htmlspecialchars($booking['room_type']) ?></p>
            <p><strong>Occupancy:</strong> <?= $booking['adults'] ?> Adults, <?= $booking['children'] ?> Children</p>
            <p><strong>Check-In Date:</strong> <?= date('l, d M Y', strtotime($booking['check_in_date'])) ?> (From 14:00)</p>
            <p><strong>Check-Out Date:</strong> <?= date('l, d M Y', strtotime($booking['check_out_date'])) ?> (Until 11:00)</p>
            <p><strong>Total Duration:</strong> <?= $booking['nights'] ?> Night(s)</p>
        </div>
    </div>

    <!-- Tariff & Advance Breakdown -->
    <div class="tariff-box">
        <table>
            <tr>
                <td>Room Tariff (<?= $booking['nights'] ?> nights &times; ₹<?= number_format($booking['room_tariff'], 2) ?>):</td>
                <td style="text-align: right; font-weight: 600;">₹<?= number_format($booking['room_tariff'] * $booking['nights'], 2) ?></td>
            </tr>
            <tr>
                <td>Estimated Taxes (GST 12%):</td>
                <td style="text-align: right; color: #64748b;">₹<?= number_format(($booking['room_tariff'] * $booking['nights']) * 0.12, 2) ?></td>
            </tr>
            <tr>
                <td>Advance Deposit Paid:</td>
                <td style="text-align: right; color: #10b981; font-weight: 600;">- ₹<?= number_format($booking['paid_amount'], 2) ?></td>
            </tr>
            <tr class="grand-row">
                <td>Estimated Balance Payable at Check-In / Out:</td>
                <td style="text-align: right; color: <?= $booking['balance'] > 0 ? '#ef4444' : '#10b981' ?>;">
                    ₹<?= number_format($booking['balance'], 2) ?>
                </td>
            </tr>
        </table>
    </div>

    <div class="policies">
        <p><strong>Hotel Check-In Policies & Instructions:</strong></p>
        <p>1. <strong>Mandatory Identification:</strong> Per local regulations, all adult guests must present a valid government-issued photo ID (Passport, Aadhaar Card, Driving License, or Voter ID) upon physical check-in.</p>
        <p>2. <strong>Check-In & Check-Out:</strong> Standard check-in is 2:00 PM and check-out is 11:00 AM. Early check-in or late check-out is subject to suite availability and standard surcharges.</p>
        <p>3. <strong>Cancellation Policy:</strong> Free cancellation up to 48 hours prior to arrival date. Cancellations made within 48 hours or no-shows forfeit the first night deposit.</p>
        <p>4. <strong>Special Assistance:</strong> For chauffeured airport pickups or dietary requests, please contact our Concierge desk at <?= htmlspecialchars($settings['phone']) ?>.</p>
        
        <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
            <p>We eagerly look forward to curating your regal stay with us.</p>
            <div style="text-align: center; border-top: 1px solid #94a3b8; width: 170px; padding-top: 4px; font-size: 0.75rem;">
                Front Office Manager
            </div>
        </div>
    </div>
</div>

</body>
</html>
