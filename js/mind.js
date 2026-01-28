// mind.js - Autonomous loop: pensees, mentors, wave probability

import state from './state.js';
import { say } from './ui.js';
import { pensees, mentors, mentorKeys, pick, TIMING } from './data.js';

let running = false;

// Main autonomous loop
async function boucleVie() {
    while (running) {
        // Variable delay between checks (organic timing)
        await sleep(2000 + Math.random() * 3000);

        state.incrementIdle();

        // Only emit thoughts during chat or game phase
        if (state.phase !== 'chat' && state.phase !== 'game') continue;

        // Pensee after ~6s idle (idle count > IDLE_THINK)
        if (state.activity.idle > TIMING.IDLE_THINK && shouldSpeak(0.5)) {
            say(pick(pensees), 'pensee');
        }

        // Mentor quote after ~10s idle (idle count > IDLE_MENTOR)
        if (state.activity.idle > TIMING.IDLE_MENTOR && shouldSpeak(0.3)) {
            mentorParle();
        }
    }
}

// Should Zoe speak now? Uses wave probability
function shouldSpeak(threshold) {
    return Math.random() < state.waveProbability() * threshold;
}

// Mentor speaks
function mentorParle() {
    const key = pick(mentorKeys);
    const mentor = mentors[key];
    if (!mentor) return;

    const parole = pick(mentor.paroles);
    say(`${mentor.nom}: ${parole}`, mentor.cssClass);
}

// Sleep utility
function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
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
}
