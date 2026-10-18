<?php
declare(strict_types=1);
// Legacy ISP/Rewards integration permanently retired from the public app.
// Historical tables and data are preserved; no subscriber / wallet data is exposed.
header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');
http_response_code(410);
echo json_encode(['ok'=>false,'message'=>'This feature has been retired from VWEB.DEV Connect.'],JSON_UNESCAPED_SLASHES);
exit;
