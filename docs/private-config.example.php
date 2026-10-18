<?php
// Copy this EXAMPLE to connect-secrets.php OUTSIDE public_html,
// e.g. /domains/connect.vweb.dev/connect-secrets.php.
// NEVER commit the real file. Replace each CHANGE_ME field.
return [
 'db'=>[
  'host'=>'localhost',
  'port'=>3306,
  'name'=>'CHANGE_ME_DATABASE_NAME',
  'user'=>'CHANGE_ME_DATABASE_USER',
  'password'=>'CHANGE_ME_DATABASE_PASSWORD'
 ],
 // Create a private random setup token (at least 32 random characters).
 // It authorizes first admin creation only. Never publish it in Git.
 'setup_token'=>'CHANGE_ME_LONG_RANDOM_PRIVATE_SETUP_TOKEN'
];
