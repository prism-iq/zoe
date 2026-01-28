// app.js - Entry point, init, input history, keyboard

import state from './state.js';
import { initUI, say, think, getInput, getInputValue, clearInput, setInputEnabled, updateHUD, evolveUI } from './ui.js';
import { init as initParticles } from './particles.js';
import { start as startMind } from './mind.js';
import { respond } from './handlers.js';
import { setAwakeningCallback } from './fragments.js';
import { triggerAwakening } from './game.js';
import { MAX_INPUT_HISTORY } from './data.js';

// === INPUT HISTORY ===
let inputHistory = [];
let historyIndex = -1;
let lastDeleted = null;
let tempInput = '';

try {
    const saved = localStorage.getItem('zoe_history');
    if (saved) inputHistory = JSON.parse(saved).slice(-MAX_INPUT_HISTORY);
} catch (e) {}

function saveHistory(text) {
    if (text && text.trim() && text !== inputHistory[inputHistory.length - 1]) {
        inputHistory.push(text);
        if (inputHistory.length > MAX_INPUT_HISTORY) inputHistory.shift();
        try { localStorage.setItem('zoe_history', JSON.stringify(inputHistory)); } catch (e) {}
    }
    historyIndex = -1;
    tempInput = '';
}

function navigateHistory(input, dir) {
    if (inputHistory.length === 0) return;
    if (historyIndex === -1) tempInput = input.value;

    if (dir === 'up' && historyIndex < inputHistory.length - 1) {
        historyIndex++;
        input.value = inputHistory[inputHistory.length - 1 - historyIndex];
    } else if (dir === 'down') {
        if (historyIndex > 0) {
            historyIndex--;
            input.value = inputHistory[inputHistory.length - 1 - historyIndex];
        } else if (historyIndex === 0) {
            historyIndex = -1;
            input.value = tempInput;
        }
    }
    setTimeout(() => input.selectionStart = input.selectionEnd = input.value.length, 0);
}

function saveForRestore(text) {
    if (text && text.trim()) lastDeleted = text;
}

function restore(input) {
    if (lastDeleted) {
        input.value = lastDeleted;
        lastDeleted = null;
        input.focus();
    }
}

// === INPUT SETUP ===
function setupInput() {
    const input = getInput();
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
        // Enter = send
        if (e.key === 'Enter' && getInputValue()) {
            e.preventDefault();
            const value = getInputValue();
            saveHistory(value);
            saveForRestore(value);
            say(value, 'user');
            clearInput();
            setInputEnabled(false);

            await respond(value);

            setInputEnabled(true);
            return;
        }

        // Arrow Up = history (cursor at start)
        if (e.key === 'ArrowUp' && input.selectionStart === 0) {
            e.preventDefault();
            navigateHistory(input, 'up');
            return;
        }

        // Arrow Down = history (cursor at end)
        if (e.key === 'ArrowDown' && input.selectionStart === input.value.length) {
            e.preventDefault();
            navigateHistory(input, 'down');
            return;
        }

        // Escape = clear (save for restore)
        if (e.key === 'Escape' && input.value) {
            saveForRestore(input.value);
            input.value = '';
            historyIndex = -1;
            return;
        }

        // Ctrl+Z on empty = restore
        if (e.ctrlKey && e.key === 'z' && !input.value) {
            e.preventDefault();
            restore(input);
            return;
        }
    });

    // Global shortcut: focus input on letter key
    document.addEventListener('keydown', e => {
        if (document.activeElement === input) return;
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key) && !e.ctrlKey && !e.altKey) {
            input.focus();
        }
    });
}

// === START CONVERSATION ===
async function start() {
    // Check for saved state
    state.load();

    if (state.phase !== 'intro' && state.userName) {
        // Resume previous session
        updateHUD();
        if (state.level > 0) evolveUI();
        await think(600);
        say("re-salut" + (state.userName ? ", " + state.userName : "") + ".");
        await think(500);
        say("on en etait ou?");
    } else {
        // Fresh start
        await think(800);
        say("hey.");
        await think(600);
        say("c'est quoi ton prenom?");
    }

    // Start autonomous mind loop
    startMind();
}

// === INIT ===
async function init() {
    // Init UI
    initUI();

    // Init particles
    const canvas = document.getElementById('canvas');
    if (canvas) initParticles(canvas);

    // Wire awakening callback
    setAwakeningCallback(triggerAwakening);

    // Setup input
    setupInput();

    // Start conversation
    await start();

    console.log('[zoe] ready');
}

// DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Debug access
window.zoe = { state };
