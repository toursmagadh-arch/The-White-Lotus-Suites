# The Grand Royale Palace Hotel & Spa - Complete Hotel PMS (PHP & MySQL)

A modern, responsive, enterprise-grade Hotel Property Management System (PMS) built with pure PHP 8.x, PDO, MySQL/MariaDB, and responsive CSS with Google Fonts and FontAwesome icons.

---

## 📋 System Highlights & Modules Included

1. **Executive Dashboard (`index.php`)**:
   - Real-time KPI statistics: Total Rooms, Occupancy %, Today's In-House Guests, Today's Expected Arrivals & Departures.
   - Financial counters: Room Revenue, POS Dining Sales, Net Profit.
   - Live Room Status matrix indicators (Available, Occupied, Cleaning, Dirty, Maintenance).
   - Recent Bookings & Pending Housekeeping tasks widget.

2. **Room Management & Status Board (`rooms.php`)**:
   - Visual color-coded room grid (Suites 101 to 502 across 5 floors).
   - Filter by floor (All Floors, Floor 1 to 5).
   - Instant room status toggling (Dirty, Cleaning, Ready/Available).
   - Modal to add new rooms with tariff, capacity, AC, and amenities.

3. **Reservations Engine with Conflict Prevention (`bookings.php`)**:
   - Date range overlap protection: Prevents double-booking the same room on overlapping dates.
   - Guest profile auto-creation (Name, Phone, Email, Address, Govt ID).
   - Automatic stay nights, tariff calculation, and advance deposit tracking.
   - Booking sources: Walk-in, Website, Phone, OTA, Travel Agent.
   - Direct links to printable Confirmation Voucher and GST Tax Invoice.

4. **Front Desk & Stay Management (`frontdesk.php`)**:
   - Express 1-click Guest Check-in with validation.
   - Guest Check-out with **Unpaid Folio Balance Warning** to ensure complete payment settlement.
   - In-house Suite Transfer (room change) with automatic status updates.

5. **Housekeeping & Cleanliness Inspection (`housekeeping.php`)**:
   - Cleaning task queue with room status badges.
   - Staff assignment (Housekeeping Supervisor, Attendant).
   - 4-point sanitization checklist (Linen replacement, bathroom sanitization, minibar restocking, amenities).
   - Supervisor inspection and 1-click Front Desk readiness notification.

6. **Restaurant Point-of-Sale (POS) & Live KOT (`pos.php`)**:
   - Food menu catalog by category (Breakfast, Lunch, Dinner, Beverages, Snacks).
   - Real-time shopping cart calculation with GST (12%).
   - Direct billing to in-house guest suite folio (`Bill to Room`).
   - Live Kitchen Order Ticket (KOT) workflow: `Pending` &rarr; `Preparing` &rarr; `Ready to Serve` &rarr; `Served`.

7. **Hotel & Kitchen Inventory Ledger (`inventory.php`)**:
   - Raw materials and kitchen stocks (Basmati Rice, Dairy, Spices, Linen, Toiletries).
   - Reorder threshold with automatic **LOW STOCK** warnings.
   - Stock movement logger: Stock In (Purchase), Stock Out (Kitchen Consumption), and Wastage / Spoilage.
   - Total inventory valuation calculation in INR (₹).

8. **Engineering & Maintenance Work Orders (`maintenance.php`)**:
   - Equipment and HVAC issue reporting.
   - Automatic room blocking: Sets suite to `Maintenance` (Out of Order) to prevent reservations.
   - Technician resolution notes, repair cost logging, and clearance back to `Clean/Available`.

9. **Billing, Master Folios & Payments (`billing.php`)**:
   - Comprehensive guest folio registry.
   - Post incidental charges: Minibar, Express Laundry, Spa, Airport Transfer, Late Checkout.
   - Multi-mode payment recording: **UPI (GPay/PhonePe/QR)**, **Credit/Debit Card**, **Cash**, and **Bank Transfer**.

10. **Printable Documents (`invoice.php` & `voucher.php`)**:
    - **A4 GST Tax Invoice (`invoice.php`)**: GSTIN, Hotel details, room charges, dining charges, CGST 6%, SGST 6%, payments history, authorized signature block.
    - **A4 Reservation Voucher (`voucher.php`)**: Guaranteed booking confirmation, stay dates, room type, advance deposit, hotel check-in policies.

11. **Reports & Financial Analytics (`reports.php`)**:
    - Average Daily Rate (ADR) and Revenue Per Available Room (RevPAR).
    - Occupancy rate breakdown and category revenue.
    - Booking channel distribution.
    - Consolidated Profit & Loss statement.
    - **1-Click CSV Export** for Bookings and Folios.

