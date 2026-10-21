# Connect v61 — LibreSpeed, tool UX and global search

## What changed
- Every registered tool page gets consistent premium styling, a guided workflow, contextual help, save/copy link actions and supported safe sample-input shortcuts. The underlying processors remain the existing tool modules.
- Directory screens have search/filter controls; `/tools` discovers all 49 registered tool URLs.
- Global search and the command palette search tools, official app listings, LMS courses and guides with weighted matches. Direct tool and course pages open using SEO-friendly URLs. App searches use `/apps?q=<term>`.
- Uses **LibreSpeed v6.3.0**, original open-source JavaScript plus Web Worker and PHP upload/download endpoints on the Connect domain. GitHub: https://github.com/librespeed/speedtest.

## LGPL notice and local modifications
LibreSpeed is copyright © Federico Dossena and contributors, provided under **LGPL v3 or later**. The full licence is included at `librespeed/LICENSE`.
The upstream `librespeed/speedtest.js` has one adjustment to load the worker from the deployed `/librespeed/` path. The download backend `librespeed/backend/garbage.php` limits a single request to at most **16 MiB** (upstream allows up to 1024 MiB) to reduce resource exhaustion on shared hosting. `speedtest_worker.js` and `backend/empty.php` remain upstream versions.
The page's own controller `assets/librespeed-connect-v61.js` configures an on-demand, shorter-duration test. It disables IP lookup by using the `P_D_U` sequence and disables test telemetry. No results database is installed. Recent completed measurements are stored in device-local browser storage only.

## Required hosting validation
1. Deploy `librespeed/speedtest.js`, `librespeed/speedtest_worker.js` and `librespeed/backend/{empty,garbage}.php` along with the new assets.
2. Verify PHP executes: `/librespeed/backend/empty.php` must return HTTP 200 with an empty body. It must not expose PHP source code.
3. Verify `/librespeed/backend/garbage.php?ckSize=1` returns a non-cached binary response.
4. Open `/network` and `/network/speed-test` and run a user-initiated test. Confirm nonzero download/upload samples, ping, jitter, stop and copy results; compare on two devices. Results depend on server and routing and are not a definitive ISP speed.
5. Verify the hosting plan **allows bandwidth-intensive tests**. Even with request caps, usage can be significant; shared hosting and PHP limits can degrade results. If the host restricts testing, use a permitted dedicated self-hosted endpoint instead; do not claim performance accuracy.
6. Test representative workspaces `/tools/password-generator`, `/tools/json-formatter`, `/convert/pdf`, `/qr/wifi`, `/ai/chat`, `/daily/calculator`, `/windows/activation` on both mobile and desktop.
7. Test search for `password`, `QR wifi`, `json formatter`, `excel`, and an app publisher name. Verify direct navigation and the Back button.
8. Verify all 16 main pages are siblings in the DOM, not nested under Network.

Only static-source validation is available before deployment. Do not assert that Hostinger has deployed these files or that the performance test is accurate until live browser testing is completed.
