// ZOE v2 - UI Functions

import { game } from './state.js';

// DOM elements
export const $ = id => document.getElementById(id);
export const $messages = () => $('messages');
export const $input = () => $('input');
export const $choices = () => $('choices');
export const $hud = () => $('hud');
export const $pulse = () => $('pulse');
export const $titre = () => $('titre');

// Say something
export function say(text, type = 'zoe') {
    const msg = document.createElement('div');
    msg.className = 'msg ' + type;
    msg.innerHTML = text;
    $messages().appendChild(msg);
    $messages().scrollTop = $messages().scrollHeight;
    game.history.push({ type, text, ts: Date.now() });
}

// Typing indicator
export function showTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg zoe typing';
    msg.id = 'typing';
    msg.textContent = '...';
    $messages().appendChild(msg);
    $messages().scrollTop = $messages().scrollHeight;
}

export function hideTyping() {
    const t = $('typing');
    if (t) t.remove();
}

// Think (delay with typing)
export function think(ms) {
    return new Promise(r => {
        showTyping();
        setTimeout(() => { hideTyping(); r(); }, ms);
    });
}

// Update HUD
export function updateHUD() {
    $('level').textContent = game.level;
    $('fragments').textContent = game.fragments;
    if (game.level > 0) {
        $hud().classList.add('visible');
    }
}

// Show choices
export function showChoices(options, callback) {
    const choices = $choices();
    choices.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.onclick = () => {
            choices.classList.remove('visible');
            say(opt.text, 'user');
            if (callback) callback(opt);
            if (opt.action) opt.action();
        };
        choices.appendChild(btn);
    });
    choices.classList.add('visible');
    $input().style.display = 'none';
}

// Hide choices
export function hideChoices() {
    $choices().classList.remove('visible');
    $input().style.display = 'block';
    $input().focus();
}

// Evolve UI
export function evolveUI() {
    $pulse().classList.add('alive');
    $titre().classList.add('evolved');
}
