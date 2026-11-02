# Open-Typer self-hosted integration

Connect Academy uses `/assets/connect-open-typer.js` to locate a **compiled** Open-Typer WebAssembly build. This integration deliberately avoids an external iframe. The fallback is the existing native Connect typing course, including all existing local progress.

## Upstream
Source: https://github.com/Open-Typer/Open-Typer
License: GPL-3.0 (retain source, notices and corresponding-license obligations when redistributing).
Upstream build reference: `.github/workflows/wasm-build.yml` in the upstream repository (Qt 6.5.2 / Emscripten 3.1.25 as documented at inspection time).

## Preferred: prebuilt upstream web application

The official [Open-Typer/web-app](https://github.com/Open-Typer/web-app) repository contains precompiled browser files. Install a pinned build locally using `bash scripts/install-open-typer-web.sh` from the Connect repository root. This requires bash, curl, and Python 3, and downloads the runtime files (including an approximately 34MB WASM binary). The selected upstream commit is `61db1f4914341b578a707f71e9df001cca4f45d8` (August 2023), so treat it as an older beta and verify browser compatibility. The script creates `apps/open-typer/index.html` and runs the manifest validator. **It does not deploy to hosting automatically.** Upload or commit the resulting assets only after reviewing license notices and testing the app.

## Alternative: compiling and deploying a build
1. Build upstream Open-Typer for WebAssembly using the upstream build instructions and matching Qt/Emscripten dependencies **on a developer machine**; do not compile on Hostinger shared hosting.
2. Copy generated HTML, JS, WASM and supporting files to `apps/open-typer/` in the Connect web root.
3. Make sure the compiled entry document is `apps/open-typer/index.html`. Rename or adapt paths carefully and preserve generated asset references.
4. Once compiled files are present, run `python3 scripts/prepare-open-typer.py apps/open-typer` from the Connect repository root. It validates HTML/JS/WASM presence and WASM magic bytes and generates `manifest.json` with `entrypoint`, `javascript`, and `wasm`. The manifest does not guarantee successful Qt runtime initialization.
5. Verify direct loading of `https://connect.vweb.dev/apps/open-typer/index.html` and navigation from Academy, including keyboard input, browser refresh, and WASM network/MIME loading.
6. Keep the upstream GPL-3.0 license, copyright notices, source-access link and third-party notices available alongside the distributed build.

**Do not add the ready manifest before installing the actual engine.** The launcher now checks for actual HTML, JavaScript and valid WebAssembly magic bytes before enabling local launch. Without it, the Connect typing course remains the functional local fallback. Do not add placeholder `.wasm` files or assume a successful upstream build.

## Operational considerations
- WASM should be served as `application/wasm`. Hostinger static hosting may need an appropriate MIME mapping.
- The upstream online beta is an optional external link, not embedded in Connect.
- Static-cache updates must bump the service-worker version after integrating the binary artifacts.
- Test desktop and touch/virtual keyboard behavior; the upstream Qt desktop-oriented UI might not be mobile-friendly.
- User progress from Connect's local typing course does not automatically transfer into upstream Open-Typer.
- Avoid CI builds in this repository when minimizing GitHub Actions usage. Build locally and upload the output artifacts to existing hosting.

## Windows one-command installer (no Qt compilation)

For Windows 11, clone the Connect repository and run in PowerShell from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-open-typer-web.ps1
```

This downloads a pinned historical official upstream WebAssembly bundle, checks for required assets and the WASM magic signature, and prepares `apps/open-typer/` with a launch manifest. **It only installs into the local repository folder.** To publish, commit the generated assets (the ~34MB WASM file is below GitHub's 100MB per-file hard limit, subject to repository limits) or upload the directory to Hostinger under the site document root. Confirm license notices and test the actual application first. Never upload a manifest without matching binaries. No GitHub Actions build is required. Watch out for service-worker caching after the upload.


## Publish and verify on existing GitHub/Hostinger setup

After the Windows installer has generated the real assets, run `powershell -ExecutionPolicy Bypass -File scripts/publish-open-typer.ps1` in your local repo. The helper checks required files and creates a Git commit **without pushing** so you can review the large binary first. Push with `git push origin main` only when your existing Hostinger Git deployment maps the `apps/open-typer/` directory to the site document root. Then run `python scripts/verify-open-typer-production.py https://connect.vweb.dev` to check the deployed manifest, entry HTML, JS and WASM signature. A successful smoke test does not replace real keyboard/browser QA. Do not enable a ready manifest on production before the files are live. These commands have not been run on your local machine or Hostinger by ChatGPT.

## One-command Windows installation and optional publish

From a clean Git clone in Windows PowerShell, run `powershell -ExecutionPolicy Bypass -File scripts/open-typer-one-command.ps1` to download and validate the prebuilt assets. After reviewing your downloaded files, run `powershell -ExecutionPolicy Bypass -File scripts/open-typer-one-command.ps1 -Publish` to commit and push the prepared assets to the existing `main` branch. This push requires local Git credentials and will trigger Hostinger only if automatic Git deployment is configured. The script deliberately refuses a dirty working tree. ChatGPT has not executed this on the user's Windows PC. On GitHub or Hostinger, verify asset publication before declaring the engine live.

## Network fallback (Windows)

The PowerShell installer first requests the pinned upstream `raw.githubusercontent.com` files and then attempts the same pinned revision through jsDelivr if the primary host is unreachable. Both endpoints may be blocked by corporate DNS, regional routing or CDN file-size restrictions; success is not guaranteed. The installer fails rather than publishing incomplete binaries. The alternative is a transport mirror, not an independent verified release. Review the downloaded files before distribution and keep the upstream GPL-3.0 source/notice links.
