# Phase 2 — First-party Coupons, News and Advertising CMS

This is a **free PHP 8.1+ / MySQL** backend for Hostinger. It runs from the same origin as the existing PWA, minimizing CORS/security complexity. Public PWA continues to work with its static fallback when backend is not set up.

## Secure installation (Hostinger)

1. Set up a separate MySQL database/user through hPanel; assign that database user privileges to its own database only.
2. Find the website's document root. Typical layout:
   /home/ACCOUNT/domains/connect.vweb.dev/public_html/
3. Copy the EXAMPLE from docs/private-config.example.php and create the **real** PHP file at:
   /home/ACCOUNT/domains/connect.vweb.dev/connect-secrets.php
   (one level **above** public_html). Never place it inside public_html, commit it to GitHub or paste its contents into chat.
4. Fill in your actual MySQL host, database, user and password, and a long, private random setup_token.
5. Visit https://connect.vweb.dev/admin/ . Use the **one-time setup** form: enter the exact private setup token, choose an admin username, and a strong 12+ character password. This initializes the tables and creates the first admin.
6. Sign in. Create drafts, preview their titles/links in the table, and publish only genuine verified content.
7. Visit /api/public.php and check the returned categories. Visit public PWA Home, Deals and Community pages. No customer router credentials are needed.
8. Remove the setup_token value from the private config after installation or rotate it; the one-time setup path refuses to add a second admin.

## Supported content types

- Coupon: title, summary, source/brand, category, optional verified promo code, HTTPS destination, publish dates.
- News: original short summary, source/brand, source URL, UTC schedule/expiry. No scraped full copyrighted article.
- Advertisement: first-party native card with sponsor name, placement and priority, HTTPS destination, publish dates.
- Every record supports Draft/Published status and start/end dates. Expired items are automatically hidden.
- Advertisement redirect counts are *approximate clicks* and **not confirmed sales**, validated impressions or billable unique visits.

## Security and constraints

- HTTPS-only administrator access, server-side sessions with HttpOnly, Secure and Strict cookies, CSRF tokens, prepared SQL statements, password hashing, input validation.
- Credentials loaded from a PHP file OUTSIDE the public document root. Codebase contains only a template.
- No exposed SSH / MikroTik / RADIUS credentials or customer data.
- Never link other merchants with made-up codes; disclose sponsored/affiliate placements. Verify merchant programme terms.
- Public API is read-only; it is cacheable for one minute. PWA falls back to its built-in static offers if CMS is offline.
- Admin logs out on demand; the first admin is installed only once. Limit admin URLs at Cloudflare (free rules) if possible.
- No live PPPoE sync, ISP customer account linking, quota rewards or push registration in this phase.
- Mixed or older router administrative credentials are not accessed by this CMS.
