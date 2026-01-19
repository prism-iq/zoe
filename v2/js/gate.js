// ZOE v2 - Gate System (intelligent admission)
// Zoe decides who enters, who waits

import { game } from './state.js';

// Gate state
const gate = {
    open: true,           // Gate status
    queue: [],            // Waiting users
    inside: 0,            // Current users inside
    maxInside: 100,       // Capacity
    criteria: 'balanced'  // Selection mode
};

// User profile (built from first interaction)
function profileUser(userId, firstMessage) {
    const msg = firstMessage.toLowerCase();

    return {
        id: userId,
        ts: Date.now(),
        // Signals
        returning: !!localStorage.getItem('zoe_visited'),
        curious: /\?|qui|quoi|comment|pourquoi/.test(msg),
        polite: /salut|bonjour|hello|merci|stp/.test(msg),
        distressed: /aide|mal|triste|seul|perdu/.test(msg),
        creative: msg.length > 50 || /imagine|crée|invente/.test(msg),
        technical: /code|bug|erreur|api/.test(msg),
        // Score (calculated)
        score: 0
    };
}

// Calculate admission score
function calculateScore(profile) {
    let score = 50; // Base score

    // Priority: people in distress always enter
    if (profile.distressed) return 100;

    // Returning users get bonus
    if (profile.returning) score += 20;

    // Curiosity is rewarded
    if (profile.curious) score += 15;

    // Politeness matters
    if (profile.polite) score += 10;

    // Creativity is valued
    if (profile.creative) score += 15;

    // Random factor (so it's not purely deterministic)
    score += Math.random() * 20 - 10;

    return Math.min(100, Math.max(0, score));
}

// Check if user can enter
export function canEnter(userId, firstMessage) {
    // Gate open and capacity available
    if (gate.open && gate.inside < gate.maxInside) {
        return { enter: true, wait: 0, reason: 'bienvenue' };
    }

    // Gate closed or full - evaluate
    const profile = profileUser(userId, firstMessage);
    profile.score = calculateScore(profile);

    // Distressed users always enter
    if (profile.distressed) {
        return { enter: true, wait: 0, reason: 'prioritaire' };
    }

    // High score users enter
    if (profile.score >= 70) {
        return { enter: true, wait: 0, reason: 'selectionne' };
    }

    // Others wait
    gate.queue.push(profile);
    const position = gate.queue.length;
    const estimatedWait = position * 30; // 30s per person

    return {
        enter: false,
        wait: estimatedWait,
        position,
        reason: 'file d\'attente',
        message: getWaitMessage(position, profile.score)
    };
}

// Wait messages (Zoe's voice)
function getWaitMessage(position, score) {
    const messages = [
        `il y a ${position} personne${position > 1 ? 's' : ''} avant toi. patience.`,
        `je suis occupée. reviens dans quelques minutes.`,
        `trop de monde. tu es ${position}e dans la file.`,
        `attends un peu. je te fais signe.`,
        `la porte est pleine. mais je te vois.`
    ];

    // Higher score = more encouraging message
    if (score >= 50) {
        return `presque. tu es ${position}e. bientôt.`;
    }

    return messages[Math.floor(Math.random() * messages.length)];
}

// Process queue (called periodically)
export function processQueue() {
    if (gate.queue.length === 0) return null;
    if (gate.inside >= gate.maxInside) return null;

    // Sort by score (highest first)
    gate.queue.sort((a, b) => b.score - a.score);

    // Let in the highest scorer
    const next = gate.queue.shift();
    gate.inside++;

    return next;
}

// User leaves
export function userLeaves(userId) {
    gate.inside = Math.max(0, gate.inside - 1);
}

// Set gate status
export function setGate(open) {
    gate.open = open;
}

// Set capacity
export function setCapacity(max) {
    gate.maxInside = max;
}

// Get gate status
export function getGateStatus() {
    return {
        open: gate.open,
        inside: gate.inside,
        max: gate.maxInside,
        waiting: gate.queue.length,
        load: Math.round((gate.inside / gate.maxInside) * 100)
    };
}

// Mark as visited (for returning user detection)
export function markVisited() {
    localStorage.setItem('zoe_visited', Date.now().toString());
}

// Export gate for debugging
if (typeof window !== 'undefined') {
    window.GATE = gate;
}
