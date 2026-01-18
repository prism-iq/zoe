#!/usr/bin/env python3
"""
ATLAS - Le coordinateur
Route les messages, gere les workers, orchestre le pantheon
"""
import json, asyncio, httpx, time
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import random

app = FastAPI()
BASE = Path(__file__).parent

# Config
COSMOS_URL = "http://localhost:9000"
PHI_PORTS = list(range(9100, 9110))  # Workers on ports 9100-9109

# State
workers: Dict[str, dict] = {}  # worker_id -> {url, status, load, last_seen}
clients: Dict[str, WebSocket] = {}  # daemon_name -> websocket

class Task(BaseModel):
    id: Optional[str] = None
    type: str  # "code", "search", "compute", "llm"
    payload: Any
    source: str
    priority: int = 5  # 1-10, higher = more urgent
    timeout: int = 120

class TaskResult(BaseModel):
    task_id: str
    status: str  # "success", "error", "timeout"
    result: Any
    worker: str
    duration: float

# ============== WORKER MANAGEMENT ==============

@app.post("/worker/register")
async def worker_register(worker_id: str, url: str, capabilities: List[str] = []):
    """Register a phi worker."""
    workers[worker_id] = {
        "url": url,
        "status": "ready",
        "load": 0,
        "capabilities": capabilities,
        "last_seen": datetime.now().isoformat(),
        "tasks_completed": 0
    }

    # Log to cosmos
    try:
        async with httpx.AsyncClient() as c:
            await c.post(f"{COSMOS_URL}/event", params={
                "daemon": "atlas",
                "event": "worker_registered",
                "data": json.dumps({"worker_id": worker_id, "url": url})
            })
    except:
        pass

    return {"status": "registered", "worker_id": worker_id}

@app.post("/worker/heartbeat/{worker_id}")
async def worker_heartbeat(worker_id: str, load: float = 0):
    """Worker heartbeat."""
    if worker_id in workers:
        workers[worker_id]["last_seen"] = datetime.now().isoformat()
        workers[worker_id]["load"] = load
        workers[worker_id]["status"] = "ready" if load < 0.9 else "busy"
    return {"status": "ok"}

@app.get("/workers")
def list_workers():
    """List all registered workers."""
    return {"workers": workers, "count": len(workers)}

def select_worker(task_type: str = None) -> Optional[str]:
    """Select best available worker."""
    available = [
        (wid, w) for wid, w in workers.items()
        if w["status"] == "ready" and w["load"] < 0.9
    ]
    if not available:
        return None

    # Sort by load (least loaded first)
    available.sort(key=lambda x: x[1]["load"])
    return available[0][0]

# ============== TASK ROUTING ==============

@app.post("/task/submit")
async def task_submit(task: Task, background_tasks: BackgroundTasks):
    """Submit a task for processing."""
    task_id = task.id or f"task_{int(time.time()*1000)}_{random.randint(1000,9999)}"

    # Find worker
    worker_id = select_worker(task.type)

    if not worker_id:
        # Queue in cosmos
        try:
            async with httpx.AsyncClient() as c:
                await c.post(f"{COSMOS_URL}/msg/send", json={
                    "source": "atlas",
                    "target": "task_queue",
                    "content": {"task_id": task_id, **task.dict()},
                    "type": "queued_task"
                })
        except:
            pass
        return {"status": "queued", "task_id": task_id, "reason": "no_worker_available"}

    # Dispatch to worker
    background_tasks.add_task(dispatch_task, task_id, task, worker_id)

    return {"status": "dispatched", "task_id": task_id, "worker": worker_id}

