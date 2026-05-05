param(
    [string]$ProjectDir = "C:\Users\senol\OneDrive\Desktop\yapayzeka",
    [string]$VercelScope = "senols-projects-a69630e0",
    [int]$BrainPort = 8045
)

$ErrorActionPreference = "Continue"

$logDir = Join-Path $env:LOCALAPPDATA "SolenzAI"
$cloudflaredPath = Join-Path $env:LOCALAPPDATA "cloudflared\cloudflared.exe"
$antigravityPath = Join-Path $env:LOCALAPPDATA "Antigravity Tools\antigravity_tools.exe"
$runLog = Join-Path $logDir "brain-startup.log"
$cfOutLog = Join-Path $logDir "cloudflared.out.log"
$cfErrLog = Join-Path $logDir "cloudflared.err.log"

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-StartupLog {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Add-Content -Path $runLog -Value $line -Encoding UTF8
}

function Test-BrainPort {
    try {
        $client = New-Object Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", $BrainPort, $null, $null)
        $success = $iar.AsyncWaitHandle.WaitOne(1000, $false)
        if ($success) {
            $client.EndConnect($iar)
        }
        $client.Close()
        return $success
    } catch {
        return $false
    }
}

function Wait-ForBrain {
    for ($i = 0; $i -lt 90; $i++) {
        if (Test-BrainPort) {
            return $true
        }
        Start-Sleep -Seconds 2
    }

    return $false
}

function Find-TunnelUrl {
    $logs = @($cfOutLog, $cfErrLog) | Where-Object { Test-Path $_ }

    foreach ($path in $logs) {
        $content = Get-Content -Path $path -Raw -ErrorAction SilentlyContinue
        $match = [regex]::Match($content, "https://[a-z0-9-]+\.trycloudflare\.com")
        if ($match.Success) {
            return $match.Value.TrimEnd("/")
        }
    }

    return $null
}

function Invoke-Vercel {
    param(
        [string[]]$Arguments,
        [string]$InputText = $null
    )

    Push-Location $ProjectDir
    try {
        if ($null -ne $InputText) {
            $InputText | & npx.cmd vercel @Arguments 2>&1 | ForEach-Object { Write-StartupLog $_ }
        } else {
            & npx.cmd vercel @Arguments 2>&1 | ForEach-Object { Write-StartupLog $_ }
        }
        return $LASTEXITCODE
    } finally {
        Pop-Location
    }
}

Write-StartupLog "Solenz AI brain startup başladı."

if (Test-Path $antigravityPath) {
    $antigravityRunning = Get-Process -Name "antigravity_tools" -ErrorAction SilentlyContinue
    if (-not $antigravityRunning) {
        Write-StartupLog "Antigravity Tools başlatılıyor."
        Start-Process -FilePath $antigravityPath -WindowStyle Hidden | Out-Null
    } else {
        Write-StartupLog "Antigravity Tools zaten çalışıyor."
    }
} else {
    Write-StartupLog "Antigravity Tools bulunamadı: $antigravityPath"
}

if (-not (Wait-ForBrain)) {
    Write-StartupLog "127.0.0.1:$BrainPort açılmadı. Gemini fallback çalışmaya devam eder."
    exit 1
}

Write-StartupLog "Yerel beyin portu hazır: 127.0.0.1:$BrainPort"

$cloudflaredRunning = Get-CimInstance Win32_Process -Filter "name='cloudflared.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "127\.0\.0\.1:$BrainPort" }

if ($cloudflaredRunning) {
    Write-StartupLog "Cloudflared tüneli zaten çalışıyor."
    exit 0
}

if (-not (Test-Path $cloudflaredPath)) {
    Write-StartupLog "cloudflared bulunamadı: $cloudflaredPath"
    exit 1
}

Remove-Item -Path $cfOutLog, $cfErrLog -Force -ErrorAction SilentlyContinue
Write-StartupLog "Cloudflared quick tunnel başlatılıyor."
Start-Process -FilePath $cloudflaredPath `
    -ArgumentList @("tunnel", "--url", "http://127.0.0.1:$BrainPort", "--no-autoupdate") `
    -RedirectStandardOutput $cfOutLog `
    -RedirectStandardError $cfErrLog `
    -WindowStyle Hidden | Out-Null

$tunnelUrl = $null
for ($i = 0; $i -lt 90; $i++) {
    $tunnelUrl = Find-TunnelUrl
    if ($tunnelUrl) {
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $tunnelUrl) {
    Write-StartupLog "Cloudflare tünel URL'si bulunamadı."
    exit 1
}

Write-StartupLog "Yeni tünel bulundu: $tunnelUrl"
Write-StartupLog "Vercel ANTHROPIC_BASE_URL güncelleniyor."
Invoke-Vercel -Arguments @("env", "rm", "ANTHROPIC_BASE_URL", "production", "--yes", "--scope", $VercelScope) | Out-Null
Invoke-Vercel -Arguments @("env", "add", "ANTHROPIC_BASE_URL", "production", "--scope", $VercelScope) -InputText $tunnelUrl | Out-Null

Write-StartupLog "Yeni production deploy başlatılıyor."
$deployExit = Invoke-Vercel -Arguments @("--prod", "--yes", "--scope", $VercelScope)
Write-StartupLog "Startup tamamlandı. Deploy exit code: $deployExit"
