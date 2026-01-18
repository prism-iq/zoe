// app.js - Entry point, initialization
// ES Module

import state from './state.js';
import errors from './errors.js';
import ui from './ui.js';
import particles from './particles.js';
import activity from './activity.js';
import mind from './mind.js';
import debug from './debug.js';
import observe from './observe.js';
import { init as initIntegrity, integrity } from './integrity.js';
import { TIMING, PHI } from './constants.js';
import { respond } from './handlers.js';

// App version
const VERSION = '2.0.0';

// Initialize all modules
async function init() {
    try {
        errors.info(`Zoe v${VERSION} starting...`);

        // Initialize UI
        ui.initUI();

        // Initialize particles
        const canvas = document.getElementById('particules');
        if (canvas) {
            particles.initParticles(canvas);
        }

        // Initialize activity tracking
        activity.initActivity();

        // Initialize debug interface
        debug.initDebug();

        // Initialize organic observer
        observe.init();

        // Setup input handler
        setupInput();

        // Setup hot reload
        setupHotReload();

        // Initialize integrity system
        initIntegrity();
        integrity.startMonitoring(TIMING.BREATH);

        // Check network status
        if (!state.isOnline) {
            ui.showOffline();
        }

        // Start the chat
        await start();

        errors.info('Zoe ready');

    } catch (e) {
        errors.error(`Init failed: ${e.message}`);
    }
}

// Hot reload - check for updates and reload modules
let lastCheck = 0;
const CHECK_INTERVAL = 30000; // 30s

async function setupHotReload() {
    // Check for version file changes
    const checkUpdate = async () => {
        try {
            const res = await fetch('/version.json?t=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                if (data.version && data.version !== VERSION) {
                    errors.info('Nouvelle version disponible, rechargement...');
                    // Soft reload - just refresh the page
                    setTimeout(() => location.reload(), 2000);
                }
            }
        } catch (e) {
            // Silent fail
        }
    };

    // Periodic check with organic timing
    const scheduleCheck = () => {
        const delay = CHECK_INTERVAL + (observe.organicDelay(5000));
        setTimeout(() => {
            checkUpdate();
            scheduleCheck();
        }, delay);
    };

    scheduleCheck();
}

// Setup input handling
function setupInput() {
    const input = ui.getInput();
    if (!input) return;

    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && ui.getInputValue()) {
            const value = ui.getInputValue();
            ui.say(value, true);
            ui.clearInput();
            ui.setInputEnabled(false);

            await respond(value);

            ui.setInputEnabled(true);
        }
    });
}

// Start the conversation
async function start() {
    await ui.think(600);
    ui.say("Salut.");
    await ui.think(800);
    ui.say("Comment tu t'appelles?");

    // Start autonomous mind loop
    mind.start();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
export { VERSION };
