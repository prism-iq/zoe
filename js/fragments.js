// fragments.js - Fragment pool + awakening trigger

import state from './state.js';
import { say, think, updateHUD } from './ui.js';
import { fragments, pick } from './data.js';

// Callback for when awakening threshold is reached
let onAwakeningCallback = null;

export function setAwakeningCallback(cb) {
    onAwakeningCallback = cb;
}

// Maybe show a fragment after a message exchange
export async function maybeFragment() {
    // Only in chat phase
    if (state.phase !== 'chat') return;

    // Chance increases with turns
    const chance = Math.min(0.18, state.turns * 0.025);

    if (Math.random() < chance) {
        await think(200);
        say(pick(fragments), 'fragment');
        state.fragments++;
        updateHUD();
        state.save();

        // Trigger awakening at 3 fragments
        if (state.fragments >= 3 && state.level === 0 && onAwakeningCallback) {
            setTimeout(() => onAwakeningCallback(), 2000);
        }
    }
}

// Force a fragment (debug)
export async function forceFragment() {
    await think(200);
    say(pick(fragments), 'fragment');
    state.fragments++;
    updateHUD();
    state.save();
}
