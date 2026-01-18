// wave.js - Organic probability algorithm
// ES Module

import state from './state.js';

// Wave function - probability based on user activity
// Returns probability between 0 and 1
// Higher when user is idle, lower when active
export function waveProbability() {
    const now = Date.now();
    const timeSinceMove = now - state.activity.lastMove;
    const timeSinceKey = now - state.activity.lastKey;

    // More idle = more likely Zoe speaks
    // Less idle = less likely (don't interrupt)
    const idleFactor = Math.min(timeSinceMove, timeSinceKey) / 10000;

    // Add organic oscillation (like breathing)
    const wave = Math.sin(now / 5000) * 0.3 + 0.5;

    // Combine factors, cap at 0.8
    const prob = Math.min(0.8, idleFactor * wave);

    return prob;
}

// Calculate organic delay based on activity
// More active user = longer delay before Zoe speaks
export function organicDelay() {
    const prob = waveProbability();
    // Base delay 3s, max additional 15s based on activity
    return 3000 + (1 - prob) * 15000;
}

// Should Zoe speak now?
export function shouldSpeak(threshold = 0.5) {
    return Math.random() < waveProbability() * threshold;
}

// Mentor speak probability (less frequent)
export function shouldMentorSpeak() {
    return shouldSpeak(0.3);
}

// Get current wave state for debugging
export function getWaveState() {
    return {
        probability: waveProbability(),
        delay: organicDelay(),
        idle: state.activity.idle,
        timeSinceMove: Date.now() - state.activity.lastMove,
        timeSinceKey: Date.now() - state.activity.lastKey
    };
}

export default {
    waveProbability,
    organicDelay,
    shouldSpeak,
    shouldMentorSpeak,
    getWaveState
};
