<?php
declare(strict_types=1);
require __DIR__.'/_isp_auth.php';
header('Cache-Control: no-store');
if(empty(connect_config()['gateway_enabled']))connect_json(['ok'=>false,'message'=>'Guest gateway integration disabled.'],503);
$body=$_SERVER['REQUEST_METHOD']==='POST'?file_get_contents('php://input'):'';
if(strlen($body)>20000)connect_json(['ok'=>false,'message'=>'Request too large'],413);
isp_auth($body,'gateway_sync_key');
try{
 $db=connect_db();
 if($_SERVER['REQUEST_METHOD']==='GET'){
  $jobs=$db->query("SELECT id,quota_mb FROM gateway_jobs WHERE status='pending' ORDER BY id LIMIT 30")->fetchAll();
  connect_json(['ok'=>true,'jobs'=>$jobs]);
 }
 if($_SERVER['REQUEST_METHOD']==='POST'){
  $payload=json_decode($body,true);$completed=$payload['completed']??null;
  if(!is_array($completed)||count($completed)>30)connect_json(['ok'=>false,'message'=>'Invalid batch'],422);
  $changed=0;
  $stmt=$db->prepare("UPDATE gateway_jobs SET status='issued',voucher_code=?,fulfilled_at=UTC_TIMESTAMP() WHERE id=? AND status='pending'");
  foreach($completed as $item){
   $id=(int)($item['id']??0);$code=trim((string)($item['voucher_code']??''));
   if($id<1||!preg_match('/^[A-Za-z0-9_-]{12,80}$/D',$code))continue;
   $stmt->execute([$code,$id]);$changed+=$stmt->rowCount();
  }
  connect_json(['ok'=>true,'issued'=>$changed]);
 }
 connect_json(['ok'=>false],405);
}catch(Throwable $e){connect_json(['ok'=>false,'message'=>'Gateway sync failed.'],503);}
