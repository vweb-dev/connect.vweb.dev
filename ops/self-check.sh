#!/usr/bin/env bash
# Free local/Hostinger validation without requiring GitHub Actions runners.
set -euo pipefail
cd "$(dirname "$0")/.."
echo "[Connect] Checking PHP syntax..."
find api admin ops docs -type f -name '*.php' -print0 | while IFS= read -r -d '' f; do
  php -l "$f"
done
if command -v node >/dev/null 2>&1; then
 echo "[Connect] Checking JavaScript and media tests..."
 node --check assets/app.js
 node --check assets/converter.js
 node --check assets/hub.js
 node --check assets/puter-ai.js
 node --check assets/entertainment.js
 node --check sw.js
 node --test tests/entertainment.test.mjs tests/converter.test.mjs tests/connect20.test.mjs tests/quality.test.mjs tests/software.test.mjs tests/focus.test.mjs tests/tools-visibility.test.mjs
else
 echo "[Connect] Node unavailable: JS syntax check skipped."
fi
php -r '$m=json_decode(file_get_contents("manifest.webmanifest"),true);if (!is_array($m)||empty($m["name"])) {fwrite(STDERR,"Invalid manifest\n");exit(1);} echo "Manifest OK\n";'
echo "[Connect] Source checks completed. This is not a live database or ISP integration test."
