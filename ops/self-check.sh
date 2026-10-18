#!/usr/bin/env bash
# Free local/Hostinger validation without requiring GitHub Actions runners.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "[Connect] Checking PHP syntax..."
find api admin ops docs -type f -name '*.php' -print0 | while IFS= read -r -d '' f; do
  php -l "$f"
done
if command -v node >/dev/null 2>&1; then
 echo "[Connect] Checking JavaScript..."
 node --check assets/app.js
 node --check sw.js
else
 echo "[Connect] Node unavailable: JS syntax check skipped."
fi
if command -v python3 >/dev/null 2>&1; then
 echo "[Connect] Checking ISP agent Python sources..."
 python3 - <<'PY'
import ast
for file in ['ops/radius_agent.py','ops/gateway_agent.py']:
    ast.parse(open(file,encoding='utf-8').read(), filename=file)
    print(file+': syntax OK')
PY
else
 echo "[Connect] Python unavailable: ISP agent syntax check skipped."
fi
php -r '$m=json_decode(file_get_contents("manifest.webmanifest"),true);if (!is_array($m)||empty($m["name"])) {fwrite(STDERR,"Invalid manifest\n");exit(1);} echo "Manifest OK\n";'
echo "[Connect] Source checks completed. This is not a live database or ISP integration test."
