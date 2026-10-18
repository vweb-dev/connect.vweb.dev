<?php
declare(strict_types=1);
require_once __DIR__.'/_boot.php';
function isp_auth(string $body, string $keyName='isp_sync_key'): void {
    $cfg=connect_config();
    $key=(string)($cfg[$keyName]??'');
    if(strlen($key)<32)connect_json(['ok'=>false,'message'=>'Sync is not configured'],503);
    $timestamp=$_SERVER['HTTP_X_CONNECT_TIMESTAMP']??'';
    $nonce=$_SERVER['HTTP_X_CONNECT_NONCE']??'';
    $signature=$_SERVER['HTTP_X_CONNECT_SIGNATURE']??'';
    if(!preg_match('/^\d{10}$/D',$timestamp)||abs(time()-(int)$timestamp)>300
      ||!preg_match('/^[a-f0-9]{32}$/D',$nonce)
      ||!preg_match('/^[a-f0-9]{64}$/D',$signature))connect_json(['ok'=>false,'message'=>'Invalid signature headers'],403);
    $path=parse_url($_SERVER['REQUEST_URI']??'',PHP_URL_PATH);
    $msg=$_SERVER['REQUEST_METHOD']."\n".$path."\n".$timestamp."\n".$nonce."\n".$body;
    if(!hash_equals(hash_hmac('sha256',$msg,$key),$signature))
        connect_json(['ok'=>false,'message'=>'Signature rejected'],403);
    $db=connect_db();
    $db->prepare('DELETE FROM sync_nonces WHERE created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)')->execute();
    try{$db->prepare('INSERT INTO sync_nonces(nonce) VALUES(?)')->execute([$nonce]);}
    catch(PDOException $e){connect_json(['ok'=>false,'message'=>'Replay detected'],403);}
}
