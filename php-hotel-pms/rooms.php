<?php
$pageTitle = 'Room Matrix & Grid';
require_once __DIR__ . '/includes/header.php';

$msg = null;
$error = null;

// Handle Add Room POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_room') {
    checkRole('Administrator', 'Manager');
    $roomNum = trim($_POST['room_number'] ?? '');
    $floor = (int)($_POST['floor'] ?? 1);
    $typeId = (int)($_POST['room_type_id'] ?? 1);
    $bedType = trim($_POST['bed_type'] ?? 'King');
    $hasAc = isset($_POST['has_ac']) ? 1 : 0;
    $notes = trim($_POST['notes'] ?? '');

    try {
        $stmt = $pdo->prepare("INSERT INTO rooms (room_number, floor, room_type_id, bed_type, has_ac, status, cleaning_status, notes) VALUES (?, ?, ?, ?, ?, 'Available', 'Ready', ?)");
        $stmt->execute([$roomNum, $floor, $typeId, $bedType, $hasAc, $notes]);
        logAudit($pdo, currentUser()['name'], 'ROOM_CREATED', "Added room $roomNum");
        $msg = "Room $roomNum successfully created!";
    } catch (PDOException $e) {
        $error = "Error: Room number already exists in property records.";
    }
}

// Quick status toggle
if (isset($_GET['toggle_clean']) && is_numeric($_GET['toggle_clean'])) {
    $roomId = (int)$_GET['toggle_clean'];
    $stmt = $pdo->prepare("UPDATE rooms SET status = 'Available', cleaning_status = 'Ready' WHERE id = ?");
    $stmt->execute([$roomId]);
    logAudit($pdo, currentUser()['name'], 'ROOM_CLEANED', "Room ID $roomId marked clean and ready");
    header("Location: rooms.php");
    exit;
}

// Filter parameters
$filterFloor = $_GET['floor'] ?? 'all';
$filterStatus = $_GET['status'] ?? 'all';

$sql = "
  SELECT r.*, rt.name as room_type, rt.base_rate, rt.capacity_adults, rt.capacity_children,
         b.id as active_booking_id, g.first_name, g.last_name, b.check_out_date
  FROM rooms r
  JOIN room_types rt ON r.room_type_id = rt.id
  LEFT JOIN bookings b ON b.room_id = r.id AND b.status = 'Checked-in'
  LEFT JOIN guests g ON b.guest_id = g.id
  WHERE 1=1
";
$params = [];
if ($filterFloor !== 'all') {
    $sql .= " AND r.floor = ?";
    $params[] = (int)$filterFloor;
}
if ($filterStatus !== 'all') {
    $sql .= " AND r.status = ?";
    $params[] = $filterStatus;
}
$sql .= " ORDER BY r.floor ASC, r.room_number ASC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$roomsList = $stmt->fetchAll();

$roomTypes = $pdo->query("SELECT * FROM room_types ORDER BY base_rate ASC")->fetchAll();
?>

<?php if ($msg): ?>
  <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:12px;border-radius:8px;font-size:0.8rem;margin-bottom:16px;">
    <?= htmlspecialchars($msg) ?>
  </div>
<?php endif; ?>
<?php if ($error): ?>
  <div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:12px;border-radius:8px;font-size:0.8rem;margin-bottom:16px;">
    <?= htmlspecialchars($error) ?>
  </div>
<?php endif; ?>

<div class="panel-header" style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:10px;margin-bottom:20px;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="font-size:0.75rem;color:var(--text-muted);font-weight:700;">FLOOR:</span>
    <a href="rooms.php?status=<?= urlencode($filterStatus) ?>" class="btn <?= $filterFloor == 'all' ? 'btn-primary' : 'btn-secondary' ?> btn-sm">All</a>
    <?php for ($fl = 1; $fl <= 5; $fl++): ?>
      <a href="rooms.php?floor=<?= $fl ?>&status=<?= urlencode($filterStatus) ?>" class="btn <?= $filterFloor == $fl ? 'btn-primary' : 'btn-secondary' ?> btn-sm">Floor <?= $fl ?></a>
    <?php endfor; ?>
  </div>

  <div style="display:flex;gap:10px;">
    <?php if (in_array(currentUser()['role'], ['Administrator', 'Manager'])): ?>
      <button onclick="openModal('addRoomModal')" class="btn btn-primary btn-sm">
        <i data-feather="plus"></i> Add New Room
      </button>
    <?php endif; ?>
  </div>
