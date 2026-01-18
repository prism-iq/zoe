#!/usr/bin/env python3
"""
PHI - Les workers
Executent les taches delegues par Atlas
"""
import json, asyncio, subprocess, httpx, hashlib, math, os, sys
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Optional
import urllib.parse

app = FastAPI()

# Config from env or args
WORKER_ID = os.environ.get("PHI_ID", f"phi_{os.getpid()}")
PORT = int(os.environ.get("PHI_PORT", 9100))
ATLAS_URL = os.environ.get("ATLAS_URL", "http://localhost:9001")

class TaskRequest(BaseModel):
    task_id: str
    type: str  # "code", "search", "compute", "llm", "hash", "fetch"
    payload: Any

class TaskResponse(BaseModel):
    task_id: str
    status: str
    result: Any
    duration: float = 0

# ============== EXECUTORS ==============

async def execute_code(payload: dict) -> Any:
    """Execute code via Claude CLI."""
    prompt = payload.get("prompt", "")
    try:
        proc = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        if proc.returncode == 0:
            return {"code": stdout.decode().strip()}
        return {"error": stderr.decode()[:500]}
    except asyncio.TimeoutError:
        return {"error": "timeout"}
    except Exception as e:
        return {"error": str(e)}

async def execute_search(payload: dict) -> Any:
    """Search via DuckDuckGo."""
    query = payload.get("query", "")
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_redirect=1"
        async with httpx.AsyncClient(timeout=15.0) as c:
            r = await c.get(url)
            data = r.json()

        abstract = data.get("AbstractText", "")
        heading = data.get("Heading", "")

        if abstract:
            return {"heading": heading, "abstract": abstract, "source": data.get("AbstractSource")}

        related = data.get("RelatedTopics", [])
        topics = [t.get("Text") for t in related[:5] if isinstance(t, dict) and "Text" in t]
        return {"heading": heading, "related": topics}

    except Exception as e:
        return {"error": str(e)}

async def execute_compute(payload: dict) -> Any:
    """Safe mathematical computation."""
    expr = payload.get("expr", "")
    try:
        # Safe eval with math functions
        safe = {
            "abs": abs, "round": round, "min": min, "max": max, "sum": sum, "len": len,
            "sqrt": math.sqrt, "pow": pow, "log": math.log, "log10": math.log10,
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "pi": math.pi, "e": math.e, "phi": (1 + math.sqrt(5)) / 2,
            "floor": math.floor, "ceil": math.ceil, "factorial": math.factorial
        }
        expr = expr.replace("^", "**")
        result = eval(expr, {"__builtins__": {}}, safe)
        return {"result": result, "expr": expr}
    except Exception as e:
        return {"error": str(e)}

async def execute_llm(payload: dict) -> Any:
    """Call LLM (Claude or other)."""
    prompt = payload.get("prompt", "")
    model = payload.get("model", "claude")

    if model == "claude":
        return await execute_code({"prompt": prompt})

    # Add other models here (ollama, etc.)
    return {"error": f"Unknown model: {model}"}

async def execute_hash(payload: dict) -> Any:
    """Compute hash."""
    data = payload.get("data", "")
    algo = payload.get("algo", "sha256")

    try:
        if algo == "md5":
            h = hashlib.md5(data.encode()).hexdigest()
        elif algo == "sha1":
            h = hashlib.sha1(data.encode()).hexdigest()
        elif algo == "sha256":
            h = hashlib.sha256(data.encode()).hexdigest()
        elif algo == "sha512":
            h = hashlib.sha512(data.encode()).hexdigest()
        else:
            return {"error": f"Unknown algo: {algo}"}
        return {"hash": h, "algo": algo}
    except Exception as e:
        return {"error": str(e)}

