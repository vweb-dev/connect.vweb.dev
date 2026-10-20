<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');
$token=getenv('CLOUDFLARE_RADAR_TOKEN')?:'';
if(!$token){http_response_code(503);echo json_encode(['configured'=>false,'message'=>'Set CLOUDFLARE_RADAR_TOKEN securely on the PHP host']);exit;}
if(!function_exists('curl_init')){http_response_code(503);echo json_encode(['configured'=>false]);exit;}
$url='https://api.cloudflare.com/client/v4/radar/annotations/outages?limit=50&dateRange=7d&format=json';
$c=curl_init($url);
curl_setopt_array($c,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>10,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token,'Accept: application/json'],CURLOPT_SSL_VERIFYPEER=>true]);
$raw=curl_exec($c);$code=curl_getinfo($c,CURLINFO_HTTP_CODE);curl_close($c);
$data=json_decode((string)$raw,true);
if($code!==200||!($data['success']??false)){http_response_code(503);echo json_encode(['configured'=>true,'summary'=>'Radar temporarily unavailable']);exit;}
$items=array_values(array_filter($data['result']['annotations']??[],fn($a)=>in_array('PK',$a['locations']??[],true)));
echo json_encode(['configured'=>true,'count'=>count($items),'summary'=>count($items).' Pakistan-associated outages reported among the latest 50 global events in the past 7 days; this is not an exhaustive national count.','incidents'=>array_map(fn($a)=>['description'=>substr((string)($a['description']??'Regional network outage'),0,180),'start'=>$a['startDate']??null],array_slice($items,0,5))]);
