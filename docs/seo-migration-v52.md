# Connect SEO URL migration (v52)

Public URLs use clean routes: /tools, /qr, /convert, /ai, /academy, /apps, /pc, /network, /daily, /studios, /play, /community and /offers.

## Hosting requirements
- Hostinger site must deploy updated main branch, including hidden files such as .htaccess.
- Apache/mod_rewrite + PHP must be enabled; DirectoryIndex seo.php is used for /.
- Opening /qr in a private browser tab and refreshing must return HTTP 200 text/html with a unique title, description, canonical and WebPage JSON-LD.
- Verify /sitemap.xml and /robots.txt return 200. /account and /dashboard are not in the sitemap and serve noindex headers in rendered HTML.
- Old /#qr links continue to work through compatibility routing; canonical URL is /qr.

## Google and Bing
1. Verify site ownership in https://search.google.com/search-console and https://www.bing.com/webmasters.
2. Submit https://connect.vweb.dev/sitemap.xml to both.
3. Inspect /qr, /ai, /tools, /convert, /academy, /daily via URL Inspection / URL Inspection Tools; request indexing only after the deployment has been verified.
4. Track indexed pages and coverage. Sitemap submission does not guarantee indexing or ranking.
5. Content quality, original descriptions, good crawlable links, performance, Core Web Vitals, accessibility and meaningful page text still need ongoing SEO work.
6. GEO/AI search visibility is not guaranteed by clean URLs or JSON-LD alone; publish useful original content and ensure it can be crawled.

## QA
- Confirm canonical tags are self-referential and titles differ by URL.
- Check 200 vs 404 statuses, browser back/forward, refresh, PWA navigation and redirects.
- Review unknown routes, alternate case URLs and /index.html duplicate access in staging.
- Ensure no accidental robots.txt or host-level indexing block from deployment.
