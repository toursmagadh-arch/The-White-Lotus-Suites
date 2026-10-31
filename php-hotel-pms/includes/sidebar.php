<?php
$currentPage = basename($_SERVER['PHP_SELF']);
$user = currentUser();
?>
<aside class="sidebar no-print">
  <div class="brand-box">
    <h1>Grand Royale</h1>
    <p>Palace Hotel & Spa PMS</p>
  </div>

  <nav class="nav-menu">
    <div class="nav-section">Core Operations</div>
    <a href="index.php" class="nav-item <?= $currentPage == 'index.php' ? 'active' : '' ?>">
      <i data-feather="grid"></i> Dashboard
    </a>
    <a href="rooms.php" class="nav-item <?= $currentPage == 'rooms.php' ? 'active' : '' ?>">
      <i data-feather="key"></i> Room Matrix
    </a>
    <a href="bookings.php" class="nav-item <?= $currentPage == 'bookings.php' ? 'active' : '' ?>">
      <i data-feather="calendar"></i> Reservations
    </a>
    <a href="frontdesk.php" class="nav-item <?= $currentPage == 'frontdesk.php' ? 'active' : '' ?>">
      <i data-feather="user-check"></i> Front Desk
    </a>

    <div class="nav-section">Guest Services & Dining</div>
    <a href="housekeeping.php" class="nav-item <?= $currentPage == 'housekeeping.php' ? 'active' : '' ?>">
      <i data-feather="check-circle"></i> Housekeeping
    </a>
    <a href="pos.php" class="nav-item <?= $currentPage == 'pos.php' ? 'active' : '' ?>">
      <i data-feather="coffee"></i> Restaurant POS
    </a>
    <a href="inventory.php" class="nav-item <?= $currentPage == 'inventory.php' ? 'active' : '' ?>">
      <i data-feather="box"></i> Kitchen & Stock
    </a>
    <a href="maintenance.php" class="nav-item <?= $currentPage == 'maintenance.php' ? 'active' : '' ?>">
      <i data-feather="tool"></i> Maintenance
    </a>

    <div class="nav-section">Finance & Admin</div>
    <a href="billing.php" class="nav-item <?= $currentPage == 'billing.php' ? 'active' : '' ?>">
      <i data-feather="file-text"></i> Billing & Folios
    </a>
    <a href="reports.php" class="nav-item <?= $currentPage == 'reports.php' ? 'active' : '' ?>">
      <i data-feather="pie-chart"></i> Reports & P&L
    </a>
    <a href="staff.php" class="nav-item <?= $currentPage == 'staff.php' ? 'active' : '' ?>">
      <i data-feather="users"></i> Staff & RBAC
    </a>
    <a href="settings.php" class="nav-item <?= $currentPage == 'settings.php' ? 'active' : '' ?>">
      <i data-feather="settings"></i> Hotel Settings
    </a>
  </nav>

  <div class="user-card">
    <div>
      <div style="font-size: 0.8rem; font-weight: 700; color: #fff;"><?= htmlspecialchars($user['name']) ?></div>
      <div style="font-size: 0.7rem; color: var(--gold-accent);"><?= htmlspecialchars($user['role']) ?></div>
    </div>
    <a href="logout.php" title="Sign Out" class="btn btn-secondary btn-sm" style="padding: 6px 8px;">
      <i data-feather="log-out"></i>
    </a>
  </div>
</aside>
