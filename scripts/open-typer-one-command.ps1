# One-command Open-Typer install + GitHub publication, initiated on your Windows PC.
# Run from a clean local clone only. Requires Git and internet access.
param([switch]$Publish)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root
if((git rev-parse --show-toplevel 2>$null) -ne ($root -replace '\\','/')) {
 Write-Host 'Confirming local Git working tree...'
}
$changes=git status --porcelain
if($changes){throw 'Working tree has uncommitted changes. Commit or stash them before installation.'}
& (Join-Path $PSScriptRoot 'install-open-typer-web.ps1')
if($LASTEXITCODE -and $LASTEXITCODE -ne 0){throw 'Installer failed'}
$verify=Join-Path $root 'apps/open-typer/manifest.json'
if(!(Test-Path $verify)){throw 'Runtime manifest missing'}
$binary=Join-Path $root 'apps/open-typer/open-typer.wasm'
if(!(Test-Path $binary) -or (Get-Item $binary).Length -lt 1000000){throw 'Incomplete WASM runtime'}
if(-not $Publish){
 Write-Host 'Installation complete locally. Rerun with -Publish to create and push the generated assets.'
 exit 0
}
git add -- apps/open-typer
git diff --cached --quiet -- apps/open-typer
if($LASTEXITCODE -ne 0){git commit -m 'Install official Open-Typer browser runtime'}
git push origin HEAD:main
if($LASTEXITCODE -ne 0){throw 'Git push failed; installation remains local'}
Write-Host 'GitHub push complete. Hostinger deployment and browser QA require separate verification.'
