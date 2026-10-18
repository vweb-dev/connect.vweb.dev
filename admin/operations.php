<?php
declare(strict_types=1);
require __DIR__.'/../api/_boot.php';
header('X-Robots-Tag: noindex, nofollow, noarchive');header('Cache-Control: no-store');header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'self'; script-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
connect_session();
if(empty($_SESSION['admin_id'])){header('Location: /admin/',true,302);exit;}
function ops_csrf():string{return connect_csrf();}
function ops_redirect():never{header('Location: /admin/operations.php',true,303);exit;}
$db=connect_db();$error='';$notice='';
$hasTables=(bool)$db->query("SHOW TABLES LIKE 'app_users'")->fetch();
if($_SERVER['REQUEST_METHOD']==='POST') {
 connect_check_csrf();$action=(string)($_POST['action']??'');
 try{
  if($action==='install_schema'&&!$hasTables){
   $sql=file_get_contents(__DIR__.'/../db/phase3.sql');
   if(!$sql)throw new RuntimeException('Migration file missing');
   foreach(preg_split('/;\s*(?:\r?\n|$)/',$sql) as $statement){
    // SQL file contains single-line -- comments, valid for MySQL.
    if(trim($statement)!=='')$db->exec($statement);
   }
   // Two capped, anti-scam learning tasks; never rewarded affiliate clicks.
   $stmt=$db->prepare('INSERT INTO reward_tasks(title,description,question,answer_hash,points) VALUES(?,?,?,?,?)');
   $stmt->execute(['Secure websites','Learn to identify secure website connections.','Which protocol secures website traffic: HTTP or HTTPS?',
     hash('sha256','https'),20]);
   $stmt->execute(['Account safety','Learn a standard way to protect your online accounts.','What abbreviation is commonly used for two-factor authentication?',
     hash('sha256','2fa'),20]);
   ops_redirect();
  }
  if(!$hasTables)throw new RuntimeException('Install database extension first.');
  if($action==='approve_link'||$action==='reject_link'){
   $id=(int)($_POST['id']??0);if($id<1)throw new InvalidArgumentException('Invalid link.');
   $db->beginTransaction();
   $stmt=$db->prepare('SELECT id,user_id,pppoe_username,status FROM isp_account_links WHERE id=? FOR UPDATE');$stmt->execute([$id]);$link=$stmt->fetch();
   if(!$link)throw new InvalidArgumentException('Link not found.');
   if($action==='approve_link'){
    // Every approval MUST follow ISP-side account-ownership verification outside this UI.
    $stmt=$db->prepare("SELECT COUNT(*) FROM isp_account_links WHERE pppoe_username=? AND status='approved' AND user_id<>?");
    $stmt->execute([$link['pppoe_username'],$link['user_id']]);
    if((int)$stmt->fetchColumn()>0)throw new InvalidArgumentException('This PPPoE account is already linked to another member.');
   }
   $status=$action==='approve_link'?'approved':'rejected';
   $stmt=$db->prepare('UPDATE isp_account_links SET status=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?');
   $stmt->execute([$status,$id]);$db->commit();ops_redirect();
  }
  if($action==='merchant_status'){
   $id=(int)($_POST['id']??0);$status=(string)($_POST['status']??'');
   if($id<1||!in_array($status,['approved','rejected'],true))throw new InvalidArgumentException('Invalid status.');
   // Approval marks a submission reviewed; it does not auto-publish a sponsored campaign.
   $db->prepare('UPDATE merchant_submissions SET status=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?')->execute([$status,$id]);
   ops_redirect();
  }
  if($action==='ticket_resolve'){
   $id=(int)($_POST['id']??0);if($id<1)throw new InvalidArgumentException('Invalid ticket.');
   $db->prepare("UPDATE support_tickets SET status='resolved' WHERE id=?")->execute([$id]);ops_redirect();
  }
  if($action==='create_notification'){
   $title=trim((string)($_POST['title']??''));$body=trim((string)($_POST['body']??''));
   $url=trim((string)($_POST['url']??'/'));
   if(mb_strlen($title)<3||mb_strlen($title)>140||mb_strlen($body)<5||mb_strlen($body)>250
      ||!preg_match('#^/(?!/)[A-Za-z0-9/?&=._%-]*$#D',$url))throw new InvalidArgumentException('Use short copy and a safe same-origin path.');
   $db->prepare("INSERT INTO notification_jobs(title,body,target_url,status) VALUES(?,?,?,'draft')")->execute([$title,$body,$url]);
   ops_redirect();
  }
  if($action==='queue_notification'){
   $id=(int)($_POST['id']??0);
   $db->prepare("UPDATE notification_jobs SET status='queued' WHERE id=? AND status='draft'")->execute([$id]);
   ops_redirect();
  }
  if($action==='create_task'){
   $title=trim((string)($_POST['title']??''));$desc=trim((string)($_POST['description']??''));
   $question=trim((string)($_POST['question']??''));$answer=strtolower(trim((string)($_POST['answer']??'')));
   $points=(int)($_POST['points']??20);
   if(mb_strlen($title)<3||mb_strlen($title)>140||mb_strlen($desc)<5||mb_strlen($desc)>400
     ||mb_strlen($question)<5||mb_strlen($question)>240||strlen($answer)<2||strlen($answer)>100
     ||$points<1||$points>30)throw new InvalidArgumentException('Invalid learning task. Maximum 30 points/task.');
   $db->prepare('INSERT INTO reward_tasks(title,description,question,answer_hash,points) VALUES(?,?,?,?,?)')
     ->execute([$title,$desc,$question,hash('sha256',$answer),$points]);
   ops_redirect();
  }
  if($action==='toggle_task'){
   $id=(int)($_POST['id']??0);
   $db->prepare('UPDATE reward_tasks SET enabled=1-enabled WHERE id=?')->execute([$id]);ops_redirect();
  }
  throw new InvalidArgumentException('Unsupported operation.');
 }catch(Throwable $e){
  if($db->inTransaction())$db->rollBack();
  $error=$e instanceof InvalidArgumentException?$e->getMessage():'Operation failed. Verify schema and permissions.';
 }
}
$e=static fn($s)=>connect_escape((string)($s??''));
$links=[];$merchants=[];$tickets=[];$tasks=[];$notes=[];$jobs=[];$online=0;$memberCount=0;
if($hasTables){
 try{
  $links=$db->query("SELECT l.*,u.email FROM isp_account_links l JOIN app_users u ON u.id=l.user_id ORDER BY l.created_at DESC LIMIT 60")->fetchAll();
  $merchants=$db->query("SELECT m.*,u.email FROM merchant_submissions m JOIN app_users u ON u.id=m.user_id ORDER BY m.created_at DESC LIMIT 40")->fetchAll();
  $tickets=$db->query("SELECT t.*,u.email FROM support_tickets t JOIN app_users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 40")->fetchAll();
  $tasks=$db->query('SELECT id,title,points,enabled FROM reward_tasks ORDER BY id DESC LIMIT 50')->fetchAll();
  $notes=$db->query('SELECT * FROM notification_jobs ORDER BY created_at DESC LIMIT 30')->fetchAll();
  $jobs=$db->query('SELECT id,user_id,points,quota_mb,status,submitted_at FROM gateway_jobs ORDER BY id DESC LIMIT 30')->fetchAll();
  $memberCount=(int)$db->query('SELECT COUNT(*) FROM app_users')->fetchColumn();
  $online=(int)$db->query('SELECT COUNT(*) FROM isp_accounts WHERE is_online=1 AND collected_at > DATE_SUB(UTC_TIMESTAMP(),INTERVAL 15 MINUTE)')->fetchColumn();
 }catch(Throwable $ex){$error='Unable to read operational records.';}
}
?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Connect Operations | VWEB.DEV</title><link rel="stylesheet" href="/admin/style.css"></head><body>
<header><strong>VWEB.DEV CONNECT <small>OPERATIONS</small></strong><div><a class="btn secondary" href="/admin/">← CMS</a> <a class="btn secondary" href="/">Public site</a></div></header>
<main><div class="intro"><h1>Network, members & rewards.</h1><p>Protected operational tools. Nothing here changes an ISP router or existing PPPoE configurations.</p></div>
<?php if($error): ?><p class="error" role="alert"><?= $e($error) ?></p><?php endif; ?>
<?php if(!$hasTables): ?><section class="panel narrow"><h2>Initialize application database</h2><p class="muted">This creates user accounts, verified ISP account links, learning rewards, submissions, support, notifications and quota jobs. It does not touch MikroTik/RADIUS.</p>
<form method="post"><input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="action" value="install_schema"><button type="submit">Install application tables →</button></form></section>
<?php else: ?>
<div class="stats"><div class="stat"><span>Registered members</span><strong><?= $memberCount ?></strong></div><div class="stat"><span>Recently synced online PPPoE accounts</span><strong><?= $online ?></strong></div><div class="stat"><span>Pending ISP verification requests</span><strong><?= count(array_filter($links,fn($l)=>$l['status']==='pending')) ?></strong></div></div>
<section class="panel"><h2>PPPoE account linking</h2><p class="muted"><strong>Verify account ownership directly with the ISP's authorized subscriber records/contact before approval.</strong> A matching username alone is NOT evidence. These controls never read customer router passwords.</p>
<div class="table-scroll"><table><thead><tr><th>Claimed PPPoE username</th><th>PWA user email</th><th>Status</th><th>Action</th></tr></thead><tbody>
<?php foreach($links as $l): ?><tr><td><?= $e($l['pppoe_username']) ?></td><td><?= $e($l['email']) ?></td><td><?= $e($l['status']) ?></td>
<td><?php if($l['status']==='pending'): ?><?php foreach(['approve_link'=>'Approve after verification','reject_link'=>'Reject'] as $act=>$label): ?>
<form method="post"><input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="id" value="<?= (int)$l['id'] ?>"><input type="hidden" name="action" value="<?= $e($act) ?>"><button class="<?= $act==='reject_link'?'danger':'secondary' ?>" type="submit"><?= $e($label) ?></button></form> <?php endforeach; ?><?php endif; ?></td></tr><?php endforeach; ?></tbody></table></div></section>
<section class="panel"><h2>Local merchant submissions</h2><div class="table-scroll"><table><thead><tr><th>Business</th><th>Offer / link</th><th>Owner</th><th>Status / action</th></tr></thead><tbody>
<?php foreach($merchants as $m): ?><tr><td><?= $e($m['business_name']) ?></td>
<td><strong><?= $e($m['offer_title']) ?></strong><br><?= $e($m['description']) ?><br><a target="_blank" rel="noopener noreferrer" href="<?= $e($m['website']) ?>">Merchant destination ↗</a></td><td><?= $e($m['email']) ?></td>
<td><?= $e($m['status']) ?><?php if($m['status']==='pending'): ?><?php foreach(['approved','rejected'] as $state): ?>
<form method="post"><input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="action" value="merchant_status"><input type="hidden" name="id" value="<?= (int)$m['id'] ?>"><input type="hidden" name="status" value="<?= $e($state) ?>"><button type="submit" class="secondary"><?= ucfirst($state) ?></button></form><?php endforeach; ?><?php endif; ?></td></tr><?php endforeach; ?></tbody></table></div></section>
<section class="panel"><h2>Customer support requests</h2><div class="table-scroll"><table><thead><tr><th>User</th><th>Subject</th><th>Message</th><th>Status</th></tr></thead><tbody><?php foreach($tickets as $t): ?><tr>
<td><?= $e($t['email']) ?></td><td><?= $e($t['subject']) ?></td><td><?= nl2br($e($t['message'])) ?></td><td><?= $e($t['status']) ?><?php if($t['status']==='open'): ?><form method="post"><input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="action" value="ticket_resolve"><input type="hidden" name="id" value="<?= (int)$t['id'] ?>"><button type="submit" class="secondary">Resolve</button></form><?php endif; ?></td></tr><?php endforeach; ?></tbody></table></div></section>
<div class="grid">
<section class="panel"><h2>Add educational reward</h2><p class="muted">Rewards must not require affiliate clicks, purchases or marketing consent. Daily server cap: 60 points per person.</p><form method="post" class="form-grid">
<input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="action" value="create_task">
<div class="full"><label for="rt">Title</label><input id="rt" name="title" required maxlength="140"></div>
<div class="full"><label for="rd">Description</label><input id="rd" name="description" required maxlength="400"></div>
<div class="full"><label for="rq">Question</label><input id="rq" name="question" required maxlength="240"></div>
<div><label for="ra">Expected answer</label><input id="ra" name="answer" required maxlength="100" autocomplete="off"></div>
<div><label for="rp">Reward points</label><input id="rp" type="number" name="points" min="1" max="30" value="20"></div>
<div class="full"><button type="submit">Add learning task</button></div></form>
<?php foreach($tasks as $t): ?><div class="notice"><strong><?= $e($t['title']) ?></strong> — <?= (int)$t['points'] ?> pts (<?= $t['enabled']?'Enabled':'Disabled' ?>)
<form method="post"><input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="action" value="toggle_task"><input type="hidden" name="id" value="<?= (int)$t['id'] ?>"><button type="submit" class="secondary">Toggle</button></form></div><?php endforeach; ?></section>
<section class="panel"><h2>Push notification campaign</h2><p class="muted">Campaigns start as drafts. Sending requires configured VAPID keys and installed free open-source Web Push library. Only subscribed opt-in accounts are eligible.</p>
<form method="post"><input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="action" value="create_notification">
<label for="nt">Title</label><input id="nt" name="title" maxlength="140" required><label for="nb">Notification message</label><textarea id="nb" name="body" maxlength="250" required rows="3"></textarea>
<label for="nu">Internal target path</label><input id="nu" name="url" value="/#offers" maxlength="400"><div class="actions"><button type="submit">Save notification draft</button></div></form>
<?php foreach($notes as $n): ?><div class="notice"><strong><?= $e($n['title']) ?></strong> (<?= $e($n['status']) ?>) — sent <?= (int)$n['delivered'] ?>
<?php if($n['status']==='draft'): ?><form method="post"><input type="hidden" name="csrf" value="<?= $e(ops_csrf()) ?>"><input type="hidden" name="action" value="queue_notification"><input type="hidden" name="id" value="<?= (int)$n['id'] ?>"><button type="submit" class="secondary">Queue after review</button></form><?php endif; ?></div><?php endforeach; ?></section>
</div>
<section class="panel"><h2>Internet quota requests</h2><p class="muted">Wallet points are not internet MB. Voucher requests stay pending until a configured ISP-authorized guest gateway successfully issues them. No PPPoE subscriber quota is modified.</p>
<div class="table-scroll"><table><thead><tr><th>Job ID</th><th>Member</th><th>Requested</th><th>Status</th><th>Created</th></tr></thead><tbody>
<?php foreach($jobs as $job): ?><tr><td><?= (int)$job['id'] ?></td><td>#<?= (int)$job['user_id'] ?></td><td><?= (int)$job['quota_mb'] ?> MB / <?= (int)$job['points'] ?> pts</td><td><?= $e($job['status']) ?></td><td><?= $e($job['submitted_at']) ?></td></tr><?php endforeach; ?>
</tbody></table></div></section>
<?php endif; ?>
</main><footer>VWEB.DEV Connect · Authorized first-party operations only</footer></body></html>