<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120');
header('Access-Control-Allow-Origin: https://connect.vweb.dev');
$targets = [
 'Google Search'=>'https://www.google.com/generate_204',
 'GitHub'=>'https://github.com/',
 'Cloudflare'=>'https://www.cloudflare.com/',
 'Wikipedia'=>'https://www.wikipedia.org/'
];
if(!function_exists('curl_init')){http_response_code(503);echo json_encode(['error'=>'Network diagnostics unavailable on this host']);exit;}
$cache=sys_get_temp_dir().'/connect-network-health-v1.json';
if(is_file($cache)&&time()-filemtime($cache)<300){readfile($cache);exit;}
$results=[];
foreach($targets as $name=>$url){
 $ch=curl_init($url);
 curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_NOBODY=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>6,CURLOPT_USERAGENT=>'VWEB.Connect.Status/1.0',CURLOPT_SSL_VERIFYPEER=>true]);
 curl_exec($ch);
 $code=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);
 $elapsed=round((float)curl_getinfo($ch,CURLINFO_TOTAL_TIME)*1000);
 $error=curl_errno($ch);
 curl_close($ch);
 $results[]=['name'=>$name,'reachable'=>!$error&&$code>=200&&$code<500,'http_code'=>$code,'response_ms'=>$elapsed,'note'=>'Availability from Connect server only'];
}
$data=['source'=>'Connect host HTTP probes','checked_at'=>gmdate('c'),'targets'=>$results,'disclaimer'=>'HTTP reachability does not verify global application health. Bot protection may cause false failures.'];
$json=json_encode($data,JSON_UNESCAPED_SLASHES);
@file_put_contents($cache,$json,LOCK_EX);
echo $json;
