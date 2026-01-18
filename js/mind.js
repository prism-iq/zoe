// mind.js - Autonomous thinking loop (pensees, mentors)
// ES Module

import state from './state.js';
import { pensees, mentors, mentorKeys } from './data.js';
import { say, mentorSay, think } from './ui.js';
import { shouldSpeak, shouldMentorSpeak, organicDelay } from './wave.js';

let running = false;
let loopTimeout = null;

// Get random item from array
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Zoe thinks a random pensee
async function penser() {
    if (state.phase !== 'conversation') return;
    if (document.hidden) return;
    if (!shouldSpeak()) return;

    const delay = organicDelay();
    await think(delay);

    if (document.hidden) return;

    say(random(pensees), false, true);
}

// A mentor speaks
async function mentorParle() {
    if (state.phase !== 'conversation') return;
    if (document.hidden) return;
    if (!shouldMentorSpeak()) return;

    const key = random(mentorKeys);
    const mentor = mentors[key];
    const parole = random(mentor.paroles);

    mentorSay(mentor.nom, parole, mentor.cssClass);
}

// Main autonomous loop
async function boucleVie() {
    while (running) {
        // Variable delay between checks
        await think(2000 + Math.random() * 3000);

        state.incrementIdle();

        // Check for book insights
        checkKnowledgeUpdates();

        // Think after being idle for a bit
        if (state.activity.idle > 3) {
            penser();
        }

        // Mentor speaks after longer idle
        if (state.activity.idle > 5) {
            mentorParle();
        }
    }
}

// Check for knowledge updates from book reader
function checkKnowledgeUpdates() {
    const insight = localStorage.getItem('zoe_insight');
    if (insight) {
        localStorage.removeItem('zoe_insight');
        say("Je viens de lire quelque chose...", false, true);
        setTimeout(() => {
            say(insight, false, true);
        }, 1500);
    }
}

// Start the mind loop
export function start() {
    if (running) return;
    running = true;
    boucleVie();
}

// Stop the mind loop
export function stop() {
    running = false;
    if (loopTimeout) {
        clearTimeout(loopTimeout);
        loopTimeout = null;
    }
}

// Manually trigger a thought
export function triggerThought() {
    if (state.phase !== 'conversation') return;
    say(random(pensees), false, true);
}

// Manually trigger a mentor
export function triggerMentor(mentorKey = null) {
    if (state.phase !== 'conversation') return;

    const key = mentorKey || random(mentorKeys);
    const mentor = mentors[key];
    if (!mentor) return;

    const parole = random(mentor.paroles);
    mentorSay(mentor.nom, parole, mentor.cssClass);
}

export default {
    start,
    stop,
    triggerThought,
    triggerMentor
};
