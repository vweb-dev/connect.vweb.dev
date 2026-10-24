# API Anything integration strategy for Connect

Source project: https://github.com/vweb-dev/api-anything (fork of goodnight000/api-anything, MIT).

## Architecture distinction
API Anything is a **local Node.js command/MCP server**, not a hosted API endpoint. Its learned operations are request templates executed on the machine running the CLI. Connect is a static/PHP website deployed on existing Hostinger hosting. Do not expose API Anything's local authentication profile, browser sessions, or learned private-site credentials to visitors.

## Integration shipped
- Connect Learning > Dictionary & Books > Tech articles now provides a browser-side read-only article search.
- Reference: the fork's `sites/hacker-news.json` documents a Hacker News search operation. The Connect implementation deliberately uses the openly documented `hn.algolia.com/api/v1/search` GET endpoint instead of replaying the spec's browser-specific Algolia key, fingerprinted headers and POST payload.
- Browser fetches run **only on explicit user search/click**, limited to 12 results per request, 9-second timeout, cancelled on subsequent search.
- No API secrets, local CLI service, paid infrastructure or scraping proxy.
- Users leave Connect for original article publishers. Their own sites' policies and content restrictions apply.

## Existing public APIs retained
- Dictionary: https://dictionaryapi.dev/ (lookup; browser API)
- Book catalogs: https://gutendex.com/ and https://openlibrary.org/developers/api (browser-side search and external reading links)

## Optional developer-only API Anything CLI
For **approved sites** where a direct API is unavailable, build and validate operations locally, explicitly checking authorization, terms of use, rate limits, provenance and data sensitivity. Read `INSTALL.md` in the fork. Requires Node 22.13+ and Git, and a Chromium browser for learning browser requests. Avoid using automated requests on login-gated/private third-party services without proper authorization. Private cookies and tokens stay local; never commit them, send them to Connect visitors, or deploy a raw API Anything proxy to public hosting. The package is not published to npm yet. This local tooling is NOT required for the feature shipped above.

## Future integrations
Only add sites whose endpoint is permitted and whose browser-side CORS/terms allow this usage, or an explicit authorized and rate-limited server adapter with no new paid cost. Every integration must disclose provider, rate limits, license and failure behavior. Some APIs require attribution or disallow high-volume/commercial use.
