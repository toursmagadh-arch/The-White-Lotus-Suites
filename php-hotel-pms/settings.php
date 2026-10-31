<?php
/**
 * The Grand Royale Palace Hotel & Spa - System Settings & Database Tools
 */
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();
checkRole(['Administrator', 'General Manager']);

$msg = '';
$err = '';

// Handle SQL Backup Export
if (isset($_GET['action']) && $_GET['action'] === 'download_sql') {
    $sqlFile = __DIR__ . '/database.sql';
    if (file_exists($sqlFile)) {
        header('Content-Description: File Transfer');
        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename=hotel_pms_schema_backup_' . date('Y-m-d') . '.sql');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($sqlFile));
        readfile($sqlFile);
        exit;
    } else {
        $err = 'database.sql file not found.';
    }
}

// Handle updating settings
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_settings') {
    $hotelName = trim($_POST['hotel_name'] ?? '');
    $tagline = trim($_POST['tagline'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $currency = trim($_POST['currency'] ?? 'INR');
    $currencySymbol = trim($_POST['currency_symbol'] ?? '₹');
    $taxRate = floatval($_POST['tax_rate'] ?? 12);
    $checkInTime = trim($_POST['check_in_time'] ?? '14:00');
    $checkOutTime = trim($_POST['check_out_time'] ?? '11:00');

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO hotel_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $settingsToSave = [
            'hotel_name' => $hotelName,
            'tagline' => $tagline,
            'address' => $address,
            'phone' => $phone,
            'email' => $email,
            'currency' => $currency,
            'currency_symbol' => $currencySymbol,
            'tax_rate' => $taxRate,
            'check_in_time' => $checkInTime,
            'check_out_time' => $checkOutTime,
        ];
        foreach ($settingsToSave as $k => $v) {
            $stmt->execute([$k, $v, $v]);
        }
        $pdo->commit();

        logAudit($pdo, 'Settings Updated', 'Property configuration & tax parameters updated');
        $msg = 'Hotel configuration saved successfully.';
    } catch (Exception $e) {
        $pdo->rollBack();
        $err = 'Error saving settings: ' . $e->getMessage();
    }
}

$settings = getHotelSettings($pdo);

$pageTitle = 'Property Settings & System Configuration';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="card mb-4" style="border-left: 4px solid var(--gold);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
            <h2 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 4px;">Hotel Property Configuration</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Configure tax tariffs, check-in policy, guest contact details, and database backups.</p>
        </div>
        <div>
            <a href="settings.php?action=download_sql" class="btn btn-secondary">
                <i class="fa-solid fa-database"></i> Download database.sql Backup
            </a>
        </div>
    </div>
</div>

<?php if ($msg): ?>
    <div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($msg) ?></div>
<?php endif; ?>
<?php if ($err): ?>
    <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> <?= htmlspecialchars($err) ?></div>
<?php endif; ?>

<div class="card" style="max-width: 800px;">
    <form method="POST">
        <input type="hidden" name="action" value="update_settings">

        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
            <i class="fa-solid fa-hotel" style="color: var(--gold);"></i> Hotel Branding & Address
        </h3>

        <div class="grid grid-2 mb-3">
            <div class="form-group">
                <label>Property Legal Name *</label>
                <input type="text" name="hotel_name" class="form-control" value="<?= htmlspecialchars($settings['hotel_name'] ?? 'The Grand Royale Palace Hotel & Spa') ?>" required>
            </div>
            <div class="form-group">
                <label>Tagline / Luxury Subtitle</label>
                <input type="text" name="tagline" class="form-control" value="<?= htmlspecialchars($settings['tagline'] ?? 'Luxury Heritage Hospitality & Suites') ?>">
            </div>
        </div>

        <div class="form-group mb-3">
            <label>Physical Address (Appears on Tax Invoices & Vouchers) *</label>
            <input type="text" name="address" class="form-control" value="<?= htmlspecialchars($settings['address'] ?? '108 Marine Drive, Nariman Point, Mumbai, Maharashtra 400021, India') ?>" required>
        </div>

        <div class="grid grid-2 mb-4">
            <div class="form-group">
                <label>Front Desk Hotline / Phone *</label>
                <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($settings['phone'] ?? '+91 22 6988 5000') ?>" required>
            </div>
            <div class="form-group">
                <label>Reservations Email *</label>
                <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($settings['email'] ?? 'concierge@grandroyalepalace.com') ?>" required>
            </div>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-top: 24px;">
            <i class="fa-solid fa-coins" style="color: var(--gold);"></i> Currency, Taxation & Times
        </h3>

        <div class="grid grid-3 mb-3">
            <div class="form-group">
                <label>Currency Code</label>
                <input type="text" name="currency" class="form-control" value="<?= htmlspecialchars($settings['currency'] ?? 'INR') ?>" required>
            </div>
            <div class="form-group">
                <label>Currency Symbol</label>
                <input type="text" name="currency_symbol" class="form-control" value="<?= htmlspecialchars($settings['currency_symbol'] ?? '₹') ?>" required>
            </div>
            <div class="form-group">
                <label>GST / Tax Rate (%) *</label>
                <input type="number" step="0.1" name="tax_rate" class="form-control" value="<?= htmlspecialchars($settings['tax_rate'] ?? '12') ?>" required>
            </div>
        </div>

        <div class="grid grid-2 mb-4">
            <div class="form-group">
                <label>Standard Check-In Time</label>
                <input type="time" name="check_in_time" class="form-control" value="<?= htmlspecialchars($settings['check_in_time'] ?? '14:00') ?>">
            </div>
            <div class="form-group">
                <label>Standard Check-Out Time</label>
                <input type="time" name="check_out_time" class="form-control" value="<?= htmlspecialchars($settings['check_out_time'] ?? '11:00') ?>">
            </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="submit" class="btn btn-primary" style="padding: 10px 24px;">
                <i class="fa-solid fa-floppy-disk"></i> Save Property Settings
            </button>
        </div>
    </form>
</div>

<div class="card mt-4" style="max-width: 800px; border-top: 4px solid var(--blue);">
    <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 8px;">
        <i class="fa-solid fa-server" style="color: var(--blue);"></i> Deployment & Hosting Environment Note
    </h3>
    <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 12px;">
        This PHP application is pre-architected with pure PHP (PDO) and standard MySQL/MariaDB. It can be immediately run on:
    </p>
    <ul style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.8; margin-left: 20px;">
        <li><strong>XAMPP on Windows/Mac:</strong> Place the <code>php-hotel-pms</code> folder into <code>C:\xampp\htdocs\hotel-pms\</code>, open <code>http://localhost/php-hotel-pms/</code> in Google Chrome.</li>
        <li><strong>cPanel / Shared Hosting:</strong> Upload to <code>public_html/</code>, import <code>database.sql</code> via phpMyAdmin, and set DB credentials in <code>config/db.php</code>.</li>
        <li><strong>Linux LAMP stack:</strong> Ubuntu 22.04/24.04 with Apache2 + PHP 8.1+ + MariaDB.</li>
    </ul>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
