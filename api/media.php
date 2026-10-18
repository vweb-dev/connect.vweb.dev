<?php
declare(strict_types=1);
require __DIR__.'/_boot.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') connect_json(['ok'=>false],405);
try {
  $db=connect_db();
  $stmt=$db->query("SELECT id,kind,provider,title,summary,category,country,language,
     source_name,source_url,external_id,poster_style,permission,badge
     FROM entertainment_items WHERE status='published' AND kind IN ('watch','podcast','discover') AND checked_at IS NOT NULL
     ORDER BY display_order DESC, updated_at DESC LIMIT 100");
  $items=[];
  foreach($stmt->fetchAll() as $row){
    $row['id']='cms-media-'.(int)$row['id'];
    $items[]=$row;
  }
  header('Cache-Control: public,max-age=120,stale-while-revalidate=120');
  connect_json(['ok'=>true,'items'=>$items,'catalog_source'=>'editor-reviewed']);
} catch(Throwable $e){
  header('Cache-Control: no-store');
  connect_json(['ok'=>false,'message'=>'Optional entertainment CMS not configured.'],503);
}
