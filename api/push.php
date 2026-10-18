<?php
declare(strict_types=1);
require __DIR__.'/_member.php';
member_session();header('Cache-Control: no-store');
try{
 $db=connect_db();
 if($_SERVER['REQUEST_METHOD']==='GET'){
  $cfg=connect_config();$key=(string)($cfg['vapid_public_key']??'');
  connect_json(['ok'=>true,'available'=>$key!==''&&!empty($cfg['vapid_private_key'])&&is_file(dirname(__DIR__).'/vendor/autoload.php'),
    'vapid_public_key'=>$key]);
 }
 $data=member_post();$uid=member_required();$action=(string)($data['action']??'');
 if($action==='subscribe'){
  if(!((int)member_user($db,$uid)['marketing_opt_in']))connect_json(['ok'=>false,'message'=>'Turn on optional promotional notifications in Account settings first.'],422);
  $sub=$data['subscription']??null;
  if(!is_array($sub)||empty($sub['endpoint'])||empty($sub['keys']['p256dh'])||empty($sub['keys']['auth']))
   connect_json(['ok'=>false,'message'=>'Invalid browser subscription.'],422);
  $endpoint=(string)$sub['endpoint'];
  $host=strtolower((string)(parse_url($endpoint,PHP_URL_HOST)??''));
  $allowed=($host==='fcm.googleapis.com' || $host==='updates.push.services.mozilla.com'
    || $host==='web.push.apple.com' || $host==='push.services.mozilla.com'
    || str_ends_with($host,'.notify.windows.com'));
  if(strlen($endpoint)>1800||!connect_safe_url($endpoint)||!$allowed)
     connect_json(['ok'=>false,'message'=>'Push service endpoint not supported.'],422);
  $encoded=json_encode($sub);
  if(strlen($encoded)>5000)connect_json(['ok'=>false,'message'=>'Subscription too large'],422);
  $hash=hash('sha256',$endpoint);
  $stmt=$db->prepare('INSERT INTO push_subscriptions(user_id,endpoint_hash,subscription_json) VALUES(?,?,?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id),subscription_json=VALUES(subscription_json),enabled=1');
  $stmt->execute([$uid,$hash,$encoded]);connect_json(['ok'=>true]);
 }
 if($action==='unsubscribe'){
  $endpoint=(string)($data['endpoint']??'');
  if($endpoint!=='')$db->prepare('DELETE FROM push_subscriptions WHERE user_id=? AND endpoint_hash=?')->execute([$uid,hash('sha256',$endpoint)]);
  connect_json(['ok'=>true]);
 }
 connect_json(['ok'=>false,'message'=>'Unknown action.'],422);
}catch(Throwable $e){member_fail($e);}
