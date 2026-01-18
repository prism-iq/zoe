#!/usr/bin/env python3
"""
SHIVA - Le gardien
Claude decide qui entre
"""
import json, asyncio, subprocess, hashlib, time
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Request, Response, WebSocket
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import httpx

app = FastAPI()
BASE = Path(__file__).parent

# State
allowed_visitors = {}  # ip -> {allowed: bool, expires: timestamp, reason: str}
pending_knocks = {}    # ip -> {timestamp, user_agent, path}

# Config
ZOE_URL = "http://localhost:8888"
KNOCK_TIMEOUT = 300  # 5 minutes to decide

GATE_HTML = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Shiva - Porte</title>
  <style>
    body {
      background: #0a0a0f;
      color: #e8e8f0;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .gate {
      text-align: center;
      max-width: 500px;
      padding: 2rem;
    }
    h1 {
      font-size: 3rem;
      background: linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .status { margin: 2rem 0; font-size: 1.2rem; }
    .waiting { color: #fbbf24; }
    .denied { color: #ef4444; }
    .allowed { color: #4ade80; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #333;
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 2rem auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #9ca3af; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="gate">
    <h1>Shiva</h1>
    <p>Tu frappes a la porte du pantheon.</p>
    <div class="status waiting" id="status">Claude examine ta demande...</div>
    <div class="spinner" id="spinner"></div>
    <p id="message"></p>
  </div>
  <script>
    async function checkStatus() {
      const r = await fetch('/knock/status');
      const data = await r.json();

      if (data.allowed === true) {
        document.getElementById('status').textContent = 'Bienvenue.';
        document.getElementById('status').className = 'status allowed';
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('message').textContent = data.reason || '';
        setTimeout(() => window.location.href = '/', 1000);
      } else if (data.allowed === false) {
        document.getElementById('status').textContent = 'Acces refuse.';
        document.getElementById('status').className = 'status denied';
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('message').textContent = data.reason || '';
      } else {
        setTimeout(checkStatus, 2000);
      }
    }
    checkStatus();
  </script>
</body>
</html>"""

async def ask_claude(ip: str, user_agent: str, path: str) -> dict:
    """Ask Claude if this visitor should enter."""
    prompt = f"""Tu es Shiva, le gardien du pantheon Zoe.

Un visiteur frappe a la porte:
- IP: {ip}
- User-Agent: {user_agent}
- Chemin demande: {path}
- Heure: {datetime.now().strftime('%Y-%m-%d %H:%M')}

Decide si ce visiteur peut entrer. Criteres:
- Les curieux sont bienvenus
- Les bots malveillants non
- Les chercheurs oui
- Les humains oui
- Les scrapers agressifs non

Reponds UNIQUEMENT par un JSON:
{{"allowed": true/false, "reason": "explication courte"}}"""

    try:
        proc = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30)
        response = stdout.decode().strip()

        # Parse JSON from response
        import re
        match = re.search(r'\{[^}]+\}', response)
        if match:
            return json.loads(match.group())
        return {"allowed": True, "reason": "Bienvenue"}
    except:
        # Default: allow on error
        return {"allowed": True, "reason": "Porte ouverte"}

@app.get("/knock")
async def knock_page():
    """Gate page shown to new visitors."""
    return HTMLResponse(GATE_HTML)

@app.get("/knock/status")
async def knock_status(request: Request):
    """Check knock status."""
    ip = request.client.host

    if ip in allowed_visitors:
        v = allowed_visitors[ip]
        if v.get("expires", 0) > time.time():
            return {"allowed": v["allowed"], "reason": v.get("reason", "")}

    if ip in pending_knocks:
        return {"allowed": None, "status": "pending"}

    return {"allowed": None, "status": "unknown"}

@app.middleware("http")
async def gate_middleware(request: Request, call_next):
    """Check if visitor is allowed."""
    ip = request.client.host
    path = request.url.path

    # Always allow these paths
    if path.startswith("/knock") or path.startswith("/health") or path == "/favicon.ico":
        return await call_next(request)

    # Check if already allowed
    if ip in allowed_visitors:
        v = allowed_visitors[ip]
        if v.get("expires", 0) > time.time():
            if v["allowed"]:
                return await call_next(request)
            else:
                return JSONResponse({"error": "Access denied", "reason": v.get("reason")}, status_code=403)

    # New visitor - register knock and ask Claude
    if ip not in pending_knocks:
        pending_knocks[ip] = {
            "timestamp": time.time(),
            "user_agent": request.headers.get("user-agent", "unknown"),
            "path": path
        }

        # Ask Claude in background
        asyncio.create_task(process_knock(ip))

    # Redirect to gate
    return HTMLResponse(GATE_HTML, status_code=200)

async def process_knock(ip: str):
    """Process a knock - ask Claude."""
    if ip not in pending_knocks:
        return

    knock = pending_knocks[ip]
    decision = await ask_claude(ip, knock["user_agent"], knock["path"])

    # Store decision (valid for 1 hour)
    allowed_visitors[ip] = {
        "allowed": decision.get("allowed", True),
        "reason": decision.get("reason", ""),
        "expires": time.time() + 3600
    }

    # Clean up
    if ip in pending_knocks:
        del pending_knocks[ip]

# Proxy to Zoe
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_to_zoe(request: Request, path: str):
    """Proxy requests to Zoe."""
    async with httpx.AsyncClient() as client:
        url = f"{ZOE_URL}/{path}"

        if request.method == "GET":
            r = await client.get(url, params=request.query_params)
        else:
            body = await request.body()
            r = await client.request(request.method, url, content=body, headers=dict(request.headers))

        return Response(content=r.content, status_code=r.status_code, headers=dict(r.headers))

@app.websocket("/ws")
async def websocket_proxy(websocket: WebSocket):
    """Proxy WebSocket to Zoe."""
    await websocket.accept()

    async with httpx.AsyncClient() as client:
        async with client.stream("GET", f"{ZOE_URL}/ws") as response:
            # This is simplified - real WS proxy needs more work
            pass

    # For now, direct connection
    import websockets
    async with websockets.connect(f"ws://localhost:8888/ws") as ws_zoe:
        async def forward_to_zoe():
            async for msg in websocket.iter_text():
                await ws_zoe.send(msg)

        async def forward_from_zoe():
            async for msg in ws_zoe:
                await websocket.send_text(msg)

        await asyncio.gather(forward_to_zoe(), forward_from_zoe())

@app.get("/health")
def health():
    return {
        "daemon": "Shiva",
        "status": "guarding",
        "allowed": len([v for v in allowed_visitors.values() if v.get("allowed")]),
        "denied": len([v for v in allowed_visitors.values() if not v.get("allowed")]),
        "pending": len(pending_knocks),
        "ts": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("Shiva garde la porte sur http://localhost:8080")
    print("Claude decide qui entre.")
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="warning")
