#!/usr/bin/env python3
"""Validate a locally compiled Open-Typer Qt WebAssembly distribution.

Usage: python3 scripts/prepare-open-typer.py PATH_TO_COMPILED_OUTPUT
Produces the ready manifest only after assets pass basic checks.
No network access, external services or new paid tools are required.
"""
import json
import pathlib
import sys

def main():
    if len(sys.argv) != 2:
        print("Usage: prepare-open-typer.py apps/open-typer"); return 2
    root = pathlib.Path(sys.argv[1]).resolve()
    if not root.is_dir():
        print("Directory missing:", root); return 2
    html_files = list(root.glob("*.html"))
    wasm_files = list(root.glob("*.wasm"))
    js_files = list(root.glob("*.js"))
    if not html_files or not wasm_files or not js_files:
        print("Incomplete build: expected HTML, WASM and JS together"); return 1
    html = next((p for p in html_files if p.name == "index.html"), None)
    if html is None:
        print("Rename/adapt compiled entry to index.html before release"); return 1
    wasm = max(wasm_files, key=lambda p: p.stat().st_size)
    if wasm.read_bytes()[:4] != b"\x00asm":
        print("Invalid WASM binary signature"); return 1
    scripts = [p for p in js_files if p.stat().st_size > 1024]
    if not scripts:
        print("No compiled JavaScript runtime found"); return 1
    js = max(scripts, key=lambda p: p.stat().st_size)
    root_prefix = "/apps/open-typer/"
    manifest = dict(engine="Open-Typer",ready=True,
                    entrypoint=root_prefix + html.name,
                    wasm=root_prefix + wasm.name,
                    javascript=root_prefix + js.name)
    dest = root / "manifest.json"
    dest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Prepared:", dest)
    print("Verify the complete upstream Qt app manually in a real browser before production release.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
