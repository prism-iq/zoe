// activity.js - User activity tracking (mouse, keys, scroll)
// ES Module

import state from './state.js';

let initialized = false;

// Initialize activity listeners
export function initActivity() {
    if (initialized) return;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    document.addEventListener('scroll', onScroll);
    document.addEventListener('keydown', onKeyDown);

    initialized = true;
}

function onMouseMove(e) {
    state.updateActivity('move', { x: e.clientX, y: e.clientY });
}

function onClick() {
    state.updateActivity('click');
}

function onScroll() {
    state.updateActivity('scroll', { y: window.scrollY });
}

function onKeyDown() {
    state.updateActivity('key');
}

// Get time since last activity
export function getIdleTime() {
    const now = Date.now();
    const lastActivity = Math.max(
        state.activity.lastMove,
        state.activity.lastClick,
        state.activity.lastKey
    );
    return now - lastActivity;
}

// Check if user is idle (default: 10 seconds)
export function isIdle(threshold = 10000) {
    return getIdleTime() > threshold;
}

// Get mouse position
export function getMousePosition() {
    return {
        x: state.activity.mouseX,
        y: state.activity.mouseY
    };
}

// Cleanup
export function destroy() {
    if (!initialized) return;

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onClick);
    document.removeEventListener('scroll', onScroll);
    document.removeEventListener('keydown', onKeyDown);

    initialized = false;
}

export default {
    initActivity,
    getIdleTime,
    isIdle,
    getMousePosition,
    destroy
};
