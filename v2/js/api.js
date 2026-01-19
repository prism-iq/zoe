// ZOE v2 - API Layer (scalable backend connection)

// Backend endpoints (will be configured)
const ENDPOINTS = {
    // Primary: Cloudflare Worker (edge, fast)
    cf: 'https://zoe-api.workers.dev/ask',
    // Fallback: Direct Nyx (local)
    nyx: 'http://127.0.0.1:9999/ask',
    // Fallback: None (offline mode)
    offline: null
};

let currentEndpoint = 'offline';
let apiKey = null;

// Check which endpoint works
export async function detectEndpoint() {
    // Try CF first
    try {
        const res = await fetch(ENDPOINTS.cf.replace('/ask', '/health'), {
            method: 'GET',
            timeout: 3000
        });
        if (res.ok) {
            currentEndpoint = 'cf';
            console.log('[API] Using Cloudflare edge');
            return 'cf';
        }
    } catch (e) {}

    // Try Nyx
    try {
        const res = await fetch(ENDPOINTS.nyx.replace('/ask', '/health'), {
            method: 'GET',
            timeout: 2000
        });
        if (res.ok) {
            currentEndpoint = 'nyx';
            console.log('[API] Using local Nyx');
            return 'nyx';
        }
    } catch (e) {}

    // Offline mode
    currentEndpoint = 'offline';
    console.log('[API] Offline mode');
    return 'offline';
}

// Set API key (for authenticated requests)
export function setKey(key) {
    if (key && key.startsWith('sk-')) {
        apiKey = key;
        localStorage.setItem('zoe_key', key);
        return true;
    }
    return false;
}

// Load stored key
export function loadKey() {
    apiKey = localStorage.getItem('zoe_key');
    return !!apiKey;
}

// Ask the backend
export async function ask(prompt, context = []) {
    if (currentEndpoint === 'offline' || !ENDPOINTS[currentEndpoint]) {
        return null; // Use local patterns
    }

    try {
        const body = {
            prompt,
            context: context.slice(-10), // Last 10 messages
            user: localStorage.getItem('zoe_user_id') || 'anon'
        };

        const headers = {
            'Content-Type': 'application/json'
        };

        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const res = await fetch(ENDPOINTS[currentEndpoint], {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (res.ok) {
            const data = await res.json();
            return data.response || data.text || null;
        }
    } catch (e) {
        console.warn('[API] Request failed:', e.message);
    }

    return null;
}

// Get status
export function getStatus() {
    return {
        endpoint: currentEndpoint,
        hasKey: !!apiKey,
        online: currentEndpoint !== 'offline'
    };
}

// Generate user ID (anonymous)
export function ensureUserId() {
    let id = localStorage.getItem('zoe_user_id');
    if (!id) {
        id = 'u_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('zoe_user_id', id);
    }
    return id;
}

// Initialize
export async function init() {
    loadKey();
    ensureUserId();
    await detectEndpoint();
}
