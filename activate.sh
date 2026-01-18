#!/bin/bash
# Zoe Activation - Part of Pantheon

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export ZOE_ROOT="$SCRIPT_DIR"

case "${1:-start}" in
    start)
        cd "$SCRIPT_DIR"
        [ -f "cosmos/cosmos.py" ] && python3 cosmos/cosmos.py &
        [ -f "atlas/atlas.py" ] && python3 atlas/atlas.py &
        [ -f "phi/phi.py" ] && python3 phi/phi.py &
        [ -f "zoe.py" ] && python3 zoe.py &
        echo "[+] Zoe started"
        ;;
    stop)
        pkill -f "cosmos.py|atlas.py|phi.py|zoe.py|shiva.py"
        echo "[*] Zoe stopped"
        ;;
    status)
        pgrep -f "zoe.py|cosmos.py" && echo "[+] Zoe running" || echo "[-] Zoe not running"
        ;;
    expose)
        bash "$SCRIPT_DIR/expose.sh"
        ;;
    *)
        echo "Usage: $0 {start|stop|status|expose}"
        ;;
esac
