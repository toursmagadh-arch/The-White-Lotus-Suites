<?php
require_once __DIR__ . '/config/db.php';
session_start();

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email && $password) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = 'Active'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Support password_verify or default Admin@123 fallback
        if ($user && ($password === 'Admin@123' || password_verify($password, $user['password_hash']))) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['user_shift'] = $user['shift'];

            logAudit($pdo, $user['name'], 'USER_LOGIN', "Staff member logged in");
            header("Location: index.php");
            exit;
        } else {
            $error = "Invalid corporate email or password. (Default: admin@grandroyale.com / Admin@123)";
        }
    } else {
        $error = "Please provide both corporate email and password.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staff Portal Login — The Grand Royale Palace Hotel & Spa</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:radial-gradient(circle, #0e172e 0%, #070d1e 100%);">

<div style="background:var(--bg-surface);border:1px solid var(--border-color);padding:40px;border-radius:14px;width:100%;max-width:440px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
  <h1 style="color:var(--gold-primary);font-size:1.4rem;margin-bottom:6px;">Grand Royale</h1>
  <p style="color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:28px;">Hotel & Spa PMS Portal</p>

  <?php if ($error): ?>
    <div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:10px;border-radius:6px;font-size:0.78rem;margin-bottom:18px;text-align:left;">
      <?= htmlspecialchars($error) ?>
    </div>
  <?php endif; ?>

  <form method="POST" action="login.php" style="text-align:left;">
    <div style="margin-bottom:14px;">
      <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:6px;">Corporate Email</label>
      <input type="email" name="email" class="form-control" value="admin@grandroyale.com" required>
    </div>

    <div style="margin-bottom:20px;">
      <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:6px;">Password</label>
      <input type="password" name="password" class="form-control" value="Admin@123" required>
    </div>

    <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:10px;">
      Authorize & Access PMS
    </button>
  </form>

  <p style="font-size:0.7rem;color:var(--text-muted);margin-top:24px;">
    Pre-configured Test Accounts: <br>
    <strong>admin@grandroyale.com</strong> · <strong>reception@grandroyale.com</strong><br>
    Password: <strong>Admin@123</strong>
  </p>
</div>

</body>
</html>
