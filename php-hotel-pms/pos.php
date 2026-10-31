<?php
/**
 * The Grand Royale Palace Hotel & Spa - Restaurant POS & KOT
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

$msg = '';
$err = '';

// Handle creating order
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_order') {
    $orderType = $_POST['order_type'] ?? 'Dine-In';
    $tableNum = trim($_POST['table_number'] ?? '');
    $bookingId = !empty($_POST['booking_id']) ? intval($_POST['booking_id']) : null;
    $itemsJson = $_POST['items_json'] ?? '[]';
    $orderItems = json_decode($itemsJson, true);

    if (empty($orderItems)) {
        $err = 'Please select at least one menu item.';
    } else {
        $subtotal = 0;
        foreach ($orderItems as $item) {
            $subtotal += ($item['price'] * $item['qty']);
        }
        $settings = getHotelSettings($pdo);
        $taxRate = floatval($settings['tax_rate'] ?? 12);
        $tax = round(($subtotal * $taxRate) / 100, 2);
        $total = $subtotal + $tax;

        // Auto room number lookup if booking ID is given
        $roomNum = null;
        if ($bookingId) {
            $bkStmt = $pdo->prepare("SELECT r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?");
            $bkStmt->execute([$bookingId]);
            $roomNum = $bkStmt->fetchColumn() ?: null;
        }

        $orderNum = 'ORD-' . strtoupper(substr(uniqid(), -6));
        $stmt = $pdo->prepare("INSERT INTO restaurant_orders (order_number, booking_id, table_number, room_number, order_type, subtotal, tax, total_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())");
        $stmt->execute([$orderNum, $bookingId, $tableNum, $roomNum, $orderType, $subtotal, $tax, $total]);
        $orderId = $pdo->lastInsertId();

        // Insert order items
        $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($orderItems as $it) {
            $lineTotal = $it['price'] * $it['qty'];
            $itemStmt->execute([$orderId, $it['id'], $it['name'], $it['qty'], $it['price'], $lineTotal]);
        }

        // If charged to room booking, add charge directly into guest folio
        if ($bookingId && isset($_POST['bill_to_room']) && $_POST['bill_to_room'] === '1') {
            $folioStmt = $pdo->prepare("SELECT id FROM folios WHERE booking_id = ? LIMIT 1");
            $folioStmt->execute([$bookingId]);
            $folioId = $folioStmt->fetchColumn();
            if ($folioId) {
                $chargeStmt = $pdo->prepare("INSERT INTO folio_items (folio_id, description, category, amount, created_at) VALUES (?, ?, 'Restaurant', ?, NOW())");
                $chargeStmt->execute([$folioId, "Dining: Order #$orderNum (" . count($orderItems) . " items incl. tax)", $total]);
                
                // Update folio total
                $updFolio = $pdo->prepare("UPDATE folios SET total_amount = total_amount + ?, balance = balance + ? WHERE id = ?");
                $updFolio->execute([$total, $total, $folioId]);
            }
        }

        logAudit($pdo, 'POS Order Created', "Order #$orderNum created for $orderType (" . count($orderItems) . " items)");
        $msg = "Order #$orderNum placed successfully and routed to Kitchen Order Ticket (KOT)!";
    }
}

// Handle updating KOT status
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_kot_status') {
    $orderId = intval($_POST['order_id'] ?? 0);
    $newStatus = $_POST['kot_status'] ?? 'Pending';
    $stmt = $pdo->prepare("UPDATE restaurant_orders SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $orderId]);
    $msg = "Order status updated to $newStatus.";
}

// Fetch active in-house bookings for room charging
$inHouseBookings = $pdo->query("SELECT b.id, b.booking_code, g.full_name, r.room_number FROM bookings b JOIN guests g ON b.guest_id = g.id JOIN rooms r ON b.room_id = r.id WHERE b.status = 'Checked-in' ORDER BY r.room_number ASC")->fetchAll();

// Fetch menu categories and items
$categories = $pdo->query("SELECT DISTINCT category FROM menu_items WHERE is_available = 1 ORDER BY category ASC")->fetchAll(PDO::FETCH_COLUMN);
$menuItems = $pdo->query("SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category ASC, name ASC")->fetchAll();

// Fetch active kitchen orders
$orders = $pdo->query("SELECT ro.*, g.full_name as guest_name FROM restaurant_orders ro LEFT JOIN bookings b ON ro.booking_id = b.id LEFT JOIN guests g ON b.guest_id = g.id ORDER BY ro.created_at DESC LIMIT 20")->fetchAll();

// Fetch order items helper
$allOrderItems = $pdo->query("SELECT * FROM order_items")->fetchAll();
$itemsByOrder = [];
foreach ($allOrderItems as $oi) {
    $itemsByOrder[$oi['order_id']][] = $oi;
}

$pageTitle = 'Restaurant POS & Kitchen Display (KOT)';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="card mb-4" style="border-left: 4px solid var(--gold);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
            <h2 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 4px;">Le Grand Royal Dining & Room Service POS</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Touch POS, guest room-billing, and live Kitchen Order Ticket (KOT) workflow.</p>
        </div>
        <div style="display: flex; gap: 8px;">
            <button onclick="document.getElementById('kotSection').scrollIntoView({behavior: 'smooth'})" class="btn btn-secondary">
                <i class="fa-solid fa-utensils"></i> View Kitchen Tickets (KOT)
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

<div class="grid grid-3" style="gap: 24px; align-items: start;">
    <!-- POS Menu Selection (2 cols) -->
    <div style="grid-column: span 2;" class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <h3 style="font-size: 1.15rem; font-weight: 600;">Menu Catalog</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="categoryFilter">
                <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="filterCategory('All')">All</button>
                <?php foreach ($categories as $cat): ?>
                    <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="filterCategory('<?= htmlspecialchars($cat) ?>')"><?= htmlspecialchars($cat) ?></button>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="grid grid-3" style="gap: 14px;" id="menuContainer">
            <?php foreach ($menuItems as $m): ?>
                <div class="menu-item-card" data-category="<?= htmlspecialchars($m['category']) ?>" style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                            <span class="badge" style="background: rgba(200,162,88,0.15); color: var(--gold-light); font-size: 0.7rem;"><?= htmlspecialchars($m['category']) ?></span>
                            <span style="font-size: 1.05rem; font-weight: 700; color: var(--gold-light);">₹<?= number_format($m['price'], 2) ?></span>
                        </div>
                        <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 4px;"><?= htmlspecialchars($m['name']) ?></h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; min-height: 32px;"><?= htmlspecialchars($m['description']) ?></p>
                    </div>
                    <button type="button" class="btn btn-secondary" style="margin-top: 10px; width: 100%; font-size: 0.85rem; padding: 6px 10px;" onclick="addToCart(<?= $m['id'] ?>, '<?= addslashes($m['name']) ?>', <?= $m['price'] ?>)">
                        <i class="fa-solid fa-plus"></i> Add to Order
                    </button>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Active Cart & Checkout (1 col) -->
    <div class="card" style="position: sticky; top: 90px;">
        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-cart-shopping" style="color: var(--gold);"></i> Current Order</span>
            <span id="cartCount" class="badge badge-occup" style="font-size: 0.75rem;">0 items</span>
        </h3>

        <form method="POST" id="posForm">
            <input type="hidden" name="action" value="create_order">
            <input type="hidden" name="items_json" id="itemsJson" value="[]">

            <div class="form-group mb-2">
                <label>Order Destination</label>
                <select name="order_type" id="orderType" class="form-control" onchange="toggleOrderTypeFields()">
                    <option value="Dine-In">Dine-In Table</option>
                    <option value="Room Service">Room Service (In-House Suite)</option>
                    <option value="Takeaway">Takeaway / Bar</option>
                </select>
            </div>

            <div class="form-group mb-2" id="tableField">
                <label>Table Number</label>
                <input type="text" name="table_number" class="form-control" placeholder="e.g. T-04, Poolside-1">
            </div>

            <div class="form-group mb-2" id="roomField" style="display: none;">
                <label>Guest Suite / Room</label>
                <select name="booking_id" class="form-control">
                    <option value="">-- Select In-House Guest --</option>
                    <?php foreach ($inHouseBookings as $bk): ?>
                        <option value="<?= $bk['id'] ?>">Room <?= htmlspecialchars($bk['room_number']) ?> - <?= htmlspecialchars($bk['full_name']) ?></option>
                    <?php endforeach; ?>
                </select>
                <div style="margin-top: 6px;">
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; cursor: pointer; color: var(--gold-light);">
                        <input type="checkbox" name="bill_to_room" value="1" checked> Bill directly to Guest Folio
                    </label>
                </div>
            </div>

            <!-- Cart Table -->
            <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; margin: 12px 0; background: var(--bg-surface);">
                <table style="width: 100%; font-size: 0.85rem;" id="cartTable">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem;">
                            <th style="padding: 6px 8px; text-align: left;">Item</th>
                            <th style="padding: 6px 8px; text-align: center;">Qty</th>
                            <th style="padding: 6px 8px; text-align: right;">Total</th>
                            <th style="padding: 6px 4px;"></th>
                        </tr>
                    </thead>
                    <tbody id="cartBody">
                        <tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">No items in cart</td></tr>
                    </tbody>
                </table>
            </div>

            <div style="font-size: 0.9rem; line-height: 1.6; border-top: 1px solid var(--border); padding-top: 10px;">
                <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                    <span>Subtotal:</span>
                    <span id="posSubtotal">₹0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                    <span>GST (12%):</span>
                    <span id="posTax">₹0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.15rem; color: var(--gold-light); margin-top: 4px;">
                    <span>Total Amount:</span>
                    <span id="posTotal">₹0.00</span>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px; padding: 12px;">
                <i class="fa-solid fa-paper-plane"></i> Place Order & Generate KOT
            </button>
        </form>
    </div>
</div>

<!-- Kitchen Order Tickets (KOT) Display Section -->
<div class="card mt-4" id="kotSection">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-fire-burner" style="color: var(--amber);"></i> Live Kitchen Order Display (KOT)
        </h3>
        <span class="badge" style="background: rgba(255,255,255,0.08); color: var(--text-muted);">Auto-sorted by creation</span>
    </div>

    <div class="grid grid-3" style="gap: 16px;">
        <?php if (empty($orders)): ?>
            <p style="color: var(--text-muted); padding: 20px;">No kitchen orders active at this moment.</p>
        <?php else: ?>
            <?php foreach ($orders as $ord): ?>
                <?php
                $statusColor = '#94a3b8';
                if ($ord['status'] === 'Pending') $statusColor = '#f59e0b';
                if ($ord['status'] === 'Preparing') $statusColor = '#3b82f6';
                if ($ord['status'] === 'Ready') $statusColor = '#10b981';
                if ($ord['status'] === 'Served') $statusColor = '#64748b';
                ?>
                <div style="background: var(--bg-surface); border: 1px solid var(--border); border-top: 4px solid <?= $statusColor ?>; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="font-family: monospace; font-size: 1rem; color: var(--gold-light);"><?= htmlspecialchars($ord['order_number']) ?></strong>
                            <span class="badge" style="background: <?= $statusColor ?>20; color: <?= $statusColor ?>; border: 1px solid <?= $statusColor ?>40;">
                                <?= htmlspecialchars($ord['status']) ?>
                            </span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
                            <span><i class="fa-solid fa-location-dot"></i> <?= htmlspecialchars($ord['order_type']) ?> <?= $ord['room_number'] ? '• Room ' . htmlspecialchars($ord['room_number']) : ($ord['table_number'] ? '• Table ' . htmlspecialchars($ord['table_number']) : '') ?></span>
                            <div style="margin-top: 2px;"><i class="fa-regular fa-clock"></i> <?= date('h:i A, d M', strtotime($ord['created_at'])) ?></div>
                        </div>

                        <!-- Items list -->
                        <div style="background: var(--bg-card); border-radius: 6px; padding: 8px; margin-bottom: 12px; font-size: 0.82rem;">
                            <?php if (isset($itemsByOrder[$ord['id']])): ?>
                                <?php foreach ($itemsByOrder[$ord['id']] as $it): ?>
                                    <div style="display: flex; justify-content: space-between; padding: 2px 0;">
                                        <span><strong><?= $it['quantity'] ?>x</strong> <?= htmlspecialchars($it['item_name']) ?></span>
                                        <span style="color: var(--text-muted);">₹<?= number_format($it['total_price'], 2) ?></span>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                            <div style="border-top: 1px dashed var(--border); margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; font-weight: 600;">
                                <span>Total (incl. tax):</span>
                                <span style="color: var(--gold-light);">₹<?= number_format($ord['total_amount'], 2) ?></span>
                            </div>
                        </div>
                    </div>

                    <!-- KOT Status Action Form -->
                    <form method="POST" style="display: flex; gap: 6px; align-items: center;">
                        <input type="hidden" name="action" value="update_kot_status">
                        <input type="hidden" name="order_id" value="<?= $ord['id'] ?>">
                        <select name="kot_status" class="form-control" style="padding: 4px 8px; font-size: 0.8rem;">
                            <option value="Pending" <?= $ord['status'] === 'Pending' ? 'selected' : '' ?>>Pending</option>
                            <option value="Preparing" <?= $ord['status'] === 'Preparing' ? 'selected' : '' ?>>Preparing</option>
                            <option value="Ready" <?= $ord['status'] === 'Ready' ? 'selected' : '' ?>>Ready to Serve</option>
                            <option value="Served" <?= $ord['status'] === 'Served' ? 'selected' : '' ?>>Served</option>
                        </select>
                        <button type="submit" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">Update</button>
                    </form>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<script>
let cart = [];

function toggleOrderTypeFields() {
    const type = document.getElementById('orderType').value;
    const roomField = document.getElementById('roomField');
    const tableField = document.getElementById('tableField');
    if (type === 'Room Service') {
        roomField.style.display = 'block';
        tableField.style.display = 'none';
    } else if (type === 'Dine-In') {
        roomField.style.display = 'none';
        tableField.style.display = 'block';
    } else {
        roomField.style.display = 'none';
        tableField.style.display = 'none';
    }
}

function filterCategory(cat) {
    const cards = document.querySelectorAll('.menu-item-card');
    cards.forEach(card => {
        if (cat === 'All' || card.getAttribute('data-category') === cat) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function addToCart(id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    renderCart();
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += change;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cartBody');
    const itemsJson = document.getElementById('itemsJson');
    const cartCount = document.getElementById('cartCount');
    const posSubtotal = document.getElementById('posSubtotal');
    const posTax = document.getElementById('posTax');
    const posTotal = document.getElementById('posTotal');

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">No items in cart</td></tr>';
        itemsJson.value = '[]';
        cartCount.textContent = '0 items';
        posSubtotal.textContent = '₹0.00';
        posTax.textContent = '₹0.00';
        posTotal.textContent = '₹0.00';
        return;
    }

    let subtotal = 0;
    let totalItems = 0;
    let html = '';

    cart.forEach(item => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        totalItems += item.qty;
        html += `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 6px 8px;">
                    <div style="font-weight: 500;">${item.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">₹${item.price.toFixed(2)} ea</div>
                </td>
                <td style="padding: 6px 4px; text-align: center;">
                    <button type="button" onclick="updateQty(${item.id}, -1)" style="background: none; border: 1px solid var(--border); color: #fff; width: 20px; height: 20px; border-radius: 4px; cursor: pointer;">-</button>
                    <span style="display: inline-block; min-width: 18px; text-align: center; font-weight: 600;">${item.qty}</span>
                    <button type="button" onclick="updateQty(${item.id}, 1)" style="background: none; border: 1px solid var(--border); color: #fff; width: 20px; height: 20px; border-radius: 4px; cursor: pointer;">+</button>
                </td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 600;">₹${lineTotal.toFixed(2)}</td>
                <td style="padding: 6px 4px;">
                    <button type="button" onclick="updateQty(${item.id}, -999)" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                </td>
            </tr>
        `;
    });

    const tax = Math.round((subtotal * 0.12) * 100) / 100;
    const total = subtotal + tax;

    tbody.innerHTML = html;
    itemsJson.value = JSON.stringify(cart);
    cartCount.textContent = totalItems + (totalItems === 1 ? ' item' : ' items');
    posSubtotal.textContent = '₹' + subtotal.toFixed(2);
    posTax.textContent = '₹' + tax.toFixed(2);
    posTotal.textContent = '₹' + total.toFixed(2);
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
