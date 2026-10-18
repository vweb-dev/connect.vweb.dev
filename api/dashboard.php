<?php
declare(strict_types=1);
require __DIR__.'/_member.php';
member_session();header('Cache-Control: no-store');
try {
  if($_SERVER['REQUEST_METHOD']!=='GET')connect_json(['ok'=>false],405);
  $id=member_required();$db=connect_db();
  $user=member_user($db,$id);
  if (!$user||$user['status']!=='active')connect_json(['ok'=>false,'message'=>'Account disabled.'],403);
  $stmt=$db->prepare("SELECT l.id,l.pppoe_username,l.status,l.reviewer_note,l.created_at,
    i.is_online,i.session_uptime_seconds,i.session_download_bytes,i.session_upload_bytes,
    i.reported_download_bytes,i.reported_upload_bytes,i.reported_period,i.reported_basis,
    i.plan_name,i.renewal_date,i.collected_at
    FROM isp_account_links l LEFT JOIN isp_accounts i ON i.username=l.pppoe_username
    WHERE l.user_id=? ORDER BY l.created_at DESC LIMIT 8");
  $stmt->execute([$id]);$accounts=$stmt->fetchAll();
  foreach ($accounts as &$a) {
    if ($a['status']!=='approved') {
      foreach(['is_online','session_uptime_seconds','session_download_bytes','session_upload_bytes',
        'reported_download_bytes','reported_upload_bytes','reported_period','reported_basis','plan_name',
        'renewal_date','collected_at'] as $field)unset($a[$field]);
    } elseif ($a['collected_at']===null) {
      $a['data_status']='not_synced';
    } else {
      $fresh=(strtotime($a['collected_at'].' UTC')>=time()-900);
      $a['data_status']=$fresh?'recent':'stale';
      if (!$fresh) $a['is_online']=null; // stale status must never be presented as live
    }
  }unset($a);
  $stmt=$db->prepare('SELECT id,subject,status,created_at FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 8');
  $stmt->execute([$id]);$tickets=$stmt->fetchAll();
  connect_json(['ok'=>true,'user'=>$user,'links'=>$accounts,'wallet_points'=>member_wallet($db,$id),
    'tickets'=>$tickets,'server_time'=>gmdate('c')]);
} catch(Throwable $e){member_fail($e);}
