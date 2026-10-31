<?php
/**
 * Authentication and Session Guard
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        header("Location: login.php");
        exit;
    }
}

function checkRole(...$allowedRoles) {
    checkAuth();
    if (!in_array($_SESSION['user_role'], $allowedRoles)) {
        header("HTTP/1.1 403 Forbidden");
        die("<div style='background:#0f172a;color:#f87171;padding:40px;font-family:sans-serif;'><h2>Access Denied</h2><p>Your current role ({$_SESSION['user_role']}) does not possess the required privilege.</p><a href='index.php' style='color:#fbbf24;'>Return to Dashboard</a></div>");
    }
}

function currentUser() {
    return [
        'id' => $_SESSION['user_id'] ?? null,
        'name' => $_SESSION['user_name'] ?? 'Guest Staff',
        'email' => $_SESSION['user_email'] ?? '',
        'role' => $_SESSION['user_role'] ?? 'Receptionist',
        'shift' => $_SESSION['user_shift'] ?? 'General'
    ];
}
