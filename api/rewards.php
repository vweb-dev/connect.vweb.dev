<?php
declare(strict_types=1);
require __DIR__.'/_member.php';
member_session();header('Cache-Control: no-store');
try{
 $db=connect_db();
 if($_SERVER['REQUEST_METHOD']==='GET'){
  $tasks=$db->query('SELECT id,title,description,question,points FROM reward_tasks WHERE enabled=1 ORDER BY id LIMIT 30')->fetchAll();
  $result=['ok'=>true,'tasks'=>$tasks,'gateway_enabled'=>!empty(connect_config()['gateway_enabled']),'redemption_rate'=>['points'=>100,'megabytes'=>100]];
  if(member_id()){
   $id=member_id();$result['points']=member_wallet($db,$id);
   $stmt=$db->prepare('SELECT task_id FROM reward_claims WHERE user_id=? AND claim_date=UTC_DATE()');$stmt->execute([$id]);
   $result['completed_today']=array_map('intval',$stmt->fetchAll(PDO::FETCH_COLUMN));
   $stmt=$db->prepare('SELECT id,points,quota_mb,status,voucher_code,submitted_at FROM gateway_jobs WHERE user_id=? ORDER BY id DESC LIMIT 10');
   $stmt->execute([$id]);$result['redemptions']=$stmt->fetchAll();
  }else{$result['points']=null;$result['completed_today']=[];$result['redemptions']=[];}
  connect_json($result);
 }
 $data=member_post();$id=member_required();$action=(string)($data['action']??'');
 if($action==='claim'){
  $taskId=(int)($data['task_id']??0);$answer=strtolower(trim((string)($data['answer']??'')));
  if($taskId<1||strlen($answer)>100)connect_json(['ok'=>false,'message'=>'Invalid learning answer.'],422);
  $stmt=$db->prepare('SELECT id,points,answer_hash FROM reward_tasks WHERE enabled=1 AND id=?');$stmt->execute([$taskId]);
  $task=$stmt->fetch();
  if(!$task||!hash_equals($task['answer_hash'],hash('sha256',$answer)))
    connect_json(['ok'=>false,'message'=>'Answer not correct. Please try again.'],422);
  $db->beginTransaction();
  $stmt=$db->prepare('SELECT COALESCE(SUM(points),0) FROM reward_claims WHERE user_id=? AND claim_date=UTC_DATE()');
  $stmt->execute([$id]);$earned=(int)$stmt->fetchColumn();
  if($earned+(int)$task['points']>60){$db->rollBack();connect_json(['ok'=>false,'message'=>'Daily reward limit reached.'],429);}
  $stmt=$db->prepare('INSERT INTO reward_claims(user_id,task_id,claim_date,points) VALUES(?,?,UTC_DATE(),?)');
  try{$stmt->execute([$id,$taskId,$task['points']]);}
  catch(PDOException $e){$db->rollBack();connect_json(['ok'=>false,'message'=>'Already completed this task today.'],409);}
  $claimId=(int)$db->lastInsertId();
  $db->prepare('INSERT INTO wallet_ledger(user_id,delta,reason,reference_id) VALUES(?,?,?,?)')
   ->execute([$id,(int)$task['points'],'learning_challenge','claim:'.$claimId]);
  $db->commit();
  connect_json(['ok'=>true,'points'=>member_wallet($db,$id),'message'=>'Learning points credited.']);
 }
 if($action==='redeem'){
  if(empty(connect_config()['gateway_enabled']))connect_json(['ok'=>false,'message'=>'Internet vouchers not configured by the ISP yet.'],503);
  $db->beginTransaction();
  // Serialize redemptions per-user. Quota requests are not activated until the ISP gateway confirms.
  $stmt=$db->prepare('SELECT id FROM app_users WHERE id=? FOR UPDATE');$stmt->execute([$id]);
  if(!$stmt->fetch()){$db->rollBack();connect_json(['ok'=>false],401);}
  if(member_wallet($db,$id)<100){$db->rollBack();connect_json(['ok'=>false,'message'=>'At least 100 points required.'],422);}
  $db->prepare("INSERT INTO gateway_jobs(user_id,points,quota_mb,status) VALUES(?,100,100,'pending')")->execute([$id]);
  $job=(int)$db->lastInsertId();
  $db->prepare('INSERT INTO wallet_ledger(user_id,delta,reason,reference_id) VALUES(?,-100,?,?)')
    ->execute([$id,'hotspot_redemption','job:'.$job]);
  $db->commit();connect_json(['ok'=>true,'job_id'=>$job,'message'=>'Voucher queued. It is not usable until gateway provisioning succeeds.']);
 }
 connect_json(['ok'=>false,'message'=>'Unsupported request.'],422);
}catch(Throwable $e){if(isset($db)&&$db->inTransaction())$db->rollBack();member_fail($e);}
