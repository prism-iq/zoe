// debug.js - Debug channel + window.zoe
// ES Module

import state from './state.js';
import errors from './errors.js';
import { say } from './ui.js';
import api from './api.js';
import wave from './wave.js';
import mind from './mind.js';
import observe from './observe.js';
import { integrity } from './integrity.js';

let debugInterval = null;

// Initialize debug channel
export function initDebug() {
    // Check for debug messages via localStorage
    debugInterval = setInterval(checkDebugMessages, 1000);

    // Expose global debug interface
    window.zoe = {
        // Say something
        say: (text) => say(text),

        // Debug message (styled differently)
        debug: (text) => say("[debug] " + text, false, true),

        // Ask Claude directly
        ask: async (q) => {
            const r = await api.askClaude(q);
            if (r) say(r);
            return r;
        },

        // Get current state
        state: () => ({ ...state }),

        // Get wave state
        wave: () => wave.getWaveState(),

        // Get errors
        errors: () => errors.getRecent(),

        // Clear errors
        clearErrors: () => errors.clear(),

        // Trigger thought
        think: () => mind.triggerThought(),

        // Trigger mentor
        mentor: (key) => mind.triggerMentor(key),

        // Check for book insights
        books: () => mind.checkBooks(),

        // Organic observer
        observe: () => observe.snapshot(),
        wave: () => observe.wave(),

        // Integrity system
        integrity: () => integrity.status(),
        check: () => integrity.checkAll(),

        // API status
        status: () => api.getStatus(),

        // Test connection
        test: () => api.testConnection(),

        // Version info
        version: '2.0.0-modular'
    };

    console.log('[zoe:debug] Debug interface ready. Use window.zoe to interact.');
}

// Check for external debug messages
function checkDebugMessages() {
    const msg = localStorage.getItem('zoe_debug');
    if (msg) {
        localStorage.removeItem('zoe_debug');
        say("[debug] " + msg, false, true);
    }
}

// Stop debug channel
export function stopDebug() {
    if (debugInterval) {
        clearInterval(debugInterval);
        debugInterval = null;
    }
}

// Send debug message from outside
export function sendDebug(msg) {
    localStorage.setItem('zoe_debug', msg);
}

// Log to console with prefix
export function log(msg, level = 'info') {
    console[level](`[zoe:debug] ${msg}`);
}

export default {
    initDebug,
    stopDebug,
    sendDebug,
    log
};
