#!/usr/bin/env python3
"""Read-only Connect release integrity audit. Python stdlib only, no paid services."""
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.scripts = []
        self.styles = []
        self.qr_types = set()
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            self.ids.add(data["id"])
        if "data-qr-type" in data:
            self.qr_types.add(data["data-qr-type"])
        if tag == "script" and data.get("src"):
            self.scripts.append(data["src"])
        if tag == "link" and data.get("rel") == "stylesheet" and data.get("href"):
            self.styles.append(data["href"])

def main():
    catalog = json.loads((ROOT / "data/tool-routes.json").read_text(encoding="utf-8"))
    html = Assets()
    html.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    errors = []
    ids, paths = set(), set()
    content = (ROOT / "index.html").read_text(encoding="utf-8")
    catalog_match = re.search(r'<script[^>]+id="hub-offline-catalog"[^>]*>(.*?)</script>', content, re.S)
    if not catalog_match:
        errors.append("Offline course and app catalog is missing")
        offline = {}
    else:
        try:
            offline = json.loads(catalog_match.group(1))
        except json.JSONDecodeError:
            errors.append("Offline catalog JSON is invalid")
            offline = {}
    app_ids = set()
    for app in offline.get("apps", []):
        identifier = app.get("id")
        if not identifier or identifier in app_ids:
            errors.append("Missing/duplicate app id: " + str(identifier))
        app_ids.add(identifier)
        url = app.get("open", "")
        if not isinstance(url, str) or not url.startswith("https://"):
            errors.append("App link must use HTTPS: " + str(identifier))
    course_ids = set()
    for course in offline.get("courses", []):
        identifier = course.get("id")
        if not identifier or identifier in course_ids:
            errors.append("Missing/duplicate course id: " + str(identifier))
        course_ids.add(identifier)
    for item in catalog["tools"]:
        if item["id"] in ids:
            errors.append("Duplicate tool id: " + item["id"])
        if item["path"] in paths:
            errors.append("Duplicate route: " + item["path"])
        ids.add(item["id"])
        paths.add(item["path"])
        mode, target = item["mode"], item["target"]
        if mode == "qr" and target not in html.qr_types:
            errors.append("Missing QR selector: " + item["id"] + " -> " + target)
        elif mode not in ("qr", "quick") and target not in html.ids:
            errors.append("Missing tool DOM target: " + item["id"] + " -> " + target)
        if mode == "tab" and target.replace("-tab-", "-pane-") not in html.ids:
            errors.append("Missing tab panel: " + item["id"])
    for url in html.scripts + html.styles:
        if not url.startswith("/assets/"):
            continue
        path = ROOT / url.split("?", 1)[0].lstrip("/")
        if not path.is_file():
            errors.append("Missing local asset: " + str(path.relative_to(ROOT)))
    worker = (ROOT / "sw.js").read_text(encoding="utf-8")
    match = re.search(r"const CACHE='([^']+)'", worker)
    if not match:
        errors.append("Service worker cache version missing")
    if "/apps/open-typer/" not in worker:
        errors.append("Open-Typer network bypass missing")
    for required in ("connect-command-center-v117.js", "connect-speedtest.js", "qr-studio.js", "converter.js"):
        if not any(required in url for url in html.scripts):
            errors.append("Required controller not loaded: " + required)
    print("Connect static audit:", len(catalog["tools"]), "tools,", len(paths), "routes,",
          len(app_ids), "apps,", len(course_ids), "courses,",len(html.scripts), "scripts,", len(html.styles), "styles")
    print("PWA cache:", match.group(1) if match else "MISSING")
    if errors:
        for issue in errors:
            print("FAIL:", issue)
        return 1
    print("PASS: Static entrypoints, tool targets, and local assets are consistent.")
    print("NOTE: Browser interactions, remote CDNs and production deployment are NOT tested.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
