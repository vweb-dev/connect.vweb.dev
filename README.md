## MAS-first Windows & Office activation experience — October 20, 2026

The #pc screen now opens with a detailed, high-priority Massgrave Microsoft Activation Scripts (MAS) section before Microsoft-supported license recovery or WinGet tools. It explains four upstream methods (HWID, Ohook, TSforge and Online KMS), links the original PowerShell and BAT/CMD documentation, upstream troubleshooting and GitHub issues, and clearly identifies MAS as an independent third-party project. The page does not mirror or auto-execute third-party activation scripts. Built-in Windows status-check controls keep their existing IDs and behavior.

The new responsive section uses 4-column desktop, 2-column tablet and 1-column mobile method layouts. It includes source-first calls to action, prominent security and licensing context, and a separate Microsoft-supported diagnostics area. PWA cache v24 and the CSS asset query string ensure the updated layout can reach existing installations.

**Deployment caution:** Merge to GitHub is not proof of automatic Hostinger deployment. Verify https://connect.vweb.dev/#pc in desktop and mobile browsers, PWA update, external docs links, and working WinGet/diagnostic controls.

---

## Windows and Office activation + clearer navigation — October 20, 2026

- Renamed **Tool Studios** to **Workspaces** (#studios) and **Quick Utilities** to **Quick Actions** (#tools) in desktop, mobile, search, contextual navigation and PWA shortcuts. Existing routes, IDs and working tools remain unchanged.
- Windows & Office Help (#pc) now includes Office account/subscription troubleshooting, official Microsoft Windows/Office help links, and an explicitly third-party Massgrave MAS reference describing HWID, Ohook, TSforge and Online KMS with original GitHub/PowerShell and BAT/CMD guides. Connect neither hosts nor executes the scripts.
- Updated static asset query version and PWA service-worker cache v23.

**Production verification:** GitHub changes must be deployed to Hostinger, then #pc, #studios and #tools checked on desktop, mobile and installed PWA. A GitHub commit does not prove a live deployment.

---

## Mobile native-style experience — October 19, 2026

Mobile Connect is now organized like an installed app: persistent five-tab bottom navigation (Home, Tools, Apps, Learn, More), compact app header with previous-screen navigation and global search, and a multi-level bottom-sheet menu that opens from the bottom rather than the side. The More stack groups Tools & Create, Learn & Explore, Windows & Services and My Connect, with a Back control, focus trapping, Escape/backdrop dismissal and a downward swipe gesture on the sheet handle/header. Existing AI Studio, Convert Studio and Quick Utilities tabs remain touch-scrollable. Layout respects phone safe-area insets and reduced motion. Desktop sidebar and all existing application routes remain unchanged. No extra paid APIs, hardware or libraries.

Static assets now include `assets/mobile-app.js` and `assets/mobile-app.css`; service worker static cache v22 precaches both. The PWA manifest adds launch shortcuts. **GitHub push is not proof of Hostinger auto-deployment**: confirm the live URL, Android/iOS Safari/Chrome behavior, installed PWA navigation, keyboard focus and browser Back manually.

---

## Media retirement completed — October 19, 2026

The public Watch & Discover and Discover sections and their navigation/routes were already retired. Their remaining media publishing entry points are now fully disabled: `/admin/media.php` and `/api/media.php` return HTTP 410 without querying the database; the admin content editor no longer offers retired Watch placements. The obsolete public `data/entertainment.json` file was removed from this repository, and Apache rejects requests to its legacy URL. Installed PWA cache is now v21 to clear stale media assets. Games & Quizzes (`#play`) and its six games remain. **No existing database tables or historical media records were deleted.**

---

## Watch & Discover / Discover retirement — October 18, 2026

Both public sections were removed from desktop and mobile navigation, app routing, pages, contextual links, and their browser-side media catalog fetches. The Watch page's on-demand collections and podcasts, and Discover's Open Library book finder, are no longer available. Previous `#watch`, `#discover`, `#tv`, and `#listen` URLs redirect to Overview. Games & Quizzes (`#play`) and all six browser games remain operational. The PWA shell was advanced to v20; current public assets use `connect-focus-20261018b`. Existing CMS/database records were not deleted. Historical descriptions below refer to earlier releases, not the active navigation.

---

## Connected experience refresh — October 18, 2026

This release improves the whole VWEB.DEV Connect experience while preserving the free/browser-first architecture and retiring no additional modules.

- **Site navigation:** contextual breadcrumbs and related destinations on all 14 non-home sections, improved keyboard focus on route changes and focus-visible controls.
- **Homepage:** direct journeys for local conversion, Windows setup and learning; eight main shortcuts; four counts from the current verified local catalog.
- **Find everything:** global search and Ctrl+K now index all ten individual Quick Utilities; choosing a result opens the correct active tool, without losing its existing input.
- **App Directory:** purpose shortcuts plus grid/list view, with official publisher links, saved apps and pagination intact.
- **Windows & PC Help:** WinGet pack builder now displays up to seven removable package chips with an accurate selection count and compact overflow indicator. Script generation remains local.
- **My Workspace:** one-click links for utilities, software, learning and file conversion. Saved Quick Utilities now persist beside favorite apps in the same local workspace; export/import accepts old files without pins.
- **PWA:** static cache v19, revised asset URLs and native route-title focus. Embedded catalog remains available if the network is slow.
- **Quality:** new cross-page source tests. Anonymous visitors do not incur new PHP calls, no additional paid tools/API keys or hardware are required.

**Publish and verify:** Deploy `main` to Hostinger for `connect.vweb.dev`, verify that Cloudflare and the service worker serve a matching HTML/CSS/JS version, then test desktop and mobile navigation, search, App Directory list/grid, selected package removal and the offline catalog. GitHub push does not independently establish that the live deployment succeeded. External apps, YouTube, Puter and PDF/QR helper libraries depend on their respective services and allowances.

---

## Tools Visibility Reliability Fix (October 2026)

The Tool Studios section now has seven navigable HTML fallback cards and the homepage has static tool/app links, making the interface useful even if the catalog JavaScript does not run. A complete editor-curated static JSON snapshot is embedded in index.html. assets/hub.js renders it immediately, then revalidates data/connect-hub.json in the background with a timeout. If the external static catalog fails, the embedded catalog is preserved and an optional retry notice appears instead of empty cards. Quick tools initialize independently so one optional widget cannot stop the whole directory. Service worker upgraded to v17 and assets use cache-busting URLs.

**Deployment:** Publish updated index.html, assets/hub.js, assets/style.css, sw.js and data/connect-hub.json together, and ensure Cloudflare does not serve mixed versions. Hard refresh or reinstall stale PWA only if browser still shows the previous layout. The GitHub commit alone is not a live deployment. Run tests/tools-visibility.test.mjs, check #studios/#apps/#tools/#convert on actual mobile and desktop devices, and test both successful and simulated-failing JSON catalog requests.

## Current release — Focused Tools & Learning (2026-10-18)

The Free Internet / ISP dashboard, PPPoE linking, learning reward points, hotspot voucher redemption and network gateway features are retired. Old routes redirect to My Workspace. Retired APIs return HTTP 410 without opening MySQL. Historical tables and data were NOT dropped. Follow local retention obligations before any deletion.

Anonymous homepage visits no longer fetch member, rewards, ISP, public CMS or on-demand media CMS APIs. The optional member API loads after the user visits #account; public offers/community CMS loads after visiting those sections; media CMS is fetched after visiting #watch or #discover. The static JSON catalog and browser-first tools remain available.

App Directory: web/Windows formats, categories, sorting, search, saved apps and 12-at-a-time pagination; prominent software pack CTA on the homepage. Community administration handles merchant moderation, support tickets and opt-in notifications. Fresh installations can use db/community.sql to create only account/community tables. Existing deployments should NOT drop legacy database records.

Support requests are fetched from an authenticated member-tickets.php endpoint instead of the retired ISP dashboard. Service worker cache v16.

**Deployment action:** Disable any previously scheduled ISP agents such as ops/radius_agent.py or ops/gateway_agent.py in your actual hosting/router environment. Updating GitHub alone does not stop external cron tasks or clear live legacy data.
# VWEB.DEV Connect — Phase 1

Official project repo: https://github.com/vweb-dev/connect.vweb.dev

## Status

Deployable Phase 1 PWA starter. Working responsive homepage, original VWEB.DEV header logo referenced from its approved external image URL, curated service/offers library with search and category filters, private device-side saved deals, first-party promotional cards, browser-only image compression, password generation, text tools and JSON formatting, optional Puter AI Chat & Image generation, evergreen learning guides, installable PWA, and offline cached interface.

No fabricated coupon codes, fake live news, mock ISP usage or fake earned internet quotas. The My Internet and Rewards modules explicitly show integration pending. Coupon administration, authenticated first-party ads dashboard, account linking, push back end and live ISP reports are NOT part of this initial deployable static release.

## Deploy Hostinger (main branch)

1. In Hostinger hPanel add/choose a **separate website** for connect.vweb.dev, using HTTPS. Make sure it has its **own document root**.
2. Dashboard → Advanced → Git → Connect with GitHub.
3. Authorize private repository **vweb-dev/connect.vweb.dev** and select **main**.
4. Deploy into **this website's public_html**, not the main vweb.dev site's folder. Ensure initial deployment target is empty and no existing website files would be replaced.
5. Check https://connect.vweb.dev, click Free Tools, test on mobile, and confirm service worker loads over HTTPS.
6. Turn on auto-deployment only after verifying the root path.

No npm, composer, PHP extensions, database migration or environment secrets are needed. This also works as a static build on Cloudflare Pages later.

## File layout

- index.html: all UI sections
- assets/style.css: dark responsive interface
- assets/app.js: navigation, offer/filter UI, local tools, lazy Puter SDK, PWA install
- assets/connect-icon.svg: neutral standalone PWA icon (not a replacement VWEB.DEV logo)
- manifest.webmanifest: install metadata
- sw.js: same-origin static cache/offline fallback
- .htaccess: Apache headers, MIME types and directory protection

## Costs

No new paid hosting or API credentials required. Existing Hostinger and ISP bandwidth/electricity cost remain. Puter use is paid by the end user's own allowances/credits and **not unlimited free**. Browser-only tools do not upload files to our server.

## Limitations & launch requirements

- Puter login/AI generation requires access to Puter services; a restrictive Wi-Fi gateway would need tested domain exceptions.
- No real-time ISP billing/RADIUS read access is present. **Never commit PPPoE secrets, ONT shared passwords or SSH credentials**.
- Keep ISP integrations read-only through an authorized, secured private sync service.
- Real promotions/affiliate codes require verification, attribution, and disclosure before publication.
- Public community news should be verified and dated before it is listed as live.
- The PWA installed experience does not turn into a full in-app external browser.

## Next releases

Phase 2: private PHP/MySQL APIs, approved coupon and own ads CMS, customer authentication/linked PPPoE accounts, opt-in notifications. Phase 3: read-only MikroTik/RADIUS synchronization, outdoor free Wi-Fi gateway quota rewards, merchant integrations.

© VWEB.DEV

## Phase 2 — CMS, verified coupons, news and own ads

CMS backend is included under api/, admin/, db/ and docs/. It stays disabled until you configure Hostinger MySQL and an outside-webroot private configuration file. Read docs/phase2-setup.md for the one-time install; do not put actual secrets in GitHub.

- Secure administrator sign-in and one-time setup.
- Publish/schedule/expire coupon, local news and first-party sponsored content.
- Public API for dynamically adding live CMS items to static-first PWA.
- Click counts for sponsored destinations (approximate, not billable or confirmed conversions).
- Draft/published review states, minimal sponsored placements, external source URLs.
- PWA gracefully falls back to Phase 1 content when the database is unavailable.

Note: This release does **not** connect PPPoE usernames, MikroTik SSH, RADIUS, ISP billing data, Wi-Fi quota redemption or real push subscription. These require further authorized private integration.


## Consolidated modules release

The main branch includes member accounts, independent PPPoE ownership approval,
RADIUS read-only sync, learning-points wallet, optional isolated ISP guest
voucher gateway, optional opt-in Web Push, merchant submissions, support tickets
and administration. Operational features require server configuration and ISP
permission. See [All-modules guide](docs/all-modules-setup.md).


## Puter authentication flow

AI Studio loads Puter.js when the user navigates to AI Studio and presents a separate **Connect Puter Account** control. The SDK finishes loading before the button becomes usable. Clicking Connect directly invokes `puter.auth.signIn()` synchronously from the click handler (required for popup blockers), then displays the signed-in username and offers sign-out/switch-account actions. AI model actions require a signed-in Puter user; browser tools and VWEB.DEV member accounts remain independent. Some mobile in-app browsers/guest Wi-Fi gateways block Puter popups or SDK domains; open the PWA URL directly in Chrome/Edge/Firefox and test `https://js.puter.com/v2/` reachability. A full live OAuth flow cannot be verified without a real user browser and authorized Puter account.


## Puter login troubleshooting patch (October 2026)

AI integration is now in **assets/puter-ai.js**, independent of the main PWA bundle. Both scripts and CSS use versioned URLs to bypass stale service worker assets after deployment. A user must authorize **this website origin** with Puter even if logged into puter.com in another tab. AI Studio reports SDK-loading, signed-in, and generation errors separately. The **Test AI connection** button sends a small *user-initiated* request (and may use account allowance). Browser service worker upgraded to v6 with network-first JavaScript fetching. If the UI still shows the initial unchanging Puter status, verify that the new HTML and both JS resources are deployed; try hard refresh or clear just this site's data. Running Puter authentication in embedded browsers or closed-network hotspots may require opening in Chrome or adding the Puter domains to network allowlists.


## Visible Puter generation feedback (October 2026)

The standalone AI Studio script maintains a per-tool, in-page **indeterminate** animated bar, real elapsed wall time, status messages for unusually long waits, and a floating activity tray that stays visible when navigating across PWA pages. Buttons cannot re-submit the same task until the current request resolves. Text and media output show completed time or a real provider error. No fake completion percent, cost, or invented job status is reported. A user-selectable video **test mode** calls `puter.ai.txt2vid(prompt,true)` as documented by Puter; the returned sample is **not** a real generated clip and does not consume generation credits. Regular video calls can take several minutes and Puter returns the Promise when the clip is ready. Leaving/reloading the page may lose the in-browser result while a provider request is still processing; the interface avoids implying it can stop remote processing.


## AI Studio media layout containment

Media outputs from Puter are mounted in a bounded responsive frame rather than directly inside a grid card. Video players (including SDK HTMLVideoElement returns with intrinsic dimensions or inline styles) are constrained to the card, preserving 16:9, portrait, or square orientation via metadata when available. Image results are similarly bounded. Small-screen playback uses a compact player, and versioned asset URLs plus the v8 service worker invalidate stale PWA CSS and AI JavaScript.


## AI Studio tabs (October 2026)

AI Studio now has four proper ARIA tabs: Ask AI, Images, Videos and Captions. Each tab preserves its prompt, generated media, progress timer, and output when switching tools. Only the selected panel is displayed, so video previews cannot overlap another AI tool. Desktop uses a focused prompt/preview workspace, mobile uses compact 2×2 tabs and vertically stacked editor/preview. JavaScript supports mouse/touch and Left/Right/Home/End keyboard navigation. A background generation continues on the same page while another tab is shown, with a visible status dot and the existing floating activity tray. Closing/reloading still interrupts the local UI and may not stop upstream Puter processing.


## VWEB Entertainment (October 2026)

The PWA now includes **VWEB TV, Watch, Radio & Podcasts, Play & Learn, and Discover**, with a new mobile browse drawer, an official source directory, Radio Browser integration, Spotify official embeds, local favorites, Open Trivia DB plus offline games, Open Library search, and optional admin-curated media/first-party sponsorship. All provider streams play directly in the browser, never proxied by Hostinger. Use `/admin/media.php` for optional database-backed content curation after database setup. Review `docs/all-modules-setup.md` for licensing, configuration and testing instructions. Not every official channel permits embedding; VWEB opens their official source when it does not. No newly added content is asserted live unless the publisher has verified it.


## Convert Studio: VERT-inspired, independently implemented (2026-10)

Open \`/#convert\` for four local file-processing workspaces:

| Module | What actually works on device | Important limitations |
| --- | --- | --- |
| Image Lab | Batch PNG/JPEG/WebP conversion, resize, quality, rotation, AVIF only if browser supports it, individual downloads or single ZIP | 20 files per batch, max 40 megapixels/image, canvas output 8192 px max |
| PDF Studio | Merge PDFs, extract page ranges, split PDFs to per-page ZIP, images to A4 PDF | pdf-lib 1.17.1 downloads from jsDelivr on demand; encrypted PDFs may fail; max 120 pages for ZIP split |
| Audio Studio | Decode browser-compatible audio, trim, export PCM 16-bit WAV | MP3/M4A/OGG decode support varies; WAV is **larger** than compressed input, max 30-minute track |
| Video Studio | Capture individual JPEG/PNG/WebP still frames from browser-playable video at a chosen time | This is frame extraction **not** MP4/WEBM transcoding; advanced conversions link out to VERT |

These are original VWEB.DEV JavaScript implementations and **do not copy VERT's AGPL source**. VERT is linked as an independent external tool for advanced video/file codecs. No customer file is uploaded to our API, Hotspot, PHP/MySQL or Puter. Browser CPU/RAM/storage usage still applies; a third-party PDF library is fetched as code, not as an upload of your files.

Entertainment reliability: official radio listening destinations remain available even if the community directory, stream codec, geo-rights or insecure feed prevents in-page playback; TV cards always expose provider links. This does not imply any third-party channel stream is guaranteed live.

## VWEB.DEV Connect 2.0 — six integrated phases

1. Homepage redesign: unified search and purposeful navigation with featured courses, tools and software.
2. Video Academy: two creator-led verified YouTube courses arranged as 23 manually curated timestamped chapters, plus native YouTube playlist URL import, notes and manual progress.
3. PC & Windows Help: genuine Windows activation guidance, official Microsoft links, and curated WinGet package command builder; no keygens or activation bypass.
4. Apps & PWA Directory: curated 21 official web/software destinations, filters, saved apps and install guidance; it does not force-install third-party PWAs.
5. Tool Studios: seven grouped existing workspaces, removing homepage repetition and adding lazy-loaded client-side QR generation.
6. My Workspace: browser-local recent sections, saved apps, course progress, notes, JSON export/import/clear.

Production: catalogs load from data/connect-hub.json; application UI loads assets/hub.js. Hostinger serves static code/catalog only. YouTube, linked PWAs and software stay on their publishers' sites. Existing ISP/backend/ads/AI code is retained. No SQL migration is required.

Deploy newest main to Hostinger, invalidate PWA v12 cache, test main routes on mobile and desktop, and run the smoke tests in tests/connect20.test.mjs. Any external YouTube embedding restrictions or outdated software links need periodic source review. Imported playlists use YouTube's own native playlist viewer; custom lesson titles cannot be extracted without YouTube Data API.

Legacy single-image compressor remains in the DOM for JS compatibility but is visually consolidated into Convert Studio's richer Image Lab. The existing data/text utilities remain accessible under Quick Utilities.
NaN

## Windows Software Hub and retirement of unstable streaming (October 18, 2026)

- 73 curated software/web apps and publisher links. 34 packages have WinGet IDs; package availability can change and should be verified with `winget show --id PACKAGE_ID --exact` prior to installation.
- WinGet Builder: search/filter package cards without losing selection, choose Essentials/Creator/Developer/Creative/Privacy/Media presets, copy commands, export inspectable .cmd/.ps1 files, or export a VWEB-format JSON catalog. Scripts contain only user-selected WinGet commands and run **only when the user chooses to execute them on Windows**.
- Windows Activation: genuine Microsoft methods and read-only `slmgr /xpr` .cmd status checker. Separate, explicitly *unofficial* GitHub link to Microsoft Activation Scripts (MAS) and its traditional CMD/BAT documentation; Connect does not embed, host, mirror or auto-run third-party activation scripts or claim a Microsoft endorsement. A valid license remains the supported path.
- Retired broken Live TV/Radio: removed pages, menu links, community radio fetcher/HLS code, TV listings, and new TV publishing in admin/public media API. Old hash links redirect to Watch. On-demand documentaries, podcasts, games and Open Library remain.
- All downloads and media are served by official publishers; Hostinger only serves small code and JSON. No database migration required.
