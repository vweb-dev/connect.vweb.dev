# VWEB.DEV Connect local CI - Windows PowerShell 5.1+ / PowerShell 7
[CmdletBinding()]
param([switch]$Quick,[switch]$SkipPhp)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root
$script:failed=0
function Check-Tool([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "$name not found on PATH. Install it, reopen PowerShell, and retry." }
}
function Run-Check([string]$label,[scriptblock]$action) {
  Write-Host "`n>>> $label" -ForegroundColor Cyan
  try {
    & $action
    if ($LASTEXITCODE -ne 0) { throw "Exit code $LASTEXITCODE" }
    Write-Host "PASS: $label" -ForegroundColor Green
  } catch {
    $script:failed++
    Write-Host "FAIL: $label - $_" -ForegroundColor Red
  }
}
Check-Tool node
if (-not $SkipPhp) { Check-Tool php }
Write-Host "VWEB.DEV Connect Local CI | $root"
Write-Host ("Node: "+(& node --version))
if (-not $SkipPhp) { Write-Host ("PHP: "+(& php --version | Select-Object -First 1)) }
$jsFiles=@(Get-ChildItem (Join-Path $root 'assets') -Filter '*.js' -File; Get-Item (Join-Path $root 'sw.js'))
foreach ($file in $jsFiles) {
  Run-Check "JS syntax: $($file.Name)" { & node --check $file.FullName }
}
if (-not $SkipPhp) {
  $phpFiles=@()
  foreach($dir in @('api','admin','ops','docs')) {
    $full=Join-Path $root $dir
    if(Test-Path $full) { $phpFiles+=@(Get-ChildItem $full -Filter '*.php' -File -Recurse) }
  }
  foreach($file in $phpFiles) { Run-Check "PHP syntax: $($file.FullName.Substring($root.Length+1))" { & php -l $file.FullName } }
}
foreach($name in @('manifest.webmanifest','composer.json','data/tool-routes.json','data/connect-hub.json')) {
  Run-Check "JSON: $name" {
    $null=Get-Content (Join-Path $root $name) -Raw -Encoding UTF8 | ConvertFrom-Json
  }
}
Run-Check 'Deployment files exist' {
  foreach($p in @('index.html','.htaccess','sw.js','admin/index.php','admin/operations.php','api/public.php','api/member.php','api/member-tickets.php','db/schema.sql','db/community.sql')) {
    if(-not(Test-Path (Join-Path $root $p))) { throw "Missing $p" }
  }
}
if(-not $Quick) {
  $tests=@(Get-ChildItem (Join-Path $root 'tests') -Filter '*.test.mjs' -File | Sort-Object Name | ForEach-Object FullName)
  if($tests.Count -gt 0) { Run-Check "Node test suite ($($tests.Count) files)" { & node --test @tests } }
}
Write-Host "`nSummary: $script:failed failed checks" -ForegroundColor $(if($script:failed){'Red'}else{'Green'})
if($script:failed){exit 1}else{exit 0}
