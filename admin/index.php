<?php
declare(strict_types=1);
require __DIR__ . '/../api/_boot.php';
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
connect_session();
$error='';$notice='';$db=null;$hasAdmin=false;$logged=false;$configReady=false;
try {
    $cfg=connect_config();
    $db=connect_db();
    $configReady=true;
    $table=$db->query("SHOW TABLES LIKE 'admin_users'")->fetch();
    if ($table) $hasAdmin=(int)$db->query("SELECT COUNT(*) FROM admin_users")->fetchColumn()>0;
} catch (Throwable $e) {
    $error='Backend not configured or database unavailable. Follow docs/phase2-setup.md and place your secret config OUTSIDE public_html.';
}
function admin_redirect(string $query=''): never {
    header('Location: /admin/' . ($query === '' ? '' : '?' . $query),true,303);
    exit;
}
function admin_date(string $date): ?string {
    if ($date==='') return null;
    $dt=DateTimeImmutable::createFromFormat('!Y-m-d\TH:i',$date,new DateTimeZone('UTC'));
    if (!$dt || $dt->format('Y-m-d\TH:i')!==$date) throw new InvalidArgumentException('Invalid UTC date/time.');
    return $dt->format('Y-m-d H:i:s');
}
if ($configReady && $_SERVER['REQUEST_METHOD']==='POST') {
    connect_check_csrf();
    $action=(string)($_POST['action']??'');
    try {
        if ($action==='install' && !$hasAdmin) {
            $token=(string)($_POST['setup_token']??'');
            $username=trim((string)($_POST['username']??''));
            $pass=(string)($_POST['password']??'');
            if (strlen((string)$cfg['setup_token'])<32 || str_contains((string)$cfg['setup_token'],'CHANGE_ME') || !hash_equals((string)$cfg['setup_token'],$token)) {
                throw new InvalidArgumentException('Invalid setup token.');
            }
            if (!preg_match('/^[A-Za-z0-9._-]{3,40}$/',$username)) {
                throw new InvalidArgumentException('Username: 3–40 letters, numbers, underscore, period or hyphen.');
            }
            if (strlen($pass)<12 || strlen($pass)>72) throw new InvalidArgumentException('Password must be 12–72 bytes long.');
            $sql=file_get_contents(__DIR__.'/../db/schema.sql');
            if ($sql===false) throw new RuntimeException('Schema missing.');
            foreach (preg_split('/;\s*(?:\r?\n|$)/',$sql) as $statement) {
                if (trim($statement)!=='') $db->exec($statement);
            }
            if ((int)$db->query('SELECT COUNT(*) FROM admin_users')->fetchColumn()!==0) {
                throw new RuntimeException('Administrator already exists.');
            }
            $stmt=$db->prepare('INSERT INTO admin_users(username,password_hash) VALUES(?,?)');
            $stmt->execute([$username,password_hash($pass,PASSWORD_DEFAULT)]);
            session_regenerate_id(true);
            $_SESSION['admin_id']=(int)$db->lastInsertId();
            admin_redirect('created=1');
        }
        if ($action==='login' && $hasAdmin && empty($_SESSION['admin_id'])) {
            $fails=(int)($_SESSION['fails']??0);
            $until=(int)($_SESSION['lock_until']??0);
            if ($fails>=6 && time()<$until) throw new InvalidArgumentException('Too many attempts. Try later.');
            $stmt=$db->prepare('SELECT id,password_hash FROM admin_users WHERE username=? LIMIT 1');
            $stmt->execute([trim((string)($_POST['username']??''))]);
            $user=$stmt->fetch();
            $correct=$user && password_verify((string)($_POST['password']??''),$user['password_hash']);
            if (!$correct) {
                usleep(300000);
                $_SESSION['fails']=$fails+1;
                if ($_SESSION['fails']>=6) $_SESSION['lock_until']=time()+900;
                throw new InvalidArgumentException('Invalid username or password.');
            }
            session_regenerate_id(true);
            $_SESSION['admin_id']=(int)$user['id'];unset($_SESSION['fails'],$_SESSION['lock_until']);
            admin_redirect();
        }
        if ($action==='logout') {
            $_SESSION=[];session_regenerate_id(true);admin_redirect();
        }
        if (empty($_SESSION['admin_id']) || !$hasAdmin) throw new RuntimeException('Please sign in.');
        if ($action==='save') {
            $id=(int)($_POST['id']??0);
            $type=trim((string)($_POST['type']??''));
            $title=trim((string)($_POST['title']??''));
            $summary=trim((string)($_POST['summary']??''));
            $brand=trim((string)($_POST['brand']??''));
            $category=trim((string)($_POST['category']??'General'));
            $code=trim((string)($_POST['code']??''));
            $url=trim((string)($_POST['url']??''));
            $status=(string)($_POST['status']??'draft');
            $placement=(string)($_POST['placement']??'offers');
            $priority=(int)($_POST['priority']??0);
            if (!in_array($type,['coupon','news','ad'],true) || !in_array($status,['draft','published'],true)
                 || !in_array($placement,['home','offers','news'],true)) throw new InvalidArgumentException('Invalid content settings.');
            if ($title===''||strlen($title)>500||$summary===''||strlen($summary)>8000) {
                throw new InvalidArgumentException('Title and summary required; keep content concise.');
            }
            if (strlen($brand)>300 || strlen($category)>240 || strlen($code)>240
                 || strlen($url)>1024 || !connect_safe_url($url)) {
                throw new InvalidArgumentException('Use valid categories, short coupon codes and a public HTTPS destination.');
            }
            if ($priority < -100 || $priority > 100) throw new InvalidArgumentException('Priority must be between -100 and 100.');
            $start=admin_date((string)($_POST['starts_at']??''));
            $end=admin_date((string)($_POST['expires_at']??''));
            if ($start!==null && $end!==null && strcmp($end,$start)<=0) {
                throw new InvalidArgumentException('Expiry must be later than start.');
            }
            $params=[$type,$title,$summary,$brand,$category,$code,$url,$placement,$priority,$status,$start,$end];
            if ($id>0) {
                $params[]=$id;
                $stmt=$db->prepare("UPDATE content_items SET type=?,title=?,summary=?,brand=?,category=?,code=?,url=?,placement=?,priority=?,status=?,starts_at=?,expires_at=? WHERE id=?");
                $stmt->execute($params);
                if ($stmt->rowCount()===0) {
                    $check=$db->prepare('SELECT id FROM content_items WHERE id=?');$check->execute([$id]);
                    if (!$check->fetch()) throw new RuntimeException('Record not found.');
                }
            } else {
                $stmt=$db->prepare("INSERT INTO content_items(type,title,summary,brand,category,code,url,placement,priority,status,starts_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
                $stmt->execute($params);
            }
            admin_redirect('saved=1');
        }
        if ($action==='delete') {
            $id=(int)($_POST['id']??0);
            if ($id<=0) throw new InvalidArgumentException('Invalid record.');
            $stmt=$db->prepare('DELETE FROM content_items WHERE id=?');
            $stmt->execute([$id]);
            admin_redirect('deleted=1');
        }
        throw new InvalidArgumentException('Unknown request.');
    } catch (Throwable $e) {
        $error=$e instanceof InvalidArgumentException?$e->getMessage():'Operation failed; check database availability.';
    }
}
$logged=$configReady && $hasAdmin && !empty($_SESSION['admin_id']);
$items=[];$edit=null;$stats=['coupon'=>0,'news'=>0,'ad'=>0];$totalClicks=0;
if ($logged) {
    try {
        $items=$db->query("SELECT c.*,COALESCE(s.clicks,0) AS clicks
          FROM content_items c LEFT JOIN campaign_stats s ON s.campaign_id=c.id
          ORDER BY c.updated_at DESC LIMIT 200")->fetchAll();
        foreach ($items as $item) {if (isset($stats[$item['type']]))$stats[$item['type']]++;}
        $totalClicks=(int)$db->query('SELECT COALESCE(SUM(clicks),0) FROM campaign_stats')->fetchColumn();
        $editId=(int)($_GET['edit']??0);
        if ($editId>0) {
            $stmt=$db->prepare('SELECT * FROM content_items WHERE id=?');
            $stmt->execute([$editId]);$edit=$stmt->fetch()?:null;
        }
    } catch (Throwable $e) {$error='Unable to load content records.';}
}
$e=static fn($value):string=>connect_escape((string)($value??''));
function admin_val(?array $row,string $key,string $default=''):string {
    return connect_escape((string)($row[$key]??$default));
}
function admin_date_value(?array $row,string $key):string {
    $value=(string)($row[$key]??'');
    return connect_escape($value!==''?str_replace(' ','T',substr($value,0,16)):'');
}
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Connect Content Manager | VWEB.DEV</title><link rel="stylesheet" href="/admin/style.css"></head><body>
<header><div><strong>VWEB.DEV CONNECT</strong><br><small>FIRST-PARTY CONTENT & AD MANAGER</small></div>
<div><a href="/" class="btn secondary">← Public PWA</a>
<?php if($logged): ?><form method="post" action="/admin/" class="inline-form"><input type="hidden" name="csrf" value="<?= $e(connect_csrf()) ?>"><input type="hidden" name="action" value="logout"><button class="secondary" type="submit">Sign out</button></form><?php endif; ?></div></header>
<main>
<?php if ($error): ?><div class="error" role="alert"><?= $e($error) ?></div><?php endif; ?>
<?php if(isset($_GET['saved'])): ?><div class="notice">Content saved.</div><?php endif; ?>
<?php if(isset($_GET['deleted'])): ?><div class="notice">Content deleted.</div><?php endif; ?>
<?php if(isset($_GET['created'])): ?><div class="notice">Administrator created. Rotate/remove setup token in your private configuration.</div><?php endif; ?>
<?php if (!$configReady): ?>
<section class="panel narrow"><h1>Backend setup required</h1><p class="muted">For security, database credentials must live one directory above public_html, not inside GitHub. Follow <code>docs/phase2-setup.md</code> in the repository.</p></section>
<?php elseif (!$hasAdmin): ?>
<section class="panel narrow"><h1>One-time administrator setup</h1><p class="muted">Requires the private setup token from your server-only configuration. Only the first administrator can be provisioned here.</p>
<form method="post" action="/admin/"><input type="hidden" name="csrf" value="<?= $e(connect_csrf()) ?>"><input type="hidden" name="action" value="install">
<label for="setup-token">Private setup token</label><input id="setup-token" type="password" name="setup_token" required autocomplete="off">
<label for="setup-user">Admin username</label><input id="setup-user" name="username" required minlength="3" maxlength="40" autocomplete="username">
<label for="setup-password">Strong admin password (12+ characters)</label><input id="setup-password" type="password" name="password" required minlength="12" autocomplete="new-password">
<div class="actions"><button type="submit">Initialize database & create admin →</button></div></form></section>
<?php elseif (!$logged): ?>
<section class="panel narrow"><h1>Administrator sign in</h1><p class="muted">Only authorized VWEB.DEV editors can publish content.</p>
<form method="post" action="/admin/"><input type="hidden" name="csrf" value="<?= $e(connect_csrf()) ?>"><input type="hidden" name="action" value="login">
<label for="login-user">Username</label><input id="login-user" name="username" required autocomplete="username">
<label for="login-pass">Password</label><input id="login-pass" type="password" name="password" required autocomplete="current-password">
<div class="actions"><button type="submit">Sign in →</button></div></form></section>
<?php else: ?>
<div class="intro"><div class="muted">ADMIN / CONTENT</div><h1>Manage content & promotions.</h1><p>Draft and publish verified coupons, local updates and first-party advertising cards. Published content appears in the PWA automatically.</p></div>
<div class="stats">
<div class="stat"><span>Coupons</span><strong><?= $stats['coupon'] ?></strong></div>
<div class="stat"><span>News entries</span><strong><?= $stats['news'] ?></strong></div>
<div class="stat"><span>Advertising campaigns</span><strong><?= $stats['ad'] ?></strong></div>
</div>
<div class="grid">
<section class="panel"><h2><?= $edit?'Edit record #'.$e($edit['id']):'Create a new entry' ?></h2>
<p class="muted">Only mark verified content as Published. Schedule uses UTC time. Expired items disappear automatically.</p>
<form method="post" action="/admin/" class="form-grid">
<input type="hidden" name="csrf" value="<?= $e(connect_csrf()) ?>"><input type="hidden" name="action" value="save">
<input type="hidden" name="id" value="<?= admin_val($edit,'id','0') ?>">
<div><label for="type">Content type</label><select name="type" id="type"><?php foreach(['coupon'=>'Coupon / Deal','news'=>'News / Update','ad'=>'Sponsored ad'] as $k=>$label): ?><option value="<?= $e($k) ?>" <?= ($edit['type']??'coupon')===$k?'selected':'' ?>><?= $e($label) ?></option><?php endforeach; ?></select></div>
<div><label for="status">Publication</label><select name="status" id="status"><option value="draft" <?= ($edit['status']??'draft')==='draft'?'selected':'' ?>>Draft</option><option value="published" <?= ($edit['status']??'draft')==='published'?'selected':'' ?>>Published</option></select></div>
<div class="full"><label for="title">Title</label><input id="title" name="title" maxlength="160" required value="<?= admin_val($edit,'title') ?>"></div>
<div class="full"><label for="summary">Original description / news summary</label><textarea id="summary" name="summary" rows="4" maxlength="3000" required><?= admin_val($edit,'summary') ?></textarea></div>
<div><label for="brand">Merchant, publisher or sponsor</label><input id="brand" name="brand" maxlength="100" value="<?= admin_val($edit,'brand') ?>"></div>
<div><label for="category">Category</label><input id="category" name="category" maxlength="80" value="<?= admin_val($edit,'category','General') ?>"></div>
<div class="full"><label for="url">Verified destination URL (HTTPS)</label><input id="url" name="url" type="url" maxlength="1024" required placeholder="https://..." value="<?= admin_val($edit,'url') ?>"></div>
<div><label for="code">Optional verified coupon code</label><input id="code" name="code" maxlength="80" value="<?= admin_val($edit,'code') ?>"></div>
<div><label for="placement">Placement</label><select name="placement" id="placement"><?php foreach(['home'=>'Home','offers'=>'Offers','news'=>'News'] as $k=>$label): ?><option value="<?= $e($k) ?>" <?= ($edit['placement']??'offers')===$k?'selected':'' ?>><?= $e($label) ?></option><?php endforeach; ?></select></div>
<div><label for="priority">Display priority (-100 to 100)</label><input id="priority" type="number" min="-100" max="100" name="priority" value="<?= admin_val($edit,'priority','0') ?>"></div>
<div><label for="starts">Starts at (UTC, optional)</label><input id="starts" name="starts_at" type="datetime-local" value="<?= admin_date_value($edit,'starts_at') ?>"></div>
<div><label for="expires">Expires at (UTC, optional)</label><input id="expires" name="expires_at" type="datetime-local" value="<?= admin_date_value($edit,'expires_at') ?>"></div>
<div class="actions full"><button type="submit"><?= $edit?'Save changes':'Create entry' ?> →</button><?php if ($edit): ?><a class="btn secondary" href="/admin/">Cancel edit</a><?php endif; ?></div>
</form></section>
<section class="panel"><h2>Publishing guide</h2>
<p class="muted">Your own ads manager runs without Google AdSense or AdMob. Every sponsored placement should be clearly marked, shown in moderation and linked only to verified landing pages.</p>
<h3>Coupon rules</h3><p>Never invent promo codes. Include expiry when known, real merchant details, and current conditions. Affiliate links need disclosure.</p>
<h3>News rules</h3><p>Use original short summaries and link to the authoritative source. Don't copy full copyrighted articles or publish unverified local claims.</p>
<h3>Advertising rules</h3><p>Use ad type for your ASTER, Shopify, Hostinger or eligible local sponsors. Home placement is supported. Redirect counts are rough click indicators, not verified sales.</p>
<div class="notice">Recorded sponsor-link clicks: <strong><?= $totalClicks ?></strong> (approximate).</div>
<h3>Customer data</h3><p>Do not enter PPPoE passwords, device admin credentials, customer profiles or ISP billing records into this CMS.</p>
</section></div>
<section class="panel"><h2>Content library</h2><div class="table-scroll"><table>
<thead><tr><th>Title / category</th><th>Type</th><th>State</th><th>Schedule (UTC)</th><th>Ad clicks</th><th>Actions</th></tr></thead>
<tbody><?php foreach($items as $item): ?><tr>
<td><strong><?= $e($item['title']) ?></strong><br><span class="muted"><?= $e($item['brand']) ?> · <?= $e($item['category']) ?></span></td>
<td><?= $e($item['type']) ?></td><td><?= $e($item['status']) ?></td>
<td><?= $e($item['starts_at']?:'Immediately') ?><br><?= $e($item['expires_at']?:'No expiry') ?></td>
<td><?= $item['type']==='ad'?(int)$item['clicks']:'—' ?></td>
<td><a class="btn secondary" href="/admin/?edit=<?= (int)$item['id'] ?>">Edit</a>
<form method="post" action="/admin/"><input type="hidden" name="csrf" value="<?= $e(connect_csrf()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$item['id'] ?>"><button type="submit" class="danger">Delete</button></form></td>
</tr><?php endforeach; ?><?php if(!$items): ?><tr><td colspan="6">Nothing published yet. Add your first coupon, news update or sponsored card.</td></tr><?php endif; ?></tbody>
</table></div></section>
<?php endif; ?>
</main><footer>VWEB.DEV Connect · Self-hosted first-party publishing · No third-party ad network</footer>
</body></html>