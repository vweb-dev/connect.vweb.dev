<?php
declare(strict_types=1);
// Retired: do not access MySQL or publish obsolete media listings.
header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');
http_response_code(410);
echo json_encode(['ok'=>false,'message'=>'Watch/Discover media catalog retired.']);
