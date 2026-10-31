<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth.php';
checkAuth();

$settings = getHotelSettings($pdo);
$user = currentUser();

// Page title fallback
if (!isset($pageTitle)) $pageTitle = 'Dashboard';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($pageTitle) ?> — <?= htmlspecialchars($settings['name']) ?></title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Feather Icons CDN -->
  <script src="https://unpkg.com/feather-icons"></script>
</head>
<body>
<div class="app-container">
  <?php include __DIR__ . '/sidebar.php'; ?>
  
  <div class="main-wrapper">
    <header class="top-bar no-print">
      <div>
        <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--gold-light);"><?= htmlspecialchars($pageTitle) ?></h2>
        <p style="font-size: 0.72rem; color: var(--text-muted);"><?= htmlspecialchars($settings['name']) ?> · <?= date('l, d F Y') ?></p>
      </div>

      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 0.75rem; color: var(--gold-accent); background: rgba(212,175,55,0.1); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border-color);">
          Currency: <?= htmlspecialchars($settings['currency_symbol']) ?> (<?= htmlspecialchars($settings['currency_code']) ?>)
        </span>
        <a href="bookings.php?action=new" class="btn btn-primary btn-sm">
          <i data-feather="plus"></i> New Reservation
        </a>
      </div>
    </header>

    <main class="content-body">
