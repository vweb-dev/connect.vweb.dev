# Publish Open-Typer after installing compiled files into this local repository.
# Requires Git configured to push to the existing connected GitHub repository.
# Run from repository root: powershell -ExecutionPolicy Bypass -File scripts/publish-open-typer.ps1
$ErrorActionPreference="Stop"
$root=(Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root
$dir=Join-Path $root "apps/open-typer"
$required=@("open-typer.js","open-typer.wasm","open-typer.worker.js","qtloader.js","index.html","manifest.json")
foreach($name in $required){if(!(Test-Path (Join-Path $dir $name))){throw "Missing $name — run install-open-typer-web.ps1 first"}}
$size=(Get-Item (Join-Path $dir "open-typer.wasm")).Length
if($size -lt 1000000){throw "WASM file unexpectedly small"}
$status=git status --porcelain -- apps/open-typer
if(!$status){Write-Host "No uncommitted Open-Typer changes.";exit 0}
git add -- apps/open-typer
git diff --cached --quiet -- apps/open-typer
if($LASTEXITCODE -eq 0){Write-Host "Nothing to commit.";exit 0}
git commit -m "Deploy official pinned Open-Typer WASM assets"
Write-Host "Prepared commit. Review before pushing:"
git log -1 --oneline
Write-Host "Push manually using: git push origin main"
Write-Host "After Hostinger deploy, run: python scripts/verify-open-typer-production.py"
