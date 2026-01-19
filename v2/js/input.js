// ZOE v2 - Input Field Evolution
// The input breathes, reacts, evolves

import { game } from './state.js';
import { $ } from './ui.js';

let input = null;
let lastActivity = Date.now();
let entropy = 0;

// States
const STATES = {
    idle: 'idle',
    typing: 'typing',
    waiting: 'waiting',
    alive: 'alive',
    dystopia: 'dystopia'
};

let currentState = STATES.idle;

// Initialize input behavior
export function initInput() {
    input = $('input');
    if (!input) return;

    // Track typing
    input.addEventListener('input', onInput);
    input.addEventListener('focus', onFocus);
    input.addEventListener('blur', onBlur);

    // Start breathing
    breathe();

    // Entropy accumulator
    setInterval(accumulateEntropy, 1000);
}

// On input change
function onInput(e) {
    lastActivity = Date.now();
    currentState = STATES.typing;

    const value = e.target.value;
    const len = value.length;

    // Visual feedback based on length
    if (len > 100) {
        input.style.borderColor = 'var(--gold)';
        entropy += 0.5;
    } else if (len > 50) {
        input.style.borderColor = 'var(--mystery)';
        entropy += 0.2;
    } else {
        input.style.borderColor = 'var(--zoe-faint)';
    }

    // Detect patterns
    detectPatterns(value);
}

// Detect special patterns in input
function detectPatterns(value) {
    const lower = value.toLowerCase();

    // Dystopia triggers
    if (/mort|fin|noir|vide|rien|jamais|perdu/.test(lower)) {
        enterDystopia();
    }

    // Entropy triggers
    if (/chaos|hasard|random|infini|libre|tout/.test(lower)) {
        increaseEntropy();
    }

    // Secret commands
    if (lower === '/entropy') {
        maxEntropy();
    }
    if (lower === '/dystopia') {
        enterDystopia();
    }
    if (lower === '/reset') {
        resetState();
    }
}

// Focus
function onFocus() {
    input.classList.add('focused');
    currentState = STATES.waiting;
}

// Blur
function onBlur() {
    input.classList.remove('focused');
    currentState = STATES.idle;
}

// Breathing animation (idle state)
function breathe() {
    if (!input) return;

    const now = Date.now();
    const idle = now - lastActivity;

    // After 5s of inactivity, start breathing
    if (idle > 5000 && currentState !== STATES.typing) {
        const phase = (now % 4000) / 4000;
        const scale = 1 + Math.sin(phase * Math.PI * 2) * 0.02;
        const opacity = 0.8 + Math.sin(phase * Math.PI * 2) * 0.2;

        input.style.transform = `scale(${scale})`;
        input.style.opacity = opacity;

        // Change placeholder based on state
        if (entropy > 50) {
            input.placeholder = randomPlaceholder();
        }
    } else {
        input.style.transform = 'scale(1)';
        input.style.opacity = '1';
    }

    requestAnimationFrame(breathe);
}

// Random placeholder (high entropy)
function randomPlaceholder() {
    const placeholders = [
        '...',
        '???',
        'dis quelque chose',
        'le vide attend',
        'parle',
        'ici',
        'maintenant',
        '∞',
        'φ',
        '..?',
        'continue',
        'encore'
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
}

// Entropy accumulation
function accumulateEntropy() {
    // Entropy increases slowly over time
    entropy += 0.1;

    // Decay when inactive
    const idle = Date.now() - lastActivity;
    if (idle > 30000) {
        entropy *= 0.99;
    }

    // Thresholds
    if (entropy > 100) {
        currentState = STATES.alive;
        input.classList.add('alive');
    }

    if (entropy > 200) {
        // Max entropy - visual chaos
        input.style.borderColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    // Expose for debugging
    if (typeof window !== 'undefined') {
        window.ENTROPY = entropy;
    }
}

// Increase entropy
function increaseEntropy() {
    entropy += 10;
    pulse();
}

// Max entropy
function maxEntropy() {
    entropy = 200;
    input.classList.add('chaos');
    pulse();
}

// Enter dystopia mode
function enterDystopia() {
    currentState = STATES.dystopia;
    input.classList.add('dystopia');
    document.body.classList.add('dystopia-mode');

    // Darker colors
    document.documentElement.style.setProperty('--zoe', 'rgba(100,100,120,1)');
    document.documentElement.style.setProperty('--zoe-soft', 'rgba(100,100,120,0.6)');
}

// Reset state
function resetState() {
    entropy = 0;
    currentState = STATES.idle;
    input.classList.remove('alive', 'chaos', 'dystopia');
    document.body.classList.remove('dystopia-mode');
    document.documentElement.style.setProperty('--zoe', 'rgba(168,230,207,1)');
    document.documentElement.style.setProperty('--zoe-soft', 'rgba(168,230,207,0.6)');
}

// Visual pulse
function pulse() {
    if (!input) return;
    input.classList.add('pulse');
    setTimeout(() => input.classList.remove('pulse'), 300);
}

// Get current state
export function getInputState() {
    return {
        state: currentState,
        entropy,
        lastActivity
    };
}
