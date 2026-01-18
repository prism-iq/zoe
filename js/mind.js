// mind.js - Autonomous thinking loop (pensees, mentors, book insights)
// ES Module

import state from './state.js';
import { pensees, mentors, mentorKeys } from './data.js';
import { say, mentorSay, think } from './ui.js';
import { shouldSpeak, shouldMentorSpeak, organicDelay } from './wave.js';
import errors from './errors.js';

let running = false;
let lastInsightTime = 0;

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

// Fetch insights from zoe-reader via JSON file
async function checkBookInsights() {
    if (state.phase !== 'conversation') return;

    try {
        const res = await fetch('/insights.json?t=' + Date.now());
        if (!res.ok) return;

        const data = await res.json();

        if (data.pending && data.history?.[0]?.time) {
            const insightTime = new Date(data.history[0].time).getTime();

            // Only show if it's a new insight
            if (insightTime > lastInsightTime) {
                lastInsightTime = insightTime;

                await think(1000);
                say("Je viens de lire quelque chose d'interessant...", false, true);
                await think(2000);
                say(data.pending, false, true);

                // Clear the pending insight on server
                clearPendingInsight();
            }
        }
    } catch (e) {
        // Silent fail - reader might not be running
    }
}

// Clear the pending insight after displaying
async function clearPendingInsight() {
    try {
        // We can't write to the file from browser, but we can track locally
        // The reader will overwrite with new insights anyway
        localStorage.setItem('zoe_last_insight', lastInsightTime.toString());
    } catch (e) {
        // Ignore
    }
}

// Main autonomous loop
async function boucleVie() {
    while (running) {
        // Variable delay between checks
        await think(2000 + Math.random() * 3000);

        state.incrementIdle();

        // Check for book insights every ~30 seconds
        if (state.activity.idle % 10 === 0) {
            checkBookInsights();
        }

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

// Start the mind loop
export function start() {
    if (running) return;
    running = true;

    // Load last insight time from localStorage
    const saved = localStorage.getItem('zoe_last_insight');
    if (saved) lastInsightTime = parseInt(saved, 10);

    boucleVie();
}

// Stop the mind loop
export function stop() {
    running = false;
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

// Manually check for book insights
export function checkBooks() {
    checkBookInsights();
}

export default {
    start,
    stop,
    triggerThought,
    triggerMentor,
    checkBooks
};