async def dispatch_task(task_id: str, task: Task, worker_id: str):
    """Dispatch task to worker."""
    worker = workers.get(worker_id)
    if not worker:
        return

    worker["status"] = "busy"
    worker["load"] = min(1.0, worker["load"] + 0.2)
    start = time.time()

    try:
        async with httpx.AsyncClient(timeout=task.timeout) as c:
            r = await c.post(f"{worker['url']}/execute", json={
                "task_id": task_id,
                "type": task.type,
                "payload": task.payload
            })
            result = r.json()

        duration = time.time() - start
        worker["tasks_completed"] += 1

        # Store result in cosmos
        try:
            async with httpx.AsyncClient() as c:
                await c.post(f"{COSMOS_URL}/memory/set", json={
                    "key": f"result:{task_id}",
                    "value": {"result": result, "duration": duration, "worker": worker_id},
                    "tags": ["task_result", task.type],
                    "ttl": 3600
                })

                # Notify source
                await c.post(f"{COSMOS_URL}/msg/send", json={
                    "source": "atlas",
                    "target": task.source,
                    "content": {"task_id": task_id, "status": "completed", "result": result},
                    "type": "task_result"
                })
        except:
            pass

    except Exception as e:
        # Log error
        try:
            async with httpx.AsyncClient() as c:
                await c.post(f"{COSMOS_URL}/event", params={
                    "daemon": "atlas",
                    "event": "task_error",
                    "data": json.dumps({"task_id": task_id, "error": str(e)})
                })
        except:
            pass

    finally:
        worker["status"] = "ready"
        worker["load"] = max(0, worker["load"] - 0.2)

@app.get("/task/result/{task_id}")
async def task_result(task_id: str):
    """Get task result."""
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{COSMOS_URL}/memory/get/result:{task_id}")
            return r.json()
    except:
        return {"status": "not_found", "task_id": task_id}

# ============== MESSAGE ROUTING ==============

@app.post("/route")
async def route_message(source: str, target: str, content: Any, msg_type: str = "message"):
    """Route a message between daemons."""
    # Direct websocket if connected
    if target in clients:
        try:
            await clients[target].send_json({
                "source": source,
                "type": msg_type,
                "content": content
            })
            return {"status": "delivered", "method": "websocket"}
        except:
            del clients[target]

    # Queue in cosmos
    try:
        async with httpx.AsyncClient() as c:
            await c.post(f"{COSMOS_URL}/msg/send", json={
                "source": source,
                "target": target,
                "content": content,
                "type": msg_type
            })
        return {"status": "queued", "method": "cosmos"}
    except:
        return {"status": "error", "reason": "cosmos_unavailable"}

# ============== WEBSOCKET HUB ==============

@app.websocket("/ws/{daemon_name}")
async def websocket_endpoint(websocket: WebSocket, daemon_name: str):
    """WebSocket connection for daemons."""
    await websocket.accept()
    clients[daemon_name] = websocket

    try:
        # Send pending messages from cosmos
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(f"{COSMOS_URL}/msg/recv/{daemon_name}")
                msgs = r.json()
                for msg in msgs:
                    await websocket.send_json(msg)
        except:
            pass

        while True:
            data = await websocket.receive_json()

            # Route message
            if "target" in data:
                await route_message(
                    source=daemon_name,
                    target=data["target"],
                    content=data.get("content"),
                    msg_type=data.get("type", "message")
                )

            # Submit task
            elif "task" in data:
                task = Task(**data["task"], source=daemon_name)
                result = await task_submit(task, BackgroundTasks())
                await websocket.send_json(result)

    except WebSocketDisconnect:
        if daemon_name in clients:
            del clients[daemon_name]

# ============== BROADCAST ==============

@app.post("/broadcast")
async def broadcast(content: Any, exclude: List[str] = []):
    """Broadcast to all connected daemons."""
    sent = []
    for name, ws in list(clients.items()):
        if name not in exclude:
            try:
                await ws.send_json({"type": "broadcast", "content": content})
                sent.append(name)
            except:
                del clients[name]
    return {"sent_to": sent}

# ============== HEALTH ==============

@app.get("/health")
def health():
    active_workers = sum(1 for w in workers.values() if w["status"] == "ready")
    return {
        "daemon": "Atlas",
        "status": "awake",
        "workers": {"total": len(workers), "active": active_workers},
        "connected_daemons": list(clients.keys()),
        "ts": datetime.now().isoformat()
    }

@app.get("/")
def root():
    return {
        "daemon": "Atlas",
        "role": "Coordinator & Router",
        "endpoints": [
            "/worker/register", "/workers", "/worker/heartbeat/{id}",
            "/task/submit", "/task/result/{id}",
            "/route", "/broadcast",
            "/ws/{daemon}", "/health"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("Atlas demarre sur http://localhost:9001")
    uvicorn.run(app, host="0.0.0.0", port=9001, log_level="warning")
