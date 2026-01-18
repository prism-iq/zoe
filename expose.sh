#!/bin/bash
# SHIVA - Expose le pantheon au monde
# Acces libre, HTTPS par Caddy

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=== SHIVA - OUVERTURE ==="

# Stop old
pkill -f "caddy run" 2>/dev/null
./stop.sh 2>/dev/null
sleep 1

# Start pantheon
./start.sh
sleep 2

# Start Caddy (reverse proxy + HTTPS)
echo "[SHIVA] Caddy demarre..."
caddy run --config "$DIR/Caddyfile" &

sleep 2

# Get public IP
IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo ""
echo "=== BOUDHA VISIBLE ==="
echo "Zoe     : http://$IP"
echo "Cosmos  : http://$IP:9000"
echo "Atlas   : http://$IP:9001"
echo ""
echo "L'etranger peut voir l'interieur."
echo "Shiva protege par HTTPS."
