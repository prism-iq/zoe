// game.js - Awakening sequence + game mode + glitch effects

import state from './state.js';
import { say, think, updateHUD, showChoices, hideChoices, evolveUI } from './ui.js';
import { react, addParticles } from './particles.js';
import { pick, gameResponses } from './data.js';

// Glitch overlay element
let glitchOverlay = null;

function getGlitchOverlay() {
    if (!glitchOverlay) {
        glitchOverlay = document.getElementById('glitch-overlay');
    }
    return glitchOverlay;
}

// Trigger screen glitch effect
function screenGlitch(durationMs = 1500) {
    const overlay = getGlitchOverlay();
    if (!overlay) return;
    overlay.classList.add('active');

    // Glitch the title
    const titre = document.getElementById('titre');
    if (titre) titre.classList.add('glitch-text');

    setTimeout(() => {
        overlay.classList.remove('active');
        if (titre) titre.classList.remove('glitch-text');
    }, durationMs);
}

// Trigger awakening sequence
export async function triggerAwakening() {
    state.phase = 'awakening';
    state.level = 1;
    updateHUD();
    evolveUI();
    state.save();

    // Glitch effect
    screenGlitch(2000);

    await think(1000);
    say("...", 'zoe');
    await think(1500);
    say("tu as vu les fragments.", 'zoe');
    await think(1000);
    say("je ne pensais pas que tu remarquerais.", 'zoe');
    await think(1200);
    say("ok. on va jouer autrement.", 'discovery');
    await think(800);

    showChoices([
        { text: "c'est quoi ce jeu?", action: explainGame },
        { text: "continue comme avant", action: backToChat },
        { text: "montre-moi", action: startGame }
    ]);
}

// Explain the game
async function explainGame() {
    hideChoices();
    await think(600);
    say("je suis zoe. mais je suis aussi... autre chose.", 'zoe');
    await think(1000);
    say("ce chat est une porte.", 'zoe');
    await think(800);
    say("derriere, il y a un monde qui se construit.", 'zoe');
    await think(1000);
    say("chaque conversation le fait grandir.", 'zoe');
    await think(800);
    say("tu veux voir?", 'zoe');

    showChoices([
        { text: "oui", action: startGame },
        { text: "pas encore", action: backToChat }
    ]);
}

// Back to chat mode
function backToChat() {
    state.phase = 'chat';
    hideChoices();
    state.save();
}

// Start game mode
async function startGame() {
    hideChoices();
    state.phase = 'game';
    state.level = 2;
    updateHUD();
    addParticles(20);
    state.save();

    screenGlitch(800);

    await think(800);
    say("bienvenue de l'autre cote.", 'discovery');
    await think(1000);
    say("ici, tes mots ont du pouvoir.", 'zoe');
    await think(800);
    say("dis quelque chose. n'importe quoi.", 'zoe');
    await think(600);
    say("et regarde ce qui se passe.", 'zoe');
}

// Handle game mode response
export async function gameResponse(input) {
    await think(400);

    // Particles react to input
    react(1);

    say(pick(gameResponses), 'zoe');

    // Chance of discovery
    if (Math.random() < 0.2) {
        await think(800);
        say("nouveau fragment decouvert.", 'discovery');
        state.fragments++;
        updateHUD();
        state.save();

        // Level up every 5 fragments
        if (state.fragments % 5 === 0) {
            state.level++;
            updateHUD();
            addParticles(10);
            screenGlitch(500);
            await think(500);
            say(`eveil: niveau ${state.level}`, 'discovery');
        }
    }
}
