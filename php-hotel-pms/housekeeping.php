<?php
$pageTitle = 'Housekeeping & Sanitization';
require_once __DIR__ . '/includes/header.php';

$msg = null;

// Handle status transitions
if (isset($_GET['task_id']) && isset($_GET['new_status'])) {
    $taskId = (int)$_GET['task_id'];
    $newStatus = $_GET['new_status'];

    if (in_array($newStatus, ['In Progress', 'Completed', 'Approved'])) {
        $stmt = $pdo->prepare("SELECT * FROM housekeeping_tasks WHERE id = ?");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();

        if ($task) {
            if ($newStatus === 'Approved') {
                $pdo->prepare("UPDATE housekeeping_tasks SET status = 'Approved', completed_at = NOW(), linen_changed = 1, toiletries_restocked = 1, minibar_checked = 1 WHERE id = ?")->execute([$taskId]);
                $pdo->prepare("UPDATE rooms SET status = 'Available', cleaning_status = 'Ready' WHERE id = ?")->execute([$task['room_id']]);
                logAudit($pdo, currentUser()['name'], 'HOUSEKEEPING_APPROVED', "Supervisor approved Room ID {$task['room_id']}. Suite ready for arrival.");
            } elseif ($newStatus === 'In Progress') {
                $pdo->prepare("UPDATE housekeeping_tasks SET status = 'In Progress', started_at = NOW() WHERE id = ?")->execute([$taskId]);
                $pdo->prepare("UPDATE rooms SET cleaning_status = 'Cleaning in Progress' WHERE id = ?")->execute([$task['room_id']]);
            } elseif ($newStatus === 'Completed') {
                $pdo->prepare("UPDATE housekeeping_tasks SET status = 'Completed', completed_at = NOW() WHERE id = ?")->execute([$taskId]);
                $pdo->prepare("UPDATE rooms SET cleaning_status = 'Inspected' WHERE id = ?")->execute([$task['room_id']]);
            }
            $msg = "Housekeeping task updated to $newStatus.";
        }
    }
}

// Handle Assign Task
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'assign_task') {
    $roomId = (int)$_POST['room_id'];
    $staff = trim($_POST['assigned_to'] ?? 'Ramesh Khurana');
    $taskType = $_POST['task_type'] ?? 'Turnaround Cleaning';
    $remarks = trim($_POST['remarks'] ?? '');

    $pdo->prepare("INSERT INTO housekeeping_tasks (room_id, assigned_to, task_type, status, remarks) VALUES (?, ?, ?, 'Pending', ?)")->execute([$roomId, $staff, $taskType, $remarks]);
    $pdo->prepare("UPDATE rooms SET cleaning_status = 'Dirty' WHERE id = ?")->execute([$roomId]);
    logAudit($pdo, currentUser()['name'], 'HOUSEKEEPING_ASSIGNED', "Assigned $taskType for Room ID $roomId");
    $msg = "Task assigned successfully to $staff.";
}

