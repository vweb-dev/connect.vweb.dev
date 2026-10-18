<?php
declare(strict_types=1);
require __DIR__.'/_member.php';
member_session();
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD']!=='GET') connect_json(['ok'=>false,'message'=>'Method not allowed'],405);
try {
 $userId=member_required();
 $db=connect_db();
 $stmt=$db->prepare("SELECT id,subject,status,created_at FROM support_tickets WHERE user_id=? ORDER BY id DESC LIMIT 12");
 $stmt->execute([$userId]);
 connect_json(['ok'=>true,'tickets'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $e) {
 member_fail($e);
}
