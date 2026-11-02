# Install pinned official Open-Typer WebAssembly assets from Windows PowerShell.
# Run in a clone of vweb-dev/connect.vweb.dev:
# powershell -ExecutionPolicy Bypass -File scripts/install-open-typer-web.ps1
$ErrorActionPreference = "Stop"
$rev = "61db1f4914341b578a707f71e9df001cca4f45d8"
$base = "https://raw.githubusercontent.com/Open-Typer/web-app/$rev"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dest = Join-Path $root "apps/open-typer"
$stage = Join-Path ([IO.Path]::GetTempPath()) ("open-typer-" + [guid]::NewGuid().ToString("N"))
$names = @("open-typer.html", "open-typer.js", "open-typer.wasm", "open-typer.worker.js", "qtloader.js", "qtlogo.svg")
New-Item -Path $stage -ItemType Directory -Force | Out-Null
try {
  foreach ($name in $names) {
    Write-Host "Fetching $name"
    $saved = Join-Path $stage $name
    $sources = @("$base/$name", "https://cdn.jsdelivr.net/gh/Open-Typer/web-app@$rev/$name")
    $downloaded = $false
    foreach ($source in $sources) {
      try {
        Invoke-WebRequest -Uri $source -OutFile $saved -MaximumRedirection 5 -TimeoutSec 120
        if ((Get-Item $saved).Length -eq 0) { throw "Empty file" }
        $downloaded = $true
        break
      } catch {
        Write-Warning ("Download failed from " + ([uri]$source).Host + ": " + $_.Exception.Message)
        Remove-Item $saved -ErrorAction SilentlyContinue
      }
    }
    if (-not $downloaded) { throw "Unable to download $name from either upstream mirror." }
  }
  Copy-Item (Join-Path $stage "open-typer.html") (Join-Path $stage "index.html")
  $wasm = Join-Path $stage "open-typer.wasm"
  if ((Get-Item $wasm).Length -lt 1000000) { throw "WASM binary too small" }
  $stream = [IO.File]::OpenRead($wasm)
  try {
    $bytes = New-Object byte[] 4
    if ($stream.Read($bytes,0,4) -ne 4 -or [BitConverter]::ToString($bytes) -ne "00-61-73-6D") { throw "Invalid WASM magic bytes" }
  } finally { $stream.Dispose() }
  $manifest = @{
    engine = "Open-Typer"
    ready = $true
    entrypoint = "/apps/open-typer/index.html"
    javascript = "/apps/open-typer/open-typer.js"
    wasm = "/apps/open-typer/open-typer.wasm"
  } | ConvertTo-Json
  New-Item -Path $dest -ItemType Directory -Force | Out-Null
  Remove-Item (Join-Path $dest "manifest.json") -ErrorAction SilentlyContinue
  foreach ($name in $names + @("index.html")) { Copy-Item (Join-Path $stage $name) (Join-Path $dest $name) -Force }
  [IO.File]::WriteAllText((Join-Path $dest "manifest.json"), $manifest, [Text.UTF8Encoding]::new($false))
  Write-Host "Prepared local files at: $dest"
  Write-Host "Commit/upload apps/open-typer/ to your hosting. Runtime browser validation still required."
} finally {
  Remove-Item $stage -Force -Recurse -ErrorAction SilentlyContinue
}
