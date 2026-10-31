<?php
$pageTitle = 'Front Desk Operations';
require_once __DIR__ . '/includes/header.php';

$msg = null;
$error = null;

// Handle Check-in Action
if (isset($_GET['action']) && $_GET['action'] === 'checkin' && isset($_GET['id'])) {
    $bookingId = (int)$_GET['id'];
    
    // Check room cleaning readiness
    $bStmt = $pdo->prepare("SELECT b.*, r.room_number, r.cleaning_status FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?");
    $bStmt->execute([$bookingId]);
    $booking = $bStmt->fetch();

    if ($booking) {
        if (!in_array($booking['cleaning_status'], ['Clean', 'Ready'])) {
            $error = "Check-in Blocked: Room {$booking['room_number']} is currently '{$booking['cleaning_status']}'. Must be inspected and ready before guest check-in.";
        } else {
            $pdo->prepare("UPDATE bookings SET status = 'Checked-in', actual_check_in = NOW() WHERE id = ?")->execute([$bookingId]);
            $pdo->prepare("UPDATE rooms SET status = 'Occupied' WHERE id = ?")->execute([$booking['room_id']]);
            logAudit($pdo, currentUser()['name'], 'CHECK_IN', "Guest checked into Room {$booking['room_number']} (Booking {$booking['booking_code']})");
            $msg = "Guest successfully checked in to Room {$booking['room_number']}!";
        }
    }
}

// Handle Check-out Action
if (isset($_GET['action']) && $_GET['action'] === 'checkout' && isset($_GET['id'])) {
    $bookingId = (int)$_GET['id'];
    
    // Check balance
    $bStmt = $pdo->prepare("SELECT b.*, f.balance_amount, f.id as folio_id, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id LEFT JOIN folios f ON f.booking_id = b.id WHERE b.id = ?");
    $bStmt->execute([$bookingId]);
    $booking = $bStmt->fetch();

    if ($booking) {
        if (!isset($_GET['force']) && $booking['balance_amount'] > 1.0) {
            $error = "Outstanding Balance: Guest has an unpaid balance of {$settings['currency_symbol']}" . number_format($booking['balance_amount'], 2) . ". <a href='invoice.php?id={$booking['folio_id']}' target='_blank' style='color:#fbbf24;text-decoration:underline;'>Settle Folio Bill</a> or <a href='frontdesk.php?action=checkout&id=$bookingId&force=1' style='color:#f87171;'>Force Checkout</a>";
        } else {
            $pdo->prepare("UPDATE bookings SET status = 'Checked-out', actual_check_out = NOW() WHERE id = ?")->execute([$bookingId]);
            $pdo->prepare("UPDATE rooms SET status = 'Dirty', cleaning_status = 'Dirty' WHERE id = ?")->execute([$booking['room_id']]);
            
            // Auto queue housekeeping task
            $pdo->prepare("INSERT INTO housekeeping_tasks (room_id, task_type, status, remarks) VALUES (?, 'Turnaround Cleaning', 'Pending', 'Turnover after guest departure')")->execute([$booking['room_id']]);

            logAudit($pdo, currentUser()['name'], 'CHECK_OUT', "Guest checked out from Room {$booking['room_number']}. Room queued for Housekeeping.");
            $msg = "Check-out completed for Room {$booking['room_number']}. Room transferred to Housekeeping turnover.";
        }
    }
}

// Handle Room Transfer POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'transfer_room') {
    $bookingId = (int)$_POST['booking_id'];
    $targetRoomId = (int)$_POST['target_room_id'];
    $reason = trim($_POST['reason'] ?? 'Guest request');

    $bStmt = $pdo->prepare("SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?");
    $bStmt->execute([$bookingId]);
    $booking = $bStmt->fetch();

    $rStmt = $pdo->prepare("SELECT * FROM rooms WHERE id = ? AND status = 'Available'");
    $rStmt->execute([$targetRoomId]);
    $targetRoom = $rStmt->fetch();

    if ($booking && $targetRoom) {
        $pdo->prepare("UPDATE rooms SET status = 'Dirty', cleaning_status = 'Dirty' WHERE id = ?")->execute([$booking['room_id']]);
        $pdo->prepare("UPDATE rooms SET status = 'Occupied' WHERE id = ?")->execute([$targetRoomId]);
        $pdo->prepare("UPDATE bookings SET room_id = ? WHERE id = ?")->execute([$targetRoomId, $bookingId]);

        logAudit($pdo, currentUser()['name'], 'ROOM_TRANSFER', "Transferred Booking {$booking['booking_code']} from Room {$booking['room_number']} to Room {$targetRoom['room_number']}. Reason: $reason");
        $msg = "Suite transferred to Room {$targetRoom['room_number']} successfully!";
    } else {
        $error = "Transfer Failed: Target suite is not currently available.";
    }
}

