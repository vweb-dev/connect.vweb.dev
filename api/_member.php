<?php
declare(strict_types=1);
require_once __DIR__.'/_boot.php';
function member_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS']==='off') connect_json(['ok'=>false,'message'=>'HTTPS required'],403);
    session_name('__Host-connectmember');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);
    ini_set('session.use_strict_mode','1');
    session_start();
}
function member_id(): int {return (int)($_SESSION['member_id']??0);}
function member_required(): int {
    $id=member_id();
    if ($id<1) connect_json(['ok'=>false,'message'=>'Sign in required.'],401);
    $user=member_user(connect_db(),$id);
    if (!$user || $user['status']!=='active') connect_json(['ok'=>false,'message'=>'Account not active.'],403);
    return $id;
}
function member_csrf(): string {
    if (!isset($_SESSION['member_csrf'])) $_SESSION['member_csrf']=bin2hex(random_bytes(32));
    return $_SESSION['member_csrf'];
}
function member_body(): array {
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>32768) connect_json(['ok'=>false,'message'=>'Request too large.'],413);
    $data=json_decode(file_get_contents('php://input'),true);
    if (!is_array($data)) connect_json(['ok'=>false,'message'=>'Invalid JSON.'],400);
    return $data;
}
function member_post(): array {
    if ($_SERVER['REQUEST_METHOD']!=='POST')connect_json(['ok'=>false,'message'=>'Method not allowed'],405);
    $token=$_SERVER['HTTP_X_CSRF_TOKEN']??'';
    if (!is_string($token) || !hash_equals(member_csrf(),$token))connect_json(['ok'=>false,'message'=>'Invalid request token. Refresh the page.'],403);
    return member_body();
}
function member_user(PDO $db,int $id): ?array {
    $query=$db->prepare('SELECT id,name,email,status,marketing_opt_in,created_at FROM app_users WHERE id=? LIMIT 1');
    $query->execute([$id]);
    $row=$query->fetch();
    return $row?:null;
}
function member_wallet(PDO $db,int $id): int {
    $stmt=$db->prepare('SELECT COALESCE(SUM(delta),0) FROM wallet_ledger WHERE user_id=?');
    $stmt->execute([$id]);
    return max(0,(int)$stmt->fetchColumn());
}
function member_fail(Throwable $e): never {
    error_log('VWEB Connect member operation failed: '.$e->getMessage());
    connect_json(['ok'=>false,'message'=>'The service is temporarily unavailable.'],503);
}
