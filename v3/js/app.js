// App entry point
import { say, typing, stopTyping, wait } from './ui.js';
import { loadPatterns } from './patterns.js';
import { initInput } from './input.js';
import { state } from './state.js';

async function start() {
    // Load patterns via AJAX
    const data = await loadPatterns();
    if (!data) {
        say("erreur de chargement.");
        return;
    }

    // Init input
    initInput();

    // Start conversation
    await wait(500);
    typing();
    await wait(600);
    stopTyping();
    say(state.intro.greeting);
    await wait(500);
    typing();
    await wait(400);
    stopTyping();
    say(state.intro.askName);
}

start();
