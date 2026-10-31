-- ======================================================
-- HOTEL PROPERTY MANAGEMENT SYSTEM (PMS)
-- Complete MySQL / MariaDB Relational Database Schema
-- Compatible with XAMPP, WAMP, cPanel & Linux MySQL 8+
-- ======================================================

CREATE DATABASE IF NOT EXISTS `hotel_pms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hotel_pms`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS & STAFF ACCOUNTS
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('Administrator', 'Manager', 'Receptionist', 'Housekeeping', 'Restaurant Staff', 'Chef', 'Accountant') NOT NULL DEFAULT 'Receptionist',
  `shift` VARCHAR(100) DEFAULT 'General (09:00 - 18:00)',
  `status` ENUM('Active', 'On Leave', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. HOTEL GENERAL SETTINGS & GST
DROP TABLE IF EXISTS `hotel_settings`;
CREATE TABLE `hotel_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `name` VARCHAR(200) NOT NULL DEFAULT 'The Grand Royale Palace Hotel & Spa',
  `tagline` VARCHAR(255) DEFAULT 'A Sanctuary of Refined Elegance & Heritage Hospitality',
  `email` VARCHAR(150) DEFAULT 'concierge@grandroyalepalace.com',
  `phone` VARCHAR(50) DEFAULT '+91 22 2847 9000',
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT 'Mumbai',
  `state` VARCHAR(100) DEFAULT 'Maharashtra',
  `country` VARCHAR(100) DEFAULT 'India',
  `pin_code` VARCHAR(20) DEFAULT '400021',
  `gstin` VARCHAR(30) DEFAULT '27AAAAA0000A1Z5',
  `currency_symbol` VARCHAR(10) DEFAULT '₹',
  `currency_code` VARCHAR(10) DEFAULT 'INR',
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `service_charge_rate` DECIMAL(5,2) DEFAULT 5.00,
  `check_in_time` VARCHAR(20) DEFAULT '14:00',
  `check_out_time` VARCHAR(20) DEFAULT '11:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ROOM CATEGORIES
DROP TABLE IF EXISTS `room_types`;
CREATE TABLE `room_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `base_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `capacity_adults` INT NOT NULL DEFAULT 2,
  `capacity_children` INT NOT NULL DEFAULT 1,
  `bed_type` VARCHAR(50) DEFAULT 'King',
  `amenities` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. SUITES & ROOMS MATRIX
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_number` VARCHAR(30) NOT NULL UNIQUE,
  `floor` INT NOT NULL DEFAULT 1,
  `room_type_id` INT NOT NULL,
  `bed_type` VARCHAR(50) NOT NULL DEFAULT 'King',
  `has_ac` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('Available', 'Occupied', 'Reserved', 'Dirty', 'Cleaning', 'Clean', 'Maintenance') NOT NULL DEFAULT 'Available',
  `cleaning_status` ENUM('Ready', 'Clean', 'Dirty', 'Cleaning in Progress', 'Inspected') NOT NULL DEFAULT 'Clean',
  `notes` TEXT DEFAULT NULL,
  FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. REGISTERED GUESTS
DROP TABLE IF EXISTS `guests`;
CREATE TABLE `guests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `id_type` ENUM('Aadhaar', 'Passport', 'Driving License', 'National ID') DEFAULT 'Aadhaar',
  `id_number` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT 'Mumbai',
  `country` VARCHAR(100) DEFAULT 'India',
  `vip_status` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. RESERVATIONS & BOOKINGS
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_code` VARCHAR(50) NOT NULL UNIQUE,
  `guest_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `check_in_date` DATE NOT NULL,
  `check_out_date` DATE NOT NULL,
  `adults` INT NOT NULL DEFAULT 1,
  `children` INT NOT NULL DEFAULT 0,
  `nightly_rate` DECIMAL(10,2) NOT NULL,
  `total_nights` INT NOT NULL,
  `room_subtotal` DECIMAL(10,2) NOT NULL,
  `booking_source` ENUM('Walk-in', 'Website', 'Phone', 'Travel Agent', 'OTA') DEFAULT 'Walk-in',
  `status` ENUM('Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled', 'No-show') DEFAULT 'Confirmed',
  `actual_check_in` DATETIME DEFAULT NULL,
  `actual_check_out` DATETIME DEFAULT NULL,
  `special_requests` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. GUEST MASTER FOLIOS (BILLING)
DROP TABLE IF EXISTS `folios`;
CREATE TABLE `folios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL UNIQUE,
  `room_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `food_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `laundry_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `service_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `balance_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('Unpaid', 'Partially Paid', 'Settled') DEFAULT 'Unpaid',
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. FOLIO EXTRA CHARGES (Spa, Late checkout, Minibar, Airport)
DROP TABLE IF EXISTS `folio_charges`;
CREATE TABLE `folio_charges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `folio_id` INT NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'Other',
  `amount` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`folio_id`) REFERENCES `folios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. PAYMENTS & SETTLEMENTS
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `folio_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('Cash', 'Card', 'UPI', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
  `transaction_ref` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `recorded_by` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`folio_id`) REFERENCES `folios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. HOUSEKEEPING CLEANING QUEUE
DROP TABLE IF EXISTS `housekeeping_tasks`;
CREATE TABLE `housekeeping_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `assigned_to` VARCHAR(150) DEFAULT NULL,
  `task_type` VARCHAR(100) DEFAULT 'Turnaround Cleaning',
  `status` ENUM('Pending', 'In Progress', 'Completed', 'Approved') DEFAULT 'Pending',
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `linen_changed` TINYINT(1) DEFAULT 0,
  `toiletries_restocked` TINYINT(1) DEFAULT 0,
  `minibar_checked` TINYINT(1) DEFAULT 0,
  `remarks` TEXT DEFAULT NULL,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. RESTAURANT TABLES & MENUS
