#!/bin/bash
# -----------------------------------------------------------------------------
# Script: setup-swap.sh
# Purpose: Dynamically allocate a 2GB Swap file for the Kali Linux VM to
#          prevent Out-Of-Memory (OOM) crashes under heavy SIEM loads.
# Target: Run inside the Kali Linux VM.
# -----------------------------------------------------------------------------

set -e

echo "=== SIEM Lab: Low-Spec Hardware Optimization ==="
echo "[*] Creating a 2 GB swap file..."

# Check if swapfile already exists
if [ -f /swapfile ]; then
    echo "[!] Swap file /swapfile already exists. Checking if active..."
    if swapon --show | grep -q "/swapfile"; then
        echo "[+] Swap is already active. Nothing to do."
        swapon --show
        exit 0
    else
        echo "[*] Swap file exists but is inactive. Activating..."
        sudo chmod 600 /swapfile
        sudo mkswap -f /swapfile
        sudo swapon /swapfile
        echo "[+] Swap activated successfully!"
        exit 0
    fi
fi

# Allocate 2GB file
sudo fallocate -l 2G /swapfile

# Set restrictive permissions (critical for security)
sudo chmod 600 /swapfile

# Make the file a swap space
sudo mkswap /swapfile

# Enable the swap file immediately
sudo swapon /swapfile

# Verify the swap file is active
echo "[+] Active Swap Spaces:"
swapon --show

# Persist the swap file across reboots
if grep -q "/swapfile" /etc/fstab; then
    echo "[+] Swap persistence is already configured in /etc/fstab."
else
    echo "[*] Configuring swap persistence in /etc/fstab..."
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "[+] Persistence added to /etc/fstab."
fi

echo "[+] Swap setup complete! 2 GB of virtual safety net added."
free -h
