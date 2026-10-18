<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if (!$id || $id<1) {http_response_code(404);exit('Link not found.');}
try {
    $db=connect_db();
    $stmt=$db->prepare("SELECT id,url,type FROM content_items WHERE id=? AND " . connect_active_where() . " LIMIT 1");
    $stmt->execute([$id]);
    $item=$stmt->fetch();
    if (!$item || !connect_safe_url($item['url'])) {http_response_code(404);exit('Offer unavailable.');}
    // Approximate link clicks only; not an auditable billing or conversion metric.
    if ($item['type']==='ad') {
        $stmt=$db->prepare("INSERT INTO campaign_stats(campaign_id,clicks) VALUES(?,1)
         ON DUPLICATE KEY UPDATE clicks=clicks+1");
        $stmt->execute([$id]);
    }
    header('Location: ' . $item['url'],true,302);
    exit;
} catch (Throwable $e) {
    http_response_code(503);
    exit('Link temporarily unavailable.');
}
