# Connect v59 — individual tool and course routes

## Architecture
A shared browser-first application shell powers **49 directly addressable tool workspaces** without duplicating their processing engines. One canonical route registry (`data/tool-routes.json`) drives PHP SEO metadata, client route resolution, bottom-sheet links, related tools, and sitemap entries. Each route selects one workspace and hides unrelated tools.

The six parent directories are `/tools`, `/convert`, `/qr`, `/ai`, `/daily`, and `/pc`. Tool pages use `/tools/<slug>`, `/convert/<slug>`, `/qr/<slug>`, `/ai/<slug>`, `/daily/<slug>`, `/windows/<slug>`, or `/network/speed-test`.

Five LMS course pages use `/academy/course/<id>`. The Academy catalog and lessons share the existing course records, player, notes, quizzes and progress.

## Deployment requirements
1. Deploy `.htaccess`, `seo.php`, `index.html`, `data/tool-routes.json`, `data/connect-hub.json`, all revised JavaScript/CSS and `sw.js` to Hostinger.
2. Enable PHP and Apache mod_rewrite. Confirm `/tools/password-generator`, `/convert/pdf`, `/qr/wifi`, `/ai/chat`, `/daily/calculator`, `/windows/activation`, `/network/speed-test` and `/academy/course/python` return **200 OK** after a hard refresh.
3. Check one page from every tool category on desktop and mobile. Verify only the selected workspace shows, processing buttons still work, and a Back/Forward navigation restores correct state.
4. Verify `/sitemap.xml` includes **68 unique URLs** (14 directory pages, 49 tool pages and 5 course pages); confirm unique canonical, title, description, WebPage and breadcrumb structured data.
5. Check old `/tools?tool=json` and `/#tools` bookmarks. Browser history should still resolve the intended tool or directory.
6. Submit the sitemap after production validation in Google Search Console and Bing Webmaster Tools. Indexing and ranking are not guaranteed.

## Known follow-up opportunity
The new URLs are true server-addressable pages with unique SEO metadata and focused UIs. They currently **reuse the shared HTML/JS shell** to prevent regressions and keep infrastructure free. Splitting page-specific HTML and code bundles into smaller payloads would improve first-load performance but needs separate integration and browser testing. Do not claim the shared bundle has already been fully code-split.

Puter AI models can require provider credits. Microsoft activation references do not imply Microsoft endorsement or license entitlement.
