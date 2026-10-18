<?php
declare(strict_types=1);
require __DIR__.'/../api/_boot.php';
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
connect_session();
if(empty($_SESSION['admin_id'])){header('Location: /admin/',true,302);exit;}
$db=connect_db();
$esc=static fn($v)=>connect_escape((string)($v??''));
$error='';
function community_redirect(): never {header('Location: /admin/operations.php',true,303);exit;}
$exists=(bool)$db->query("SHOW TABLES LIKE 'app_users'")->fetch();
if($_SERVER['REQUEST_METHOD']==='POST'){
 connect_check_csrf();
 $action=(string)($_POST['action']??'');
 try{
  if($action==='install_community'){
   if($exists)throw new InvalidArgumentException('Community schema already installed.');
   $sql=file_get_contents(__DIR__.'/../db/community.sql');
   if(!$sql)throw new RuntimeException('Missing schema file.');
   foreach(preg_split('/;\s*(?:\r?\n|$)/',$sql) as $stmt){
    if(trim($stmt)!=='')$db->exec($stmt);
   }
   community_redirect();
  }
  if(!$exists)throw new InvalidArgumentException('Install community schema first.');
  if($action==='merchant_status'){
   $id=(int)($_POST['id']??0);$status=(string)($_POST['status']??'');
   if($id<1||!in_array($status,['approved','rejected'],true))throw new InvalidArgumentException('Invalid moderation action.');
   $stmt=$db->prepare("UPDATE merchant_submissions SET status=?,reviewed_at=UTC_TIMESTAMP() WHERE id=? AND status='pending'");
   $stmt->execute([$status,$id]);community_redirect();
  }
  if($action==='ticket_resolve'){
   $id=(int)($_POST['id']??0);if($id<1)throw new InvalidArgumentException('Invalid support request.');
   $stmt=$db->prepare("UPDATE support_tickets SET status='resolved' WHERE id=? AND status='open'");
   $stmt->execute([$id]);community_redirect();
  }
  if($action==='create_notification'){
   $title=trim((string)($_POST['title']??''));$body=trim((string)($_POST['body']??''));
   $target=trim((string)($_POST['url']??'/#offers'));
   if(mb_strlen($title)<3||mb_strlen($title)>140||mb_strlen($body)<5||mb_strlen($body)>250
     ||!preg_match('#^/(?!/)[A-Za-z0-9/?&=._%-]*$#D',$target))throw new InvalidArgumentException('Enter a valid message and same-origin target.');
   $stmt=$db->prepare("INSERT INTO notification_jobs(title,body,target_url,status) VALUES(?,?,?,'draft')");
   $stmt->execute([$title,$body,$target]);community_redirect();
  }
  if($action==='queue_notification'){
   $id=(int)($_POST['id']??0);if($id<1)throw new InvalidArgumentException('Invalid notification.');
   $stmt=$db->prepare("UPDATE notification_jobs SET status='queued' WHERE id=? AND status='draft'");
   $stmt->execute([$id]);community_redirect();
  }
  throw new InvalidArgumentException('Unsupported operation.');
 }catch(Throwable $e){$error=$e instanceof InvalidArgumentException?$e->getMessage():'Action failed. Review your database setup.';}
}
$members=0;$merchants=[];$tickets=[];$notices=[];
if($exists){
 try{
  $members=(int)$db->query('SELECT COUNT(*) FROM app_users')->fetchColumn();
  $merchants=$db->query("SELECT m.*,u.email FROM merchant_submissions m JOIN app_users u ON u.id=m.user_id ORDER BY m.created_at DESC LIMIT 40")->fetchAll();
  $tickets=$db->query("SELECT t.*,u.email FROM support_tickets t JOIN app_users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 40")->fetchAll();
  $notices=$db->query("SELECT id,title,body,target_url,status,created_at FROM notification_jobs ORDER BY created_at DESC LIMIT 25")->fetchAll();
 }catch(Throwable $e){$error='Community records unavailable. Check application schema.';}
}
?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Community Operations | VWEB.DEV Connect</title><link rel="stylesheet" href="/admin/style.css"></head>
<body><header><strong>VWEB.DEV CONNECT <small>COMMUNITY</small></strong><div><a class="btn secondary" href="/admin/">← CMS</a> <a class="btn secondary" href="/">Public site</a></div></header>
<main><div class="intro"><h1>Community & member operations</h1><p>Moderate community offers, respond to support requests and manage opt-in notifications. Legacy ISP and rewards operations are retired.</p></div>
<?php if($error):?><p class="error" role="alert"><?= $esc($error) ?></p><?php endif;?>
<?php if(!$exists):?><section class="panel narrow"><h2>Install community tables</h2><p>Installs member account, merchant submissions, support and opt-in notification tables only. No ISP or rewards system is initialized.</p>
<form method="post"><input type="hidden" name="csrf" value="<?= $esc(connect_csrf()) ?>"><input type="hidden" name="action" value="install_community"><button type="submit">Install community schema</button></form></section>
<?php else:?>
<div class="stats"><div class="stat"><span>Members</span><strong><?= $members ?></strong></div><div class="stat"><span>Pending submissions</span><strong><?= count(array_filter($merchants,static fn($x)=>$x['status']==='pending')) ?></strong></div><div class="stat"><span>Open support requests</span><strong><?= count(array_filter($tickets,static fn($x)=>$x['status']==='open')) ?></strong></div></div>
<section class="panel"><h2>Merchant submissions</h2><div class="table-scroll"><table><thead><tr><th>Business</th><th>Offer</th><th>Owner</th><th>Status</th></tr></thead><tbody>
<?php foreach($merchants as $m):?><tr><td><?= $esc($m['business_name']) ?></td><td><strong><?= $esc($m['offer_title']) ?></strong><br><?= $esc($m['description']) ?><br><a href="<?= $esc($m['website']) ?>" target="_blank" rel="noopener noreferrer">Official destination ↗</a></td><td><?= $esc($m['email']) ?></td><td><?= $esc($m['status']) ?>
<?php if($m['status']==='pending'):?><?php foreach(['approved','rejected'] as $status):?><form method="post"><input type="hidden" name="csrf" value="<?= $esc(connect_csrf()) ?>"><input type="hidden" name="action" value="merchant_status"><input type="hidden" name="id" value="<?= (int)$m['id'] ?>"><input type="hidden" name="status" value="<?= $status ?>"><button type="submit" class="secondary"><?= ucfirst($status) ?></button></form><?php endforeach;endif;?></td></tr><?php endforeach;?></tbody></table></div></section>
<section class="panel"><h2>Support requests</h2><div class="table-scroll"><table><thead><tr><th>Member</th><th>Subject</th><th>Message</th><th>Status</th></tr></thead><tbody>
<?php foreach($tickets as $t):?><tr><td><?= $esc($t['email']) ?></td><td><?= $esc($t['subject']) ?></td><td><?= nl2br($esc($t['message'])) ?></td><td><?= $esc($t['status']) ?>
<?php if($t['status']==='open'):?><form method="post"><input type="hidden" name="csrf" value="<?= $esc(connect_csrf()) ?>"><input type="hidden" name="action" value="ticket_resolve"><input type="hidden" name="id" value="<?= (int)$t['id'] ?>"><button type="submit" class="secondary">Resolve</button></form><?php endif;?></td></tr><?php endforeach;?></tbody></table></div></section>
<section class="panel"><h2>Opt-in notification drafts</h2><p class="muted">Users must opt in to push notifications. Queued messages are not sent unless the sender is independently configured and explicitly executed.</p>
<form method="post" class="form-grid"><input type="hidden" name="csrf" value="<?= $esc(connect_csrf()) ?>"><input type="hidden" name="action" value="create_notification">
<div><label for="notif-title">Title</label><input id="notif-title" name="title" minlength="3" maxlength="140" required></div>
<div><label for="notif-body">Message</label><input id="notif-body" name="body" minlength="5" maxlength="250" required></div>
<div><label for="notif-url">Internal target path</label><input id="notif-url" name="url" value="/#offers" maxlength="400" required></div>
<div class="full"><button type="submit">Save draft</button></div></form>
<div class="table-scroll"><table><thead><tr><th>Campaign</th><th>Target</th><th>Status</th></tr></thead><tbody>
<?php foreach($notices as $n):?><tr><td><strong><?= $esc($n['title']) ?></strong><br><?= $esc($n['body']) ?></td><td><?= $esc($n['target_url']) ?></td><td><?= $esc($n['status']) ?><?php if($n['status']==='draft'):?><form method="post"><input type="hidden" name="csrf" value="<?= $esc(connect_csrf()) ?>"><input type="hidden" name="action" value="queue_notification"><input type="hidden" name="id" value="<?= (int)$n['id'] ?>"><button type="submit" class="secondary">Queue</button></form><?php endif;?></td></tr><?php endforeach;?></tbody></table></div></section>
<?php endif;?></main></body></html>
