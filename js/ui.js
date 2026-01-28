// ui.js - DOM: say, typing, HUD, choices, toast, copy, settings

import state from './state.js';
import { burst } from './particles.js';
import { MAX_MESSAGES } from './data.js';

// DOM references
let messagesEl, inputEl, choicesEl, hudEl, pulseEl, titreEl, settingsBtn;

// Initialize DOM
export function initUI() {
    messagesEl = document.getElementById('messages');
    inputEl = document.getElementById('input');
    choicesEl = document.getElementById('choices');
    hudEl = document.getElementById('hud');
    pulseEl = document.getElementById('pulse');
    titreEl = document.getElementById('titre');
    settingsBtn = document.getElementById('settings');

    if (settingsBtn) {
        settingsBtn.onclick = openSettings;
        if (state.apiKey) settingsBtn.classList.add('active');
    }
}

// Copy to clipboard
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '\u2713';
        setTimeout(() => btn.textContent = '\u2398', 1200);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = '\u2713';
        setTimeout(() => btn.textContent = '\u2398', 1200);
    });
}

// Display a message
// type: 'zoe' | 'user' | 'pensee' | 'fragment' | 'discovery' | 'mentor-*'
export function say(text, type = 'zoe') {
    if (!messagesEl) return null;

    const div = document.createElement('div');

    // Build class list
    if (type === 'user') {
        div.className = 'msg user';
    } else if (type === 'pensee') {
        div.className = 'msg zoe pensee';
    } else if (type === 'fragment') {
        div.className = 'msg fragment';
    } else if (type === 'discovery') {
        div.className = 'msg discovery';
    } else if (type.startsWith('mentor-')) {
        div.className = `msg zoe pensee ${type}`;
    } else {
        div.className = 'msg zoe';
    }

    div.textContent = text;

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '\u2398';
    copyBtn.title = 'Copier';
    copyBtn.onclick = e => {
        e.stopPropagation();
        copyToClipboard(div.textContent.replace(/[\u2398\u2713]/g, '').trim(), copyBtn);
    };
    div.appendChild(copyBtn);

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Limit DOM messages
    while (messagesEl.children.length > MAX_MESSAGES) {
        messagesEl.removeChild(messagesEl.firstChild);
    }

    // Particle burst on zoe messages
    if (type !== 'user') {
        const canvas = document.getElementById('canvas');
        if (canvas) burst(canvas.width / 2, canvas.height - 100);
    }

    return div;
}

// Typing indicator
export function showTyping() {
    if (!messagesEl) return;
    hideTyping();
    const div = document.createElement('div');
    div.className = 'msg zoe typing';
    div.id = 'typing';
    div.textContent = '...';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

export function hideTyping() {
    document.getElementById('typing')?.remove();
}

// Think: show typing for a duration, then hide
export function think(ms) {
    return new Promise(r => {
        showTyping();
        setTimeout(() => { hideTyping(); r(); }, ms);
    });
}

// Wait (no typing indicator)
export function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// Update HUD
export function updateHUD() {
    const levelEl = document.getElementById('level');
    const fragEl = document.getElementById('fragments');
    if (levelEl) levelEl.textContent = state.level;
    if (fragEl) fragEl.textContent = state.fragments;
    if (state.level > 0 && hudEl) {
        hudEl.classList.add('visible');
    }
}

// Show choices (during awakening)
export function showChoices(options) {
    if (!choicesEl) return;
    choicesEl.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.onclick = () => {
            choicesEl.classList.remove('visible');
            say(opt.text, 'user');
            if (opt.action) opt.action();
        };
        choicesEl.appendChild(btn);
    });
    choicesEl.classList.add('visible');
    if (inputEl) inputEl.style.display = 'none';
}

export function hideChoices() {
    if (choicesEl) choicesEl.classList.remove('visible');
    if (inputEl) {
        inputEl.style.display = 'block';
        inputEl.focus();
    }
}

// Evolve UI (after awakening)
export function evolveUI() {
    if (pulseEl) pulseEl.classList.add('alive');
    if (titreEl) titreEl.classList.add('evolved');
}

// Toast notification
export function toast(msg, level = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = `toast ${level}`;
    el.textContent = msg;
    container.appendChild(el);

    setTimeout(() => {
        el.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => el.remove(), 300);
    }, 5000);
}

// Settings dialog (API key)
function openSettings() {
    const k = prompt('Cle API Claude (sk-ant-...):', state.apiKey || '');
    if (k && k.startsWith('sk-')) {
        state.setKey(k);
        settingsBtn?.classList.add('active');
        toast('cle enregistree.', 'info');
    } else if (k === '') {
        state.clearKey();
        settingsBtn?.classList.remove('active');
        toast('cle supprimee.', 'warn');
    } else if (k) {
        toast('format invalide. commence par sk-ant-...', 'error');
    }
}

// Input helpers
export function getInput() { return inputEl; }
export function getInputValue() { return inputEl ? inputEl.value.trim() : ''; }
export function clearInput() { if (inputEl) inputEl.value = ''; }
export function setInputEnabled(enabled) {
    if (inputEl) {
        inputEl.disabled = !enabled;
        if (enabled) inputEl.focus();
    }
}
