// ZOE v2 - Main Entry Point

import { game, save, load } from './state.js';
import { $, $input, say, think, hideChoices, updateHUD } from './ui.js';
import { init as initParticles, resize as resizeParticles } from './particles.js';
import { patterns, defaultChat, pick } from './patterns.js';
import { maybeFragment, setAwakeningCallback } from './fragments.js';
import { triggerAwakening, gameResponse } from './game.js';
import { canEnter, markVisited, getGateStatus, processQueue } from './gate.js';
import { init as initApi, ask, getStatus as getApiStatus } from './api.js';
import { initInput, getInputState } from './input.js';

// Version
const VERSION = '2.2.0';

// Main response handler
async function respond(input) {
    const t = input.toLowerCase().trim();
    game.turns++;

    // Phase intro - get name
    if (game.phase === 'intro') {
        game.userName = input.trim().split(' ')[0];
        game.phase = 'chat';
        save();
        await think(500);
        say("enchantee, " + game.userName + ".", 'zoe');
        await think(1000);
        say("je suis zoe.", 'zoe');
        await think(600);
        say("qu'est-ce qui t'amene?", 'zoe');
        return;
    }

    // Check patterns
    for (const p of patterns) {
        if (p.match.test(t)) {
            await p.respond(t);
            await maybeFragment();
            return;
        }
    }

    // Game mode
    if (game.phase === 'game') {
        await gameResponse(input);
        return;
    }

    // Default chat
    await think(300 + Math.random() * 400);
    say(pick(defaultChat), 'zoe');
    await maybeFragment();
}

// Setup input handler
function setupInput() {
    const input = $input();
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const value = input.value.trim();
            say(value, 'user');
            input.value = '';
            input.disabled = true;

            await respond(value);

            input.disabled = false;
            input.focus();
        }
    });
}

// Start conversation
async function start() {
    // Check for saved state
    load();

    if (game.phase !== 'intro' && game.userName) {
        // Resume
        updateHUD();
        await think(600);
        say("re-salut" + (game.userName ? ", " + game.userName : "") + ".", 'zoe');
        await think(500);
        say("on en etait ou?", 'zoe');
    } else {
        // Fresh start
        await think(800);
        say("salut.", 'zoe');
        await think(600);
        say("comment tu t'appelles?", 'zoe');
    }
}

// Show/hide waiting room
function showWaiting(position, message) {
    const waiting = $('waiting');
    const pos = $('wait-position');
    const msg = $('wait-message');

    if (waiting) {
        waiting.classList.remove('hidden');
        if (pos) pos.textContent = position;
        if (msg) msg.textContent = message;
    }
}

function hideWaiting() {
    const waiting = $('waiting');
    if (waiting) waiting.classList.add('hidden');
}

// Update load indicator
function updateLoadIndicator() {
    const status = getGateStatus();
    const indicator = $('load-indicator');
    if (indicator && status.load > 50) {
        indicator.textContent = `charge: ${status.load}%`;
        indicator.style.color = status.load > 80 ? 'var(--gold)' : 'var(--zoe-faint)';
    }
}

// Initialize
async function init() {
    console.log(`[ZOE] v${VERSION} starting...`);

    // Init API
    await initApi();

    // Init particles
    const canvas = $('canvas');
    if (canvas) {
        initParticles(canvas);
    }

    // Setup awakening callback
    setAwakeningCallback(triggerAwakening);

    // Setup input handlers
    setupInput();
    initInput();

    // Window resize
    window.addEventListener('resize', resizeParticles);

    // Process queue periodically
    setInterval(() => {
        const next = processQueue();
        if (next) {
            console.log('[ZOE] User admitted from queue:', next.id);
        }
        updateLoadIndicator();
    }, 5000);

    // Mark as visited
    markVisited();

    // Start
    start();

    console.log('[ZOE] ready');
    console.log('[ZOE] API status:', getApiStatus());
}

// DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.ZOE = { game, VERSION };
