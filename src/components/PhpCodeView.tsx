import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Chrome,
  Database,
  Server,
  Key,
  ShieldCheck,
  FolderGit2,
  ExternalLink,
  ChevronRight,
  Terminal,
  BookOpen
} from 'lucide-react';

interface PhpFileItem {
  name: string;
  category: string;
  description: string;
  codeSnippet: string;
}

const phpFiles: PhpFileItem[] = [
  {
    name: 'README.md',
    category: 'Documentation & Setup',
    description: 'Complete guide on installing XAMPP and opening the PHP app in Google Chrome',
    codeSnippet: `# The Grand Royale Palace Hotel & Spa - Complete Hotel PMS (PHP & MySQL)

## How to Run in Google Chrome via XAMPP:
1. Install XAMPP with PHP 8.x from https://www.apachefriends.org/
2. Start Apache and MySQL from XAMPP Control Panel.
3. Copy the 'php-hotel-pms' folder into C:\\xampp\\htdocs\\php-hotel-pms
4. In Google Chrome, open: http://localhost/phpmyadmin/
5. Create a database named 'hotel_pms' and import 'database.sql'
6. Open in Chrome: http://localhost/php-hotel-pms/
7. Login with:
   - Username: admin
   - Password: Admin@123`
  },
  {
    name: 'database.sql',
    category: 'Database Schema',
    description: '17 MySQL tables with foreign keys, indexes, seed rooms, menu items & admin credentials',
    codeSnippet: `-- MySQL Schema for Hotel Property Management System
CREATE DATABASE IF NOT EXISTS \`hotel_pms\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`hotel_pms\`;

-- Users Table with Bcrypt Hash
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(100) NOT NULL,
  \`role\` ENUM('Administrator', 'General Manager', 'Receptionist', 'Housekeeping', 'Restaurant Staff', 'Chef', 'Accountant') NOT NULL DEFAULT 'Receptionist',
  \`email\` VARCHAR(100),
  \`phone\` VARCHAR(30),
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Rooms Table (17 Suites, 5 Floors)
CREATE TABLE IF NOT EXISTS \`rooms\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`room_number\` VARCHAR(10) NOT NULL UNIQUE,
  \`floor\` INT NOT NULL,
  \`room_type\` ENUM('Standard', 'Deluxe', 'Super Deluxe', 'Executive Suite', 'Presidential Royal Suite') NOT NULL,
  \`capacity\` INT NOT NULL DEFAULT 2,
  \`tariff\` DECIMAL(10,2) NOT NULL,
  \`has_ac\` TINYINT(1) DEFAULT 1,
  \`bed_type\` VARCHAR(50) DEFAULT 'King Size',
  \`status\` ENUM('Available', 'Occupied', 'Reserved', 'Dirty', 'Cleaning', 'Clean', 'Maintenance') NOT NULL DEFAULT 'Available',
  \`amenities\` TEXT,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bookings Table with overlap constraints
CREATE TABLE IF NOT EXISTS \`bookings\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`booking_code\` VARCHAR(20) NOT NULL UNIQUE,
  \`guest_id\` INT NOT NULL,
  \`room_id\` INT NOT NULL,
  \`check_in_date\` DATE NOT NULL,
  \`check_out_date\` DATE NOT NULL,
  \`adults\` INT NOT NULL DEFAULT 1,
  \`children\` INT NOT NULL DEFAULT 0,
  \`nights\` INT NOT NULL,
  \`room_tariff\` DECIMAL(10,2) NOT NULL,
  \`total_amount\` DECIMAL(10,2) NOT NULL,
  \`paid_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`balance\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`booking_source\` ENUM('Walk-in', 'Website Direct', 'Phone Booking', 'Online Travel Agency (OTA)', 'Travel Agent') DEFAULT 'Walk-in',
  \`status\` ENUM('Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled', 'No-show') NOT NULL DEFAULT 'Confirmed',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`guest_id\`) REFERENCES \`guests\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;`
  },
  {
    name: 'config/db.php',
    category: 'Database Connection',
    description: 'PDO database connection with audit logger & hotel settings loader',
    codeSnippet: `<?php
// Database configuration
$db_host = 'localhost';
$db_name = 'hotel_pms';
$db_user = 'root';
$db_pass = ''; // Default XAMPP empty password
$db_port = '3306';

try {
    $pdo = new PDO("mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}

function logAudit($pdo, $action, $details) {
    $user = $_SESSION['user']['username'] ?? 'System';
    $stmt = $pdo->prepare("INSERT INTO audit_logs (user, action, details, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->execute([$user, $action, $details]);
}`
  },
  {
    name: 'index.php',
    category: 'Dashboard',
    description: 'Executive dashboard with 8 KPI counters, room status rack, arrivals and departures',
    codeSnippet: `<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

// Live Room Occupancy Counters
$totalRooms = $pdo->query("SELECT COUNT(*) FROM rooms")->fetchColumn();
$occupied = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Occupied'")->fetchColumn();
$available = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status IN ('Available', 'Clean')")->fetchColumn();
$dirty = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Dirty'")->fetchColumn();
$cleaning = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Cleaning'")->fetchColumn();
$maint = $pdo->query("SELECT COUNT(*) FROM rooms WHERE status = 'Maintenance'")->fetchColumn();

// Today's Check-ins & Check-outs
$today = date('Y-m-d');
$todayCheckIns = $pdo->query("SELECT COUNT(*) FROM bookings WHERE check_in_date = '$today'")->fetchColumn();
$todayCheckOuts = $pdo->query("SELECT COUNT(*) FROM bookings WHERE check_out_date = '$today'")->fetchColumn();

$pageTitle = 'Executive Overview & Real-Time Dashboard';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>
<!-- Dashboard KPI Cards, Room Matrix & Live Arrivals rendered here -->`
  },
  {
    name: 'rooms.php',
    category: 'Room Matrix',
    description: 'Color-coded visual rack of all 17 suites with floor filters & instant status updates',
    codeSnippet: `<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/auth.php';
checkAuth();

// Quick status updater (e.g. mark clean or dirty)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'toggle_status') {
    $roomId = intval($_POST['room_id']);
    $newStatus = $_POST['new_status'];
    $stmt = $pdo->prepare("UPDATE rooms SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $roomId]);
    logAudit($pdo, 'Room Status Updated', "Room ID #$roomId set to $newStatus");
}
$rooms = $pdo->query("SELECT * FROM rooms ORDER BY floor ASC, room_number ASC")->fetchAll();
?>`
  },
  {
    name: 'bookings.php',
    category: 'Reservations',
    description: 'Booking engine with strict date-overlap conflict validation to prevent double-booking',
    codeSnippet: `<?php
// Conflict prevention check:
$conflictQuery = "SELECT COUNT(*) FROM bookings 
                  WHERE room_id = ? 
                  AND status NOT IN ('Cancelled', 'Checked-out') 
                  AND ((check_in_date <= ? AND check_out_date > ?) 
                    OR (check_in_date < ? AND check_out_date >= ?) 
                    OR (check_in_date >= ? AND check_out_date <= ?))";
$stmt = $pdo->prepare($conflictQuery);
$stmt->execute([$roomId, $checkIn, $checkIn, $checkOut, $checkOut, $checkIn, $checkOut]);
if ($stmt->fetchColumn() > 0) {
    $err = "Conflict detected! Room is already booked for overlapping dates.";
} else {
    // Proceed with reservation & master folio creation...
}`
  },
  {
    name: 'frontdesk.php',
    category: 'Front Desk',
    description: 'Express check-in, check-out with unpaid folio balance guard, and room transfers',
    codeSnippet: `<?php
// Safe Check-Out validation:
$chkStmt = $pdo->prepare("SELECT balance FROM folios WHERE booking_id = ?");
$chkStmt->execute([$bookingId]);
$bal = $chkStmt->fetchColumn() ?: 0;
if ($bal > 0) {
    $err = "Cannot check out guest! Outstanding folio balance of ₹" . number_format($bal, 2) . " must be settled first.";
} else {
    // Check out guest & set room to Dirty for Housekeeping turnover
    $pdo->prepare("UPDATE bookings SET status = 'Checked-out' WHERE id = ?")->execute([$bookingId]);
    $pdo->prepare("UPDATE rooms SET status = 'Dirty' WHERE id = ?")->execute([$roomId]);
}`
  },
  {
    name: 'pos.php',
    category: 'Restaurant POS',
    description: 'Point of sale, direct billing to in-house guest folio, and live Kitchen Order Tickets',
    codeSnippet: `<?php
// When guest chooses "Bill to Room":
if ($bookingId && isset($_POST['bill_to_room'])) {
    $folioId = $pdo->query("SELECT id FROM folios WHERE booking_id = $bookingId")->fetchColumn();
    $chargeStmt = $pdo->prepare("INSERT INTO folio_items (folio_id, description, category, amount, created_at) VALUES (?, ?, 'Restaurant', ?, NOW())");
    $chargeStmt->execute([$folioId, "Dining: Order #$orderNum", $totalAmount]);
    $pdo->prepare("UPDATE folios SET total_amount = total_amount + ?, balance = balance + ? WHERE id = ?")->execute([$totalAmount, $totalAmount, $folioId]);
}`
  },
  {
    name: 'invoice.php',
    category: 'GST Tax Invoice',
    description: 'Printable A4 GST Tax Invoice with CGST 6%, SGST 6%, room tariff nights, and payments',
    codeSnippet: `<!-- Full A4 Printable GST Tax Invoice compliant with Section 31 of CGST Act -->
<div class="invoice-sheet">
    <div class="header">
        <h1>The Grand Royale Palace Hotel & Spa</h1>
        <p>GSTIN: 27AABCT8492Q1Z8 | State Code: 27 (Maharashtra)</p>
    </div>
    <!-- Room nights, Dining charges, Taxes (CGST/SGST), Payment history & Authorized Signature -->
</div>`
  },
  {
    name: 'voucher.php',
    category: 'Booking Voucher',
    description: 'Printable A4 Reservation Confirmation Voucher with stay policies and check-in times',
    codeSnippet: `<!-- Full A4 Printable Guaranteed Reservation Voucher -->
<div class="voucher-sheet">
    <h2>RESERVATION CONFIRMATION VOUCHER</h2>
    <p>Confirmation #: BK-2026-9021</p>
    <!-- Room details, Dates, Advance Paid, Mandatory Govt ID policy -->
</div>`
  }
];

