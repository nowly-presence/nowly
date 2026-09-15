param([string]$Version)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$DistDir = Join-Path $RootDir 'dist'

Write-Host "=== Building Windows binary + installer ==="
Write-Host "Version: $Version"
Write-Host ""

New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

$env:GOOS = 'windows'
$env:GOARCH = 'amd64'
& go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$Version" -o (Join-Path $DistDir 'nowly-host.exe') ./cmd/host
Write-Host "  + nowly-host.exe"

Write-Host ">> Fetching brand icon from CDN..."
New-Item -ItemType Directory -Force -Path (Join-Path $RootDir 'assets') | Out-Null
Invoke-WebRequest -Uri "https://cdn.nowly.me/brand/favicons/favicon-512.png" -OutFile (Join-Path $RootDir 'assets\icon.png')
python -m pip install --quiet pillow
python (Join-Path $ScriptDir 'make-installer-ico.py') --png (Join-Path $RootDir 'assets\icon.png') --out (Join-Path $RootDir 'installer.ico')

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
& "$Iscc" (Join-Path $RootDir 'installer.iss') "/DAPP_VERSION=$Version"

$SetupExe = Join-Path $DistDir 'NowlySetup.exe'
if (Test-Path $SetupExe) {
  Write-Host "  + NowlySetup.exe"
}
Write-Host ""
Write-Host "=== Done ==="
