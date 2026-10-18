<?php
declare(strict_types=1);
require __DIR__.'/_isp_auth.php';
header('Cache-Control: no-store');
if($_SERVER['REQUEST_METHOD']!=='GET') connect_json(['ok'=>false],405);
isp_auth('');
try{
 $db=connect_db();
 $names=$db->query("SELECT DISTINCT pppoe_username FROM isp_account_links
    WHERE status='approved' ORDER BY pppoe_username LIMIT 2000")->fetchAll(PDO::FETCH_COLUMN);
 connect_json(['ok'=>true,'usernames'=>$names]);
}catch(Throwable $e){connect_json(['ok'=>false,'message'=>'Target lookup unavailable'],503);}