// Fetch in-house guests
$inHouse = $pdo->query("
  SELECT b.*, g.first_name, g.last_name, g.phone, g.email as guest_email, g.city,
         r.room_number, r.floor, rt.name as room_type, f.id as folio_id, f.total_amount, f.balance_amount
  FROM bookings b
  JOIN guests g ON b.guest_id = g.id
  JOIN rooms r ON b.room_id = r.id
  JOIN room_types rt ON r.room_type_id = rt.id
  LEFT JOIN folios f ON f.booking_id = b.id
  WHERE b.status = 'Checked-in'
  ORDER BY r.room_number ASC
")->fetchAll();

$availableForTransfer = $pdo->query("SELECT r.*, rt.name as room_type FROM rooms r JOIN room_types rt ON r.room_type_id = rt.id WHERE r.status = 'Available' ORDER BY r.room_number ASC")->fetchAll();
?>

<?php if ($msg): ?>
  <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:12px;border-radius:8px;font-size:0.8rem;margin-bottom:16px;">
    <?= $msg ?>
  </div>
<?php endif; ?>
<?php if ($error): ?>
  <div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:12px;border-radius:8px;font-size:0.8rem;margin-bottom:16px;">
    <?= $error ?>
  </div>
<?php endif; ?>

<div class="table-panel">
  <div class="panel-header">
    <div class="panel-title">Resident In-House Guests (<?= count($inHouse) ?> Occupied Suites)</div>
  </div>

  <table class="pms-table">
    <thead>
      <tr>
        <th>Room #</th>
        <th>Resident Guest</th>
        <th>Arrival & Departure</th>
        <th>Suite Category</th>
        <th style="text-align:right;">Folio Total</th>
        <th style="text-align:right;">Balance Due</th>
        <th style="text-align:right;">Front Desk Operations</th>
      </tr>
    </thead>
    <tbody>
      <?php if (empty($inHouse)): ?>
        <tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px;">No resident guests currently checked in.</td></tr>
      <?php else: ?>
        <?php foreach ($inHouse as $inh): ?>
          <tr>
            <td>
              <strong style="font-size:1.1rem;color:var(--gold-primary);">Room <?= htmlspecialchars($inh['room_number']) ?></strong>
              <div style="font-size:0.7rem;color:var(--text-muted);">Floor <?= $inh['floor'] ?></div>
            </td>
            <td>
              <strong><?= htmlspecialchars($inh['first_name'] . ' ' . $inh['last_name']) ?></strong>
              <div style="font-size:0.7rem;color:var(--text-muted);"><?= htmlspecialchars($inh['phone']) ?> · <?= htmlspecialchars($inh['city']) ?></div>
            </td>
            <td>
              <?= $inh['check_in_date'] ?> → <strong><?= $inh['check_out_date'] ?></strong>
              <div style="font-size:0.7rem;color:var(--text-muted);"><?= $inh['total_nights'] ?> Nights total</div>
            </td>
            <td><?= htmlspecialchars($inh['room_type']) ?></td>
            <td style="text-align:right; font-family:monospace;"><?= $settings['currency_symbol'] ?><?= number_format($inh['total_amount'], 2) ?></td>
            <td style="text-align:right; font-family:monospace; font-weight:700; color:<?= $inh['balance_amount'] > 1 ? '#f87171' : '#34d399' ?>;">
              <?= $settings['currency_symbol'] ?><?= number_format($inh['balance_amount'], 2) ?>
            </td>
            <td style="text-align:right;">
              <?php if ($inh['folio_id']): ?>
                <a href="invoice.php?id=<?= $inh['folio_id'] ?>" target="_blank" class="btn btn-secondary btn-sm">Folio / Bill</a>
              <?php endif; ?>
              <button onclick="openTransferModal(<?= $inh['id'] ?>, '<?= $inh['room_number'] ?>')" class="btn btn-secondary btn-sm">Transfer</button>
              <a href="frontdesk.php?action=checkout&id=<?= $inh['id'] ?>" class="btn btn-primary btn-sm" onclick="return confirm('Process check-out for Room <?= $inh['room_number'] ?>?')">Check Out</a>
            </td>
          </tr>
        <?php endforeach; ?>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<!-- Modal: Suite Transfer -->
<div id="transferModal" class="modal-backdrop">
  <div class="modal-content" style="max-width:480px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="color:var(--gold-primary);font-size:1.1rem;">Suite Relocation & Transfer</h3>
      <button onclick="closeModal('transferModal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;">&times;</button>
    </div>

    <form method="POST" action="frontdesk.php">
      <input type="hidden" name="action" value="transfer_room">
      <input type="hidden" name="booking_id" id="transferBookingId">

      <div style="margin-bottom:12px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Target Vacant Suite</label>
        <select name="target_room_id" class="form-control" required>
          <?php foreach ($availableForTransfer as $av): ?>
            <option value="<?= $av['id'] ?>">Room <?= $av['room_number'] ?> - <?= $av['room_type'] ?> (Floor <?= $av['floor'] ?>)</option>
          <?php endforeach; ?>
        </select>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Transfer Reason</label>
        <select name="reason" class="form-control">
          <option value="Guest Requested Suite Upgrade">Guest Requested Suite Upgrade</option>
          <option value="Facility Defect in Prior Suite">Facility Defect in Prior Suite</option>
          <option value="High Floor / View Request">High Floor / View Request</option>
        </select>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" onclick="closeModal('transferModal')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Execute Relocation</button>
      </div>
    </form>
  </div>
</div>

<script>
  function openTransferModal(bookingId, roomNum) {
    document.getElementById('transferBookingId').value = bookingId;
    openModal('transferModal');
  }
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
