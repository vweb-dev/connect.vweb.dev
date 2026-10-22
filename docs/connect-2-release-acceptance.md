# Connect 2.0 — Production acceptance and release checklist

Release candidate: v81 (2026-10-22)

## Automated checks (required on every push)
- JS syntax, PHP syntax and JSON validity.
- All dedicated tool URLs have unique IDs and paths.
- QR and conversion workspaces exist.
- FAST.com iframe and optional Ookla comparison remain available.
- Sponsored VWEB.DEV cards use embedded graphics with unique SVG IDs.
- PWA precache paths exist; a single optional fetch must not stop installation.
- Prevent repeat-inserted discovery search bars.

## Manual browser checks (still required; do not claim certified until executed)
1. Desktop 1440/1280/1024px: homepage, tools, convert, QR, LMS, apps, Windows, Daily Desk and network pages.
2. Mobile 320/375/390/430px: topbar, bottom tabs, scroll, sheet close/back, safe area and landscape.
3. Every dedicated tool route: navigate from search and category sheet, direct URL, refresh, browser back, and retry offline where appropriate.
4. QR: every type, form validation, default-expanded how-to/customization, live preview, PNG/SVG/WebP/JPEG exports and smartphone scan.
5. Convert: image/PDF/audio/video with representative local files; unit temperature boundaries; CSV quoting; UTF-8 Base64 and all copy/export buttons.
6. LMS: course thumbnails, filters, lessons, course progress and resume behavior.
7. Apps: category navigation, working official links, trust labels, and external link sheet behavior.
8. Windows: software install links, activation guidance and no duplicate search/unused panels.
9. Network: FAST.com iframe loads, results render and Ookla comparison link opens.
10. PWA: install prompt, icons, repeated updates, cold cache, network outage, data persistence, and recovery.
11. Accessibility: tab order, visible focus, semantic headings, contrast, reduced motion, keyboard modal focus and screen reader labels.
12. SEO: canonical, title, meta, sitemap, robots, page source links and structured data across public routes.
13. Growth: test all four service CTA destinations, original VWEB.DEV logo, advertising disclosure and track only privacy-safe aggregated conversions.
14. Performance: capture mobile and desktop Lighthouse and field Core Web Vitals before and after changes; fix proven bottlenecks.

## Principles
- All new software, hosting and API spend remains zero where possible.
- No modifications to common ISP router credentials.
- Preserve FAST.com speed test and original brand logo.
- Shipping code is not equivalent to live user acceptance. This checklist remains open pending real-device verification.
