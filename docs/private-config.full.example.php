<?php
// EXAMPLE ONLY; install real credentials OUTSIDE public_html.
// For full Phase 3 functionality, the ISP sync and optional hotspot
// share keys only with authorized ISP-side agents. No real credentials in Git.
return [
 'db'=>['host'=>'localhost','port'=>3306,'name'=>'CHANGE_ME','user'=>'CHANGE_ME',
         'password'=>'CHANGE_ME'],
 // Retain setup_token only until first admin creation, then remove or rotate.
 'setup_token'=>'CHANGE_ME_USE_AT_LEAST_32_RANDOM_CHARACTERS',
 // 32+ independent random characters. Set only after ISP permits outbound sync.
 'isp_sync_key'=>'',
 // Separate secret for voucher provisioning, not the RADIUS reporter.
 'gateway_sync_key'=>'',
 // Default FALSE. Enabling requires a configured isolated guest hotspot gateway,
 // provisioned/tested voucher agent and a signed API channel.
 'gateway_enabled'=>false,
 // Required for optional standards-based Web Push notifications.
 'vapid_public_key'=>'',
 'vapid_private_key'=>''
];
