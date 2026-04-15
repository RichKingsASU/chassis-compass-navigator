# BlackBerry Radar Overnight Seeding Monitor
# Save as: run_blackberry_overnight.ps1
# Run: .\run_blackberry_overnight.ps1

$ProjectDir  = "C:\__FORREST\________Projects\EquipmentCompass\chassis-compass-navigator"
$Script      = "blackberry_radar_ingest.py"
$LogFile     = Join-Path $ProjectDir "blackberry_overnight.log"
$MaxRestarts = 20
$RestartWait = 30

Set-Location $ProjectDir

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

$wsh = New-Object -ComObject WScript.Shell

Write-Log "=========================================="
Write-Log "BlackBerry Overnight Seeding Started"
Write-Log "Script:  $Script"
Write-Log "Log:     $LogFile"
Write-Log "Max restarts: $MaxRestarts"
Write-Log "=========================================="

$restartCount = 0

while ($restartCount -le $MaxRestarts) {

    Write-Log "Starting run $($restartCount + 1)..."

    $pinfo                        = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName               = "python"
    $pinfo.Arguments              = $Script
    $pinfo.WorkingDirectory       = $ProjectDir
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError  = $true
    $pinfo.UseShellExecute        = $false
    $pinfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $pinfo.StandardErrorEncoding  = [System.Text.Encoding]::UTF8

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $pinfo
    $process.Start() | Out-Null

    while (-not $process.HasExited) {
        Start-Sleep -Seconds 60
        $wsh.SendKeys('{SCROLLLOCK}')
        $wsh.SendKeys('{SCROLLLOCK}')
        $line = $process.StandardOutput.ReadLine()
        if ($line) { Write-Log $line }
    }

    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()

    if ($stdout) {
        foreach ($line in ($stdout -split "`n")) {
            if ($line.Trim()) { Write-Log $line.Trim() }
        }
    }
    if ($stderr) {
        foreach ($line in ($stderr -split "`n")) {
            if ($line.Trim()) { Write-Log $line.Trim() "WARN" }
        }
    }

    $exitCode = $process.ExitCode

    if ($exitCode -eq 0) {
        Write-Log "=========================================="
        Write-Log "Seeding completed successfully!"
        Write-Log "=========================================="
        break
    }

    $restartCount++
    if ($restartCount -le $MaxRestarts) {
        Write-Log "Exit code $exitCode. Restarting in ${RestartWait}s... ($restartCount of $MaxRestarts)" "WARN"
        Start-Sleep -Seconds $RestartWait
    }
}

if ($restartCount -gt $MaxRestarts) {
    Write-Log "Max restarts reached. Check log for details." "ERROR"
}

Write-Log "Monitor finished at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")