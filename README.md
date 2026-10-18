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
