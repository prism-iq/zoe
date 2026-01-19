// Patterns module - loads via AJAX
import { state } from './state.js';

export async function loadPatterns() {
    try {
        const res = await fetch('data/patterns.json');
        const data = await res.json();
        state.patterns = data.patterns;
        state.defaults = data.defaults;
        state.intro = data.intro;
        return data;
    } catch (e) {
        console.error('Failed to load patterns:', e);
        return null;
    }
}

export function findPattern(text) {
    const t = text.toLowerCase().trim();

    for (const p of state.patterns) {
        const regex = new RegExp(p.match, 'i');
        if (regex.test(t)) {
            return p;
        }
    }
    return null;
}

export function getDefault() {
    return state.defaults[Math.floor(Math.random() * state.defaults.length)];
}

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
