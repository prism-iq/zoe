// api.js - Claude API: retry, history, sentence rendering

import state from './state.js';
import { say, showTyping, hideTyping, wait, toast } from './ui.js';
import {
    CLAUDE_ENDPOINT, CLAUDE_MODEL, API_VERSION,
    MAX_TOKENS, MAX_HISTORY, API_RETRIES, API_TIMEOUT, API_BACKOFF,
    SYSTEM_PROMPT
} from './data.js';

// Fetch with timeout using AbortController
async function fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error('Request timeout');
        throw e;
    }
}

// Send message to Claude with conversation history and retry
export async function askClaude(message) {
    if (!state.apiKey) return null;
    if (!state.isOnline) return null;

    // Add user message to history
    state.conversationHistory.push({ role: 'user', content: message });
    if (state.conversationHistory.length > MAX_HISTORY) {
        state.conversationHistory = state.conversationHistory.slice(-MAX_HISTORY);
    }

    for (let i = 0; i < API_RETRIES; i++) {
        try {
            const res = await fetchWithTimeout(CLAUDE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': state.apiKey,
                    'anthropic-version': API_VERSION,
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: MAX_TOKENS,
                    system: SYSTEM_PROMPT,
                    messages: state.conversationHistory
                })
            }, API_TIMEOUT);

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    toast('cle API invalide.', 'error');
                    return null;
                }
                if (res.status === 429) {
                    toast('trop de requetes. patiente.', 'warn');
                    await wait(API_BACKOFF * (i + 1) * 2);
                    continue;
                }
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const reply = data.content?.[0]?.text;
            if (!reply) throw new Error('Empty response');

            // Add assistant reply to history
            state.conversationHistory.push({ role: 'assistant', content: reply });
            return reply;

        } catch (e) {
            console.warn(`[zoe:api] attempt ${i + 1}/${API_RETRIES}: ${e.message}`);
            if (i < API_RETRIES - 1) {
                await wait(API_BACKOFF * (i + 1));
            }
        }
    }

    return null;
}

// Render Claude response sentence by sentence with typing indicator
export async function renderSentences(text) {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    for (let i = 0; i < sentences.length; i++) {
        say(sentences[i]);
        if (i < sentences.length - 1) {
            await wait(300);
            showTyping();
            await wait(400);
            hideTyping();
        }
    }
}

// Check if API is configured
export function hasKey() {
    return !!state.apiKey;
}
