#!/bin/bash
# ZOE PANTHEON - Lancement complet
# Cosmos > Atlas > Phi > Zoe > Shiva

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=== ZOE PANTHEON ==="

# Kill existing
pkill -f "cosmos.py" 2>/dev/null
pkill -f "atlas.py" 2>/dev/null
pkill -f "phi.py" 2>/dev/null
pkill -f "zoe.py" 2>/dev/null
pkill -f "shiva.py" 2>/dev/null
sleep 1

# 1. Cosmos (port 9000)
echo "[1/5] Cosmos (stockage)..."
python3 cosmos/cosmos.py &
sleep 1

# 2. Atlas (port 9001)
echo "[2/5] Atlas (coordinateur)..."
python3 atlas/atlas.py &
sleep 1

# 3. Phi workers (ports 9100-9102)
echo "[3/5] Phi workers..."
PHI_PORT=9100 PHI_ID=phi_1 python3 phi/phi.py &
PHI_PORT=9101 PHI_ID=phi_2 python3 phi/phi.py &
PHI_PORT=9102 PHI_ID=phi_3 python3 phi/phi.py &
sleep 1

# 4. Zoe (port 8888)
echo "[4/5] Zoe (interface)..."
python3 zoe.py &
sleep 1

# 5. Shiva (port 8080) - Gardien
echo "[5/5] Shiva (gardien)..."
python3 shiva.py &
sleep 1

echo ""
echo "=== PANTHEON ACTIF ==="
echo "Shiva   : http://localhost:8080  <- ENTREE (Claude decide)"
echo "Zoe     : http://localhost:8888  <- Interface"
echo "Cosmos  : http://localhost:9000"
echo "Atlas   : http://localhost:9001"
echo "Phi     : http://localhost:9100-9102"
echo ""
echo "Quand quelqu'un toque, Claude decide."
