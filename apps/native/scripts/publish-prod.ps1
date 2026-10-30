$Version = $args[0]
if (-not $Version) {
  Write-Host "Usage: publish-prod.ps1 <version>"
  Write-Host "  e.g. publish-prod.ps1 1.0.0"
  exit 1
}

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$MonorepoRoot = Resolve-Path (Join-Path $RootDir '..\..')
$ReleaseDir = Join-Path (Join-Path $RootDir 'releases') $Version

Write-Host "=== Publishing Nowly Host v$Version to CDN ==="
Write-Host ""

# Check all required files exist
$RequiredFiles = @(
  'nowly-setup.exe',
  'nowly-windows.zip',
  'nowly-linux.tar.gz',
  'nowly-macos.tar.gz'
)

$Missing = $false
foreach ($file in $RequiredFiles) {
  $path = Join-Path $ReleaseDir $file
  if (-not (Test-Path $path)) {
    Write-Host "   x Missing: $path"
    $Missing = $true
  }
}

if ($Missing) {
  Write-Host ""
  Write-Host "Build the release first:"
  Write-Host "  make release HOST_VERSION=$Version"
  exit 1
}

Write-Host "   + All artifacts found in releases/$Version/"
Write-Host ""

# Publish to CDN via the private internal CLI (separate repository).
$InternalCliDir = if ($env:INTERNAL_CLI_DIR) { $env:INTERNAL_CLI_DIR } else { Join-Path $MonorepoRoot 'packages\internal-cli' }
if (-not (Test-Path (Join-Path $InternalCliDir 'node_modules'))) {
  Write-Host "   x internal-cli not ready at $InternalCliDir"
  Write-Host ""
  Write-Host "Clone nowly-presence/internal-cli there and run npm install, or set INTERNAL_CLI_DIR."
  exit 1
}

Push-Location $InternalCliDir
try {
  & npx tsx index.ts host:publish `
    --release-version $Version `
    --installer (Join-Path $ReleaseDir 'nowly-setup.exe') `
    --portable (Join-Path $ReleaseDir 'nowly-windows.zip') `
    --linux (Join-Path $ReleaseDir 'nowly-linux.tar.gz') `
    --macos (Join-Path $ReleaseDir 'nowly-macos.tar.gz')
  if ($LASTEXITCODE -ne 0) {
    throw "internal-cli host:publish failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "=== Done! v$Version published to CDN ==="
