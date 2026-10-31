<?php
/**
 * Database Connection Configuration (PDO MySQL)
 * The Grand Royale Palace Hotel & Spa PMS
 */

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'hotel_pms');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    die("Database Connection Error: " . $e->getMessage() . "<br><small>Make sure MySQL is running in XAMPP/WAMP and 'hotel_pms' database has been imported.</small>");
}

/**
 * Log System Audit Entry
 */
function logAudit($pdo, $userName, $action, $details) {
    try {
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_name, action, details) VALUES (?, ?, ?)");
        $stmt->execute([$userName, $action, $details]);
    } catch (Exception $e) {
        // Silent fail for audit log
    }
}

/**
 * Get Hotel Settings
 */
function getHotelSettings($pdo) {
    $stmt = $pdo->query("SELECT * FROM hotel_settings WHERE id = 1");
    $settings = $stmt->fetch();
    if (!$settings) {
        return [
            'name' => 'The Grand Royale Palace Hotel & Spa',
            'tagline' => 'A Sanctuary of Refined Elegance',
            'currency_symbol' => '₹',
            'currency_code' => 'INR',
            'tax_rate' => 18.00,
            'service_charge_rate' => 5.00,
            'check_in_time' => '14:00',
            'check_out_time' => '11:00'
        ];
    }
    return $settings;
}
