<?php
declare(strict_types=1);

/**
 * Backend shared utilities. Credentials must be in connect-secrets.php,
 * one directory ABOVE the website public_html, never in this repository.
 */
function connect_config(): array {
    static $config = null;
    if ($config !== null) return $config;
    $file = dirname(__DIR__, 2) . '/connect-secrets.php';
    if (!is_file($file)) throw new RuntimeException('Backend not configured.');
    $value = require $file;
    if (!is_array($value) || !isset($value['db'])) {
        throw new RuntimeException('Invalid private configuration.');
    }
    $config = $value;
    $config['setup_token'] = (string)($config['setup_token'] ?? '');
    return $config;
}
function connect_db(): PDO {
    static $db = null;
    if ($db !== null) return $db;
    $c = connect_config()['db'];
    $db = new PDO(
        'mysql:host=' . $c['host'] . ';port=' . (int)($c['port'] ?? 3306) .
        ';dbname=' . $c['name'] . ';charset=utf8mb4',
        $c['user'], $c['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
         PDO::ATTR_EMULATE_PREPARES => false,
         PDO::ATTR_TIMEOUT => 5]
    );
    return $db;
}
function connect_json(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function connect_escape(?string $s): string {
    return htmlspecialchars($s ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
function connect_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') {
        http_response_code(403);
        exit('HTTPS required for admin.');
    }
    session_name('__Host-connectadmin');
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/', 'secure' => true, 'httponly' => true,
        'samesite' => 'Strict'
    ]);
    ini_set('session.use_strict_mode', '1');
    session_start();
}
function connect_csrf(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
function connect_check_csrf(): void {
    if (!hash_equals(connect_csrf(), (string)($_POST['csrf'] ?? ''))) {
        http_response_code(403);
        exit('Invalid request token.');
    }
}
function connect_safe_url(string $url): bool {
    if (!filter_var($url, FILTER_VALIDATE_URL)) return false;
    $parts = parse_url($url);
    return is_array($parts) && ($parts['scheme'] ?? '') === 'https'
        && !empty($parts['host'])
        && !in_array(strtolower($parts['host']), ['localhost','127.0.0.1'], true);
}
function connect_active_where(): string {
    return "status = 'published' AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP())
            AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())";
}
