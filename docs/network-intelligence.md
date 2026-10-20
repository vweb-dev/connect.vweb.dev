# Connect Network Intelligence — deployment notes

## Live components
- Official Statuspage public APIs: existing browser-side feed cards; individual providers control CORS/availability.
- Cloudflare Speedtest: existing browser-side measurements. Results reflect Cloudflare route, not an ISP-certified line rate; compare wired tests repeated 3 times with Fast.com/Ookla.
- Connect synthetic availability: `api/network-health.php` checks a fixed allowlist of 4 services from the Hostinger PHP server, cached for 5 minutes. A successful HEAD response does **not** confirm a full application's health, nor availability from Pakistan.
- Cloudflare Radar: `api/radar-outages.php` queries last 7 days' global annotations (limit 50), then shows PK events. Configure the `CLOUDFLARE_RADAR_TOKEN` environment variable **on Hostinger server**. No hardcoded token. No claim that this is a complete Pakistan incident list.
- RIPE Atlas: public measurements explorer and API documentation are linked, but measurements are not misrepresented as current Pakistan outage status.

## Upptime (not deployed automatically)
To activate long-term Upptime monitoring, create a separate **public** GitHub repository from https://github.com/upptime/upptime, copy the example configuration below as `.upptimerc.yml`, then enable GitHub Actions + Pages per Upptime documentation. The private Connect repository is **not** currently a published Upptime status site. Use a separate repository to avoid disclosing private source or secrets. Confirm Actions quotas and domain monitoring policies before running it.

Example configuration:
```yaml
owner: vweb-dev
repo: connect-uptime
sites:
  - name: VWEB.DEV Connect
    url: https://connect.vweb.dev/
  - name: VWEB.DEV
    url: https://vweb.dev/
  - name: GitHub
    url: https://github.com/
status-website:
  name: Connect Uptime
  introTitle: Independent endpoint reachability
  introMessage: Checks from GitHub runners. These are not provider-wide outage claims.
```

## Verification
- Confirm Hostinger deploy actually tracks GitHub main.
- Check PHP cURL availability and file read permissions.
- Verify `/api/network-health.php` JSON and no caching secrets.
- Validate Radar account permission, token configuration and API response.
- Validate actual browser CORS/network failures for Statuspage feeds.
- Test download/upload on Wi-Fi and Ethernet against a second measurement provider.
