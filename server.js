/**
 * ZOE - server.js
 * Lightweight Express HTTP server for the Pantheon public interface.
 * Port 9601 - Where Programs Live.
 *
 * phi = 1.618033988749895
 */

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const PORT = 9601;
const START_TIME = Date.now();

// --- CORS ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// --- Body parsing ---
app.use(express.json());

// --- Health ---
app.get('/health', (req, res) => {
  res.json({
    status: 'alive',
    name: 'zoe',
    port: PORT,
    uptime: Math.floor((Date.now() - START_TIME) / 1000)
  });
});

// --- Helper: fetch JSON from a local daemon ---
function fetchDaemon(port, endpoint = '/health') {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${endpoint}`, { timeout: 2000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ port, status: 'up', data: JSON.parse(body) });
        } catch {
          resolve({ port, status: 'up', data: body });
        }
      });
    });
    req.on('error', () => resolve({ port, status: 'down', data: null }));
    req.on('timeout', () => { req.destroy(); resolve({ port, status: 'timeout', data: null }); });
  });
}

// --- Pantheon daemon ports ---
const PANTHEON_DAEMONS = [
  { name: 'cipher',     port: 9600 },
  { name: 'euterpe',    port: 9700 },
  { name: 'nyx',        port: 9999 },
  { name: 'zoe',        port: 9601 }
];

// --- API: aggregate status of all daemons ---
app.get('/api/status', async (req, res) => {
  const results = await Promise.all(
    PANTHEON_DAEMONS.map(async (d) => {
      const result = await fetchDaemon(d.port);
      return { name: d.name, port: d.port, status: result.status, data: result.data };
    })
  );
  const alive = results.filter(r => r.status === 'up').length;
  res.json({
    pantheon: results,
    summary: { total: PANTHEON_DAEMONS.length, alive, down: PANTHEON_DAEMONS.length - alive },
    timestamp: Date.now()
  });
});

// --- API: stats ---
app.get('/api/stats', (req, res) => {
  const uptime = Math.floor((Date.now() - START_TIME) / 1000);
  res.json({
    papers: 42,
    daemons: PANTHEON_DAEMONS.length,
    uptime
  });
});

// --- Proxy: POST /api/chat -> cipher at 9600 ---
app.post('/api/chat', (req, res) => {
  const payload = JSON.stringify(req.body);
  const options = {
    hostname: 'localhost',
    port: 9600,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    timeout: 10000
  };

  const proxy = http.request(options, (upstream) => {
    let body = '';
    upstream.on('data', (chunk) => { body += chunk; });
    upstream.on('end', () => {
      res.status(upstream.statusCode).send(body);
    });
  });

  proxy.on('error', () => {
    res.status(502).json({ error: 'cipher daemon unavailable', port: 9600 });
  });

  proxy.on('timeout', () => {
    proxy.destroy();
    res.status(504).json({ error: 'cipher daemon timeout' });
  });

  proxy.write(payload);
  proxy.end();
});

// --- Static files (serves index.html, css/, js/, etc.) ---
app.use(express.static(path.join(__dirname)));

// --- Start ---
app.listen(PORT, () => {
  console.log(`[ZOE] alive on port ${PORT}`);
  console.log(`[ZOE] http://localhost:${PORT}`);
});
