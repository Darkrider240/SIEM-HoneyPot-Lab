# -----------------------------------------------------------------------------
# Script: deploy-to-kali.ps1
# Purpose: Automated Powershell script to deploy your custom low-spec configuration
#          files from your Windows Host directly onto the Kali Linux VM.
#          Uses Windows native OpenSSH client ('scp').
# Target: Run on Windows Host (in Powershell) inside the project folder.
# -----------------------------------------------------------------------------

# Parameters
$DefaultIP = "127.0.0.1"      # Change to VM IP if Host-Only/Bridged
$DefaultPort = "22"          # Change to port forwarded for SSH if using NAT (e.g. 2222)
$DefaultUser = "kali"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "        SIEM LAB: KALI CONFIGURATION DEPLOYER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "This script will push all custom low-resource configs to your Kali VM."

# Prompt for details or accept defaults
$TargetIP = Read-Host "Enter Kali VM IP address [Default: $DefaultIP]"
if ([string]::IsNullOrWhiteSpace($TargetIP)) { $TargetIP = $DefaultIP }

$TargetPort = Read-Host "Enter Kali SSH Port [Default: $DefaultPort]"
if ([string]::IsNullOrWhiteSpace($TargetPort)) { $TargetPort = $DefaultPort }

$TargetUser = Read-Host "Enter Kali Username [Default: $DefaultUser]"
if ([string]::IsNullOrWhiteSpace($TargetUser)) { $TargetUser = $DefaultUser }

# Define source and destination paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigsFolder = Join-Path $ScriptDir "lab-configs"
$RemoteDir = "~/lab/configs"

Write-Host "`n[*] Source configs path: $ConfigsFolder" -ForegroundColor Gray
Write-Host "[*] Destination on VM : ${TargetUser}@${TargetIP}:${RemoteDir}" -ForegroundColor Gray

# Test local folder presence
if (-not (Test-Path $ConfigsFolder)) {
    Write-Host "[!] Error: 'lab-configs' directory not found!" -ForegroundColor Red
    Exit
}

Write-Host "`n[*] Initiating secure transfer..." -ForegroundColor Yellow

# Ensure directory structure exists on Kali before transferring
Write-Host "[*] Creating remote directory structure..." -ForegroundColor Gray
& ssh -p $TargetPort "$TargetUser@$TargetIP" "mkdir -p $RemoteDir"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] SSH Connection check failed. Please ensure:" -ForegroundColor Red
    Write-Host "    1. The Kali VM is running and accessible." -ForegroundColor Red
    Write-Host "    2. SSH Server is active in Kali (run: sudo systemctl start ssh)." -ForegroundColor Red
    Write-Host "    3. Your VM network settings are correct." -ForegroundColor Red
    Exit
}

# Transfer the files
Write-Host "[*] Copying files via SCP..." -ForegroundColor Yellow
& scp -P $TargetPort -r "$ConfigsFolder\*" "${TargetUser}@${TargetIP}:${RemoteDir}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[+] Transfer completed successfully!" -ForegroundColor Green
    Write-Host "[+] Files are now available in your VM under: ~/lab/configs/" -ForegroundColor Green
    Write-Host "[+] You can ssh in and run: chmod +x ~/lab/configs/*.sh" -ForegroundColor Green
} else {
    Write-Host "`n[!] File transfer failed. Check permissions or network routes." -ForegroundColor Red
}
