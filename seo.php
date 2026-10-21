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
if(!array_key_exists($path,$pages)){http_response_code(404);header('Content-Type: text/plain; charset=utf-8');echo 'Page not found';exit;}
$source=@file_get_contents(__DIR__.'/index.html');
if($source===false){http_response_code(503);echo 'Application temporarily unavailable';exit;}
$title=$pages[$path][0];$description=$pages[$path][1];$url='https://connect.vweb.dev/'.($path!==''?$path:'');
$esc=static fn(string $text):string=>htmlspecialchars($text,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
$source=preg_replace('/<title>.*?<\/title>/s','<title>'.$esc($title).'</title>',$source,1);
$source=preg_replace('/<meta name="description" content="[^"]*">/','<meta name="description" content="'.$esc($description).'">',$source,1);
$source=preg_replace('/<meta property="og:title" content="[^"]*">/','<meta property="og:title" content="'.$esc($title).'">',$source,1);
$source=preg_replace('/<meta property="og:description" content="[^"]*">/','<meta property="og:description" content="'.$esc($description).'">',$source,1);
$head='<link rel="canonical" href="'.$esc($url).'"><meta property="og:url" content="'.$esc($url).'"><meta name="twitter:title" content="'.$esc($title).'"><meta name="twitter:description" content="'.$esc($description).'">';
if($path==='dashboard'||$path==='account'){$head.='<meta name="robots" content="noindex,follow">';}
$schema=['@context'=>'https://schema.org','@type'=>'WebPage','name'=>$title,'description'=>$description,'url'=>$url,'isPartOf'=>['@type'=>'WebSite','name'=>'VWEB.DEV Connect','url'=>'https://connect.vweb.dev/']];
$head.='<script type="application/ld+json">'.json_encode($schema,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).'</script>';
$source=str_replace('</head>',$head.'</head>',$source);
if($path!==''){$source=preg_replace('/(<section\b[^>]*\bid="page-'.preg_quote($path,'/').'"[^>]*?)\s+hidden(>)/','$1$2',$source,1);}
header('Content-Type: text/html; charset=utf-8');header('Cache-Control: public, max-age=120');
echo $source;
