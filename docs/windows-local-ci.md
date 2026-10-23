# VWEB.DEV Connect — Free Local CI (Windows 11)

No GitHub-hosted runners, Docker, npm install, Composer install, paid API, or always-on PC required.

## Step 1 — Install on Windows Terminal / PowerShell
Run each command individually:
```powershell
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
winget install --id PHP.PHP.8.2 -e --source winget
```
These are no-cost tools. PHP 8.2 matches the repository's GitHub workflow (Composer requirement >=8.2). If WinGet says a package cannot be found, try `winget search PHP.PHP` and use a supported version >=8.2.

**Close and reopen PowerShell** after installation, then confirm:
```powershell
git --version
node --version
php --version
```
No password or account tokens should ever be pasted into commands or committed to the repo.

## Step 2 — Clone private repo (first time only)
```powershell
New-Item -ItemType Directory -Force C:\VWEB | Out-Null
Set-Location C:\VWEB
git clone https://github.com/vweb-dev/connect.vweb.dev.git
Set-Location C:\VWEB\connect.vweb.dev
```
If GitHub requests authentication, use Git Credential Manager/browser login. GitHub account needs access to this private repository; do **not** embed credentials in a URL.

## Step 3 — Run all checks locally
```powershell
Set-Location C:\VWEB\connect.vweb.dev
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-ci.ps1
```
This checks:
- All JavaScript files in assets and sw.js: `node --check`.
- PHP in api/admin/ops/docs recursively: `php -l`.
- JSON: manifest, composer, tool routes, hub catalog.
- Required deployment files.
- All `tests/*.test.mjs` with `node --test`.

Fast syntax/asset check:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-ci.ps1 -Quick
```
If PHP cannot be installed immediately (limited check only):
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-ci.ps1 -SkipPhp
```
Exit code 0 = all included checks passed; exit code 1 = at least one failed. CI is not equivalent to browser E2E QA.

## Step 4 — Update and rerun
```powershell
git pull --ff-only
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-ci.ps1
```
Only push/deploy after checks pass; no automatic deployment is configured by this script.

## Billing safety
GitHub repository pushes are separate from GitHub Actions. To stop additional **GitHub-hosted runner attempts**, disable Actions on the repository under Settings > Actions > General or disable its workflow. This does not cancel existing billable usage, invoices, or payment restrictions. Do not make a client project public only to save CI cost.

Local execution uses your existing PC electricity and internet; zero **additional paid software or cloud runner fees**, not literally zero operating cost.

## Security
Run tests on trusted source only; Node tests and PHP run with your user's local privileges. Use a normal Windows account, keep Windows Defender enabled, never store production passwords in the project, and do not use a public or third-party runner for private client code.

## Local CI is distinct from Hostinger deployment
Passing tests only validates the local checkout. Confirm the exact Git commit deployed to connect.vweb.dev separately, via Hostinger's deployment configuration or a version marker. Never assume a GitHub push updated production.