12. **Staff Directory & RBAC Security (`staff.php`)**:
    - Multi-role support: Administrator, General Manager, Receptionist, Housekeeping, Chef, Restaurant Staff, Accountant.
    - Bcrypt password hashing (`password_hash`).
    - Full system security audit trail logging every action.

13. **Property Settings & Backup (`settings.php`)**:
    - Hotel name, address, GST rate, check-in / check-out times.
    - 1-Click download of complete MySQL `database.sql` backup.

---

## 🚀 How to Run in Google Chrome via XAMPP (Windows / Mac / Linux)

### Step 1: Install XAMPP
If you don't already have XAMPP installed:
- Download XAMPP with PHP 8.x from [https://www.apachefriends.org/](https://www.apachefriends.org/)
- Install it and launch the **XAMPP Control Panel**.
- Click **Start** for both **Apache** and **MySQL**.

### Step 2: Copy the Project Files
- Locate your XAMPP web root folder:
  - **Windows**: `C:\xampp\htdocs\`
  - **Mac**: `/Applications/XAMPP/xamppfiles/htdocs/`
  - **Linux**: `/opt/lampp/htdocs/`
- Copy the entire folder `php-hotel-pms` into your `htdocs` directory.
- The path will be: `C:\xampp\htdocs\php-hotel-pms`

### Step 3: Create the MySQL Database & Import Data
1. Open Google Chrome and go to:
   ```
   http://localhost/phpmyadmin/
   ```
2. Click **New** on the left menu and name the database:
   ```
   hotel_pms
   ```
   (Collation: `utf8mb4_unicode_ci`)
3. Select the newly created `hotel_pms` database and click the **Import** tab at the top.
4. Click **Choose File** and select:
   ```
   htdocs/php-hotel-pms/database.sql
   ```
5. Click **Import** at the bottom.
6. The 17 tables along with rooms, default users, menu items, and initial bookings will be set up automatically.

### Step 4: Verify Database Connection (`config/db.php`)
Open `config/db.php` in any text editor. By default, XAMPP uses:
```php
$db_host = 'localhost';
$db_name = 'hotel_pms';
$db_user = 'root';
$db_pass = ''; // Leave blank for default XAMPP
$db_port = '3306';
```
If your MySQL has a password, enter it in `$db_pass`.

### Step 5: Open in Google Chrome
Open your Google Chrome browser and navigate to:
```
http://localhost/php-hotel-pms/
```
You will be directed to the login page.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `Admin@123` | Full access to all 13 modules, settings, staff |
| **General Manager** | `manager` | `Admin@123` | Operations, Reports, Billing, Front Desk |
| **Front Desk Receptionist** | `reception` | `Admin@123` | Bookings, Front Desk, Room Matrix, Billing |
| **Housekeeping Supervisor** | `housekeeping` | `Admin@123` | Housekeeping Queue, Room Matrix |

*(Note: In `database.sql`, the password hash is created via PHP's standard `password_hash('Admin@123', PASSWORD_BCRYPT)` and is verified safely).*

---

## 🖨️ Printing Invoices & Vouchers in Chrome
- To print any A4 Tax Invoice: Go to **Billing** &rarr; click **Invoice** &rarr; click **Print GST Invoice (A4)**.
- In Chrome's print dialog:
  - Destination: Save as PDF or your physical printer.
  - Paper size: A4.
  - Margins: Default or None.
  - Options: Enable **Background graphics** for gold badge styling.

---

## 📂 File Structure Overview

```
php-hotel-pms/
├── assets/
│   └── css/
│       └── style.css            # Luxury dark responsive theme & print styles
├── config/
│   └── db.php                  # PDO connection, audit logger, hotel settings
├── includes/
│   ├── auth.php                # Authentication & RBAC role checker
│   ├── header.php              # Top navigation bar, current user, notifications
│   ├── sidebar.php             # Luxury gold navigation menu with 12 items
│   └── footer.php              # Footer and closing tags
├── index.php                   # Executive KPI dashboard
├── rooms.php                   # Room matrix and status board
├── bookings.php                # Reservation engine & overlap protection
├── frontdesk.php               # Guest check-in, check-out & suite transfers
├── housekeeping.php            # Housekeeping queue & supervisor approval
├── pos.php                     # Restaurant POS, room billing & live KOT
├── inventory.php               # Kitchen stock ledger, valuation & alerts
├── maintenance.php             # Facilities repair work orders & room blocker
├── billing.php                 # Master folios & multi-mode payment ledger
├── invoice.php                 # Printable A4 GST Tax Invoice
├── voucher.php                 # Printable A4 Booking Confirmation Voucher
├── reports.php                 # Analytics, ADR, RevPAR, P&L & CSV exports
├── staff.php                   # Staff accounts & security audit log
├── settings.php                # Hotel profile, GST rates, database backup
├── database.sql                # Complete MySQL schema & seed data
└── README.md                   # This instruction guide
```