</div>

<!-- Color Coded Visual Room Rack -->
<div class="room-grid">
  <?php foreach ($roomsList as $room): ?>
    <div class="room-card <?= $room['status'] ?>">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="room-num"><?= htmlspecialchars($room['room_number']) ?></div>
            <div style="font-size:0.72rem;color:var(--text-muted);">Floor <?= $room['floor'] ?> · <?= htmlspecialchars($room['bed_type']) ?></div>
          </div>
          <span class="badge badge-<?= $room['status'] ?>"><?= $room['status'] ?></span>
        </div>

        <div style="margin-top:8px;font-size:0.78rem;color:var(--gold-primary);font-weight:600;">
          <?= htmlspecialchars($room['room_type']) ?>
        </div>

        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
          <?= $settings['currency_symbol'] ?><?= number_format($room['base_rate'], 0) ?>/night
        </div>

        <?php if ($room['status'] === 'Occupied' && $room['first_name']): ?>
          <div style="margin-top:8px;padding:6px;background:rgba(0,0,0,0.4);border-radius:6px;font-size:0.72rem;">
            <div>Guest: <strong><?= htmlspecialchars($room['first_name'] . ' ' . $room['last_name']) ?></strong></div>
            <div style="color:var(--text-muted);">Until: <?= $room['check_out_date'] ?></div>
          </div>
        <?php endif; ?>
      </div>

      <div style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.68rem;color:var(--text-muted);">Cleaning: <?= $room['cleaning_status'] ?></span>

        <?php if ($room['status'] === 'Available'): ?>
          <a href="bookings.php?action=new&room_id=<?= $room['id'] ?>" class="btn btn-primary btn-sm" style="padding:2px 8px;font-size:0.7rem;">Book</a>
        <?php elseif ($room['status'] === 'Dirty' || $room['status'] === 'Cleaning'): ?>
          <a href="rooms.php?toggle_clean=<?= $room['id'] ?>" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:0.7rem;">Mark Ready</a>
        <?php endif; ?>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<!-- Modal: Add New Room -->
<div id="addRoomModal" class="modal-backdrop">
  <div class="modal-content">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="color:var(--gold-primary);font-size:1.1rem;">Add New Property Suite</h3>
      <button onclick="closeModal('addRoomModal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;">&times;</button>
    </div>

    <form method="POST" action="rooms.php">
      <input type="hidden" name="action" value="add_room">
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Room Number</label>
          <input type="text" name="room_number" class="form-control" placeholder="e.g. 105" required>
        </div>
        <div>
          <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Floor Level</label>
          <input type="number" name="floor" min="1" max="20" class="form-control" value="1" required>
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Room Category</label>
        <select name="room_type_id" class="form-control" required>
          <?php foreach ($roomTypes as $rt): ?>
            <option value="<?= $rt['id'] ?>"><?= htmlspecialchars($rt['name']) ?> (<?= $settings['currency_symbol'] ?><?= number_format($rt['base_rate'], 0) ?>/nt)</option>
          <?php endforeach; ?>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Bed Configuration</label>
          <select name="bed_type" class="form-control">
            <option value="King">King Bed</option>
            <option value="Twin">Twin Beds</option>
            <option value="Two Kings">Two Master Kings</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;padding-top:20px;">
          <label style="font-size:0.75rem;color:#fff;cursor:pointer;">
            <input type="checkbox" name="has_ac" value="1" checked> Air Conditioned
          </label>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Notes / Balcony / Sea View</label>
        <input type="text" name="notes" class="form-control" placeholder="e.g. Arab Sea facing balcony">
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" onclick="closeModal('addRoomModal')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Suite</button>
      </div>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
