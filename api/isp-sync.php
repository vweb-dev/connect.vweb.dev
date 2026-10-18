<?php
declare(strict_types=1);
require __DIR__.'/_isp_auth.php';
header('Cache-Control: no-store');
if($_SERVER['REQUEST_METHOD']!=='POST')connect_json(['ok'=>false],405);
$body=file_get_contents('php://input');
if(strlen($body)>500000)connect_json(['ok'=>false,'message'=>'Batch too large'],413);
isp_auth($body);
$payload=json_decode($body,true);
if(!is_array($payload)||!isset($payload['accounts'])||!is_array($payload['accounts'])||count($payload['accounts'])>500)
 connect_json(['ok'=>false,'message'=>'Expected accounts array (maximum 500)'],422);
try{
 $db=connect_db();$db->beginTransaction();$count=0;
 $sql="INSERT INTO isp_accounts(username,is_online,session_uptime_seconds,
    session_download_bytes,session_upload_bytes,reported_download_bytes,reported_upload_bytes,
    reported_period,reported_basis,plan_name,renewal_date,collected_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE is_online=VALUES(is_online),
    session_uptime_seconds=VALUES(session_uptime_seconds),
    session_download_bytes=VALUES(session_download_bytes),
    session_upload_bytes=VALUES(session_upload_bytes),
    reported_download_bytes=VALUES(reported_download_bytes),
    reported_upload_bytes=VALUES(reported_upload_bytes),
    reported_period=VALUES(reported_period),reported_basis=VALUES(reported_basis),
    plan_name=VALUES(plan_name),renewal_date=VALUES(renewal_date),collected_at=UTC_TIMESTAMP()";
 $stmt=$db->prepare($sql);
 foreach($payload['accounts'] as $a){
  if(!is_array($a))continue;
  $name=trim((string)($a['username']??''));
  if(!preg_match('/^[A-Za-z0-9@._:-]{3,190}$/D',$name))continue;
  $safeInt=static function($v):?int {return is_int($v)&&$v>=0?$v:null;};
  $basis=substr((string)($a['reported_basis']??'unknown'),0,60);
  $period=substr((string)($a['reported_period']??'not_available'),0,40);
  $plan=isset($a['plan_name'])?substr((string)$a['plan_name'],0,120):null;
  $renewal=$a['renewal_date']??null;
  if($renewal!==null&&!preg_match('/^\d{4}-\d{2}-\d{2}$/D',(string)$renewal))$renewal=null;
  $stmt->execute([$name,!empty($a['is_online'])?1:0,$safeInt($a['session_uptime_seconds']??null),
   $safeInt($a['session_download_bytes']??null),$safeInt($a['session_upload_bytes']??null),
   $safeInt($a['reported_download_bytes']??null),$safeInt($a['reported_upload_bytes']??null),
   $period,$basis,$plan,$renewal]);
  $count++;
 }
 $db->commit();connect_json(['ok'=>true,'updated_accounts'=>$count,'server_time'=>gmdate('c')]);
}catch(Throwable $e){if(isset($db)&&$db->inTransaction())$db->rollBack();connect_json(['ok'=>false,'message'=>'Sync failed.'],503);}
