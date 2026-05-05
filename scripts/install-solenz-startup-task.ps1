$ErrorActionPreference = "Stop"

$projectDir = "C:\Users\senol\OneDrive\Desktop\yapayzeka"
$scriptPath = Join-Path $projectDir "scripts\start-solenz-brain.ps1"
$taskName = "SolenzAI Brain Tunnel"

if (-not (Test-Path $scriptPath)) {
    throw "Startup script bulunamadı: $scriptPath"
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Solenz AI Antigravity brain ve Cloudflare tünelini kullanıcı oturum açınca başlatır." `
        -Force | Out-Null

    Write-Host "Kuruldu: $taskName"
} catch {
    $startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
    $cmdPath = Join-Path $startupDir "SolenzAI Brain Tunnel.cmd"
    $cmd = "@echo off`r`npowershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"`r`n"

    New-Item -ItemType Directory -Path $startupDir -Force | Out-Null
    Set-Content -Path $cmdPath -Value $cmd -Encoding ASCII

    Write-Host "Görev Zamanlayıcı erişim vermedi; başlangıç klasörü kuruldu: $cmdPath"
}
