$Version = $args[0]
if (-not $Version) {
  Write-Host "Usage: release.ps1 <version>"
  Write-Host "  e.g. release.ps1 1.0.0"
  exit 1
}

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$DistDir = Join-Path $RootDir 'dist'
$ReleaseDir = Join-Path (Join-Path $RootDir 'releases') $Version

Write-Host "=== Nowly Host v$Version release ==="
Write-Host ""

# Build binaries
Write-Host ">> Building binaries..."
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

$env:GOOS = 'windows'
$env:GOARCH = 'amd64'
& go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$Version" -o (Join-Path $DistDir 'nowly-host.exe') ./cmd/host
Write-Host "   + nowly-host.exe"

$env:GOOS = 'linux'
$env:GOARCH = 'amd64'
& go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$Version" -o (Join-Path $DistDir 'nowly-host-linux') ./cmd/host
Write-Host "   + nowly-host-linux"

$env:GOOS = 'darwin'
$env:GOARCH = 'amd64'
& go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$Version" -o (Join-Path $DistDir 'nowly-host-darwin') ./cmd/host
Write-Host "   + nowly-host-darwin (Intel)"

$env:GOOS = 'darwin'
$env:GOARCH = 'arm64'
& go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$Version" -o (Join-Path $DistDir 'nowly-host-darwin-arm64') ./cmd/host
Write-Host "   + nowly-host-darwin-arm64 (Apple Silicon)"
Write-Host ""

Write-Host ">> Fetching brand icon from CDN..."
New-Item -ItemType Directory -Force -Path (Join-Path $RootDir 'assets') | Out-Null
Invoke-WebRequest -Uri "https://cdn.nowly.me/brand/favicons/favicon-192.png" -OutFile (Join-Path $RootDir 'assets\icon.png')
Write-Host ""

# Create release directory
New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null

# Windows installer (Inno Setup)
$Iscc = Get-Command 'iscc' -ErrorAction SilentlyContinue
if (-not $Iscc) {
  $isccPaths = @(
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
  )
  foreach ($p in $isccPaths) {
    if (Test-Path $p) { $Iscc = $p; break }
  }
}
if ($Iscc) {
  Write-Host ">> Building Windows installer..."
  & "$Iscc" (Join-Path $RootDir 'installer.iss') `
    "/DAPP_VERSION=$Version"
  $SetupExe = Join-Path $DistDir 'NowlySetup.exe'
  if (Test-Path $SetupExe) {
    Copy-Item $SetupExe (Join-Path $ReleaseDir 'nowly-setup.exe')
    Write-Host "   + nowly-setup.exe"
  }
} else {
  Write-Host "   ! iscc not found - skipping Windows installer"
}
Write-Host ""

# Windows portable
$HostExe = Join-Path $DistDir 'nowly-host.exe'
if (Test-Path $HostExe) {
  Write-Host ">> Creating Windows portable..."
  $zipPath = Join-Path $ReleaseDir 'nowly-windows.zip'
  Compress-Archive -Path $HostExe -DestinationPath $zipPath -Force
  Write-Host "   + nowly-windows.zip"
}
Write-Host ""

# Linux archive
$LinuxBin = Join-Path $DistDir 'nowly-host-linux'
if (Test-Path $LinuxBin) {
  Write-Host ">> Creating Linux archive..."
  $tarPath = Join-Path $ReleaseDir 'nowly-linux.tar.gz'
  & tar -czf $tarPath -C $DistDir 'nowly-host-linux'
  Write-Host "   + nowly-linux.tar.gz"
}
Write-Host ""

# macOS archive
$MacFiles = @()
if (Test-Path (Join-Path $DistDir 'nowly-host-darwin')) { $MacFiles += 'nowly-host-darwin' }
if (Test-Path (Join-Path $DistDir 'nowly-host-darwin-arm64')) { $MacFiles += 'nowly-host-darwin-arm64' }
if ($MacFiles.Count -gt 0) {
  Write-Host ">> Creating macOS archive..."
  $tarPath = Join-Path $ReleaseDir 'nowly-macos.tar.gz'
  & tar -czf $tarPath -C $DistDir @MacFiles
  Write-Host "   + nowly-macos.tar.gz"
}
Write-Host ""

# Generate latest.json
Write-Host ">> Generating latest.json..."

function Get-Sha256($path) {
  if (Test-Path $path) {
    return (Get-FileHash $path -Algorithm SHA256).Hash.ToLower()
  }
  return ''
}

function Get-FileSize($path) {
  if (Test-Path $path) {
    return (Get-Item $path).Length
  }
  return 0
}

$ReleasedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

$latest = @{
  version = $Version
  releasedAt = $ReleasedAt
  windows = @{
    installer = @{
      url = 'https://cdn.nowly.me/installer/nowly-setup.exe'
      sha256 = Get-Sha256 (Join-Path $ReleaseDir 'nowly-setup.exe')
      size = Get-FileSize (Join-Path $ReleaseDir 'nowly-setup.exe')
    }
    portable = @{
      url = 'https://cdn.nowly.me/installer/nowly-windows.zip'
      sha256 = Get-Sha256 (Join-Path $ReleaseDir 'nowly-windows.zip')
      size = Get-FileSize (Join-Path $ReleaseDir 'nowly-windows.zip')
    }
  }
  linux = @{
    archive = @{
      url = 'https://cdn.nowly.me/installer/nowly-linux.tar.gz'
      sha256 = Get-Sha256 (Join-Path $ReleaseDir 'nowly-linux.tar.gz')
      size = Get-FileSize (Join-Path $ReleaseDir 'nowly-linux.tar.gz')
    }
  }
  macos = @{
    archive = @{
      url = 'https://cdn.nowly.me/installer/nowly-macos.tar.gz'
      sha256 = Get-Sha256 (Join-Path $ReleaseDir 'nowly-macos.tar.gz')
      size = Get-FileSize (Join-Path $ReleaseDir 'nowly-macos.tar.gz')
    }
  }
}

$latest | ConvertTo-Json | Set-Content (Join-Path $ReleaseDir 'latest.json') -Encoding UTF8
Write-Host "   + latest.json"
Write-Host ""

# Summary
Write-Host "=== Release v$Version ready ==="
Write-Host "Output: $ReleaseDir"
Write-Host ""
Get-ChildItem $ReleaseDir | Select-Object Name, Length | Format-Table -AutoSize
