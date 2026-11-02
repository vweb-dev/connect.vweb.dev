#!/usr/bin/env bash
set -euo pipefail
# Pinned Open-Typer precompiled web build. No Qt build or paid CI needed.
UPSTREAM_REV=61db1f4914341b578a707f71e9df001cca4f45d8
BASE="https://raw.githubusercontent.com/Open-Typer/web-app/$UPSTREAM_REV"
MIRROR="https://cdn.jsdelivr.net/gh/Open-Typer/web-app@$UPSTREAM_REV"
DEST="apps/open-typer"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
for file in open-typer.html open-typer.js open-typer.wasm open-typer.worker.js qtloader.js qtlogo.svg; do
  echo "Fetching $file"
  if ! curl --fail --location --retry 2 --connect-timeout 15 --silent --show-error "$BASE/$file" --output "$TMP/$file"; then
    echo "Primary download failed; trying pinned mirror for $file"
    curl --fail --location --retry 2 --connect-timeout 15 --silent --show-error "$MIRROR/$file" --output "$TMP/$file"
  fi
  test -s "$TMP/$file" || { echo "Missing asset $file" >&2; exit 1; }
done
cp "$TMP/open-typer.html" "$TMP/index.html"
# Validate staging files before publishing any incomplete manifest.
python3 scripts/prepare-open-typer.py "$TMP"
mkdir -p "$DEST"
rm -f "$DEST/manifest.json"
for file in open-typer.html open-typer.js open-typer.wasm open-typer.worker.js qtloader.js qtlogo.svg index.html; do
  cp "$TMP/$file" "$DEST/$file"
done
cp "$TMP/manifest.json" "$DEST/manifest.json"
echo "Local build prepared in $DEST. Validate browser loading before production."
