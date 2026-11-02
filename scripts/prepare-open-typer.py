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
    with wasm.open("rb") as handle:
        signature = handle.read(4)
    if signature != b"\x00asm":
        print("Invalid WASM binary signature"); return 1
    js = root / "open-typer.js"
    if not js.is_file() or js.stat().st_size < 100000 or not (root / "qtloader.js").is_file() or not (root / "open-typer.worker.js").is_file():
        print("Incomplete Qt runtime: expected compiled JS, qtloader.js and worker"); return 1
    root_prefix = "/apps/open-typer/"
    if wasm.stat().st_size < 1000000:
        print("WASM binary is unexpectedly small"); return 1
    html_content = html.read_text(encoding="utf-8", errors="replace")
    if "open-typer.js" not in html_content or "qtloader.js" not in html_content:
        print("HTML entry does not reference the expected Open-Typer runtime"); return 1
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