$tasks = $pdo->query("
  SELECT hk.*, r.room_number, r.floor, r.status as room_status
  FROM housekeeping_tasks hk
  JOIN rooms r ON hk.room_id = r.id
  ORDER BY hk.id DESC
")->fetchAll();

$allRooms = $pdo->query("SELECT * FROM rooms ORDER BY room_number ASC")->fetchAll();
?>

<?php if ($msg): ?>
  <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;padding:12px;border-radius:8px;font-size:0.8rem;margin-bottom:16px;">
    <?= htmlspecialchars($msg) ?>
  </div>
<?php endif; ?>

<div class="panel-header" style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:10px;margin-bottom:20px;">
  <div style="font-size:0.85rem;color:var(--text-muted);">
    Suite Sanitization Queue & Readiness Inspection
  </div>
  <button onclick="openModal('assignHkModal')" class="btn btn-primary btn-sm">
    <i data-feather="plus"></i> Assign Cleaning Duty
  </button>
</div>

<div class="table-panel">
  <table class="pms-table">
    <thead>
      <tr>
        <th>Room #</th>
        <th>Task Details</th>
        <th>Attendant Assigned</th>
        <th>Checklist Audit</th>
        <th style="text-align:center;">Task Status</th>
        <th style="text-align:right;">Workflow Transition</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($tasks as $t): ?>
        <tr>
          <td>
            <strong style="color:var(--gold-primary);font-size:1rem;">Room <?= htmlspecialchars($t['room_number']) ?></strong>
            <div style="font-size:0.7rem;color:var(--text-muted);">Floor <?= $t['floor'] ?></div>
          </td>
          <td>
            <strong><?= htmlspecialchars($t['task_type']) ?></strong>
            <div style="font-size:0.72rem;color:var(--text-muted);"><?= htmlspecialchars($t['remarks'] ?: 'Standard suite turn-down') ?></div>
          </td>
          <td><?= htmlspecialchars($t['assigned_to'] ?: 'Unassigned') ?></td>
          <td style="font-size:0.72rem;color:var(--text-muted);">
            <div>Linens: <?= $t['linen_changed'] ? '✓ Changed' : 'Pending' ?></div>
            <div>Amenities: <?= $t['toiletries_restocked'] ? '✓ Restocked' : 'Pending' ?></div>
          </td>
          <td style="text-align:center;">
            <span class="badge badge-<?= $t['status'] === 'Approved' ? 'Available' : ($t['status'] === 'Completed' ? 'Occupied' : ($t['status'] === 'In Progress' ? 'Cleaning' : 'Dirty')) ?>">
              <?= $t['status'] ?>
            </span>
          </td>
          <td style="text-align:right;">
            <?php if ($t['status'] === 'Pending'): ?>
              <a href="housekeeping.php?task_id=<?= $t['id'] ?>&new_status=In+Progress" class="btn btn-secondary btn-sm">Start Cleaning</a>
            <?php elseif ($t['status'] === 'In Progress'): ?>
              <a href="housekeeping.php?task_id=<?= $t['id'] ?>&new_status=Completed" class="btn btn-secondary btn-sm">Mark Complete</a>
            <?php elseif ($t['status'] === 'Completed'): ?>
              <a href="housekeeping.php?task_id=<?= $t['id'] ?>&new_status=Approved" class="btn btn-primary btn-sm">Supervisor Pass</a>
            <?php else: ?>
              <span style="font-size:0.75rem;color:#34d399;font-weight:600;">✓ Ready for Guest</span>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<!-- Modal: Assign Duty -->
<div id="assignHkModal" class="modal-backdrop">
  <div class="modal-content" style="max-width:480px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="color:var(--gold-primary);font-size:1.1rem;">Assign Cleaning Work Order</h3>
      <button onclick="closeModal('assignHkModal')" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;">&times;</button>
    </div>

    <form method="POST" action="housekeeping.php">
      <input type="hidden" name="action" value="assign_task">

      <div style="margin-bottom:12px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Target Suite</label>
        <select name="room_id" class="form-control" required>
          <?php foreach ($allRooms as $r): ?>
            <option value="<?= $r['id'] ?>">Room <?= $r['room_number'] ?> (Cleaning: <?= $r['cleaning_status'] ?>)</option>
          <?php endforeach; ?>
        </select>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Attendant Name</label>
        <input type="text" name="assigned_to" class="form-control" value="Ramesh Khurana" required>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Task Category</label>
        <select name="task_type" class="form-control">
          <option value="Turnaround Cleaning">Turnaround Cleaning (Departure turnover)</option>
          <option value="Daily Linen Change">Daily Linen Change & Turndown</option>
          <option value="Deep Sanitization">Deep Sanitization & Ozone Refresh</option>
          <option value="VIP Arrival Preparation">VIP Arrival Preparation</option>
        </select>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:4px;">Special Instructions</label>
        <input type="text" name="remarks" class="form-control" placeholder="e.g. Restock herbal bath kit">
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" onclick="closeModal('assignHkModal')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-primary">Dispatch Attendant</button>
      </div>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
