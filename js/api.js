// api.js - Claude API with retry + timeout
// ES Module

import state from './state.js';
import errors from './errors.js';
import { CLAUDE_ENDPOINT, SCIENCE_PROMPT } from './data.js';

const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000; // 30s
const BACKOFF_BASE = 1000; // 1s

// Sleep utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch with timeout
async function fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch(e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw e;
    }
}

// Main Claude API call with retry
export async function askClaude(question, retries = DEFAULT_RETRIES) {
    if (!state.claudeKey) {
        errors.info('Pas de cle API configuree');
        return null;
    }

    if (!state.isOnline) {
        errors.warn('Hors ligne');
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetchWithTimeout(CLAUDE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': state.claudeKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 300,
                    system: SCIENCE_PROMPT,
                    messages: [{ role: 'user', content: question }]
                })
            }, DEFAULT_TIMEOUT);

            if (!res.ok) {
                const errorText = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status}: ${errorText.slice(0, 100)}`);
            }

            const data = await res.json();
            const text = data.content?.[0]?.text;

            if (!text) {
                throw new Error('Reponse vide de Claude');
            }

            return text;

        } catch(e) {
            const attempt = i + 1;
            errors.warn(`API tentative ${attempt}/${retries}: ${e.message}`);

            // Don't retry on specific errors
            if (e.message.includes('401') || e.message.includes('403')) {
                errors.error('Cle API invalide');
                return null;
            }

            if (e.message.includes('429')) {
                errors.warn('Limite de requetes atteinte');
                // Wait longer for rate limit
                await sleep(BACKOFF_BASE * (i + 1) * 2);
                continue;
            }

            // Exponential backoff for other errors
            if (i < retries - 1) {
                await sleep(BACKOFF_BASE * (i + 1));
            }
        }
    }

    errors.error('Impossible de contacter Claude apres plusieurs essais');
    return null;
}

// Set API key
export function setKey(key) {
    if (!key || !key.startsWith('sk-')) {
        errors.error('Format de cle invalide. Utilise sk-ant-...');
        return false;
    }

    state.setKey(key);
    errors.info('Cle enregistree');
    return true;
}

// Check connection status
export function getStatus() {
    return {
        hasKey: !!state.claudeKey,
        isOnline: state.isOnline
    };
}

// Test API connection
export async function testConnection() {
    const response = await askClaude('Dis juste "ok" pour tester la connexion.', 1);
    return !!response;
}

export default {
    askClaude,
    setKey,
    getStatus,
    testConnection
};
