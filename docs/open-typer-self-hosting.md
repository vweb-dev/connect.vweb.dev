# Open-Typer self-hosted integration

Connect Academy uses `/assets/connect-open-typer.js` to locate a **compiled** Open-Typer WebAssembly build. This integration deliberately avoids an external iframe. The fallback is the existing native Connect typing course, including all existing local progress.

## Upstream
Source: https://github.com/Open-Typer/Open-Typer
License: GPL-3.0 (retain source, notices and corresponding-license obligations when redistributing).
Upstream build reference: `.github/workflows/wasm-build.yml` in the upstream repository (Qt 6.5.2 / Emscripten 3.1.25 as documented at inspection time).

## Deploying a compiled build
1. Build upstream Open-Typer for WebAssembly using the upstream build instructions and matching Qt/Emscripten dependencies **on a developer machine**; do not compile on Hostinger shared hosting.
2. Copy generated HTML, JS, WASM and supporting files to `apps/open-typer/` in the Connect web root.
3. Make sure the compiled entry document is `apps/open-typer/index.html`. Rename or adapt paths carefully and preserve generated asset references.
4. Only after all runtime files exist, create `apps/open-typer/manifest.json` containing `{"engine":"Open-Typer","ready":true,"entrypoint":"/apps/open-typer/index.html"}`.
5. Verify direct loading of `https://connect.vweb.dev/apps/open-typer/index.html` and navigation from Academy, including keyboard input, browser refresh, and WASM network/MIME loading.
6. Keep the upstream GPL-3.0 license, copyright notices, source-access link and third-party notices available alongside the distributed build.

**Do not add the ready manifest before installing the actual engine.** Without it, the Connect typing course remains the functional local fallback. Do not add placeholder `.wasm` files or assume a successful upstream build.

## Operational considerations
- WASM should be served as `application/wasm`. Hostinger static hosting may need an appropriate MIME mapping.
- The upstream online beta is an optional external link, not embedded in Connect.
- Static-cache updates must bump the service-worker version after integrating the binary artifacts.
- Test desktop and touch/virtual keyboard behavior; the upstream Qt desktop-oriented UI might not be mobile-friendly.
- User progress from Connect's local typing course does not automatically transfer into upstream Open-Typer.
- Avoid CI builds in this repository when minimizing GitHub Actions usage. Build locally and upload the output artifacts to existing hosting.
