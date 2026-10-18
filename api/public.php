<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') connect_json(['ok'=>false],405);
try {
    $db = connect_db();
    $rows = $db->query("SELECT id,type,title,summary,brand,category,code,url,placement,
       DATE_FORMAT(expires_at,'%Y-%m-%dT%H:%i:%sZ') AS expires_at
       FROM content_items WHERE " . connect_active_where() . "
       ORDER BY priority DESC, updated_at DESC LIMIT 120")->fetchAll();
    $result=['coupons'=>[],'news'=>[],'ads'=>[]];
    foreach ($rows as $row) {
        $type = $row['type'];
        $row['id'] = (int)$row['id'];
        $row['action_url'] = '/api/go.php?id=' . $row['id'];
        if ($type === 'coupon') $result['coupons'][]=$row;
        elseif ($type === 'news') $result['news'][]=$row;
        elseif ($type === 'ad') $result['ads'][]=$row;
    }
    header('Cache-Control: public, max-age=60, stale-while-revalidate=180');
    connect_json(['ok'=>true,'updated_at'=>gmdate('c')]+$result);
} catch (Throwable $e) {
    header('Cache-Control: no-store');
    connect_json(['ok'=>false,'message'=>'CMS content currently unavailable.'],503);
}
