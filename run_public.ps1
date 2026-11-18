$ErrorActionPreference = "Continue"
$projectRoot = "C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus"
$backendDir = Join-Path $projectRoot "backend"
$pythonExe = "C:\Users\swarp\AppData\Local\Programs\Python\Python312\python.exe"
$cloudflared = Join-Path $projectRoot "cloudflared.exe"
$tunnelLog = Join-Path $projectRoot "tunnel.log"
$serverOutLog = Join-Path $projectRoot "server_out.log"
$serverErrLog = Join-Path $projectRoot "server_err.log"
$urlFile = Join-Path $projectRoot "public_url.txt"

# Check if backend is already responding on port 8000
$serverReady = $false
try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 2
    if ($res.StatusCode -eq 200) {
        $serverReady = $true
        Write-Host "Backend is already running and healthy on http://127.0.0.1:8000!"
    }
} catch {}

$serverProcess = $null
if (-not $serverReady) {
    Write-Host "Starting MindBridge FastAPI backend on http://127.0.0.1:8000..."
    $serverProcess = Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $backendDir -RedirectStandardOutput $serverOutLog -RedirectStandardError $serverErrLog -PassThru
    
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $res = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 2
            if ($res.StatusCode -eq 200) {
                $serverReady = $true
                Write-Host "FastAPI server started and is responding!"
                break
            }
        } catch {}
    }
}

if (-not $serverReady) {
    Write-Host "ERROR: FastAPI server failed to respond on port 8000."
    exit 1
}

# Stop any existing cloudflared
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force }

Write-Host "Starting Cloudflare Quick Tunnel to expose port 8000..."
$tunnelProcess = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:8000 --logfile `"$tunnelLog`"" -WorkingDirectory $projectRoot -PassThru

# Monitor tunnel log for public URL
$tunnelUrl = $null
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $tunnelLog) {
        $content = Get-Content $tunnelLog -Raw -ErrorAction SilentlyContinue
        if ($content -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $tunnelUrl = $matches[0]
            break
        }
    }
}

if ($tunnelUrl) {
    Write-Host "=========================================================="
    Write-Host "MINDBRIDGE CAMPUS IS LIVE AND PUBLICLY ACCESSIBLE!"
    Write-Host "PUBLIC URL: $tunnelUrl"
    Write-Host "=========================================================="
    $tunnelUrl | Out-File -FilePath $urlFile -Encoding utf8
} else {
    Write-Host "Warning: Tunnel URL not found yet in tunnel.log. Recent entries:"
    if (Test-Path $tunnelLog) { Get-Content $tunnelLog -Tail 20 }
}

# Keep running and monitor both backend server and tunnel process
while ($true) {
    Start-Sleep -Seconds 5
    if ($serverProcess -ne $null -and $serverProcess.HasExited) {
        Write-Host "Backend server exited with code $($serverProcess.ExitCode). Restarting backend server..."
        $serverProcess = Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $backendDir -RedirectStandardOutput $serverOutLog -RedirectStandardError $serverErrLog -PassThru
    }
    if ($tunnelProcess -ne $null -and $tunnelProcess.HasExited) {
        Write-Host "Tunnel process exited with code $($tunnelProcess.ExitCode). Restarting tunnel..."
        $tunnelProcess = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:8000 --logfile `"$tunnelLog`"" -WorkingDirectory $projectRoot -PassThru
    }
}
