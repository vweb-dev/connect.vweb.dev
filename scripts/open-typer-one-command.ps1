# Install and optionally publish the pinned Open-Typer browser runtime.
# From a clean local Git clone:
# powershell -ExecutionPolicy Bypass -File scripts/open-typer-one-command.ps1 -Publish
param([switch]$Publish)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root
$gitRoot=(git rev-parse --show-toplevel 2>$null)
if($LASTEXITCODE -ne 0 -or !$gitRoot){throw 'Not inside a Git clone. Clone vweb-dev/connect.vweb.dev first.'}
if([IO.Path]::GetFullPath($gitRoot).TrimEnd('\') -ne [IO.Path]::GetFullPath($root).TrimEnd('\')){throw 'Run in the Connect repository root.'}
$remote=git remote get-url origin 2>$null
if($LASTEXITCODE -ne 0 -or $remote -notmatch 'vweb-dev[/:]connect\.vweb\.dev(\.git)?$'){throw 'Git origin is not the expected Connect repository.'}
if(git status --porcelain){throw 'Working tree is not clean. Commit or stash changes first.'}
if($Publish){
 $branch=git branch --show-current
 if($branch -ne 'main'){throw 'Publishing requires checked out main branch.'}
 git fetch origin main
 if($LASTEXITCODE -ne 0){throw 'Cannot fetch origin/main.'}
 git merge-base --is-ancestor origin/main HEAD
 if($LASTEXITCODE -ne 0){throw 'Local main is behind or diverged. Sync it before publishing.'}
}
& (Join-Path $PSScriptRoot 'install-open-typer-web.ps1')
if(!(Test-Path 'apps/open-typer/manifest.json')){throw 'Installer did not create the runtime manifest.'}
if(!(Test-Path 'apps/open-typer/open-typer.wasm')){throw 'Compiled WebAssembly runtime is missing.'}
if(-not $Publish){Write-Host 'Assets installed locally. Run with -Publish to commit and push.';exit 0}
git add -f -- apps/open-typer
if($LASTEXITCODE -ne 0){throw 'Unable to stage runtime files.'}
git diff --cached --quiet -- apps/open-typer
if($LASTEXITCODE -ne 0){
 git commit -m 'Install official Open-Typer browser runtime'
 if($LASTEXITCODE -ne 0){throw 'Git commit failed.'}
}
git push origin HEAD:main
if($LASTEXITCODE -ne 0){throw 'Git push failed. Assets remain local.'}
Write-Host 'Runtime committed and pushed. Verify Hostinger and test typing interactions in browser.'
