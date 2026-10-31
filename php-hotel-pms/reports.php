<?php
/**
 * The Grand Royale Palace Hotel & Spa - Reports & Financial Analytics
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

// CSV Export Handler
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    $reportType = $_GET['type'] ?? 'bookings';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=hotel_' . $reportType . '_report_' . date('Y-m-d') . '.csv');
    $output = fopen('php://output', 'w');

    if ($reportType === 'bookings') {
        fputcsv($output, ['Booking ID', 'Guest Name', 'Phone', 'Room', 'Type', 'Check In', 'Check Out', 'Nights', 'Tariff', 'Total (INR)', 'Paid (INR)', 'Balance (INR)', 'Status', 'Channel']);
        $rows = $pdo->query("SELECT b.booking_code, g.full_name, g.phone, r.room_number, r.room_type, b.check_in_date, b.check_out_date, b.nights, b.room_tariff, b.total_amount, b.paid_amount, b.balance, b.status, b.booking_source FROM bookings b JOIN guests g ON b.guest_id = g.id JOIN rooms r ON b.room_id = r.id ORDER BY b.check_in_date DESC")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) fputcsv($output, $r);
    } elseif ($reportType === 'folios') {
        fputcsv($output, ['Folio ID', 'Booking Code', 'Guest Name', 'Room', 'Total Amount', 'Paid Amount', 'Balance Due', 'Status']);
        $rows = $pdo->query("SELECT f.folio_number, b.booking_code, g.full_name, r.room_number, f.total_amount, f.paid_amount, f.balance, f.status FROM folios f JOIN bookings b ON f.booking_id = b.id JOIN guests g ON b.guest_id = g.id JOIN rooms r ON b.room_id = r.id ORDER BY f.id DESC")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) fputcsv($output, $r);
    }
    exit;
}

// KPI analytics calculations
$totalRooms = $pdo->query("SELECT COUNT(*) FROM rooms")->fetchColumn();
$occupiedRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Occupied'")->fetchColumn();
$occupancyRate = ($totalRooms > 0) ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

$roomRevenue = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM folios")->fetchColumn();
$posRevenue = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM restaurant_orders")->fetchColumn();
$totalExpenses = $pdo->query("SELECT COALESCE(SUM(cost), 0) FROM maintenance_tickets")->fetchColumn();
$netProfit = ($roomRevenue + $posRevenue) - $totalExpenses;

// Average Daily Rate (ADR) & RevPAR
$soldNights = $pdo->query("SELECT COALESCE(SUM(nights), 0) FROM bookings WHERE status IN ('Checked-in', 'Checked-out')")->fetchColumn();
$adr = ($soldNights > 0) ? round($roomRevenue / $soldNights, 2) : 0;
$revPar = ($totalRooms > 0) ? round($roomRevenue / $totalRooms, 2) : 0;

// Revenue by room category
$categoryStats = $pdo->query("
    SELECT r.room_type, COUNT(b.id) as booking_count, COALESCE(SUM(b.total_amount), 0) as total_rev
    FROM rooms r
    LEFT JOIN bookings b ON r.id = b.room_id
    GROUP BY r.room_type
    ORDER BY total_rev DESC
")->fetchAll();

// Channel distribution
$channelStats = $pdo->query("
    SELECT booking_source, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as rev
    FROM bookings
    GROUP BY booking_source
    ORDER BY count DESC
")->fetchAll();

$pageTitle = 'Reports, Revenue & Profit Analysis';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="card mb-4" style="border-left: 4px solid var(--gold);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
            <h2 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 4px;">Executive Analytics & Operational Reports</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Comprehensive ADR, RevPAR, channel performance, and P&L statements.</p>
        </div>
        <div style="display: flex; gap: 8px;">
            <a href="reports.php?export=csv&type=bookings" class="btn btn-secondary">
                <i class="fa-solid fa-file-csv"></i> Export Bookings CSV
            </a>
            <a href="reports.php?export=csv&type=folios" class="btn btn-primary">
                <i class="fa-solid fa-file-arrow-down"></i> Export Folios CSV
            </a>
        </div>
    </div>
</div>

<!-- High Level Financial KPIs -->
<div class="grid grid-4 mb-4">
    <div class="card stat-card">
        <span class="stat-label">Current Occupancy</span>
        <div class="stat-value" style="color: var(--gold-light);"><?= $occupancyRate ?>%</div>
        <span style="font-size: 0.8rem; color: var(--text-muted);"><?= $occupiedRooms ?> of <?= $totalRooms ?> suites occupied</span>
    </div>
    <div class="card stat-card">
        <span class="stat-label">Avg Daily Rate (ADR)</span>
        <div class="stat-value" style="color: #fff;">₹<?= number_format($adr, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Realized average tariff</span>
    </div>
    <div class="card stat-card">
        <span class="stat-label">RevPAR</span>
        <div class="stat-value" style="color: #fff;">₹<?= number_format($revPar, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Revenue Per Available Room</span>
    </div>
    <div class="card stat-card" style="border-left: 4px solid var(--emerald);">
        <span class="stat-label">Net Operating Profit</span>
        <div class="stat-value" style="color: var(--emerald);">₹<?= number_format($netProfit, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Gross Revenue minus expenses</span>
    </div>
</div>

<!-- Revenue Streams vs P&L Grid -->
<div class="grid grid-2 mb-4" style="gap: 20px;">
    <!-- Revenue Breakdown by Room Category -->
    <div class="card">
        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-chart-pie" style="color: var(--gold);"></i> Revenue by Room Category
        </h3>
        <table class="table" style="font-size: 0.88rem;">
            <thead>
                <tr>
                    <th>Room Type</th>
                    <th style="text-align: center;">Bookings</th>
                    <th style="text-align: right;">Gross Revenue (₹)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($categoryStats as $cs): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($cs['room_type']) ?></strong></td>
                        <td style="text-align: center;"><span class="badge" style="background: rgba(255,255,255,0.08);"><?= $cs['booking_count'] ?></span></td>
                        <td style="text-align: right; font-weight: 600; color: var(--gold-light);">₹<?= number_format($cs['total_rev'], 2) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- Booking Channel Distribution -->
    <div class="card">
        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-globe" style="color: var(--gold);"></i> Booking Channel Distribution
        </h3>
        <table class="table" style="font-size: 0.88rem;">
            <thead>
                <tr>
                    <th>Channel / Source</th>
                    <th style="text-align: center;">Total Bookings</th>
                    <th style="text-align: right;">Share Revenue (₹)</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($channelStats as $ch): ?>
                    <tr>
                        <td><i class="fa-solid fa-arrow-turn-down" style="color: var(--gold); margin-right: 6px;"></i> <?= htmlspecialchars($ch['booking_source']) ?></td>
                        <td style="text-align: center; font-weight: 600;"><?= $ch['count'] ?></td>
                        <td style="text-align: right; color: var(--gold-light); font-weight: 600;">₹<?= number_format($ch['rev'], 2) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Consolidated Profit & Loss Summary -->
<div class="card">
    <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px;">
        <i class="fa-solid fa-scale-balanced" style="color: var(--gold);"></i> Consolidated Profit & Loss Summary Statement
    </h3>
    <table class="table" style="max-width: 650px;">
        <tbody>
            <tr>
                <td style="font-weight: 600; color: #fff;">1. Room Accommodations & Folio Revenue</td>
                <td style="text-align: right; font-weight: 600; color: var(--emerald);">+ ₹<?= number_format($roomRevenue, 2) ?></td>
            </tr>
            <tr>
                <td style="font-weight: 600; color: #fff;">2. Restaurant Dining & Bar Orders</td>
                <td style="text-align: right; font-weight: 600; color: var(--emerald);">+ ₹<?= number_format($posRevenue, 2) ?></td>
            </tr>
            <tr style="border-top: 1px solid var(--border); background: rgba(255,255,255,0.02);">
                <td style="font-weight: 700; color: var(--gold-light);">Total Gross Inflow</td>
                <td style="text-align: right; font-weight: 700; color: var(--gold-light);">₹<?= number_format($roomRevenue + $posRevenue, 2) ?></td>
            </tr>
            <tr>
                <td style="color: var(--text-muted);">3. Facility Repairs & Maintenance Outflow</td>
                <td style="text-align: right; color: #ef4444; font-weight: 600;">- ₹<?= number_format($totalExpenses, 2) ?></td>
            </tr>
            <tr style="border-top: 2px solid var(--gold); font-size: 1.15rem; background: rgba(200,162,88,0.08);">
                <td style="font-weight: 700; color: #fff;">NET REALIZED OPERATING PROFIT</td>
                <td style="text-align: right; font-weight: 700; color: var(--emerald);">₹<?= number_format($netProfit, 2) ?></td>
            </tr>
        </tbody>
    </table>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
