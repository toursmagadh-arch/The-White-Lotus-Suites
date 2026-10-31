<?php
/**
 * The Grand Royale Palace Hotel & Spa - Staff & RBAC Permissions
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();
checkRole(['Administrator', 'General Manager']);

$msg = '';
$err = '';

// Handle Add New Staff
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_user') {
    $username = trim($_POST['username'] ?? '');
    $fullName = trim($_POST['full_name'] ?? '');
    $role = $_POST['role'] ?? 'Receptionist';
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $pass = $_POST['password'] ?? '';

    if (empty($username) || empty($fullName) || empty($pass)) {
        $err = 'Username, Full Name, and Password are required.';
    } else {
        // Check uniqueness
        $check = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $check->execute([$username]);
        if ($check->fetch()) {
            $err = "Username '$username' already taken.";
        } else {
            $hash = password_hash($pass, PASSWORD_BCRYPT);
            $ins = $pdo->prepare("INSERT INTO users (username, password_hash, full_name, role, email, phone, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())");
            $ins->execute([$username, $hash, $fullName, $role, $email, $phone]);

            logAudit($pdo, 'User Created', "Added new staff member: $fullName ($role)");
            $msg = "Staff member '$fullName' ($role) added successfully.";
        }
    }
}

// Handle Toggle User Status (Activate/Deactivate)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'toggle_status') {
    $userId = intval($_POST['user_id'] ?? 0);
    if ($userId === 1) {
        $err = 'Master Administrator account cannot be disabled.';
    } else {
        $pdo->prepare("UPDATE users SET is_active = NOT is_active WHERE id = ?")->execute([$userId]);
        logAudit($pdo, 'Staff Status Toggled', "Toggled active state for User ID #$userId");
        $msg = 'Staff active status updated.';
    }
}

// Fetch staff list
$staffList = $pdo->query("SELECT * FROM users ORDER BY id ASC")->fetchAll();

// Fetch audit trail
$auditLogs = $pdo->query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 30")->fetchAll();

$pageTitle = 'Staff Management & Security Audit Logs';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="card mb-4" style="border-left: 4px solid var(--gold);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
            <h2 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 4px;">Staff Directory & Security Audit</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Manage user accounts, RBAC permissions, and review security audit trail logs.</p>
        </div>
        <div>
            <button onclick="document.getElementById('addUserModal').style.display='flex'" class="btn btn-primary">
                <i class="fa-solid fa-user-plus"></i> Add New Employee
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

<!-- Staff Directory Table -->
<div class="card mb-4">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.15rem; font-weight: 600;">Authorized Personnel (<?= count($staffList) ?>)</h3>
        <span class="badge" style="background: rgba(200,162,88,0.15); color: var(--gold-light);">Role-Based Access Control</span>
    </div>

    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Staff Name & Username</th>
                    <th>Role</th>
                    <th>Contact Information</th>
                    <th>Status</th>
                    <th>Enrolled Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($staffList as $u): ?>
                    <tr>
                        <td>
                            <strong style="color: #fff; font-size: 0.95rem;"><?= htmlspecialchars($u['full_name']) ?></strong>
                            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">@<?= htmlspecialchars($u['username']) ?></div>
                        </td>
                        <td>
                            <?php
                            $roleBadgeColor = '#3b82f6';
                            if ($u['role'] === 'Administrator') $roleBadgeColor = '#ef4444';
                            elseif ($u['role'] === 'General Manager') $roleBadgeColor = '#f59e0b';
                            elseif ($u['role'] === 'Receptionist') $roleBadgeColor = '#10b981';
                            elseif ($u['role'] === 'Housekeeping') $roleBadgeColor = '#8b5cf6';
                            ?>
                            <span class="badge" style="background: <?= $roleBadgeColor ?>20; color: <?= $roleBadgeColor ?>; border: 1px solid <?= $roleBadgeColor ?>40;">
                                <?= htmlspecialchars($u['role']) ?>
                            </span>
                        </td>
                        <td style="font-size: 0.85rem; color: var(--text-muted);">
                            <div><i class="fa-solid fa-envelope" style="width: 14px;"></i> <?= htmlspecialchars($u['email'] ?: 'N/A') ?></div>
                            <div><i class="fa-solid fa-phone" style="width: 14px;"></i> <?= htmlspecialchars($u['phone'] ?: 'N/A') ?></div>
                        </td>
                        <td>
                            <?php if ($u['is_active']): ?>
                                <span class="badge badge-clean"><i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> Active</span>
                            <?php else: ?>
                                <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444;">Suspended</span>
                            <?php endif; ?>
                        </td>
                        <td style="color: var(--text-muted); font-size: 0.85rem;"><?= date('d M Y', strtotime($u['created_at'])) ?></td>
                        <td>
                            <?php if ($u['id'] !== 1): ?>
                                <form method="POST" style="display: inline;">
                                    <input type="hidden" name="action" value="toggle_status">
                                    <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                    <button type="submit" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.78rem;">
                                        <?= $u['is_active'] ? 'Deactivate' : 'Activate' ?>
                                    </button>
                                </form>
                            <?php else: ?>
                                <span style="font-size: 0.75rem; color: var(--gold-light);">Primary Admin</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Security Audit Log Table -->
<div class="card">
    <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-shield-halved" style="color: var(--gold);"></i> System Security Audit Trail
    </h3>
    <div class="table-responsive">
        <table class="table" style="font-size: 0.84rem;">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($auditLogs as $log): ?>
                    <tr>
                        <td style="color: var(--text-muted); white-space: nowrap;"><?= date('d M Y, h:i:s A', strtotime($log['created_at'])) ?></td>
                        <td><strong style="color: var(--gold-light);"><?= htmlspecialchars($log['user']) ?></strong></td>
                        <td><span class="badge" style="background: rgba(255,255,255,0.08);"><?= htmlspecialchars($log['action']) ?></span></td>
                        <td style="color: var(--text-muted);"><?= htmlspecialchars($log['details']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Add Employee Modal -->
<div id="addUserModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
    <div class="card" style="max-width: 520px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-heading); color: var(--gold-light);">Enroll New Staff Member</h3>
            <button onclick="document.getElementById('addUserModal').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;">&times;</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="add_user">
            <div class="grid grid-2 mb-3">
                <div class="form-group">
                    <label>Full Legal Name *</label>
                    <input type="text" name="full_name" class="form-control" placeholder="e.g. Vikram Malhotra" required>
                </div>
                <div class="form-group">
                    <label>System Username *</label>
                    <input type="text" name="username" class="form-control" placeholder="e.g. vikram.m" required>
                </div>
            </div>
            <div class="grid grid-2 mb-3">
                <div class="form-group">
                    <label>Designation / Role</label>
                    <select name="role" class="form-control" required>
                        <option value="Receptionist">Front Desk Receptionist</option>
                        <option value="Housekeeping">Housekeeping Supervisor</option>
                        <option value="Restaurant Staff">Restaurant F&B Staff</option>
                        <option value="Chef">Executive Chef</option>
                        <option value="Accountant">Night Auditor / Accountant</option>
                        <option value="General Manager">General Manager</option>
                        <option value="Administrator">System Administrator</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Password *</label>
                    <input type="password" name="password" class="form-control" placeholder="Strong password" required>
                </div>
            </div>
            <div class="grid grid-2 mb-4">
                <div class="form-group">
                    <label>Work Email</label>
                    <input type="email" name="email" class="form-control" placeholder="vikram@grandroyale.com">
                </div>
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input type="text" name="phone" class="form-control" placeholder="+91 98200 12345">
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('addUserModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Employee Profile</button>
            </div>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
