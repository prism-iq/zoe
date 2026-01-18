#!/usr/bin/env python3
"""
ZOE - Face publique du pantheon
Interface web connectee a Atlas > Phi > Cosmos
"""
import json, httpx, asyncio
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
BASE = Path(__file__).parent

# Backend URLs
ATLAS_URL = "http://localhost:9001"
COSMOS_URL = "http://localhost:9000"

# ============== STATIC FILES ==============

@app.get("/")
async def home():
    return FileResponse(BASE / "index.html")

@app.get("/chat.html")
async def chat():
    return FileResponse(BASE / "chat.html")

@app.get("/manifest.json")
async def manifest():
    return FileResponse(BASE / "manifest.json")

@app.get("/sw.js")
async def sw():
    return FileResponse(BASE / "sw.js")

@app.get("/icon.svg")
async def icon():
    return FileResponse(BASE / "icon.svg")

# ============== TASK SUBMISSION ==============

async def submit_task(task_type: str, payload: dict, source: str = "zoe") -> dict:
    """Submit task via Atlas."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as c:
            r = await c.post(f"{ATLAS_URL}/task/submit", json={
                "type": task_type,
                "payload": payload,
                "source": source,
                "priority": 5
            })
            task_info = r.json()

            if task_info.get("status") == "dispatched":
                # Wait for result
                task_id = task_info.get("task_id")
                for _ in range(60):  # Wait up to 60 seconds
                    await asyncio.sleep(1)
                    result = await c.get(f"{ATLAS_URL}/task/result/{task_id}")
                    data = result.json()
                    if "value" in data:
                        return data["value"].get("result", {})

            return {"status": "queued", "info": task_info}

    except httpx.ConnectError:
        # Fallback: direct execution
        return await fallback_execute(task_type, payload)
    except Exception as e:
        return {"error": str(e)}

async def fallback_execute(task_type: str, payload: dict) -> dict:
    """Fallback when Atlas unavailable."""
    if task_type == "search":
        return await direct_search(payload.get("query", ""))
    elif task_type == "code":
        return await direct_code(payload.get("prompt", ""))
    return {"error": "Atlas unavailable, fallback failed"}

async def direct_search(query: str) -> dict:
    """Direct DuckDuckGo search."""
    import urllib.parse
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_redirect=1"
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(url)
            data = r.json()
        abstract = data.get("AbstractText", "")
        if abstract:
            return {"result": f"{data.get('Heading', '')}\n\n{abstract}"}
        return {"result": "Pas de resultat"}
    except Exception as e:
        return {"error": str(e)}

async def direct_code(prompt: str) -> dict:
    """Direct Claude call."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=120)
        return {"code": stdout.decode().strip()}
    except Exception as e:
        return {"error": str(e)}

# ============== MEMORY ==============

async def save_message(role: str, content: str):
    """Save message to Cosmos."""
    try:
        async with httpx.AsyncClient() as c:
            await c.post(f"{COSMOS_URL}/memory/set", json={
                "key": f"zoe:msg:{datetime.now().timestamp()}",
                "value": {"role": role, "content": content[:1000]},
                "tags": ["zoe", "message", role]
            })
    except:
        pass

async def get_history(limit: int = 10) -> list:
    """Get message history from Cosmos."""
    try:
        async with httpx.AsyncClient() as c:
            r = await c.post(f"{COSMOS_URL}/memory/query", json={
                "tags": ["zoe", "message"],
                "limit": limit
            })
            return r.json()
    except:
        return []

# ============== WEBSOCKET ==============

def is_code_request(text: str) -> bool:
    keywords = ["code", "ecris", "cree", "fais", "programme", "script", "fonction", "/code"]
    return any(k in text.lower() for k in keywords)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ask":
                query = data.get("content", "").strip()
                if not query:
                    continue

                await save_message("user", query)

                # Route based on content
                if query.startswith("/code "):
                    result = await submit_task("code", {"prompt": query[6:]})
                    if "code" in result:
                        await websocket.send_json({"type": "code", "content": result["code"]})
                    else:
                        await websocket.send_json({"type": "response", "content": result.get("error", "Erreur")})

                elif query.startswith("/search "):
                    result = await submit_task("search", {"query": query[8:]})
                    content = result.get("abstract") or result.get("result") or str(result)
                    await websocket.send_json({"type": "response", "content": content})

                elif query.startswith("/compute "):
                    result = await submit_task("compute", {"expr": query[9:]})
                    await websocket.send_json({"type": "response", "content": str(result.get("result", result))})

                elif is_code_request(query):
                    await websocket.send_json({"type": "response", "content": "Je demande a Claude..."})
                    result = await submit_task("code", {"prompt": query})
                    if "code" in result:
                        await websocket.send_json({"type": "code", "content": result["code"]})
                    else:
                        await websocket.send_json({"type": "response", "content": result.get("error", "Erreur")})

                else:
                    result = await submit_task("search", {"query": query})
                    content = result.get("abstract") or result.get("result") or "Pas de resultat"
                    heading = result.get("heading", "")
                    if heading:
                        content = f"{heading}\n\n{content}"
                    await websocket.send_json({"type": "response", "content": content})

                await save_message("assistant", content if 'content' in dir() else "")

    except WebSocketDisconnect:
        pass

# ============== API ==============

@app.get("/health")
async def health():
    # Check backends
    atlas_ok = False
    cosmos_ok = False

    try:
        async with httpx.AsyncClient(timeout=2.0) as c:
            r = await c.get(f"{ATLAS_URL}/health")
            atlas_ok = r.status_code == 200
    except:
        pass

    try:
        async with httpx.AsyncClient(timeout=2.0) as c:
            r = await c.get(f"{COSMOS_URL}/health")
            cosmos_ok = r.status_code == 200
    except:
        pass

    return {
        "daemon": "Zoe",
        "status": "awake",
        "backends": {
            "atlas": "ok" if atlas_ok else "down",
            "cosmos": "ok" if cosmos_ok else "down"
        },
        "ts": datetime.now().isoformat()
    }

@app.get("/api/history")
async def api_history(limit: int = 20):
    return await get_history(limit)

if __name__ == "__main__":
    import uvicorn
    print("Zoe demarre sur http://localhost:8888")
    print("Backends: Atlas (9001), Cosmos (9000)")
    uvicorn.run(app, host="0.0.0.0", port=8888, log_level="warning")