DROP TABLE IF EXISTS `restaurant_tables`;
CREATE TABLE `restaurant_tables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_number` VARCHAR(50) NOT NULL UNIQUE,
  `capacity` INT NOT NULL DEFAULT 4,
  `status` ENUM('Available', 'Occupied', 'Reserved') DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` ENUM('Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Room Service') NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. RESTAURANT ORDERS (KOT)
DROP TABLE IF EXISTS `restaurant_orders`;
CREATE TABLE `restaurant_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `order_type` ENUM('Dine-in', 'Takeaway', 'Room Service') NOT NULL,
  `table_id` INT DEFAULT NULL,
  `room_id` INT DEFAULT NULL,
  `booking_id` INT DEFAULT NULL,
  `guest_name` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('Pending', 'Preparing', 'Ready', 'Served') DEFAULT 'Pending',
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `billed_to_room` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `menu_item_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `restaurant_orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. RAW STOCK & INVENTORY
DROP TABLE IF EXISTS `inventory_items`;
CREATE TABLE `inventory_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('Kitchen', 'Beverage', 'Housekeeping', 'Amenities') NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(30) NOT NULL DEFAULT 'kg',
  `reorder_level` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  `unit_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `supplier_info` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `movement_type` ENUM('IN', 'OUT', 'WASTE', 'ADJUSTMENT') NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. LAUNDRY ORDERS
DROP TABLE IF EXISTS `laundry_orders`;
CREATE TABLE `laundry_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT DEFAULT NULL,
  `room_number` VARCHAR(30) NOT NULL,
  `guest_name` VARCHAR(150) NOT NULL,
  `items_count` INT NOT NULL DEFAULT 1,
  `service_type` VARCHAR(100) NOT NULL DEFAULT 'Washing',
  `status` ENUM('Received', 'Processing', 'Ready', 'Delivered') DEFAULT 'Received',
  `total_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. MAINTENANCE WORK ORDERS
