<?php
/**
 * The Grand Royale Palace Hotel & Spa - Kitchen & Hotel Inventory
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

$msg = '';
$err = '';

// Handle stock adjustment (Stock-In or Stock-Out / Wastage)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'adjust_stock') {
    $itemId = intval($_POST['item_id'] ?? 0);
    $type = $_POST['type'] ?? 'IN'; // IN, OUT, WASTE
    $qty = floatval($_POST['quantity'] ?? 0);
    $notes = trim($_POST['notes'] ?? '');

    if ($itemId <= 0 || $qty <= 0) {
        $err = 'Please enter a valid quantity.';
    } else {
        $itemStmt = $pdo->prepare("SELECT item_name, current_stock FROM inventory WHERE id = ?");
        $itemStmt->execute([$itemId]);
        $inv = $itemStmt->fetch();

        if (!$inv) {
            $err = 'Inventory item not found.';
        } elseif (($type === 'OUT' || $type === 'WASTE') && $inv['current_stock'] < $qty) {
            $err = "Insufficient stock. Current available: {$inv['current_stock']}";
        } else {
            $stockChange = ($type === 'IN') ? $qty : -$qty;
            $upd = $pdo->prepare("UPDATE inventory SET current_stock = current_stock + ?, last_restocked = CASE WHEN ? = 'IN' THEN CURRENT_DATE ELSE last_restocked END WHERE id = ?");
            $upd->execute([$stockChange, $type, $itemId]);

            $user = currentUser();
            $logStmt = $pdo->prepare("INSERT INTO stock_movements (inventory_id, type, quantity, notes, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $logStmt->execute([$itemId, $type, $qty, $notes, $user['full_name'] ?? 'Staff']);

            logAudit($pdo, 'Inventory Adjustment', "Stock $type: $qty for {$inv['item_name']} ($notes)");
            $msg = "Stock successfully recorded for {$inv['item_name']} ($type $qty).";
        }
    }
}

// Handle Add New Inventory Item
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_item') {
    $name = trim($_POST['item_name'] ?? '');
    $cat = trim($_POST['category'] ?? 'Kitchen & Dairy');
    $unit = trim($_POST['unit'] ?? 'kg');
    $current = floatval($_POST['current_stock'] ?? 0);
    $min = floatval($_POST['min_stock'] ?? 10);
    $cost = floatval($_POST['cost_per_unit'] ?? 0);
    $supplier = trim($_POST['supplier'] ?? '');

    if (empty($name)) {
        $err = 'Item name is required.';
    } else {
        $ins = $pdo->prepare("INSERT INTO inventory (item_name, category, unit, current_stock, min_stock, cost_per_unit, supplier, last_restocked) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)");
        $ins->execute([$name, $cat, $unit, $current, $min, $cost, $supplier]);
        logAudit($pdo, 'Inventory Item Added', "Added $name to $cat");
        $msg = "Item '$name' added to inventory catalog.";
    }
}

// Fetch all inventory items
$inventory = $pdo->query("SELECT * FROM inventory ORDER BY (current_stock <= min_stock) DESC, category ASC, item_name ASC")->fetchAll();

// Fetch recent stock movements
$movements = $pdo->query("SELECT sm.*, inv.item_name, inv.unit FROM stock_movements sm JOIN inventory inv ON sm.inventory_id = inv.id ORDER BY sm.created_at DESC LIMIT 15")->fetchAll();

// KPI counts
$totalItems = count($inventory);
$lowStockCount = 0;
$totalValuation = 0;
foreach ($inventory as $i) {
    if ($i['current_stock'] <= $i['min_stock']) $lowStockCount++;
    $totalValuation += ($i['current_stock'] * $i['cost_per_unit']);
}

$pageTitle = 'Inventory & Kitchen Stock Management';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="card mb-4" style="border-left: 4px solid var(--gold);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
            <h2 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 4px;">Hotel & Kitchen Inventory Ledger</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Manage raw kitchen provisions, minibar items, linen supplies, and track stock movements.</p>
        </div>
        <div style="display: flex; gap: 8px;">
            <button onclick="document.getElementById('adjustModal').style.display='flex'" class="btn btn-secondary">
                <i class="fa-solid fa-arrow-right-arrow-left"></i> Stock In / Out
            </button>
            <button onclick="document.getElementById('addItemModal').style.display='flex'" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> Add New Item
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

<!-- Inventory KPIs -->
<div class="grid grid-3 mb-4">
    <div class="card stat-card">
        <span class="stat-label">Catalog Items</span>
        <div class="stat-value"><?= $totalItems ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Kitchen, Bar & Housekeeping</span>
    </div>
    <div class="card stat-card" style="<?= $lowStockCount > 0 ? 'border-color: rgba(239, 68, 68, 0.4);' : '' ?>">
        <span class="stat-label">Low Stock Alerts</span>
        <div class="stat-value" style="color: <?= $lowStockCount > 0 ? '#ef4444' : 'var(--emerald)' ?>;"><?= $lowStockCount ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Items at or below reorder threshold</span>
    </div>
    <div class="card stat-card">
        <span class="stat-label">Total Inventory Valuation</span>
        <div class="stat-value" style="color: var(--gold-light);">₹<?= number_format($totalValuation, 2) ?></div>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Current on-hand stock cost</span>
    </div>
</div>

<!-- Inventory Table -->
<div class="card mb-4">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <h3 style="font-size: 1.15rem; font-weight: 600;">Stock Directory</h3>
        <input type="text" id="inventorySearch" placeholder="Search item or supplier..." class="form-control" style="max-width: 260px;" onkeyup="searchInventoryTable()">
    </div>

    <div class="table-responsive">
        <table class="table" id="invTable">
            <thead>
                <tr>
                    <th>Item & Category</th>
                    <th>Current Level</th>
                    <th>Min. Reorder Threshold</th>
                    <th>Unit Cost</th>
                    <th>Stock Value</th>
                    <th>Supplier</th>
                    <th>Last Restocked</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($inventory as $row): ?>
                    <?php 
                    $isLow = $row['current_stock'] <= $row['min_stock'];
                    ?>
                    <tr style="<?= $isLow ? 'background: rgba(239, 68, 68, 0.05);' : '' ?>">
                        <td>
                            <strong style="color: #fff; font-size: 0.95rem;"><?= htmlspecialchars($row['item_name']) ?></strong>
                            <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($row['category']) ?></div>
                        </td>
                        <td>
                            <span style="font-weight: 700; font-size: 1rem; color: <?= $isLow ? '#ef4444' : '#10b981' ?>;">
                                <?= $row['current_stock'] ?> <?= htmlspecialchars($row['unit']) ?>
                            </span>
                            <?php if ($isLow): ?>
                                <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; margin-left: 6px; font-size: 0.65rem;">LOW STOCK</span>
                            <?php endif; ?>
                        </td>
                        <td style="color: var(--text-muted);"><?= $row['min_stock'] ?> <?= htmlspecialchars($row['unit']) ?></td>
                        <td>₹<?= number_format($row['cost_per_unit'], 2) ?> / <?= htmlspecialchars($row['unit']) ?></td>
                        <td style="font-weight: 600; color: var(--gold-light);">₹<?= number_format($row['current_stock'] * $row['cost_per_unit'], 2) ?></td>
                        <td style="color: var(--text-muted); font-size: 0.85rem;"><?= htmlspecialchars($row['supplier'] ?: 'N/A') ?></td>
                        <td style="color: var(--text-muted); font-size: 0.85rem;"><?= $row['last_restocked'] ? date('d M Y', strtotime($row['last_restocked'])) : 'N/A' ?></td>
                        <td>
                            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;" onclick="quickAdjust(<?= $row['id'] ?>, '<?= addslashes($row['item_name']) ?>', '<?= htmlspecialchars($row['unit']) ?>')">
                                <i class="fa-solid fa-pen-to-square"></i> Adjust
                            </button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Recent Stock Movements Audit -->
<div class="card">
    <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-clock-rotate-left" style="color: var(--gold);"></i> Recent Stock Movement Activity Log
    </h3>
    <div class="table-responsive">
        <table class="table" style="font-size: 0.85rem;">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Item</th>
                    <th>Movement</th>
                    <th>Quantity</th>
                    <th>Reason / Notes</th>
                    <th>Recorded By</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($movements)): ?>
                    <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 16px;">No recent stock transactions recorded.</td></tr>
                <?php else: ?>
                    <?php foreach ($movements as $m): ?>
                        <tr>
                            <td style="color: var(--text-muted);"><?= date('d M Y, h:i A', strtotime($m['created_at'])) ?></td>
                            <td><strong><?= htmlspecialchars($m['item_name']) ?></strong></td>
                            <td>
                                <?php if ($m['type'] === 'IN'): ?>
                                    <span class="badge" style="background: rgba(16,185,129,0.2); color: #10b981;">STOCK IN</span>
                                <?php elseif ($m['type'] === 'OUT'): ?>
                                    <span class="badge" style="background: rgba(59,130,246,0.2); color: #3b82f6;">CONSUMPTION</span>
                                <?php else: ?>
                                    <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444;">WASTE / SPOIL</span>
                                <?php endif; ?>
                            </td>
                            <td style="font-weight: 600;"><?= $m['quantity'] ?> <?= htmlspecialchars($m['unit']) ?></td>
                            <td style="color: var(--text-muted);"><?= htmlspecialchars($m['notes'] ?: '-') ?></td>
                            <td style="color: var(--gold-light);"><?= htmlspecialchars($m['recorded_by']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Stock In / Out Adjustment Modal -->
<div id="adjustModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
    <div class="card" style="max-width: 500px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-heading); color: var(--gold-light);" id="adjustModalTitle">Record Stock Movement</h3>
            <button onclick="document.getElementById('adjustModal').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;">&times;</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="adjust_stock">
            <div class="form-group mb-3">
                <label>Inventory Item</label>
                <select name="item_id" id="adjustItemId" class="form-control" required>
                    <?php foreach ($inventory as $i): ?>
                        <option value="<?= $i['id'] ?>"><?= htmlspecialchars($i['item_name']) ?> (Current: <?= $i['current_stock'] ?> <?= $i['unit'] ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="grid grid-2 mb-3">
                <div class="form-group">
                    <label>Movement Type</label>
                    <select name="type" class="form-control" required>
                        <option value="IN">Stock In (Purchase/Restock)</option>
                        <option value="OUT">Stock Out (Kitchen Usage)</option>
                        <option value="WASTE">Wastage / Spoiled Stock</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" step="0.01" name="quantity" class="form-control" placeholder="Quantity" required>
                </div>
            </div>
            <div class="form-group mb-4">
                <label>Reason / Supplier Invoice Ref</label>
                <input type="text" name="notes" class="form-control" placeholder="e.g. Daily breakfast buffet prep or PO #9823">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('adjustModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Adjustment</button>
            </div>
        </form>
    </div>
</div>

<!-- Add Item Modal -->
<div id="addItemModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
    <div class="card" style="max-width: 550px; width: 90%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-family: var(--font-heading); color: var(--gold-light);">Add Item to Inventory</h3>
            <button onclick="document.getElementById('addItemModal').style.display='none'" style="background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;">&times;</button>
        </div>
        <form method="POST">
            <input type="hidden" name="action" value="add_item">
            <div class="grid grid-2 mb-3">
                <div class="form-group">
                    <label>Item Name *</label>
                    <input type="text" name="item_name" class="form-control" placeholder="e.g. Basmati Rice 1121" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select name="category" class="form-control">
                        <option value="Kitchen & Dairy">Kitchen & Dairy</option>
                        <option value="Bakery & Flour">Bakery & Flour</option>
                        <option value="Meat & Seafood">Meat & Seafood</option>
                        <option value="Spices & Oils">Spices & Oils</option>
                        <option value="Beverages & Bar">Beverages & Bar</option>
                        <option value="Housekeeping Supplies">Housekeeping Supplies</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-3 mb-3">
                <div class="form-group">
                    <label>Unit of Measure</label>
                    <input type="text" name="unit" class="form-control" placeholder="kg, L, bottles, pkts" value="kg" required>
                </div>
                <div class="form-group">
                    <label>Initial Stock</label>
                    <input type="number" step="0.01" name="current_stock" class="form-control" value="0" required>
                </div>
                <div class="form-group">
                    <label>Min Reorder Level</label>
                    <input type="number" step="0.01" name="min_stock" class="form-control" value="10" required>
                </div>
            </div>
            <div class="grid grid-2 mb-4">
                <div class="form-group">
                    <label>Cost per Unit (₹)</label>
                    <input type="number" step="0.01" name="cost_per_unit" class="form-control" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Primary Supplier</label>
                    <input type="text" name="supplier" class="form-control" placeholder="Supplier / Vendor name">
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('addItemModal').style.display='none'">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Item</button>
            </div>
        </form>
    </div>
</div>

<script>
function quickAdjust(itemId, itemName, unit) {
    document.getElementById('adjustItemId').value = itemId;
    document.getElementById('adjustModalTitle').textContent = 'Adjust Stock: ' + itemName;
    document.getElementById('adjustModal').style.display = 'flex';
}

function searchInventoryTable() {
    const q = document.getElementById('inventorySearch').value.toLowerCase();
    const rows = document.querySelectorAll('#invTable tbody tr');
    rows.forEach(r => {
        const text = r.innerText.toLowerCase();
        r.style.display = text.includes(q) ? '' : 'none';
    });
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
