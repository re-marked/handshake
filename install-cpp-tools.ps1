# Self-elevating — will UAC-prompt if not already admin
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process PowerShell -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait
    exit
}

$installer = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe"

Write-Host "Installing C++ Build Tools (10-15 min, progress window will appear)..." -ForegroundColor Cyan

& $installer install `
  --productId Microsoft.VisualStudio.Product.BuildTools `
  --channelId VisualStudio.17.Release `
  --add Microsoft.VisualStudio.Workload.VCTools `
  --includeRecommended `
  --passive `
  --norestart

Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Yellow
Write-Host "Open a new terminal and run: pnpm tauri dev" -ForegroundColor Green
Read-Host "Press Enter to close"
