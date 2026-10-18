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