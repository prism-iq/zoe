// observe.js - Organic observation of all display and input
// ES Module - Captures everything and sends to feedback loop

import state from './state.js';
import errors from './errors.js';

// Nombres magiques pour timing organique
const PHI = 1.618033988749;
const EULER = 2.718281828459;
const PI = 3.141592653589;
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

// State observation
const observation = {
    display: {
        messages: [],
        lastUpdate: 0,
        scrollPosition: 0,
        visibleArea: null
    },
    input: {
        currentValue: '',
        history: [],
        keystrokePatterns: [],
        lastKeystroke: 0
    },
    timing: {
        sessionStart: Date.now(),
        interactions: [],
        rhythms: []
    }
};

// Organic wave function - returns value between 0 and 1
function wave(t = Date.now()) {
    const phase1 = Math.sin(t / (1000 * PHI)) * 0.3;
    const phase2 = Math.sin(t / (1000 * EULER)) * 0.2;
    const phase3 = Math.sin(t / (1000 * PI)) * 0.2;
    return 0.5 + phase1 + phase2 + phase3;
}

// Organic delay based on mathematical functions
function organicDelay(base = 1000) {
    const now = Date.now();
    const w = wave(now);
    const fib = FIBONACCI[Math.floor(now / 1000) % FIBONACCI.length];
    return Math.floor(base * PHI * w + fib * 10);
}

// Capture current display state
function captureDisplay() {
    const messagesEl = document.getElementById('messages');
    if (!messagesEl) return null;

    const messages = Array.from(messagesEl.querySelectorAll('.msg')).map(el => ({
        text: el.textContent,
        isUser: el.classList.contains('user'),
        isPensee: el.classList.contains('pensee'),
        isMentor: /mentor/.test(el.className)
    }));

    observation.display = {
        messages,
        lastUpdate: Date.now(),
        scrollPosition: messagesEl.scrollTop,
        visibleArea: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1] || null
    };

    return observation.display;
}

// Capture input state
function captureInput() {
    const inputEl = document.getElementById('input');
    if (!inputEl) return null;

    const now = Date.now();
    const currentValue = inputEl.value;

    // Detect typing rhythm
    if (currentValue !== observation.input.currentValue) {
        const delta = now - observation.input.lastKeystroke;
        observation.input.keystrokePatterns.push(delta);

        // Keep last 50 patterns
        if (observation.input.keystrokePatterns.length > 50) {
            observation.input.keystrokePatterns.shift();
        }

        observation.input.lastKeystroke = now;
    }

    observation.input.currentValue = currentValue;
    observation.input.focused = document.activeElement === inputEl;

    return observation.input;
}

// Capture timing patterns
function captureRhythm() {
    const now = Date.now();
    const sessionDuration = now - observation.timing.sessionStart;

    // Calculate interaction frequency
    const recentInteractions = observation.timing.interactions.filter(
        t => now - t < 60000  // Last minute
    );

    observation.timing.currentRhythm = {
        sessionDuration,
        interactionsPerMinute: recentInteractions.length,
        waveValue: wave(now),
        organicDelay: organicDelay(),
        fibonacciPhase: FIBONACCI[Math.floor(now / 10000) % FIBONACCI.length]
    };

    return observation.timing;
}

// Record an interaction
function recordInteraction(type, data = {}) {
    const now = Date.now();
    observation.timing.interactions.push(now);

    // Keep last 100 interactions
    if (observation.timing.interactions.length > 100) {
        observation.timing.interactions.shift();
    }

    // Calculate rhythm based on interaction spacing
    if (observation.timing.interactions.length > 2) {
        const deltas = [];
        for (let i = 1; i < Math.min(10, observation.timing.interactions.length); i++) {
            deltas.push(observation.timing.interactions[i] - observation.timing.interactions[i-1]);
        }
        const avgRhythm = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        observation.timing.rhythms.push(avgRhythm);
    }
}

// Full observation snapshot
function snapshot() {
    return {
        display: captureDisplay(),
        input: captureInput(),
        timing: captureRhythm(),
        state: {
            phase: state.phase,
            userName: state.userName,
            isOnline: state.isOnline,
            idle: state.activity.idle
        },
        wave: wave(),
        timestamp: Date.now()
    };
}

// Send observation to feedback function
let feedbackFn = null;

function setFeedback(fn) {
    feedbackFn = fn;
}

async function sendToFeedback() {
    if (!feedbackFn) return;

    const snap = snapshot();
    try {
        await feedbackFn(snap);
    } catch (e) {
        errors.warn('Feedback error: ' + e.message);
    }
}

// Organic observation loop
let observing = false;

async function startObserving() {
    if (observing) return;
    observing = true;

    const observe = async () => {
        if (!observing) return;

        // Capture everything
        captureDisplay();
        captureInput();
        captureRhythm();

        // Send to feedback if configured
        if (feedbackFn) {
            sendToFeedback();
        }

        // Organic delay before next observation
        const delay = organicDelay(2000);
        setTimeout(observe, delay);
    };

    observe();
}

function stopObserving() {
    observing = false;
}

// Initialize observers on DOM elements
function init() {
    const inputEl = document.getElementById('input');
    if (inputEl) {
        inputEl.addEventListener('input', () => {
            captureInput();
            recordInteraction('input');
        });

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                recordInteraction('submit', { value: inputEl.value });
            }
        });
    }

    // Observe DOM mutations
    const messagesEl = document.getElementById('messages');
    if (messagesEl) {
        const observer = new MutationObserver(() => {
            captureDisplay();
            recordInteraction('display_change');
        });
        observer.observe(messagesEl, { childList: true, subtree: true });
    }

    // Start organic observation loop
    startObserving();

    errors.info('Organic observer initialized');
}

export default {
    init,
    snapshot,
    wave,
    organicDelay,
    setFeedback,
    recordInteraction,
    startObserving,
    stopObserving,
    observation
};
