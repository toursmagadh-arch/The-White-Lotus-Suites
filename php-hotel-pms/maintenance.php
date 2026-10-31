<?php
/**
 * The Grand Royale Palace Hotel & Spa - Maintenance & Engineering
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

$msg = '';
$err = '';

// Handle creating maintenance ticket
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_ticket') {
    $roomId = !empty($_POST['room_id']) ? intval($_POST['room_id']) : null;
    $issue = trim($_POST['issue'] ?? '');
    $priority = $_POST['priority'] ?? 'Medium';
    $blockRoom = isset($_POST['block_room']) && $_POST['block_room'] === '1';

    if (empty($issue)) {
        $err = 'Please describe the engineering issue.';
    } else {
        $user = currentUser();
        $ins = $pdo->prepare("INSERT INTO maintenance_tickets (room_id, issue, priority, status, reported_by, created_at) VALUES (?, ?, ?, 'Pending', ?, NOW())");
        $ins->execute([$roomId, $issue, $priority, $user['full_name'] ?? 'Staff']);
        $ticketId = $pdo->lastInsertId();

        // If block room is selected, set room to Maintenance
        if ($roomId && $blockRoom) {
            $updRoom = $pdo->prepare("UPDATE rooms SET status = 'Maintenance' WHERE id = ?");
            $updRoom->execute([$roomId]);
            logAudit($pdo, 'Room Blocked for Maintenance', "Room ID #$roomId set to Out of Order (Ticket #$ticketId)");
        }

        $msg = "Maintenance ticket #$ticketId logged successfully.";
    }
}

// Handle updating maintenance ticket
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_ticket') {
    $ticketId = intval($_POST['ticket_id'] ?? 0);
    $status = $_POST['status'] ?? 'Pending';
    $cost = floatval($_POST['cost'] ?? 0);
    $notes = trim($_POST['resolution_notes'] ?? '');

    $tStmt = $pdo->prepare("SELECT * FROM maintenance_tickets WHERE id = ?");
    $tStmt->execute([$ticketId]);
    $ticket = $tStmt->fetch();

    if ($ticket) {
        $upd = $pdo->prepare("UPDATE maintenance_tickets SET status = ?, cost = ?, resolution_notes = ?, resolved_at = CASE WHEN ? = 'Resolved' THEN NOW() ELSE resolved_at END WHERE id = ?");
        $upd->execute([$status, $cost, $notes, $status, $ticketId]);

        // If resolved and had a room attached, set room to Clean / Available
        if ($status === 'Resolved' && $ticket['room_id']) {
            $updRoom = $pdo->prepare("UPDATE rooms SET status = 'Clean' WHERE id = ? AND status = 'Maintenance'");
            $updRoom->execute([$ticket['room_id']]);
        }

        logAudit($pdo, 'Maintenance Updated', "Ticket #$ticketId updated to $status (Cost: ₹$cost)");
        $msg = "Maintenance ticket #$ticketId updated to $status.";
    }
}

// Fetch all rooms for selector
$rooms = $pdo->query("SELECT id, room_number, room_type, status FROM rooms ORDER BY room_number ASC")->fetchAll();

// Fetch maintenance tickets
$tickets = $pdo->query("SELECT mt.*, r.room_number, r.room_type FROM maintenance_tickets mt LEFT JOIN rooms r ON mt.room_id = r.id ORDER BY (mt.status = 'Pending') DESC, (mt.status = 'In Progress') DESC, mt.created_at DESC")->fetchAll();

$pendingCount = 0;
$inProgressCount = 0;
$resolvedCount = 0;
$totalExpense = 0;
foreach ($tickets as $t) {
    if ($t['status'] === 'Pending') $pendingCount++;
    if ($t['status'] === 'In Progress') $inProgressCount++;
    if ($t['status'] === 'Resolved') $resolvedCount++;
    $totalExpense += floatval($t['cost']);
}

$pageTitle = 'Engineering & Facilities Maintenance';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="card mb-4" style="border-left: 4px solid var(--gold);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
            <h2 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 4px;">Facilities & Equipment Maintenance</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Track equipment repairs, HVAC servicing, plumbing, and out-of-order room clearance.</p>
        </div>
        <div>
            <button onclick="document.getElementById('newTicketModal').style.display='flex'" class="btn btn-primary">
                <i class="fa-solid fa-wrench"></i> Log Maintenance Issue
            </button>
        </div>
    </div>
</div>

<?php if ($msg): ?>
    <div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($msg) ?></div>
<?php endif; ?>
<?php if ($err): ?>
    <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> <?= htmlspecialchars($err) ?></div>
<?php endif; ?>

<!-- Stats Row -->
<div class="grid grid-4 mb-4">
    <div class="card stat-card" style="border-left: 4px solid #ef4444;">
        <span class="stat-label">Pending Issues</span>
        <div class="stat-value" style="color: #ef4444;"><?= $pendingCount ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Awaiting technician review</span>
    </div>
    <div class="card stat-card" style="border-left: 4px solid #3b82f6;">
        <span class="stat-label">In Progress Work</span>
        <div class="stat-value" style="color: #3b82f6;"><?= $inProgressCount ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Being repaired</span>
    </div>
    <div class="card stat-card" style="border-left: 4px solid #10b981;">
        <span class="stat-label">Resolved & Cleared</span>
        <div class="stat-value" style="color: #10b981;"><?= $resolvedCount ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Cleared for operations</span>
    </div>
    <div class="card stat-card" style="border-left: 4px solid var(--gold);">
        <span class="stat-label">Total Repair Costs</span>
        <div class="stat-value" style="color: var(--gold-light);">₹<?= number_format($totalExpense, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Recorded facility expenses</span>
    </div>
</div>

<!-- Maintenance Tickets Table -->
<div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.15rem; font-weight: 600;">Work Order Tickets</h3>
        <span class="badge" style="background: rgba(255,255,255,0.08); color: var(--text-muted);"><?= count($tickets) ?> total recorded</span>
    </div>

    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Ticket ID</th>
                    <th>Location / Room</th>
                    <th>Issue Description</th>
                    <th>Priority</th>
                    <th>Reported By / Date</th>
                    <th>Status</th>
                    <th>Repair Cost</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($tickets)): ?>
                    <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No maintenance tickets found. All facilities operational.</td></tr>
                <?php else: ?>
                    <?php foreach ($tickets as $t): ?>
                        <tr>
                            <td><strong style="color: var(--gold-light);">#MT-<?= str_pad($t['id'], 4, '0', STR_PAD_LEFT) ?></strong></td>
                            <td>
                                <?php if ($t['room_number']): ?>
                                    <span class="badge badge-maint"><i class="fa-solid fa-door-closed"></i> Room <?= htmlspecialchars($t['room_number']) ?></span>
                                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;"><?= htmlspecialchars($t['room_type']) ?></div>
                                <?php else: ?>
                                    <span class="badge" style="background: rgba(255,255,255,0.08); color: var(--text-muted);">General Facility</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="font-weight: 500;"><?= htmlspecialchars($t['issue']) ?></div>
                                <?php if ($t['resolution_notes']): ?>
                                    <div style="font-size: 0.75rem; color: var(--emerald); margin-top: 2px;">
                                        <i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($t['resolution_notes']) ?>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($t['priority'] === 'High'): ?>
                                    <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444;">High</span>
                                <?php elseif ($t['priority'] === 'Medium'): ?>
                                    <span class="badge" style="background: rgba(245,158,11,0.2); color: #f59e0b;">Medium</span>
                                <?php else: ?>
                                    <span class="badge" style="background: rgba(59,130,246,0.2); color: #3b82f6;">Low</span>
                                <?php endif; ?>
                            </td>
                            <td style="font-size: 0.85rem; color: var(--text-muted);">
                                <div><?= htmlspecialchars($t['reported_by']) ?></div>
                                <div style="font-size: 0.75rem;"><?= date('d M Y, h:i A', strtotime($t['created_at'])) ?></div>
                            </td>
                            <td>
                                <?php if ($t['status'] === 'Pending'): ?>
                                    <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444;"><i class="fa-solid fa-clock"></i> Pending</span>
                                <?php elseif ($t['status'] === 'In Progress'): ?>
                                    <span class="badge" style="background: rgba(59,130,246,0.2); color: #3b82f6;"><i class="fa-solid fa-screwdriver-wrench"></i> In Progress</span>
                                <?php else: ?>
                                    <span class="badge" style="background: rgba(16,185,129,0.2); color: #10b981;"><i class="fa-solid fa-check"></i> Resolved</span>
                                <?php endif; ?>
                            </td>
                            <td style="font-weight: 600; color: var(--gold-light);">
                                <?= $t['cost'] > 0 ? '₹' . number_format($t['cost'], 2) : '-' ?>
                            </td>
                            <td>
                                <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="openUpdateModal(<?= $t['id'] ?>, '<?= htmlspecialchars($t['status']) ?>', <?= $t['cost'] ?? 0 ?>, '<?= addslashes($t['resolution_notes'] ?? '') ?>')">
                                    <i class="fa-solid fa-pen"></i> Update
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Create Ticket Modal -->
<div id="newTicketModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
    <div class="card" style="max-width: 500px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-heading); color: var(--gold-light);">Report Facility Maintenance</h3>
            <button onclick="document.getElementById('newTicketModal').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;">&times;</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="create_ticket">
            <div class="form-group mb-3">
                <label>Affected Suite / Location</label>
                <select name="room_id" class="form-control">
                    <option value="">General Facility / Common Area</option>
                    <?php foreach ($rooms as $r): ?>
                        <option value="<?= $r['id'] ?>">Room <?= htmlspecialchars($r['room_number']) ?> - <?= htmlspecialchars($r['room_type']) ?> (<?= $r['status'] ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-group mb-3">
                <label>Issue Description *</label>
                <textarea name="issue" class="form-control" rows="3" placeholder="Describe the fault (e.g. Master bathroom AC cooling failure, geyser leak, lock jammed...)" required></textarea>
            </div>
            <div class="form-group mb-3">
                <label>Urgency Level</label>
                <select name="priority" class="form-control">
                    <option value="Medium">Medium</option>
                    <option value="High">High (Immediate Action Required)</option>
                    <option value="Low">Low (Routine Servicing)</option>
                </select>
            </div>
            <div class="form-group mb-4">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--amber);">
                    <input type="checkbox" name="block_room" value="1" checked>
                    <span>Mark Suite as <strong>Out of Order (Maintenance)</strong> until resolved</span>
                </label>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('newTicketModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Dispatch Work Order</button>
            </div>
        </form>
    </div>
</div>

<!-- Update Ticket Modal -->
<div id="updateTicketModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
    <div class="card" style="max-width: 480px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-heading); color: var(--gold-light);" id="updateModalTitle">Update Work Order</h3>
            <button onclick="document.getElementById('updateTicketModal').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;">&times;</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="update_ticket">
            <input type="hidden" name="ticket_id" id="updTicketId" value="0">
            <div class="form-group mb-3">
                <label>Work Status</label>
                <select name="status" id="updStatus" class="form-control">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved & Cleared</option>
                </select>
            </div>
            <div class="form-group mb-3">
                <label>Repair Expense (₹)</label>
                <input type="number" step="0.01" name="cost" id="updCost" class="form-control" placeholder="Parts and labor cost">
            </div>
            <div class="form-group mb-4">
                <label>Resolution Notes</label>
                <textarea name="resolution_notes" id="updNotes" class="form-control" rows="2" placeholder="e.g. Replaced AC thermostat capacitor; tested cooling at 21C."></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('updateTicketModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    </div>
</div>

<script>
function openUpdateModal(id, status, cost, notes) {
    document.getElementById('updTicketId').value = id;
    document.getElementById('updateModalTitle').textContent = 'Update Ticket #MT-' + String(id).padStart(4, '0');
    document.getElementById('updStatus').value = status;
    document.getElementById('updCost').value = cost || '';
    document.getElementById('updNotes').value = notes || '';
    document.getElementById('updateTicketModal').style.display = 'flex';
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
