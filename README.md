# VWEB.DEV Connect

A zero-additional-subscription-cost, mobile-first PWA starter for VWEB.DEV: browser tools, curated offers, services, and optional Puter AI.

**Status:** deployable Phase 1. No ISP integration, RADIUS sync, user account system, live quota/rewards, push subscriptions, paid ad serving, or live news feed is connected yet. The UI labels unavailable modules. No mock user data is represented as real.

## Hostinger deployment

1. In hPanel, create/select the **separate connect.vweb.dev website**, never the main vweb.dev site.
2. Dashboard > Advanced > Git > Connect with GitHub.
3. Authorize private repository vweb-dev/connect.vweb.dev and select branch **main**.
4. Select the document root of the **separate Connect website** (normally its own public_html). Initial deployment target should be empty; do not overwrite other websites.
5. Click Deploy; enable auto-deployment after checking the first release.
6. Enable HTTPS and check https://connect.vweb.dev on a phone.

Plain HTML/CSS/JS: no build step, PHP server, database migration or API secrets. Compatible with future Cloudflare Pages migration.

## Working features

- Responsive accessible home, service promotions and navigation.
- Curated offers in data/offers.json: genuine landing links, not fabricated coupon codes.
- Local-only tools: image compressor, password generator, text tools and URL utility.
- Optional Puter.js image generation and AI chat: end users are subject to credits and login.
- PWA manifest, offline service worker, in-app local navigation and install affordance.
- Unconnected network dashboard and rewards modules explicitly labelled not connected.

## Future modules (not yet enabled)

- Hostinger PHP/MySQL API with verified accounts, coupons CMS, first-party ad manager and opted-in web push.
- ISP-side **authorized, read-only** MikroTik/RADIUS sync; never expose SSH, RADIUS or shared ONT admin passwords to browsers.
- Separate free outdoor Wi-Fi quota gateway, isolated from PPPoE customers.
- Reliable live news feed with attribution and consent-based marketing.

## Cost & safety

- No paid dependency to deploy starter. Existing Hostinger/bandwidth/electricity costs still apply.
- Puter uses end-user allowances/credits; free AI use is not unlimited.
- Browser image processing does not upload files to VWEB.DEV.
- Never commit router credentials, API keys, ISP customers, billing data or environment secrets.
- Verify discount eligibility and affiliate programme terms before publishing specific codes.
- Do not reward affiliate clicks or use deceptive forced ads.

## Files

index.html, assets/app.css, assets/app.js, assets/icon.svg, data/offers.json, manifest.webmanifest, sw.js, .htaccess.

Copyright VWEB.DEV. Third-party trademarks are their owners' property.