DROP TABLE IF EXISTS `maintenance_tickets`;
CREATE TABLE `maintenance_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `issue_description` TEXT NOT NULL,
  `priority` ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
  `status` ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
  `expense` DECIMAL(10,2) DEFAULT 0.00,
  `reported_by` VARCHAR(150) DEFAULT NULL,
  `reported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. OPERATIONAL EXPENSES
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `date` DATE NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. AUDIT TRAIL LOGS
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_name` VARCHAR(150) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ======================================================
-- INITIAL SEED DATA
-- Default Admin Password: Admin@123 (hashed via password_hash)
-- ======================================================

INSERT INTO `hotel_settings` (`id`, `name`, `tagline`, `email`, `phone`, `address`, `city`, `state`, `country`, `pin_code`, `gstin`, `currency_symbol`, `currency_code`, `tax_rate`, `service_charge_rate`, `check_in_time`, `check_out_time`) VALUES
(1, 'The Grand Royale Palace Hotel & Spa', 'A Sanctuary of Refined Elegance & Heritage Hospitality', 'concierge@grandroyalepalace.com', '+91 22 2847 9000', '108 Marine Drive, Nariman Point', 'Mumbai', 'Maharashtra', 'India', '400021', '27AAAAA0000A1Z5', '₹', 'INR', 18.00, 5.00, '14:00', '11:00')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Default Users: Password is "Admin@123"
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `shift`, `status`) VALUES
(1, 'Vikramaditya Oberoi', 'admin@grandroyale.com', '+91 98200 12345', '$2y$10$vQ6/7b9KzHq6o6JbLgV20.Wj9H4L/1oFkKzDNuG01V4i78iX6zXqm', 'Administrator', 'General (09:00 - 18:00)', 'Active'),
(2, 'Pooja Sharma', 'reception@grandroyale.com', '+91 98200 23456', '$2y$10$vQ6/7b9KzHq6o6JbLgV20.Wj9H4L/1oFkKzDNuG01V4i78iX6zXqm', 'Receptionist', 'Morning (06:00 - 14:00)', 'Active'),
(3, 'Ramesh Khurana', 'hk@grandroyale.com', '+91 98200 34567', '$2y$10$vQ6/7b9KzHq6o6JbLgV20.Wj9H4L/1oFkKzDNuG01V4i78iX6zXqm', 'Housekeeping', 'Morning (06:00 - 14:00)', 'Active'),
(4, 'Chef Sanjeev Anand', 'chef@grandroyale.com', '+91 98200 45678', '$2y$10$vQ6/7b9KzHq6o6JbLgV20.Wj9H4L/1oFkKzDNuG01V4i78iX6zXqm', 'Chef', 'Evening (14:00 - 22:00)', 'Active'),
(5, 'Sunita Menon', 'accounts@grandroyale.com', '+91 98200 56789', '$2y$10$vQ6/7b9KzHq6o6JbLgV20.Wj9H4L/1oFkKzDNuG01V4i78iX6zXqm', 'Accountant', 'General (09:00 - 18:00)', 'Active');

INSERT INTO `room_types` (`id`, `name`, `base_rate`, `capacity_adults`, `capacity_children`, `bed_type`, `amenities`, `description`) VALUES
(1, 'Standard Room', 4500.00, 2, 1, 'King', 'High-Speed Wi-Fi, 43" Smart TV, Rain Shower, Coffee Maker, Work Desk', 'Refined contemporary comfort tailored for business travelers.'),
(2, 'Deluxe Sea Facing', 7500.00, 2, 1, 'King', 'Arabian Sea View, Balcony, Deep Soaking Tub, Pillow Menu, Minibar', 'Unobstructed ocean horizons with luxury bespoke plush furnishings.'),
(3, 'Super Deluxe Palace Wing', 11000.00, 3, 2, 'King', 'Heritage Artwork, Walk-in Closet, Jacuzzi, Club Lounge Access', 'Immaculately restored heritage suite embodying royal Indian architecture.'),
(4, 'Presidential Suite', 25000.00, 4, 2, 'King', '24/7 Dedicated Butler, Dual Master Suites, Private Dining Salon, Steam Room', 'The pinnacle of luxury living with white-glove butler services.'),
(5, 'Executive Family Suite', 14000.00, 4, 3, 'Two Kings', 'Two Adjoining Rooms, 2 Bathrooms, Kitchenette, Child Play Corner', 'Expansive family residence providing supreme privacy and space.');

INSERT INTO `rooms` (`id`, `room_number`, `floor`, `room_type_id`, `bed_type`, `has_ac`, `status`, `cleaning_status`, `notes`) VALUES
(1, '101', 1, 1, 'King', 1, 'Available', 'Ready', 'Near east elevator'),
(2, '102', 1, 1, 'Twin', 1, 'Available', 'Clean', 'Courtyard garden view'),
(3, '103', 1, 1, 'King', 1, 'Occupied', 'Clean', NULL),
(4, '104', 1, 1, 'King', 1, 'Dirty', 'Dirty', 'Turnover required'),
(5, '201', 2, 2, 'King', 1, 'Occupied', 'Clean', 'Guest Aditya Singhania'),
(6, '202', 2, 2, 'King', 1, 'Dirty', 'Dirty', 'Checkout turnover'),
(7, '203', 2, 2, 'King', 1, 'Reserved', 'Ready', 'VIP arrival today'),
(8, '204', 2, 2, 'Twin', 1, 'Available', 'Ready', NULL),
(9, '301', 3, 3, 'King', 1, 'Available', 'Ready', NULL),
(10, '302', 3, 3, 'King', 1, 'Cleaning', 'Cleaning in Progress', 'Ozone sanitization'),
(11, '303', 3, 3, 'King', 1, 'Occupied', 'Clean', NULL),
(12, '304', 3, 3, 'King', 1, 'Reserved', 'Ready', NULL),
(13, '401', 4, 4, 'King', 1, 'Occupied', 'Clean', 'VIP Eleanor Vanderbilt'),
(14, '402', 4, 4, 'King', 1, 'Available', 'Ready', NULL),
(15, '403', 4, 5, 'Two Kings', 1, 'Available', 'Ready', NULL),
(16, '501', 5, 5, 'Two Kings', 1, 'Maintenance', 'Dirty', 'AC compressor recalibration'),
(17, '502', 5, 5, 'Two Kings', 1, 'Available', 'Ready', NULL);

INSERT INTO `guests` (`id`, `first_name`, `last_name`, `email`, `phone`, `id_type`, `id_number`, `city`, `country`, `vip_status`) VALUES
(1, 'Aditya', 'Singhania', 'aditya.singhania@corp.in', '+91 99301 12233', 'Aadhaar', '8839 2910 4918', 'New Delhi', 'India', 1),
(2, 'Eleanor', 'Vanderbilt', 'eleanor.v@globaltravel.com', '+1 415 890 2311', 'Passport', 'USA-90281144', 'San Francisco', 'United States', 1),
(3, 'Rajesh', 'Patel', 'rajesh.patel@surattextiles.com', '+91 98250 99881', 'Aadhaar', '3391 8840 1029', 'Surat', 'India', 0);

INSERT INTO `bookings` (`id`, `booking_code`, `guest_id`, `room_id`, `check_in_date`, `check_out_date`, `adults`, `children`, `nightly_rate`, `total_nights`, `room_subtotal`, `booking_source`, `status`, `actual_check_in`) VALUES
(1, 'GRP-2610-001', 1, 5, CURDATE() - INTERVAL 1 DAY, CURDATE() + INTERVAL 2 DAY, 2, 0, 7500.00, 3, 22500.00, 'Website', 'Checked-in', NOW() - INTERVAL 1 DAY),
(2, 'GRP-2610-002', 2, 13, CURDATE(), CURDATE() + INTERVAL 3 DAY, 2, 1, 25000.00, 3, 75000.00, 'Travel Agent', 'Checked-in', NOW()),
(3, 'GRP-2610-003', 3, 7, CURDATE() + INTERVAL 1 DAY, CURDATE() + INTERVAL 4 DAY, 2, 0, 7500.00, 3, 22500.00, 'OTA', 'Confirmed', NULL);

INSERT INTO `folios` (`id`, `booking_id`, `room_charge`, `food_charge`, `laundry_charge`, `service_charge`, `tax_amount`, `discount_amount`, `total_amount`, `paid_amount`, `balance_amount`, `payment_status`) VALUES
(1, 1, 22500.00, 3150.00, 850.00, 1325.00, 4950.00, 0.00, 32775.00, 15000.00, 17775.00, 'Partially Paid'),
(2, 2, 75000.00, 9800.00, 0.00, 4240.00, 16027.20, 0.00, 105067.20, 75000.00, 30067.20, 'Partially Paid'),
(3, 3, 22500.00, 0.00, 0.00, 1125.00, 4252.50, 0.00, 27877.50, 10000.00, 17877.50, 'Partially Paid');

INSERT INTO `payments` (`id`, `folio_id`, `amount`, `payment_method`, `transaction_ref`, `notes`, `recorded_by`) VALUES
(1, 1, 15000.00, 'Card', 'TXN-CARD-901824', 'Pre-authorization card deposit', 'Pooja Sharma'),
(2, 2, 75000.00, 'Bank Transfer', 'WIRE-CHASE-002910', 'Full stay wire deposit', 'Vikramaditya Oberoi'),
(3, 3, 10000.00, 'UPI', 'UPI/OTA-DEPOSIT', 'Advance booking deposit', 'Pooja Sharma');

INSERT INTO `restaurant_tables` (`id`, `table_number`, `capacity`, `status`) VALUES
(1, 'Table 01 (Sea View Bay)', 4, 'Occupied'),
(2, 'Table 02 (Sea View Bay)', 2, 'Available'),
(3, 'Table 03 (Royal Garden Gazebo)', 6, 'Available'),
(4, 'Table 04 (Maharaja Private Salon)', 8, 'Reserved'),
(5, 'Table 05 (Indoor Piano Bar)', 4, 'Available');

INSERT INTO `menu_items` (`id`, `category`, `name`, `description`, `price`, `is_active`) VALUES
(1, 'Breakfast', 'Royal Indian Maharaja Thali', 'Poori bhaji, paratha, idli, fresh juice & masala chai', 650.00, 1),
(2, 'Breakfast', 'Grand Continental Eggs Benedict', 'Artisan brioche, smoked salmon, poached eggs, hollandaise', 750.00, 1),
(3, 'Lunch', 'Dum Pukht Awadhi Biryani', 'Fragrant basmati rice slow cooked with royal spices', 1150.00, 1),
(4, 'Lunch', 'Paneer Tikka Velvet Makhani', 'Charcoal tandoor cottage cheese in cashew cream gravy', 850.00, 1),
(5, 'Dinner', 'Tandoori Ocean Jumbo Prawns', 'Marinated with yellow chili and hung curd', 1650.00, 1),
(6, 'Dinner', 'Dal Makhani Bukhara Heritage', 'Slow cooked overnight on charcoal with white butter', 650.00, 1),
(7, 'Beverages', 'Darjeeling First Flush Rare Tea', 'Single-estate organic spring harvest infusion', 350.00, 1),
(8, 'Beverages', 'Coastal Tender Coconut Water', 'Organic coastal tender coconut served chilled', 250.00, 1);

INSERT INTO `inventory_items` (`id`, `name`, `category`, `quantity`, `unit`, `reorder_level`, `unit_cost`, `supplier_info`) VALUES
(1, 'Aged Himalayan Basmati Rice', 'Kitchen', 140.00, 'kg', 40.00, 150.00, 'Himalaya Heritage Grains Ltd'),
(2, 'Amul Churned Cultured Butter', 'Kitchen', 48.00, 'kg', 15.00, 520.00, 'Gujarat Dairy Co-operative'),
(3, 'Egyptian Cotton King Linens (400 TC)', 'Housekeeping', 85.00, 'units', 25.00, 1400.00, 'Bombay Dyeing Hotel Linens'),
(4, 'Kama Ayurveda Luxury Guest Kits', 'Housekeeping', 18.00, 'kits', 30.00, 220.00, 'Kama Ayurveda Hospitality');

INSERT INTO `maintenance_tickets` (`id`, `room_id`, `issue_description`, `priority`, `status`, `expense`, `reported_by`) VALUES
(1, 16, 'AC compressor vibration and thermostat recalibration.', 'High', 'In Progress', 3500.00, 'Ramesh Khurana');

INSERT INTO `expenses` (`id`, `title`, `category`, `amount`, `date`, `notes`) VALUES
(1, 'Commercial Power & Municipal Grid', 'Utilities & Power', 145000.00, CURDATE(), 'Monthly power utility'),
(2, 'Egyptian Cotton Linens Batch Restock', 'Housekeeping Goods', 48000.00, CURDATE(), '400 TC luxury linens');
