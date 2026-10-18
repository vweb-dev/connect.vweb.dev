<?php
declare(strict_types=1);
require __DIR__.'/../api/_boot.php';
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; script-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
connect_session();
if(empty($_SESSION['admin_id'])){header('Location: /admin/',true,302);exit;}
$db=connect_db();$error='';
$hasTable=(bool)$db->query("SHOW TABLES LIKE 'entertainment_items'")->fetch();
function media_redirect(string $extra=''): never {
 header('Location: /admin/media.php'.($extra?'?'.$extra:''),true,303);exit;
}
function media_validate(string $text,int $max): string {
 $text=trim($text);
 if (strlen($text)>$max)throw new InvalidArgumentException('A text field is too long.');
 return $text;
}
function media_authorized_url(string $url,string $provider): bool {
 if(!connect_safe_url($url))return false;
 $host=strtolower((string)parse_url($url,PHP_URL_HOST));
 if($provider==='youtube')return in_array($host,['youtube.com','www.youtube.com','youtu.be','m.youtube.com'],true);
 if($provider==='spotify')return $host==='open.spotify.com';
 if($provider==='twitch')return in_array($host,['twitch.tv','www.twitch.tv'],true);
 return true;
}
if($_SERVER['REQUEST_METHOD']==='POST'){
 connect_check_csrf();
 $action=(string)($_POST['action']??'');
 try {
  if($action==='install'&&!$hasTable){
    // Only the media table is created here; the original CMS is untouched.
    $sql=file_get_contents(__DIR__.'/../db/entertainment.sql');
    if(!$sql)throw new RuntimeException('Entertainment schema missing.');
    foreach(preg_split('/;\s*(?:\r?\n|$)/',$sql) as $statement)
      if(trim($statement)!=='')$db->exec($statement);
    // Extend existing first-party ad placement enum without dropping campaigns.
    if($db->query("SHOW TABLES LIKE 'content_items'")->fetch()){
      $db->exec("ALTER TABLE content_items MODIFY placement ENUM('home','offers','news','tv','watch','listen','play') NOT NULL DEFAULT 'offers'");
    }
    media_redirect('installed=1');
  }
  if(!$hasTable)throw new InvalidArgumentException('Initialize the media catalog first.');
  if($action==='delete'){
    $id=(int)($_POST['id']??0);
    if($id<1)throw new InvalidArgumentException('Invalid ID.');
    $db->prepare('DELETE FROM entertainment_items WHERE id=?')->execute([$id]);
    media_redirect('deleted=1');
  }
  if($action==='save'){
    $id=(int)($_POST['id']??0);
    $kind=(string)($_POST['kind']??'');
    $provider=(string)($_POST['provider']??'');
    $title=media_validate((string)($_POST['title']??''),160);
    $summary=media_validate((string)($_POST['summary']??''),450);
    $category=media_validate((string)($_POST['category']??'General'),70);
    $country=media_validate((string)($_POST['country']??''),10);
    $lang=media_validate((string)($_POST['language']??''),40);
    $source=media_validate((string)($_POST['source_name']??''),90);
    $url=media_validate((string)($_POST['source_url']??''),1024);
    $external=media_validate((string)($_POST['external_id']??''),100);
    $poster=(string)($_POST['poster_style']??'learning');
    $permission=(string)($_POST['permission']??'');
    $note=media_validate((string)($_POST['permission_note']??''),500);
    $badge=media_validate((string)($_POST['badge']??'Official source'),70);
    $status=(string)($_POST['status']??'draft');
    $order=(int)($_POST['display_order']??0);
    $confirmed=($_POST['rights_confirmed']??'')==='yes';
    if(!in_array($kind,['tv','watch','podcast','discover'],true) ||
       !in_array($provider,['youtube','spotify','external','twitch','hls'],true) ||
       !in_array($poster,['news','space','culture','learning','entertainment'],true) ||
       !in_array($permission,['official_link','official_embed','licensed_stream'],true) ||
       !in_array($status,['draft','published'],true))
       throw new InvalidArgumentException('Invalid item type or status.');
    if(!$title||!$summary||!$source||!$category||!media_authorized_url($url,$provider))
       throw new InvalidArgumentException('Title, source, valid HTTPS provider URL and summary are required.');
    if($order < -100 || $order > 100)throw new InvalidArgumentException('Order must be -100 to 100.');
    if($provider==='youtube'&&!preg_match('/^[A-Za-z0-9_-]{11}$/D',$external))
       throw new InvalidArgumentException('YouTube requires its exact 11-character video ID.');
    if($provider==='spotify'&&!preg_match('/^[A-Za-z0-9]{22}$/D',$external))
       throw new InvalidArgumentException('Spotify requires its exact 22-character show ID.');
    if($provider==='twitch'&&!preg_match('/^[A-Za-z0-9_]{1,40}$/D',$external))
       throw new InvalidArgumentException('Twitch requires an official channel name.');
    if($provider==='hls'&&$permission!=='licensed_stream')
       throw new InvalidArgumentException('HLS needs explicit licensed-stream approval.');
    if($permission==='official_link'&&$provider!=='external')
       throw new InvalidArgumentException('For non-embeddable providers use External.');
    if($status==='published'&&(!$confirmed||strlen($note)<15))
       throw new InvalidArgumentException('Verify source and rights, provide a meaningful note and check confirmation before publishing.');
    $row=[$kind,$provider,$title,$summary,$category,$country,$lang,$source,$url,$external,$poster,$permission,$note,$badge,$order,$status,
      $confirmed?gmdate('Y-m-d H:i:s'):null];
    if($id>0){
      $row[]=$id;
      $stmt=$db->prepare("UPDATE entertainment_items SET kind=?,provider=?,title=?,summary=?,category=?,country=?,language=?,source_name=?,
         source_url=?,external_id=?,poster_style=?,permission=?,permission_note=?,badge=?,display_order=?,status=?,checked_at=? WHERE id=?");
      $stmt->execute($row);
    } else {
      $stmt=$db->prepare("INSERT INTO entertainment_items
        (kind,provider,title,summary,category,country,language,source_name,source_url,external_id,poster_style,
         permission,permission_note,badge,display_order,status,checked_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
      $stmt->execute($row);
    }
    media_redirect('saved=1');
  }
  throw new InvalidArgumentException('Unsupported operation.');
 }catch(Throwable $e){
   $error=$e instanceof InvalidArgumentException?$e->getMessage():'Media database operation failed. Verify Hostinger MySQL settings.';
 }
}
$entries=[];$edit=null;
if($hasTable){
 try{
  $entries=$db->query("SELECT id,kind,provider,title,source_name,status,checked_at,source_url
    FROM entertainment_items ORDER BY updated_at DESC LIMIT 150")->fetchAll();
  $editId=(int)($_GET['edit']??0);
  if($editId>0){$stmt=$db->prepare('SELECT * FROM entertainment_items WHERE id=?');
    $stmt->execute([$editId]);$edit=$stmt->fetch()?:null;}
 }catch(Throwable $e){$error='Unable to read media catalog.';}
}
$esc=static fn($s):string=>connect_escape((string)($s??''));
function media_field(?array $edit,string $key,string $default=''):string {
 return connect_escape((string)($edit[$key]??$default));
}
?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Entertainment CMS | VWEB.DEV Connect</title><link rel="stylesheet" href="/admin/style.css"></head><body>
<header><div><strong>VWEB.DEV CONNECT</strong><br><small>ENTERTAINMENT CATALOG MANAGER</small></div><div><a class="btn secondary" href="/admin/">← Ads & Content</a> <a class="btn secondary" href="/">Public PWA ↗</a></div></header>
<main><div class="intro"><h1>Curate your media.</h1><p>Only publish independently verified official embeds, official links or licensed streams. The app never hosts the media files.</p></div>
<?php if($error):?><div class="error" role="alert"><?=$esc($error)?></div><?php endif;?>
<?php if(isset($_GET['saved'])):?><div class="notice">Catalog item saved.</div><?php endif;?>
<?php if(isset($_GET['installed'])):?><div class="notice">Entertainment table created. Publish your first verified listing.</div><?php endif;?>
<?php if(isset($_GET['deleted'])):?><div class="notice">Catalog item deleted.</div><?php endif;?>
<?php if(!$hasTable):?>
<section class="panel narrow"><h2>Install entertainment catalog</h2><p>Creates one MySQL table. Existing users, coupons, network accounts and PPPoE settings are unchanged.</p><form method="post"><input type="hidden" name="csrf" value="<?=$esc(connect_csrf())?>"><input type="hidden" name="action" value="install"><button type="submit">Initialize entertainment catalog →</button></form></section>
<?php else:?>
<div class="grid">
<section class="panel"><h2><?=$edit?'Edit item #'.$esc($edit['id']):'Add verified content'?></h2><form method="post" class="form-grid">
<input type="hidden" name="csrf" value="<?=$esc(connect_csrf())?>"><input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?=media_field($edit,'id','0')?>">
<div><label for="mkind">Section</label><select id="mkind" name="kind"><?php foreach(['tv'=>'TV','watch'=>'Watch','podcast'=>'Podcast','discover'=>'Discover'] as $key=>$label):?><option value="<?=$esc($key)?>" <?=($edit['kind']??'tv')===$key?'selected':''?>><?=$esc($label)?></option><?php endforeach;?></select></div>
<div><label for="mprov">Provider</label><select id="mprov" name="provider"><?php foreach(['external'=>'Official external link','youtube'=>'YouTube official embed','spotify'=>'Spotify show embed','twitch'=>'Twitch channel embed','hls'=>'Licensed HLS (browser-native)'] as $key=>$label):?><option value="<?=$esc($key)?>" <?=($edit['provider']??'external')===$key?'selected':''?>><?=$esc($label)?></option><?php endforeach;?></select></div>
<div class="full"><label for="mtitle">Display title</label><input id="mtitle" name="title" maxlength="160" required value="<?=media_field($edit,'title')?>"></div>
<div class="full"><label for="msummary">Original summary</label><textarea id="msummary" name="summary" maxlength="450" rows="3" required><?=media_field($edit,'summary')?></textarea></div>
<div><label for="mcategory">Category</label><input id="mcategory" name="category" maxlength="70" required value="<?=media_field($edit,'category','News')?>"></div>
<div><label for="msource">Official source / publisher</label><input id="msource" name="source_name" maxlength="90" required value="<?=media_field($edit,'source_name')?>"></div>
<div class="full"><label for="murl">Official HTTPS URL</label><input id="murl" name="source_url" type="url" maxlength="1024" required placeholder="https://www.youtube.com/watch?v=..." value="<?=media_field($edit,'source_url')?>"></div>
<div><label for="mid">Provider video ID / show ID / channel</label><input id="mid" name="external_id" maxlength="100" value="<?=media_field($edit,'external_id')?>"></div>
<div><label for="mbadge">Public badge</label><input id="mbadge" name="badge" maxlength="70" value="<?=media_field($edit,'badge','Official source')?>"></div>
<div><label for="mcountry">Country code</label><input id="mcountry" name="country" maxlength="10" value="<?=media_field($edit,'country')?>"></div>
<div><label for="mlanguage">Language</label><input id="mlanguage" name="language" maxlength="40" value="<?=media_field($edit,'language','English')?>"></div>
<div><label for="mposter">Card art style</label><select id="mposter" name="poster_style"><?php foreach(['news'=>'News','space'=>'Space','culture'=>'Culture','learning'=>'Learning','entertainment'=>'Entertainment'] as $key=>$label):?><option value="<?=$esc($key)?>" <?=($edit['poster_style']??'learning')===$key?'selected':''?>><?=$esc($label)?></option><?php endforeach;?></select></div>
<div><label for="morder">Display priority (-100 to 100)</label><input id="morder" name="display_order" type="number" min="-100" max="100" value="<?=media_field($edit,'display_order','0')?>"></div>
<div><label for="mpermission">Rights / playback permission</label><select id="mpermission" name="permission"><?php foreach(['official_link'=>'Official site link only','official_embed'=>'Publisher permits official embed','licensed_stream'=>'Licensed direct stream'] as $key=>$label):?><option value="<?=$esc($key)?>" <?=($edit['permission']??'official_link')===$key?'selected':''?>><?=$esc($label)?></option><?php endforeach;?></select></div>
<div><label for="mstatus">Status</label><select id="mstatus" name="status"><option value="draft" <?=($edit['status']??'draft')==='draft'?'selected':''?>>Draft</option><option value="published" <?=($edit['status']??'draft')==='published'?'selected':''?>>Published</option></select></div>
<div class="full"><label for="mnote">Verification note (publisher link/license evidence)</label><textarea id="mnote" name="permission_note" maxlength="500" rows="3" placeholder="Confirmed from official publisher’s embed/share settings on YYYY-MM-DD…"><?=media_field($edit,'permission_note')?></textarea></div>
<div class="full"><label class="toggle-line"><input type="checkbox" name="rights_confirmed" value="yes"> I have checked this source and possess permission to list/embed it as selected.</label></div>
<div class="full actions"><button type="submit">Save verified catalog entry ↗</button><?php if($edit):?><a class="btn secondary" href="/admin/media.php">Cancel edit</a><?php endif;?></div></form></section>
<section class="panel"><h2>Publishing standards</h2><p class="muted">A public channel link does not automatically authorize third-party playback or rebroadcasting. Use the publisher’s official share/embed route.</p><h3>Streaming costs</h3><p>Only titles, IDs, categories and official links live on Hostinger. We do not relay videos, audio or IPTV streams.</p><h3>Live label</h3><p>Do not label a video “Live now” unless independently verified. Content availability can change without warning.</p><h3>What can I publish?</h3><p>Official YouTube embeds, authorized Twitch/Spotify embeds, official external destinations and independently licensed HLS sources. No copied paid movies or arbitrary IPTV playlists.</p></section></div>
<section class="panel"><h2>Media catalog</h2><div class="table-scroll"><table><thead><tr><th>Title</th><th>Type</th><th>Source</th><th>Approval</th><th>Actions</th></tr></thead><tbody>
<?php foreach($entries as $item):?><tr><td><strong><?=$esc($item['title'])?></strong></td><td><?=$esc($item['kind'])?> / <?=$esc($item['provider'])?></td><td><?=$esc($item['source_name'])?></td><td><?=$esc($item['status'])?> <?=$item['checked_at']?'✓ verified':''?></td><td><a class="btn secondary" href="/admin/media.php?edit=<?=(int)$item['id']?>">Edit</a><form method="post"><input type="hidden" name="csrf" value="<?=$esc(connect_csrf())?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?=(int)$item['id']?>"><button type="submit" class="danger">Delete</button></form></td></tr><?php endforeach;?>
<?php if(!$entries):?><tr><td colspan="5">No custom entries. The public PWA still has its starter official catalog.</td></tr><?php endif;?></tbody></table></div></section>
<?php endif;?></main><footer>VWEB.DEV Connect · Editor-reviewed entertainment metadata</footer></body></html>
