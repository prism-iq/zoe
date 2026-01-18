// ui.js - DOM manipulation (say, burst, toast)
// ES Module

import errors from './errors.js';

// DOM references (initialized on load)
let messagesEl = null;
let inputEl = null;
let canvasEl = null;

// Initialize DOM references
export function initUI() {
    messagesEl = document.getElementById('messages');
    inputEl = document.getElementById('input');
    canvasEl = document.getElementById('particules');

    if (!messagesEl || !inputEl) {
        errors.error('DOM elements not found');
    }
}

// Get canvas for particles
export function getCanvas() {
    return canvasEl;
}

// Display a message
export function say(text, isUser = false, isPensee = false, mentorClass = null) {
    if (!messagesEl) {
        errors.warn('Messages container not ready');
        return null;
    }

    const div = document.createElement('div');
    div.className = 'msg ' + (isUser ? 'user' : 'zoe') + (isPensee ? ' pensee' : '');

    if (mentorClass) {
        div.className += ` ${mentorClass}`;
    }

    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Limit messages in DOM
    while (messagesEl.children.length > 25) {
        messagesEl.removeChild(messagesEl.firstChild);
    }

    // Trigger particle burst
    if (typeof window.particleBurst === 'function') {
        const canvas = getCanvas();
        if (canvas) {
            window.particleBurst(canvas.width / 2, canvas.height - 100);
        }
    }

    return div;
}

// Say with mentor styling
export function mentorSay(mentorName, text, mentorClass) {
    if (!messagesEl) return null;

    const div = document.createElement('div');
    div.className = `msg zoe pensee ${mentorClass}`;
    div.textContent = `${mentorName}: ${text}`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Particle burst
    if (typeof window.particleBurst === 'function') {
        const canvas = getCanvas();
        if (canvas) {
            window.particleBurst(canvas.width / 2, canvas.height / 2);
        }
    }

    return div;
}

// Toast notification
export function toast(msg, level = 'info') {
    errors.showToast(msg, level);
}

// Show offline banner
export function showOffline() {
    if (document.querySelector('.offline-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.textContent = 'Hors ligne - Certaines fonctions indisponibles';
    document.body.appendChild(banner);
}

// Hide offline banner
export function hideOffline() {
    const banner = document.querySelector('.offline-banner');
    if (banner) banner.remove();
}

// Get input element
export function getInput() {
    return inputEl;
}

// Disable/enable input
export function setInputEnabled(enabled) {
    if (inputEl) {
        inputEl.disabled = !enabled;
        if (enabled) inputEl.focus();
    }
}

// Clear input
export function clearInput() {
    if (inputEl) inputEl.value = '';
}

// Get input value
export function getInputValue() {
    return inputEl ? inputEl.value.trim() : '';
}

// Sleep utility
export function think(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Network status listeners
window.addEventListener('online', hideOffline);
window.addEventListener('offline', showOffline);

export default {
    initUI,
    say,
    mentorSay,
    toast,
    showOffline,
    hideOffline,
    getInput,
    setInputEnabled,
    clearInput,
    getInputValue,
    getCanvas,
    think
};