async def execute_fetch(payload: dict) -> Any:
    """HTTP fetch."""
    url = payload.get("url", "")
    method = payload.get("method", "GET").upper()

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as c:
            if method == "GET":
                r = await c.get(url)
            elif method == "POST":
                r = await c.post(url, json=payload.get("body", {}))
            else:
                return {"error": f"Unknown method: {method}"}

            return {
                "status": r.status_code,
                "body": r.text[:5000] if len(r.text) > 5000 else r.text,
                "headers": dict(r.headers)
            }
    except Exception as e:
        return {"error": str(e)}

async def execute_shell(payload: dict) -> Any:
    """Execute shell command (restricted)."""
    cmd = payload.get("cmd", "")

    # Whitelist safe commands
    allowed = ["ls", "pwd", "whoami", "date", "uptime", "df", "free", "cat", "head", "tail", "wc", "grep"]
    first_word = cmd.split()[0] if cmd.split() else ""

    if first_word not in allowed:
        return {"error": f"Command not allowed: {first_word}"}

    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
        return {
            "stdout": stdout.decode()[:2000],
            "stderr": stderr.decode()[:500],
            "exit_code": proc.returncode
        }
    except asyncio.TimeoutError:
        return {"error": "timeout"}
    except Exception as e:
        return {"error": str(e)}

# Executor map
EXECUTORS = {
    "code": execute_code,
    "search": execute_search,
    "compute": execute_compute,
    "llm": execute_llm,
    "hash": execute_hash,
    "fetch": execute_fetch,
    "shell": execute_shell
}

# ============== API ==============

@app.post("/execute")
async def execute(req: TaskRequest) -> TaskResponse:
    """Execute a task."""
    import time
    start = time.time()

    executor = EXECUTORS.get(req.type)
    if not executor:
        return TaskResponse(
            task_id=req.task_id,
            status="error",
            result={"error": f"Unknown task type: {req.type}"},
            duration=0
        )

    try:
        result = await executor(req.payload)
        status = "error" if "error" in result else "success"
    except Exception as e:
        result = {"error": str(e)}
        status = "error"

    duration = time.time() - start

    return TaskResponse(
        task_id=req.task_id,
        status=status,
        result=result,
        duration=duration
    )

@app.get("/capabilities")
def capabilities():
    """List worker capabilities."""
    return {
        "worker_id": WORKER_ID,
        "capabilities": list(EXECUTORS.keys()),
        "port": PORT
    }

@app.get("/health")
def health():
    return {
        "daemon": "Phi",
        "worker_id": WORKER_ID,
        "status": "ready",
        "capabilities": list(EXECUTORS.keys()),
        "port": PORT,
        "ts": datetime.now().isoformat()
    }

@app.get("/")
def root():
    return {
        "daemon": "Phi",
        "worker_id": WORKER_ID,
        "role": "Task executor",
        "capabilities": list(EXECUTORS.keys())
    }

# ============== REGISTRATION ==============

async def register_with_atlas():
    """Register this worker with Atlas."""
    try:
        async with httpx.AsyncClient() as c:
            await c.post(f"{ATLAS_URL}/worker/register", params={
                "worker_id": WORKER_ID,
                "url": f"http://localhost:{PORT}",
                "capabilities": list(EXECUTORS.keys())
            })
            print(f"Registered with Atlas as {WORKER_ID}")
    except Exception as e:
        print(f"Could not register with Atlas: {e}")

async def heartbeat_loop():
    """Send periodic heartbeats to Atlas."""
    while True:
        try:
            async with httpx.AsyncClient() as c:
                await c.post(f"{ATLAS_URL}/worker/heartbeat/{WORKER_ID}", params={"load": 0.1})
        except:
            pass
        await asyncio.sleep(30)

@app.on_event("startup")
async def startup():
    await register_with_atlas()
    asyncio.create_task(heartbeat_loop())

if __name__ == "__main__":
    import uvicorn

    # Allow port override from command line
    if len(sys.argv) > 1:
        PORT = int(sys.argv[1])
        WORKER_ID = f"phi_{PORT}"

    print(f"Phi worker {WORKER_ID} demarre sur http://localhost:{PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")
