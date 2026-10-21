<?php
declare(strict_types=1);
/* Server-rendered SEO metadata for public Connect routes. Shared UI remains in index.html. */
$pages=[
 ''=>['VWEB.DEV Connect — Free Online Tools, Learning & Utilities','Free browser tools, QR codes, image and PDF utilities, software resources and practical learning in VWEB.DEV Connect.'],
 'tools'=>['Free Online Tools — QR, PDF, AI & Utilities | VWEB.DEV Connect','Explore 49 practical tools for QR codes, PDFs, file conversion, AI, text, developers, accessibility, daily productivity and internet diagnostics.'],
 'qr'=>['QR Code Studio — Custom QR Generator | VWEB.DEV Connect','Create and customize QR codes for links, Wi-Fi, contacts and WhatsApp with a browser-based QR studio.'],
 'convert'=>['Convert Studio — Image, PDF & Media Tools | VWEB.DEV Connect','Convert images, work with PDFs and explore browser-based audio and video utilities.'],
 'ai'=>['AI Studio — AI Chat, Images & Creative Tools | VWEB.DEV Connect','Explore AI chat, image generation, video and caption tools powered by your Puter account.'],
 'academy'=>['Learn — Free Courses & Lessons | VWEB.DEV Connect','Discover organized learning paths and free video lessons for technology and digital skills.'],
 'apps'=>['Free Software & App Directory | VWEB.DEV Connect','Discover trusted desktop and web software, official download sources and useful apps.'],
 'pc'=>['Windows & Office Help — Guides & Software | VWEB.DEV Connect','Explore Windows troubleshooting, software installation and Windows and Office licensing guidance.'],
 'network'=>['Internet Speed Test | VWEB.DEV Connect','Measure download and upload speeds, latency and jitter against Cloudflare using the browser-based speed test.'],
 'daily'=>['Daily Desk — Notes, Tasks & Everyday Tools | VWEB.DEV Connect','Manage local to-do lists, notes, a focus timer, calculators and other browser-based everyday utilities.'],
 'studios'=>['Digital Tool Studios | VWEB.DEV Connect','Explore focused browser workspaces for QR codes, file conversion, AI tools and quick actions.'],
 'play'=>['Games & Quizzes | VWEB.DEV Connect','Explore interactive quizzes and browser games in VWEB.DEV Connect.'],
 'community'=>['Local & Learning Resources | VWEB.DEV Connect','Explore curated community resources and useful educational links.'],
 'offers'=>['Deals & Partner Resources | VWEB.DEV Connect','Explore software and digital-service offers and curated partner resources.'],
 'dashboard'=>['My Workspace | VWEB.DEV Connect','Access your saved personal tools and local progress.'],
 'account'=>['My Account | VWEB.DEV Connect','Manage your Connect preferences and account-related actions.']
];
$path=trim(parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)??'','/');
if($path==='index.php')$path='';
$toolInfo=null;$courseInfo=null;$directoryInfo=null;
$rawTools=@file_get_contents(__DIR__.'/data/tool-routes.json');
$toolData=$rawTools!==false?json_decode($rawTools,true):null;
$tools=is_array($toolData)&&isset($toolData['tools'])&&is_array($toolData['tools'])?$toolData['tools']:[];
foreach($tools as $entry){
 if(isset($entry['path'])&&$entry['path']==='/'.$path){$toolInfo=$entry;break;}
}
if($toolInfo){
 $base=$toolInfo['section'];
 $title=$toolInfo['title'].' — '.($base==='ai'?'AI Studio':($base==='pc'?'Windows & Office Guide':'Online Tool')).' | VWEB.DEV Connect';
 $description=$toolInfo['description'].'. Open a dedicated workspace on VWEB.DEV Connect.';
}else{
 $courseJson=@file_get_contents(__DIR__.'/data/connect-hub.json');
 $courseData=$courseJson!==false?json_decode($courseJson,true):null;
 $courses=is_array($courseData)&&isset($courseData['courses'])&&is_array($courseData['courses'])?$courseData['courses']:[];
 foreach($courses as $course){
  if(isset($course['id'])&&$path==='academy/course/'.$course['id']){$courseInfo=$course;break;}
 }
 if($courseInfo){
  $base='academy';
  $title=$courseInfo['title'].' — Free Course | VWEB.DEV Connect';
  $description=$courseInfo['description'];
 }elseif(array_key_exists($path,$pages)){
  $base=$path;
  $title=$pages[$path][0];$description=$pages[$path][1];
  if(in_array($path,['tools','convert','ai','qr','daily','pc'],true)){
   $directoryInfo=$path==='tools'?$tools:array_values(array_filter($tools,static fn($t)=>isset($t['section'])&&$t['section']===$path));
  }
 }else{
  http_response_code(404);header('Content-Type: text/plain; charset=utf-8');echo 'Page not found';exit;
 }
}
$source=@file_get_contents(__DIR__.'/index.html');
if($source===false){http_response_code(503);echo 'Application temporarily unavailable';exit;}
$url='https://connect.vweb.dev/'.($path!==''?$path:'');
$esc=static fn(string $text):string=>htmlspecialchars($text,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
$source=preg_replace('/<link rel="canonical"[^>]*>\s*/','',$source);$source=preg_replace('/<meta property="og:url"[^>]*>\s*/','',$source);
$source=preg_replace('/<title>.*?<\/title>/s','<title>'.$esc($title).'</title>',$source,1);
$source=preg_replace('/<meta name="description" content="[^"]*">/','<meta name="description" content="'.$esc($description).'">',$source,1);
$source=preg_replace('/<meta property="og:title" content="[^"]*">/','<meta property="og:title" content="'.$esc($title).'">',$source,1);
$source=preg_replace('/<meta property="og:description" content="[^"]*">/','<meta property="og:description" content="'.$esc($description).'">',$source,1);
$head='<link rel="canonical" href="'.$esc($url).'"><meta property="og:url" content="'.$esc($url).'"><meta name="twitter:title" content="'.$esc($title).'"><meta name="twitter:description" content="'.$esc($description).'">';
if($path==='dashboard'||$path==='account'){$head.='<meta name="robots" content="noindex,follow">';}
$schema=['@context'=>'https://schema.org','@type'=>'WebPage','name'=>$title,'description'=>$description,'url'=>$url,'isPartOf'=>['@type'=>'WebSite','name'=>'VWEB.DEV Connect','url'=>'https://connect.vweb.dev/']];
$head.='<script type="application/ld+json">'.json_encode($schema,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).'</script>';
if($toolInfo||$courseInfo){
 $crumbs=[['name'=>'Connect','item'=>'https://connect.vweb.dev/']];
 $area=$toolInfo?($toolInfo['section']==='pc'?'pc':$toolInfo['section']):'academy';
 $crumbs[]=['name'=>ucfirst($area),'item'=>'https://connect.vweb.dev/'.$area];
 $crumbs[]=['name'=>$toolInfo?$toolInfo['title']:$courseInfo['title'],'item'=>$url];
 $head.='<script type="application/ld+json">'.json_encode(['@context'=>'https://schema.org','@type'=>'BreadcrumbList','itemListElement'=>array_map(static fn($c,$i)=>['@type'=>'ListItem','position'=>$i+1,'name'=>$c['name'],'item'=>$c['item']],$crumbs,array_keys($crumbs))],JSON_UNESCAPED_SLASHES|JSON_HEX_TAG|JSON_HEX_AMP).'</script>';
}
$source=str_replace('</head>',$head.'</head>',$source);
if($toolInfo||$courseInfo||$directoryInfo!==null){
 $page=$toolInfo?$toolInfo['section']:($courseInfo?'academy':$path);
 $attribute=$toolInfo?'data-connect-tool-route="'.$esc($toolInfo['id']).'"':($courseInfo?'data-connect-course-route="'.$esc($courseInfo['id']).'"':'data-connect-tool-directory="'.$esc($page).'"');
 $source=str_replace('<html lang="en">','<html lang="en" '.$attribute.'>',$source);
 $intro='';
 if($toolInfo){
  $intro='<section id="connect-tool59-hero" class="tool59-hero"><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/'.$esc($toolInfo['section']).'"'.($toolInfo['section']==='tools'?' data-tools-no-sheet="true"':'').' >'.($toolInfo['section']==='pc'?'Windows &amp; Office':ucfirst($esc($toolInfo['section']))).'</a> / <span>'.$esc($toolInfo['title']).'</span></nav><div class="overline">FOCUSED TOOL WORKSPACE</div><h1>'.$esc($toolInfo['title']).'</h1><p>'.$esc($toolInfo['description']).'.</p></section>';
  $related=array_values(array_filter($tools,static fn($t)=>$t['group']===$toolInfo['group']&&$t['id']!==$toolInfo['id']));
  $intro.='<nav class="tool59-related" aria-label="Related tools"><span>Related tools</span>';
  foreach(array_slice($related,0,4) as $r){$intro.='<a href="'.$esc($r['path']).'">'.$esc($r['title']).' ↗</a>';}
  $intro.='</nav>';
 }elseif($courseInfo){
  $intro='<section id="connect-tool59-hero" class="tool59-hero"><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/academy">Learn</a> / <span>'.$esc($courseInfo['title']).'</span></nav><div class="overline">YOUR COURSE CLASSROOM</div><h1>'.$esc($courseInfo['title']).'</h1><p>'.$esc($courseInfo['description']).'</p><p>Lessons are provided by the original publisher. Progress is self-tracked on this device.</p></section>';
 }else{
  $areaName=$path==='pc'?'Windows & Office':($path==='qr'?'QR Studio':($path==='ai'?'AI Studio':ucfirst($path)));
  $intro='<section id="connect-tool59-directory" class="tool59-directory"><div class="overline">EXPLORE INDIVIDUAL TOOLS</div><h2>'.$esc($areaName).' tools</h2><p>Open the exact tool you need in a focused workspace.</p><div class="tool59-directory-grid">';
  foreach($directoryInfo as $r){$intro.='<a class="tool59-directory-item" href="'.$esc($r['path']).'"><strong>'.$esc($r['title']).'</strong><small>'.$esc($r['description']).'</small><span>Open tool ↗</span></a>';}
  $intro.='</div></section>';
 }
 $sectionPattern='/(<section\b[^>]*\bid="page-'.preg_quote($page,'/').'"[^>]*?)(\s+hidden)?(>)/';
 $source=preg_replace_callback($sectionPattern,static fn($m)=>$m[1].$m[3].$intro,$source,1);
}elseif($path!==''){
 $source=preg_replace('/(<section\b[^>]*\bid="page-'.preg_quote($path,'/').'"[^>]*?)\s+hidden(>)/','$1$2',$source,1);
}
header('Content-Type: text/html; charset=utf-8');header('Cache-Control: public, max-age=120');
echo $source;
