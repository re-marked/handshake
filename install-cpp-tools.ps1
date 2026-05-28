# Run this as Administrator (right-click → Run with PowerShell, or from an admin terminal)
# Installs VS C++ Build Tools — required for Tauri/Rust on Windows

$installer = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe"

Write-Host "Installing C++ Build Tools..." -ForegroundColor Cyan

& $installer install `
  --productId Microsoft.VisualStudio.Product.BuildTools `
  --add Microsoft.VisualStudio.Workload.VCTools `
  --includeRecommended `
  --passive `
  --norestart

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done! Open a new terminal and run: pnpm tauri dev" -ForegroundColor Green
} else {
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "If a progress window appeared and finished, it may have worked anyway — try pnpm tauri dev in a new terminal." -ForegroundColor Yellow
}
