# VWEB.DEV Connect — All-Modules Deployment & ISP Integration Guide

This repository contains the **software implementation**, not a claim that the
real ISP, billing server, Cloudflare, customers, Hostinger database or hotspot
is already connected. Connections to external infrastructure must be authorized
and configured on that infrastructure.

## Required environment

- Hostinger Business with PHP 8.2+ and MySQL (existing subscription).
- Cloudflare DNS, HTTPS and independent connect.vweb.dev website root.
- Existing MikroTik PPPoE, RADIUS, optional authorized read-only ISP database access.
- Existing ISP server capable of running a Python 3 cron if live RADIUS sync is desired.
- No additional paid API/subscription. Puter AI still has end-user credit limits.

## 1. Deploy the branch

Link your private GitHub repository \`vweb-dev/connect.vweb.dev\`, branch \`main\`,
to **its own** connect.vweb.dev Hostinger document root. NEVER target the primary
vweb.dev website's public_html. For a private repo use Hostinger's GitHub authorization.
Avoid uploading real .env or passwords to Git.

## 2. Initialize both database phases

- Create a NEW isolated MySQL database/user in Hostinger hPanel.
- Place \`connect-secrets.php\` (from docs/private-config.full.example.php)
  **one directory ABOVE** this subdomain's public_html (not web-accessible).
- Fill DB credentials; choose private random first-admin setup_token.
- At \`https://connect.vweb.dev/admin/\`, initialize admin & Phase 2 tables.
- Then sign in and open \`/admin/operations.php\`, select "Install application tables".
- After first admin setup REMOVE/ROTATE the setup token.
- Confirm \`/api/public.php\`, \`/api/member.php\` and \`/api/rewards.php\` respond.
- Confirm normal users can register/log in and submit one educational quiz.

## 3. ISP PPPoE account dashboard — independent of Huawei/mixed ONTs

- A PWA member submits a PPPoE username **without its password**.
- Staff verify subscriber ownership through the ISP's existing authorized
  contact/billing record, then click Approve in /admin/operations.php.
- The private ISP-side agent pushes usage summaries to /api/isp-sync.php.
  Public PWA never reaches MikroTik SSH/API and never stores shared ONT admin credentials.
- Install \`ops/requirements.txt\` on the EXISTING ISP host:
  \`python3 -m pip install -r ops/requirements.txt\`.
- Use an ISP-side MySQL RADIUS account with **SELECT on radacct only**.
- Configure ISP-side private environment variables detailed in
  \`ops/radius_agent.py\`. In the Hostinger private configuration, define
  the same 32+ character \`isp_sync_key\`. Never commit this value.
- Test with one authorized account first. Run via existing server cron every
  ~5–15 min *if performance permits*.
- **Important**: built-in SQL works on common FreeRADIUS \`radacct\` schema
  and is labelled \`session_start_estimate\`. It counts sessions started this
  month; if a long PPPoE session crosses midnight/month boundary, it is NOT an
  authoritative billing-month total. Replace it with your billing software's
  correct accounting query/API before making billing claims.
- "Online" is hidden when sync records are older than 15 minutes.

## 4. Free Wi-Fi, points and quota

- Bullet M2's open SSID can remain open, with isolated basic access.
- Rewarded quota is **separate** from existing ISP PPPoE subscribers.
- Points are earned through short learning quizzes, daily capped, without
  purchase/affiliate click incentives.
- Actual redeemed MB require ISP permission and an existing isolated
  MikroTik HotSpot/gateway/VLAN. Open SSID ≠ no accounting gateway.
- A minimal RouterOS 7 voucher agent is provided in \`ops/gateway_agent.py\`
  and must run exclusively on an authorized private ISP management host.
- Do not set \`gateway_enabled=true\` until HTTPS REST, HotSpot profile,
  management network isolation and both API directions have been tested.
- Voucher jobs remain pending until acknowledged; do not falsely display
  pending points as usable internet.
- Open public Wi-Fi requires applicable Pakistani regulatory/ISP approval.
  Shared customer ONT admin credentials and current PPPoE configuration remain
  unchanged; avoid managing customer ONTs from the public PWA.

## 5. Optional push notifications

- Requires VAPID signing keys, PHP Composer, \`minishlink/web-push\` (open source)
  and a CLI cron on existing Hostinger/managed machine.
- Install dependencies into app root: \`composer install --no-dev\`.
- Place VAPID keys only in the **private config**, never Git.
- Optional marketing permission is OFF by default; account holder opts in.
- Browser push subscriptions are stored only after explicit permission.
- Prepare campaign in /admin/operations.php, then manually Queue.
- A CLI cron (e.g. every 15 minutes) invokes
  \`php /ABSOLUTE/PATH/TO/public_html/ops/push-send.php\`.
- Browsers/push services may refuse subscriptions. Accepted-for-delivery
  is not equivalent to user having read a notification.
- Do not send high-frequency or irrelevant promotions.

## 6. Coupons, news, first-party advertising & merchants

- The CMS in /admin/ publishes scheduled, expiring coupons, verified local news,
  ASTER, Shopify, Hostinger and approved sponsor cards.
- /admin/operations.php moderates merchant submissions; merchant approval is
  separate from sponsoring/advertising publication.
- Only one sponsored placement per section. Click tracking is approximate,
  NOT verified sales or unique impressions. No Google ad network required.
- Do not invent discounts. Follow Hostinger/Daraz/affiliate terms and disclose
  referral relationships as necessary.

## 7. Zero additional subscription cost — limitations

- Static PWA/browser tools execute client-side; Puter requests are processed
  by Puter and billed against user allowances/credits.
- PHP/MySQL API still consumes existing Hostinger resources.
- Background sync and push need available existing machines or Hostinger cron.
- Open Wi-Fi has real bandwidth and electricity cost.
- No built-in third-party SMS/OTP. ISP ownership verification is done manually
  by ISP staff using existing records, not from a claimed username alone.
- Do not claim a live internet dashboard before the ISP sync has been configured.
- Do not claim a push notification was delivered merely because it was queued.

## Testing checklist

1. Homepage + mobile nav + offline shell open with no database.
2. Admin starts with private config outside web root; first admin setup once only.
3. Operations schema creates all tables; reject reused setup token.
4. Registration, sign-in, CSRF, logout and session isolation.
5. Unverified PPPoE claims display NO usage, admin independent approval.
6. ISP sync signed HMAC with nonces, reject stale/replayed requests.
7. When offline/stale, online indicator is NOT shown as live.
8. Quiz daily cap + duplicate claim, no MB conversion without gateway.
9. Merchant and ticket moderation; no automatic sponsor publication.
10. Marketing opt-in OFF by default; push only with explicit subscription.
11. Hostinger PHP/server logs have no public display of private secrets.

**Not yet verified**: actual billing schema, credentials, production PHP, RouterOS
version/HotSpot service, network/ISP permissions, web push cron and real PWA
deployment. These depend on live user-owned services and cannot be faked.


### Minimum-necessary RADIUS collection

Set CONNECT_TARGETS_URL=https://connect.vweb.dev/api/isp-targets.php in the authorized ISP agent. It fetches only approved PPPoE usernames through a signed HTTPS request; the SQL query then reads only those accounts. Account-link requests must first be verified independently by ISP staff. Existing router credentials and PPPoE configurations are not modified.


### Run source checks without a GitHub runner

From the deployed site document root over SSH, run `bash ops/self-check.sh`. It uses PHP lint, optional Node checks and Python AST parsing without paid services. This does not verify actual MySQL, SSL, push delivery, router management or billing-data accuracy. Configure and smoke-test those separately.



# Entertainment modules (October 2026)

Public-facing additions: \`#tv\`, \`#watch\`, \`#listen\`, \`#play\`, \`#discover\`.
All media is **provider-direct**; Hostinger only hosts HTML, static JSON and
optional PHP/MySQL metadata. Never enable video proxy, restreaming, scraping
or automatic CDN mirroring on Hostinger.

## What works without a database

- Static curated TV/watch/podcast/learning directory: \`data/entertainment.json\`.
- DW News verified official YouTube livestream embed (publisher may disable it).
- Official NASA+, NASA Live, Euronews, France 24, Al Jazeera, PTV, TED and
  educational links that open at their publishers.
- Radio Browser direct browser search + playback and local favorites; HTTPS
  stations only in the inline player, insecure feeds are not proxied.
- Spotify embedded podcasts when the official \`show\` ID is valid; provider
  controls playback, region restrictions and subscriptions.
- Trivia through Open Trivia DB (CC BY-SA 4.0; one call per IP per 5 seconds).
  An original offline set is used when the remote API is unavailable.
- Memory, math, flags, word scramble and mini Sudoku entirely in the browser.
  Official Lichess chess puzzle destination.
- Open Library search from the browser, subject to its API availability.
- Persistent local favorites for TV/radio; no sign-in required.
- Small-screen Browse drawer; single active TV/podcast/radio player strategy,
  lazy provider embeds and minimal video memory load.

## Activate entertainment publishing on Hostinger

1. Pull the latest \`main\` to your **separate** connect.vweb.dev document root.
2. Ensure PHP/MySQL CMS was initialized at \`/admin/\` as documented earlier.
3. Open \`https://connect.vweb.dev/admin/media.php\` while signed in.
4. Click **Initialize entertainment catalog**: this creates the new table and
   extends your existing own-ad placement enum to include
   TV, Watch, Radio & Podcasts, and Games.
5. Create a **Draft** first, enter an official HTTPS URL, provider details,
   and independent proof that the publisher permits the selected embed.
6. Confirm source and rights, then Publish. Only approved reviewed entries
   are returned by \`/api/media.php\` and merged into the PWA catalog.
7. In the existing Ads Manager at \`/admin/\`, create clearly labelled
   sponsored cards using the new placements. Only one sponsor appears per
   section. Sponsorships are separate from embedded players.

Never label an arbitrary HLS/IPTV playlist as authorized. Generic HLS entries
are only allowed with an explicit licensed-stream confirmation. Licensed HLS uses native Safari playback where supported, or lazy-loaded
hls.js 1.7.3 from the public jsDelivr CDN in compatible browsers. The stream
must allow CORS and must be licensed; the external publisher link remains the
fallback when no compatible player is available. Do not treat this as a
fully-featured IPTV player or assume third-party terms automatically permit
embedding. This is an independent media **directory**, not a content owner.

## Quality assurance

- Desktop: navigate all four entertainment pages, search and favorite a TV listing.
- Play the official DW YouTube embed then leave TV; iframe should unload.
- Radio: search PK/GB/US stations, try HTTPS stations, pause/close the bottom
  dock; external streams may be geo-blocked or unavailable.
- Podcasts: select a Spotify item, open provider player and switch back to radio.
- Games: verify quiz scoring and offline fallback, memory matching, flag
  quiz, unscramble, math and Sudoku checks.
- Discover: query Open Library, navigate to an official book listing.
- Admin: verify drafts are NOT public, published entries require rights
  confirmation, and new approved entries are visible in catalog.
- Ads: verify sponsored labels, correct placement and secure redirects.
- Mobile: test navigation drawer and bottom tabs, no cropped players.
- Offline: the PWA shell and cached local catalog are available after the
  first visit; radio/external streaming/live APIs do NOT work offline.
- No DNS/hosting/ISP plan changes and no new paid service are required.
  Provider limits, ISP bandwidth, existing hosting and power cost remain.

## Sources and rights

- YouTube Embed: https://support.google.com/youtube/answer/171780
- Spotify: https://developer.spotify.com/documentation/embeds/
- Radio Browser API: https://api.radio-browser.info/
- Open Trivia DB: https://opentdb.com/api_config.php
- NASA official live: https://www.nasa.gov/live/
- Open Library API: https://openlibrary.org/developers/api

Production checklist must include permissions review, user-specific external
API limitations, mobile/browser tests and ISP bandwidth forecasting. Never
imply partner endorsement by external media providers.
