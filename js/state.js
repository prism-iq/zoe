// state.js - Global state management
// ES Module

const state = {
    userName: '',
    phase: 'intro',  // intro | conversation
    claudeKey: localStorage.getItem('claude_key') || null,
    isOnline: navigator.onLine,
    apprentissage: [],

    // User activity tracking
    activity: {
        lastMove: Date.now(),
        lastClick: Date.now(),
        lastKey: Date.now(),
        mouseX: 0,
        mouseY: 0,
        scrollY: 0,
        idle: 0
    },

    // Knowledge from books
    knowledge: {
        quotes: [],
        concepts: [],
        insights: []
    }
};

// Methods
state.setUser = function(name) {
    this.userName = name;
    this.phase = 'conversation';
};

state.setKey = function(key) {
    this.claudeKey = key;
    localStorage.setItem('claude_key', key);
};

state.learn = function(input) {
    this.apprentissage.push({ t: input, d: Date.now() });
    if (this.apprentissage.length > 50) this.apprentissage.shift();
};

state.updateActivity = function(type, data = {}) {
    const now = Date.now();
    this.activity.idle = 0;

    switch(type) {
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
        case 'scroll':
            this.activity.scrollY = data.y || 0;
            break;
    }
};

state.incrementIdle = function() {
    this.activity.idle++;
};

// Network status
window.addEventListener('online', () => { state.isOnline = true; });
window.addEventListener('offline', () => { state.isOnline = false; });

export default state;
