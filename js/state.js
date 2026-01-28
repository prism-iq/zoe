// state.js - Unified state + activity tracking + localStorage

const state = {
    // Phase: intro | chat | awakening | game
    phase: 'intro',
    userName: '',
    level: 0,
    fragments: 0,
    turns: 0,
    discoveries: [],

    // API
    apiKey: localStorage.getItem('zoe_key') || null,
    conversationHistory: [],
    isOnline: navigator.onLine,

    // Activity tracking
    activity: {
        lastMove: Date.now(),
        lastClick: Date.now(),
        lastKey: Date.now(),
        mouseX: 0,
        mouseY: 0,
        idle: 0
    }
};

// Set user name and transition to chat
state.setUser = function(name) {
    this.userName = name;
    this.phase = 'chat';
    this.save();
};

// Save API key
state.setKey = function(key) {
    this.apiKey = key;
    localStorage.setItem('zoe_key', key);
};

// Remove API key
state.clearKey = function() {
    this.apiKey = null;
    localStorage.removeItem('zoe_key');
};

// Update activity (resets idle counter)
state.updateActivity = function(type, data = {}) {
    this.activity.idle = 0;
    const now = Date.now();
    switch (type) {
        case 'move':
            this.activity.lastMove = now;
            this.activity.mouseX = data.x || 0;
            this.activity.mouseY = data.y || 0;
            break;
        case 'click':
            this.activity.lastClick = now;
            break;
        case 'key':
            this.activity.lastKey = now;
            break;
    }
};

state.incrementIdle = function() {
    this.activity.idle++;
};

// Wave probability - organic timing based on idle state
state.waveProbability = function() {
    const now = Date.now();
    const idleMs = Math.min(
        now - this.activity.lastMove,
        now - this.activity.lastKey
    );
    const idleFactor = Math.min(1, idleMs / 10000);
    const wave = Math.sin(now / 5000) * 0.3 + 0.5;
    return Math.min(0.8, idleFactor * wave);
};

// Save game state to localStorage
state.save = function() {
    try {
        localStorage.setItem('zoe_state', JSON.stringify({
            phase: this.phase,
            userName: this.userName,
            level: this.level,
            fragments: this.fragments,
            turns: this.turns,
            discoveries: this.discoveries
        }));
    } catch (e) {}
};

// Load game state from localStorage
state.load = function() {
    try {
        const data = localStorage.getItem('zoe_state');
        if (data) {
            const saved = JSON.parse(data);
            Object.assign(this, saved);
        }
    } catch (e) {}
};

// Reset game state
state.reset = function() {
    this.phase = 'intro';
    this.userName = '';
    this.level = 0;
    this.fragments = 0;
    this.turns = 0;
    this.discoveries = [];
    this.conversationHistory = [];
    this.save();
};

// Network status
window.addEventListener('online', () => { state.isOnline = true; });
window.addEventListener('offline', () => { state.isOnline = false; });

// Activity listeners
document.addEventListener('mousemove', e => state.updateActivity('move', { x: e.clientX, y: e.clientY }));
document.addEventListener('click', () => state.updateActivity('click'));
document.addEventListener('keydown', () => state.updateActivity('key'));

export default state;
