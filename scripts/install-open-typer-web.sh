#!/usr/bin/env bash
set -euo pipefail
# Install precompiled upstream Open-Typer browser release without running Qt builds.
# Run from Connect repository root: bash scripts/install-open-typer-web.sh
UPSTREAM_REV=61db1f4914341b578a707f71e9df001cca4f45d8
BASE="https://raw.githubusercontent.com/Open-Typer/web-app/$UPSTREAM_REV"
DEST="apps/open-typer"
mkdir -p "$DEST"
for file in open-typer.html open-typer.js open-typer.wasm open-typer.worker.js qtloader.js qtlogo.svg; do
  echo "Downloading $file from pinned upstream commit"
  curl --fail --location --retry 3 --silent --show-error "$BASE/$file" --output "$DEST/$file"
done
cp "$DEST/open-typer.html" "$DEST/index.html"
python3 scripts/prepare-open-typer.py "$DEST"
echo "Installed local browser assets under $DEST"
echo "Inspect GPL source notices and test in real browser before production deployment."
