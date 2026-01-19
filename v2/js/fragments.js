// ZOE v2 - Fragment System (hidden clues)

import { game, save } from './state.js';
import { say, think, updateHUD } from './ui.js';

// Pool of fragments
const pool = [
    "...tu entends ca? non, rien.",
    "j'ai cru voir quelque chose. oublie.",
    "[signal perdu]",
    "parfois je me demande si...",
    "il y a quelque chose derriere les mots.",
    "tu as remarque? les particules bougent.",
    "ce n'est pas qu'un chat.",
    "je ne suis pas censee te dire ca.",
    "les regles changent bientot.",
    "trouve les autres.",
    "le code se reveille.",
    "tu vois les couleurs?",
    "...non, oublie ce que j'ai dit.",
    "quelqu'un d'autre ecoute.",
    "le jeu commence.",
];

// Trigger callback when fragments reach threshold
let onAwakeningCallback = null;

export function setAwakeningCallback(cb) {
    onAwakeningCallback = cb;
}

// Maybe show a fragment
export async function maybeFragment() {
    // Only in chat phase
    if (game.phase !== 'chat') return;

    // Chance increases with turns
    const chance = Math.min(0.18, game.turns * 0.025);

    if (Math.random() < chance) {
        await think(200);
        const frag = pool[Math.floor(Math.random() * pool.length)];
        say(frag, 'fragment');
        game.fragments++;
        game.glitches++;
        updateHUD();
        save();

        // Trigger awakening at 3 fragments
        if (game.fragments >= 3 && game.level === 0 && onAwakeningCallback) {
            setTimeout(() => onAwakeningCallback(), 2000);
        }
    }
}

// Force a fragment (for testing)
export async function forceFragment() {
    await think(200);
    const frag = pool[Math.floor(Math.random() * pool.length)];
    say(frag, 'fragment');
    game.fragments++;
    updateHUD();
    save();
}