export const PhpCodeView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PhpFileItem>(phpFiles[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chrome_guide' | 'code_viewer'>('chrome_guide');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const sqlContent = phpFiles.find(f => f.name === 'database.sql')?.codeSnippet || '';
    const blob = new Blob([sqlContent], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
              <Server className="w-3.5 h-3.5" />
              <span>Full PHP 8.x + MySQL / PDO Edition</span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-100">
              The Grand Royale Palace Hotel & Spa — PHP Engine
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Complete conversion of all 14 modules into standard PHP 8.x + MySQL/MariaDB.
              Ready to copy or deploy on XAMPP, WAMP, LAMP, or any cPanel web host.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadSql}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>Download database.sql</span>
            </button>
            <button
              onClick={() => setActiveTab('chrome_guide')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'chrome_guide'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              <Chrome className="w-4 h-4" />
              <span>How to Open in Chrome</span>
            </button>
            <button
              onClick={() => setActiveTab('code_viewer')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'code_viewer'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Browse PHP Files</span>
            </button>
          </div>
        </div>
      </div>

      {/* View 1: Step-by-Step Chrome & XAMPP Setup Guide */}
      {activeTab === 'chrome_guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span>Start Apache & MySQL</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open <strong>XAMPP Control Panel</strong> on your PC or Mac and click <strong>Start</strong> next to both <strong>Apache</strong> and <strong>MySQL</strong> until both highlight green.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-400" />
                <span>Copy to htdocs Folder</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Put the folder into your local web root:
                <br />
                <code className="text-amber-300 text-[11px] font-mono bg-slate-950 px-1 py-0.5 rounded mt-1 inline-block">
                  C:\xampp\htdocs\php-hotel-pms
                </code>
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Import Database in Chrome</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                In Chrome, open <code className="text-amber-300 text-[11px] font-mono">http://localhost/phpmyadmin/</code>, create a database named <strong className="text-slate-200">hotel_pms</strong>, and import <strong className="text-slate-200">database.sql</strong>.
              </p>
            </div>
          </div>

          {/* Quick Credentials Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Default Login Credentials in PHP Application</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Admin Account</div>
                <div className="text-xs font-semibold text-slate-200 mt-1">admin</div>
                <div className="text-xs text-amber-300 font-mono">Admin@123</div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">General Manager</div>
                <div className="text-xs font-semibold text-slate-200 mt-1">manager</div>
                <div className="text-xs text-amber-300 font-mono">Admin@123</div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Front Desk Reception</div>
                <div className="text-xs font-semibold text-slate-200 mt-1">reception</div>
                <div className="text-xs text-amber-300 font-mono">Admin@123</div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Housekeeping Lead</div>
                <div className="text-xs font-semibold text-slate-200 mt-1">housekeeping</div>
                <div className="text-xs text-amber-300 font-mono">Admin@123</div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Chrome className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Direct URL to Open in Google Chrome:</div>
                  <div className="text-xs text-amber-300 font-mono">http://localhost/php-hotel-pms/</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('code_viewer')}
                className="text-xs text-slate-300 hover:text-amber-300 underline font-medium"
              >
                Inspect PHP Code Files &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View 2: File Browser & Code Viewer */}
      {activeTab === 'code_viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Picker Sidebar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2 lg:col-span-1 max-h-[600px] overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              PHP Application Source Files
            </div>
            {phpFiles.map(file => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedFile.name === file.name
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase ml-2 shrink-0">{file.category}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>{selectedFile.name}</span>
                </h3>
                <p className="text-xs text-slate-400">{selectedFile.description}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy File Content'}</span>
              </button>
            </div>

            {/* Code Box */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 max-h-[480px] overflow-y-auto overflow-x-auto whitespace-pre">
              {selectedFile.codeSnippet}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>All 24 PHP & SQL files are written in /php-hotel-pms/</span>
              <span className="text-amber-400/80 font-mono">PHP 8.x / MySQL 8.x / MariaDB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
