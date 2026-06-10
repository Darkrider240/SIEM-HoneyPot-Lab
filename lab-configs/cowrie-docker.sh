#!/bin/bash
# -----------------------------------------------------------------------------
# Script: cowrie-docker.sh
# Purpose: Pull and run the Cowrie Honeypot in a lightweight Docker container.
#          Persists logs to ~/lab/cowrie/logs for SIEM ingestion.
# Target: Run inside the Kali Linux VM.
# -----------------------------------------------------------------------------

set -e

COWRIE_LOG_DIR="$HOME/lab/cowrie/logs"

echo "=== SIEM Lab: Deploying Cowrie Honeypot (Docker) ==="

# Create local log directory
echo "[*] Creating persistent directory structure..."
mkdir -p "$COWRIE_LOG_DIR"
# Ensure the user has full access
chmod -R 777 "$HOME/lab"

# Check if cowrie container is already running
if docker ps -a --format '{{.Names}}' | grep -q "^cowrie$"; then
    echo "[!] A container named 'cowrie' already exists."
    echo "[*] Recreating container to ensure clean configuration..."
    docker stop cowrie >/dev/null 2>&1 || true
    docker rm cowrie >/dev/null 2>&1 || true
fi

# Run the Cowrie container
echo "[*] Launching Cowrie container..."
docker run -d \
  --name cowrie \
  -p 2222:2222 \
  -p 2323:2323 \
  -v "$COWRIE_LOG_DIR:/home/cowrie/cowrie/var/log/cowrie" \
  --restart unless-stopped \
  cowrie/cowrie:latest

# Check status
echo "[+] Cowrie Honeypot started!"
docker ps | grep cowrie

echo "--------------------------------------------------------"
echo "Ports Mapped:"
echo "  * SSH Honeypot   : Port 2222"
echo "  * Telnet Honeypot: Port 2323"
echo "Logs mapped to: $COWRIE_LOG_DIR"
echo "--------------------------------------------------------"
echo "[*] To view logs in real-time:"
echo "    tail -f $COWRIE_LOG_DIR/cowrie.log"
echo "[*] To view JSON formatted attack logs (perfect for SIEM):"
echo "    tail -f $COWRIE_LOG_DIR/cowrie.json"
