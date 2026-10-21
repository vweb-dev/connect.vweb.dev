# Connect v60 — Routing, Layout & Search Audit

## Confirmed root causes
1. **Unclosed Network page:** `#page-network` lacked a closing `</section>`. The Windows (`#page-pc`), Apps (`#page-apps`) and Dashboard (`#page-dashboard`) pages were inadvertently nested inside the Network page. When hidden by router, these pages could disappear or render in unexpected places.
2. **Unclosed desktop shell:** `<div class="shell">` was not closed before mobile tabs and overlays, causing invalid document containment and possible layout / overlay problems.
3. **Legacy search index:** Home and Ctrl+K search used a small static quick-tool list and routed results through old hash links, ignoring many of the 49 dedicated tool URLs.
4. **Hidden obsolete target:** The Tools sheet's "View full Tools" action scrolled to an obsolete directory that the newer route renderer hid, instead of the visible 49-tool index.
5. **Fragile focused-tool initialization:** v59 relied on tab event handlers and Quick Actions having already moved a card into the active workspace, without displaying a recovery state on failure.
6. **Directory discoverability:** `/tools` was showing only the original Quick Actions subset in its server-rendered markup, and the replacement directory had no visible search.

## Implemented corrections
- Balanced and validated all 16 main page containers as direct children of `<main>`.
- Closed the desktop shell before mobile tabs and dialog overlays.
- Integrated all 49 registered tool routes, 73 publisher apps and 5 LMS courses into Search and Ctrl+K.
- Rank exact title and URL matches ahead of broad category aliases; support common search variations.
- Built a responsive, searchable 49-tool directory with family filters and "Show more" pagination.
- Restored canonical tool navigation from search, Tools/Explore sheets, and directory links.
- Resolved hidden tabs and details on opening tool routes, added Quick Actions card recovery and a visible retry state if a workspace is unavailable.
- Corrected sheet scroll-to-directory behavior.
- Exposed all 49 links server-side in `/tools` for crawlability even when client JavaScript fails.
- Bumped updated JS/CSS references and the PWA cache to v60.
- Added dependency-free `node --test tests/connect-smoke.test.mjs` regression tests.

## What was verified
Source validation for 16 correctly nested pages, 49 unique tools and target controls, 68 XML sitemap URLs, page assets, six search test cases, and modified JS syntax.

## Still to verify on hosting
Actual Hostinger deployment synchronization, Apache/PHP responses for deep routes, CSS rendering at real breakpoints, and real interaction with AI/PDF/QR/browser-native APIs. Live website could not be accessed in this session. Do not describe hosting/browser checks as passed.

Recommended production spot checks:
- `/tools`, `/tools/password-generator`, `/tools/json-formatter`
- `/qr/wifi`, `/convert/pdf`, `/ai/chat`
- `/daily/calculator`, `/windows/activation`, `/network/speed-test`
- `/apps`, `/dashboard`, `/academy/course/python`
- Search queries: "QR WiFi", "JSON formatter", "Windows activation", "PDF", "Power Tools".
