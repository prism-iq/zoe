#!/usr/bin/env python3
"""
COSMOS - Le stockage universel
Backend de persistence pour le pantheon
"""
import json, asyncio, hashlib, sqlite3
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any

app = FastAPI()
BASE = Path(__file__).parent
DB_PATH = BASE / "cosmos.db"

# Models
class Memory(BaseModel):
    key: str
    value: Any
    tags: List[str] = []
    ttl: Optional[int] = None  # seconds, None = permanent

class Query(BaseModel):
    pattern: Optional[str] = None
    tags: Optional[List[str]] = None
    limit: int = 100

class Message(BaseModel):
    source: str
    target: str
    content: Any
    type: str = "data"

# Database setup
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Key-value store
    c.execute('''CREATE TABLE IF NOT EXISTS memories (
        key TEXT PRIMARY KEY,
        value TEXT,
        tags TEXT,
        created_at TEXT,
        expires_at TEXT
    )''')

    # Message queue
    c.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT,
        target TEXT,
        content TEXT,
        type TEXT,
        created_at TEXT,
        processed INTEGER DEFAULT 0
    )''')

    # Event log
    c.execute('''CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        daemon TEXT,
        event TEXT,
        data TEXT,
        ts TEXT
    )''')

    conn.commit()
    conn.close()

init_db()

def get_db():
    return sqlite3.connect(DB_PATH)

# ============== MEMORY (Key-Value) ==============

@app.post("/memory/set")
def memory_set(mem: Memory):
    """Store a value."""
    conn = get_db()
    c = conn.cursor()

    now = datetime.now().isoformat()
    expires = None
    if mem.ttl:
        from datetime import timedelta
        expires = (datetime.now() + timedelta(seconds=mem.ttl)).isoformat()

    c.execute('''INSERT OR REPLACE INTO memories (key, value, tags, created_at, expires_at)
                 VALUES (?, ?, ?, ?, ?)''',
              (mem.key, json.dumps(mem.value), json.dumps(mem.tags), now, expires))
    conn.commit()
    conn.close()

    return {"status": "stored", "key": mem.key}

@app.get("/memory/get/{key}")
def memory_get(key: str):
    """Retrieve a value."""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT value, tags, created_at FROM memories WHERE key = ?', (key,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Key not found")

    return {
        "key": key,
        "value": json.loads(row[0]),
        "tags": json.loads(row[1]),
        "created_at": row[2]
    }

@app.post("/memory/query")
def memory_query(q: Query):
    """Search memories."""
    conn = get_db()
    c = conn.cursor()

    sql = 'SELECT key, value, tags, created_at FROM memories WHERE 1=1'
    params = []

    if q.pattern:
        sql += ' AND key LIKE ?'
        params.append(f'%{q.pattern}%')

    if q.tags:
        for tag in q.tags:
            sql += ' AND tags LIKE ?'
            params.append(f'%"{tag}"%')

    sql += f' ORDER BY created_at DESC LIMIT {q.limit}'

    c.execute(sql, params)
    rows = c.fetchall()
    conn.close()

    return [{
        "key": r[0],
        "value": json.loads(r[1]),
        "tags": json.loads(r[2]),
        "created_at": r[3]
    } for r in rows]

@app.delete("/memory/delete/{key}")
def memory_delete(key: str):
    """Delete a value."""
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM memories WHERE key = ?', (key,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "key": key}

# ============== MESSAGES (Queue) ==============

@app.post("/msg/send")
def msg_send(msg: Message):
    """Send a message to the queue."""
    conn = get_db()
    c = conn.cursor()
    c.execute('''INSERT INTO messages (source, target, content, type, created_at)
                 VALUES (?, ?, ?, ?, ?)''',
              (msg.source, msg.target, json.dumps(msg.content), msg.type, datetime.now().isoformat()))
    msg_id = c.lastrowid
    conn.commit()
    conn.close()
    return {"status": "sent", "id": msg_id}

@app.get("/msg/recv/{target}")
def msg_recv(target: str, limit: int = 10):
    """Receive messages for a target."""
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT id, source, content, type, created_at FROM messages
                 WHERE target = ? AND processed = 0
                 ORDER BY created_at LIMIT ?''', (target, limit))
    rows = c.fetchall()

    # Mark as processed
    ids = [r[0] for r in rows]
    if ids:
        c.execute(f'UPDATE messages SET processed = 1 WHERE id IN ({",".join("?"*len(ids))})', ids)
        conn.commit()

    conn.close()

    return [{
        "id": r[0],
        "source": r[1],
        "content": json.loads(r[2]),
        "type": r[3],
        "created_at": r[4]
    } for r in rows]

@app.get("/msg/pending/{target}")
def msg_pending(target: str):
    """Count pending messages."""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM messages WHERE target = ? AND processed = 0', (target,))
    count = c.fetchone()[0]
    conn.close()
    return {"target": target, "pending": count}

# ============== EVENTS (Log) ==============

@app.post("/event")
def event_log(daemon: str, event: str, data: dict = {}):
    """Log an event."""
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO events (daemon, event, data, ts) VALUES (?, ?, ?, ?)',
              (daemon, event, json.dumps(data), datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"status": "logged"}

@app.get("/events/{daemon}")
def events_get(daemon: str, limit: int = 50):
    """Get events for a daemon."""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT event, data, ts FROM events WHERE daemon = ? ORDER BY ts DESC LIMIT ?',
              (daemon, limit))
    rows = c.fetchall()
    conn.close()
    return [{"event": r[0], "data": json.loads(r[1]), "ts": r[2]} for r in rows]

# ============== HEALTH ==============

@app.get("/health")
def health():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM memories')
    memories = c.fetchone()[0]
    c.execute('SELECT COUNT(*) FROM messages WHERE processed = 0')
    pending = c.fetchone()[0]
    conn.close()

    return {
        "daemon": "Cosmos",
        "status": "awake",
        "memories": memories,
        "pending_messages": pending,
        "ts": datetime.now().isoformat()
    }

@app.get("/")
def root():
    return {"daemon": "Cosmos", "role": "Universal storage", "endpoints": [
        "/memory/set", "/memory/get/{key}", "/memory/query", "/memory/delete/{key}",
        "/msg/send", "/msg/recv/{target}", "/msg/pending/{target}",
        "/event", "/events/{daemon}", "/health"
    ]}

if __name__ == "__main__":
    import uvicorn
    print("Cosmos demarre sur http://localhost:9000")
    uvicorn.run(app, host="0.0.0.0", port=9000, log_level="warning")
