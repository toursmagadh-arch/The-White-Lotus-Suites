<?php
$pageTitle = 'Executive Overview';
require_once __DIR__ . '/includes/header.php';

// Fetch Live Room Counts
$totalRooms = $pdo->query("SELECT COUNT(*) FROM rooms")->fetchColumn();
$availableRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Available'")->fetchColumn();
$occupiedRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Occupied'")->fetchColumn();
$reservedRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Reserved'")->fetchColumn();
$dirtyRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Dirty' OR cleaning_status = 'Dirty'")->fetchColumn();
$cleaningRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Cleaning' OR cleaning_status = 'Cleaning in Progress'")->fetchColumn();
$readyRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE cleaning_status = 'Ready'")->fetchColumn();
$maintenanceRooms = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Maintenance'")->fetchColumn();

$occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

// Front desk arrivals & departures today
$today = date('Y-m-d');
$stmt = $pdo->prepare("
  SELECT b.*, g.first_name, g.last_name, g.phone, r.room_number, rt.name as room_type
  FROM bookings b
  JOIN guests g ON b.guest_id = g.id
  JOIN rooms r ON b.room_id = r.id
  JOIN room_types rt ON r.room_type_id = rt.id
  WHERE b.check_in_date = ? AND b.status = 'Confirmed'
");
$stmt->execute([$today]);
$todayArrivals = $stmt->fetchAll();

$stmt = $pdo->prepare("
  SELECT b.*, g.first_name, g.last_name, r.room_number, f.balance_amount, f.id as folio_id
  FROM bookings b
  JOIN guests g ON b.guest_id = g.id
  JOIN rooms r ON b.room_id = r.id
  JOIN folios f ON f.booking_id = b.id
  WHERE b.check_out_date = ? AND b.status = 'Checked-in'
");
$stmt->execute([$today]);
$todayDepartures = $stmt->fetchAll();

// Today's collections
$todayRevenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE DATE(created_at) = CURDATE()")->fetchColumn();
$todayFnb = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM restaurant_orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();

// Recent 6 bookings
$recentBookings = $pdo->query("
  SELECT b.*, g.first_name, g.last_name, r.room_number, rt.name as room_type, f.id as folio_id, f.total_amount, f.balance_amount
  FROM bookings b
  JOIN guests g ON b.guest_id = g.id
  JOIN rooms r ON b.room_id = r.id
  JOIN room_types rt ON r.room_type_id = rt.id
  LEFT JOIN folios f ON f.booking_id = b.id
  ORDER BY b.id DESC LIMIT 6
")->fetchAll();
?>

<!-- 8 Live KPI Stat Cards -->
<div class="stats-row">
  <div class="stat-box">
    <div class="title">Total Rooms</div>
    <div class="val"><?= $totalRooms ?></div>
    <div class="desc">Occupancy: <?= $occupancyRate ?>%</div>
  </div>

  <div class="stat-box" style="border-color: rgba(16,185,129,0.3);">
    <div class="title">Available Ready</div>
    <div class="val" style="color: var(--status-available);"><?= $availableRooms ?></div>
    <div class="desc"><?= $readyRooms ?> Inspected & Ready</div>
  </div>

  <div class="stat-box" style="border-color: rgba(59,130,246,0.3);">
    <div class="title">Occupied Suites</div>
    <div class="val" style="color: var(--status-occupied);"><?= $occupiedRooms ?></div>
    <div class="desc">In-House Guests</div>
  </div>

  <div class="stat-box" style="border-color: rgba(245,158,11,0.3);">
    <div class="title">Reserved</div>
    <div class="val" style="color: var(--status-reserved);"><?= $reservedRooms ?></div>
    <div class="desc">Inbound Arrivals</div>
  </div>

  <div class="stat-box" style="border-color: rgba(239,68,68,0.3);">
    <div class="title">Dirty / Turnover</div>
    <div class="val" style="color: var(--status-dirty);"><?= $dirtyRooms ?></div>
    <div class="desc">Needs Housekeeping</div>
  </div>

  <div class="stat-box" style="border-color: rgba(139,92,246,0.3);">
    <div class="title">In Cleaning</div>
    <div class="val" style="color: var(--status-cleaning);"><?= $cleaningRooms ?></div>
    <div class="desc">Attendants on Floor</div>
  </div>

  <div class="stat-box" style="border-color: rgba(100,116,139,0.3);">
    <div class="title">Out of Order</div>
    <div class="val" style="color: var(--status-maintenance);"><?= $maintenanceRooms ?></div>
    <div class="desc">Locked in Maintenance</div>
  </div>

  <div class="stat-box" style="border-color: rgba(212,175,55,0.4); background: linear-gradient(135deg, rgba(212,175,55,0.08) 0%, transparent 100%);">
    <div class="title">Today's Revenue</div>
    <div class="val" style="color: var(--gold-primary);"><?= $settings['currency_symbol'] ?><?= number_format($todayRevenue, 0) ?></div>
    <div class="desc">F&B Sales: <?= $settings['currency_symbol'] ?><?= number_format($todayFnb, 0) ?></div>
  </div>
</div>

<!-- Two-Column Operations Hub -->
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;">
  
  <!-- Today's Expected Arrivals -->
  <div class="table-panel" style="margin-top: 0;">
    <div class="panel-header">
      <div class="panel-title">Expected Arrivals Today (<?= count($todayArrivals) ?>)</div>
      <a href="frontdesk.php" style="color: var(--gold-primary); font-size: 0.75rem;">Open Front Desk →</a>
    </div>
    <div style="padding: 16px;">
      <?php if (empty($todayArrivals)): ?>
        <p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No pending arrivals scheduled for today.</p>
      <?php else: ?>
        <table class="pms-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Suite</th>
              <th>Stay</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($todayArrivals as $arr): ?>
              <tr>
                <td>
                  <strong><?= htmlspecialchars($arr['first_name'] . ' ' . $arr['last_name']) ?></strong>
                  <div style="font-size:0.7rem; color:var(--text-muted);"><?= htmlspecialchars($arr['phone']) ?></div>
                </td>
                <td>Room <?= htmlspecialchars($arr['room_number']) ?> (<?= htmlspecialchars($arr['room_type']) ?>)</td>
                <td><?= $arr['total_nights'] ?> Nights</td>
                <td>
                  <a href="frontdesk.php?action=checkin&id=<?= $arr['id'] ?>" class="btn btn-primary btn-sm">Check In</a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  </div>

  <!-- Today's Expected Departures -->
  <div class="table-panel" style="margin-top: 0;">
    <div class="panel-header">
      <div class="panel-title">Scheduled Departures Today (<?= count($todayDepartures) ?>)</div>
      <a href="frontdesk.php" style="color: var(--gold-primary); font-size: 0.75rem;">Manage Departures →</a>
    </div>
    <div style="padding: 16px;">
      <?php if (empty($todayDepartures)): ?>
        <p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No guest departures due today.</p>
      <?php else: ?>
        <table class="pms-table">
          <thead>
            <tr>
              <th>Resident Guest</th>
              <th>Room</th>
              <th>Balance Due</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($todayDepartures as $dep): ?>
              <tr>
                <td><strong><?= htmlspecialchars($dep['first_name'] . ' ' . $dep['last_name']) ?></strong></td>
                <td>Room <?= htmlspecialchars($dep['room_number']) ?></td>
                <td style="font-weight:700; color:<?= $dep['balance_amount'] > 1 ? '#f87171' : '#34d399' ?>;">
                  <?= $settings['currency_symbol'] ?><?= number_format($dep['balance_amount'], 2) ?>
                </td>
                <td>
                  <a href="invoice.php?id=<?= $dep['folio_id'] ?>" target="_blank" class="btn btn-secondary btn-sm">Invoice</a>
                  <a href="frontdesk.php?action=checkout&id=<?= $dep['id'] ?>" class="btn btn-primary btn-sm" onclick="return confirm('Check out guest from Room <?= $dep['room_number'] ?>?')">Check Out</a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  </div>
</div>

<!-- Recent Bookings Live Stream -->
<div class="table-panel">
  <div class="panel-header">
    <div class="panel-title">Recent Property Reservations</div>
    <a href="bookings.php" style="color: var(--gold-primary); font-size: 0.75rem;">View All Bookings →</a>
  </div>
  <table class="pms-table">
    <thead>
      <tr>
        <th>Booking Code</th>
        <th>Guest Name</th>
        <th>Room Assigned</th>
        <th>Stay Dates</th>
        <th style="text-align:right;">Tariff Subtotal</th>
        <th style="text-align:right;">Balance</th>
        <th style="text-align:center;">Status</th>
        <th style="text-align:right;">Documents</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($recentBookings as $b): ?>
        <tr>
          <td><strong style="color:var(--gold-primary);"><?= htmlspecialchars($b['booking_code']) ?></strong></td>
          <td><?= htmlspecialchars($b['first_name'] . ' ' . $b['last_name']) ?></td>
          <td>Room <?= htmlspecialchars($b['room_number']) ?> (<?= htmlspecialchars($b['room_type']) ?>)</td>
          <td><?= $b['check_in_date'] ?> → <?= $b['check_out_date'] ?></td>
          <td style="text-align:right; font-family:monospace;"><?= $settings['currency_symbol'] ?><?= number_format($b['room_subtotal'], 2) ?></td>
          <td style="text-align:right; font-family:monospace; color:<?= $b['balance_amount'] > 1 ? '#f87171' : '#34d399' ?>;">
            <?= $settings['currency_symbol'] ?><?= number_format($b['balance_amount'], 2) ?>
          </td>
          <td style="text-align:center;">
            <span class="badge badge-<?= $b['status'] ?>"><?= $b['status'] ?></span>
          </td>
          <td style="text-align:right;">
            <a href="voucher.php?id=<?= $b['id'] ?>" target="_blank" class="btn btn-secondary btn-sm">Voucher</a>
            <?php if ($b['folio_id']): ?>
              <a href="invoice.php?id=<?= $b['folio_id'] ?>" target="_blank" class="btn btn-primary btn-sm">Folio</a>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
