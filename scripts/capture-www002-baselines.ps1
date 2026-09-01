param(
  [string]$BaseUrl = "http://127.0.0.1:8080",
  [string]$OutDir = (Join-Path (Join-Path $PSScriptRoot "..") "baseline")
)

$ErrorActionPreference = "Stop"
$OutDir = [System.IO.Path]::GetFullPath($OutDir)
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$script = Join-Path $PSScriptRoot "capture-www002-baselines.mjs"
if (-not (Test-Path $script)) {
  throw "Missing $script"
}

Write-Host "WWW-002 baseline capture -> $OutDir"
Write-Host "Base URL: $BaseUrl"

Push-Location (Join-Path $PSScriptRoot "..")
try {
  Push-Location $PSScriptRoot
  if (-not (Test-Path "node_modules/playwright")) {
    Write-Host "Installing Playwright (scripts/)…"
    npm install --no-fund --no-audit
  }
  npx playwright install chromium 2>$null | Out-Null
  node (Join-Path $PSScriptRoot "capture-www002-baselines.mjs") --base-url $BaseUrl --out-dir $OutDir
} finally {
  Pop-Location
}

Write-Host "Done. Review PNG files in baseline/"
