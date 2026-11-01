#!/usr/bin/env python3
"""Read-only Open-Typer production smoke test. No credentials and no writes."""
import json, sys, urllib.request, urllib.error
from urllib.parse import urljoin, urlparse
BASE = (sys.argv[1] if len(sys.argv)>1 else "https://connect.vweb.dev").rstrip("/") + "/"
PATH="/apps/open-typer/"
def get(path):
    url=urljoin(BASE,path.lstrip("/"))
    req=urllib.request.Request(url,headers={"Cache-Control":"no-cache","User-Agent":"Connect-Open-Typer-Verify/1"})
    with urllib.request.urlopen(req,timeout=20) as resp:
        return resp.read(8 if path.endswith(".wasm") else 2048),resp.status,resp.headers.get("Content-Type","")
def main():
    try:
        data,status,typ=get(PATH+"manifest.json")
        manifest=json.loads(data)
        if manifest.get("engine")!="Open-Typer" or manifest.get("ready") is not True:
            raise ValueError("Application not marked ready")
        for key in ("entrypoint","wasm","javascript"):
            path=manifest.get(key)
            if not isinstance(path,str) or not path.startswith(PATH) or ".." in path:
                raise ValueError("Unsafe/missing manifest path: "+key)
            head,status,mime=get(path)
            if not head: raise ValueError("Empty file: "+key)
            if key=="wasm" and not head.startswith(b"\x00asm"):
                raise ValueError("Invalid WASM signature")
            print("OK",key,path,"HTTP",status,"MIME",mime)
        print("PASS: assets available. Interactive browser testing is still necessary.")
        return 0
    except Exception as exc:
        print("FAIL:",exc,file=sys.stderr);return 1
if __name__=="__main__":sys.exit(main())
