<?php
// api.php
header('Content-Type: application/json; charset=utf-8');

// Basic configuration - XAMPP default
$DB_HOST = '127.0.0.1';
$DB_NAME = 'family_budget';
$DB_USER = 'root';
$DB_PASS = ''; // XAMPP default has empty password for root

// connect using PDO
try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

$requestBody = file_get_contents('php://input');
$input = json_decode($requestBody, true);




// ------- ADD -------
if ($action === 'add') {
    $month = isset($input['month']) ? trim($input['month']) : '';
    $type  = isset($input['type']) ? trim($input['type']) : '';
    $amount = isset($input['amount']) ? (float)$input['amount'] : 0;

    if ($month === '' || $type === '' || $amount <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO expenses (expense_month, expense_type, amount) VALUES (?, ?, ?)");
        $stmt->execute([$month, $type, $amount]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Insert failed: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'list') {
    $month = isset($_GET['month']) ? trim($_GET['month']) : '';
    try {
        if ($month === '') {
            // return last 20 records if no month provided
            $stmt = $pdo->query("SELECT * FROM expenses ORDER BY created_at DESC LIMIT 20");
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM expenses WHERE expense_month = ? ORDER BY created_at DESC");
            $stmt->execute([$month]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        echo json_encode(['success' => true, 'items' => $items]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Query failed: ' . $e->getMessage()]);
    }
    exit;
}

// ------- DELETE -------
if ($action === 'delete') {
    if (!isset($input['id'])) {
        echo json_encode(['success' => false, 'message' => 'Missing id']);
        exit;
    }
    $id = (int)$input['id'];
    try {
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'deleted' => $stmt->rowCount()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $e->getMessage()]);
    }
    exit;
}


// Unknown action
echo json_encode(['success' => false, 'message' => 'Unknown action']);
exit;
