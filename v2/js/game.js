// ZOE v2 - Game Logic (awakening & evolution)

import { game, save } from './state.js';
import { say, think, updateHUD, showChoices, hideChoices, evolveUI } from './ui.js';
import { react, addParticles } from './particles.js';

// Trigger awakening sequence
export async function triggerAwakening() {
    game.phase = 'awakening';
    game.level = 1;
    updateHUD();
    evolveUI();
    save();

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
    game.phase = 'chat';
    hideChoices();
    save();
}

// Start game mode
export async function startGame() {
    hideChoices();
    game.phase = 'game';
    game.level = 2;
    updateHUD();
    addParticles(20);
    save();

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

    // Particles react
    react(1);

    // Random response
    const responses = [
        "je ressens ca.",
        "les particules reagissent.",
        "quelque chose change.",
        "tu sens?",
        "le monde t'entend.",
        "continue.",
        "plus profond.",
        "oui...",
        "ca vibre.",
        "le reseau grandit."
    ];
    say(responses[Math.floor(Math.random() * responses.length)], 'zoe');

    // Chance of discovery
    if (Math.random() < 0.2) {
        await think(800);
        say("nouveau fragment decouvert.", 'discovery');
        game.fragments++;
        updateHUD();
        save();

        // Level up at milestones
        if (game.fragments % 5 === 0) {
            game.level++;
            updateHUD();
            addParticles(10);
            await think(500);
            say(`eveil: niveau ${game.level}`, 'discovery');
        }
    }
}
