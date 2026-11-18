$ErrorActionPreference = "SilentlyContinue"
Write-Host "Stopping any existing uvicorn and cloudflared processes..."
Get-Process cloudflared | Stop-Process -Force
Get-NetTCPConnection -LocalPort 8000 | ForEach-Object {
    if ($_.OwningProcess -gt 0) {
        Stop-Process -Id $_.OwningProcess -Force
    }
}
Write-Host "Cleanup completed."
