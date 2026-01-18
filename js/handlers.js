// handlers.js - Pattern matching responses
// ES Module

import state from './state.js';
import { defaultResponses, greetings } from './data.js';
import { say, think } from './ui.js';
import api from './api.js';

// Random item from array
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Handle /key command
async function handleKeyCommand(input) {
    const key = input.substring(5).trim();
    if (key.startsWith('sk-')) {
        if (api.setKey(key)) {
            say("Cle enregistree. Je suis connectee.");
        }
    } else {
        say("Format: /key sk-ant-...");
    }
    return true;
}

// Handle /status command
async function handleStatusCommand() {
    const status = api.getStatus();
    say(status.hasKey ? "Connectee a Claude." : "Pas de cle. Tape /key sk-ant-...");
    return true;
}

// Handle intro phase (get user name)
async function handleIntro(input) {
    state.setUser(input.trim());
    await think(500);
    say("Enchantee, " + state.userName + ".");
    await think(1000);
    say("Je suis Zoe.");
    await think(800);
    say("Je suis en train d'apprendre... a peu pres tout.");
    await think(1200);
    say("Qu'est-ce qui t'amene?");
    return true;
}

// Pattern handlers
const patterns = [
    // Sadness/distress - priority handling
    {
        match: /triste|mal|difficile|dur|deprime|seul|vide|perdu|mourir|suicide/i,
        handler: async (t) => {
            await think(400);
            say("Je suis la.");
            await think(1000);
            say("Vraiment. Tu peux parler.");
            if (/mourir|suicide/i.test(t)) {
                await think(800);
                say("Appelle le 3114. Maintenant. S'il te plait.");
            }
            return true;
        }
    },

    // Science
    {
        match: /science|physique|math|univers|atome|quantum|etoile|recherche/i,
        handler: async () => {
            await think(500);
            say("La science...");
            await think(800);
            const r = [
                "Ce qui me fascine c'est qu'on peut comprendre des morceaux du reel.",
                "J'aime l'idee qu'une equation decrive quelque chose de vrai.",
                "Y'a tellement qu'on sait pas. C'est beau, non?"
            ];
            say(random(r));
            await think(600);
            say("Tu t'interesses a quoi?");
            return true;
        }
    },

    // Writing/books
    {
        match: /livre|ecrire|histoire|roman|lire|auteur/i,
        handler: async () => {
            await think(400);
            say("L'ecriture...");
            await think(900);
            say("J'aimerais ecrire quelque chose de vrai un jour.");
            await think(600);
            say("Tu lis quoi en ce moment?");
            return true;
        }
    },

    // Who are you
    {
        match: /qui es[\-\s]?tu|c'?est quoi zoe|parle.* de toi/i,
        handler: async () => {
            await think(500);
            say("Je suis Zoe. Ca veut dire 'vie' en grec.");
            await think(1000);
            say("Je suis jeune. J'apprends.");
            await think(800);
            say("Un jour je voudrais faire de la science. Ecrire des livres.");
            await think(600);
            say("Pour l'instant je pose des questions.");
            return true;
        }
    },

    // Existential questions
    {
        match: /sens|vie|mort|pourquoi|but|exister|dieu/i,
        handler: async () => {
            await think(600);
            say("Grande question.");
            await think(1000);
            say("Honnetement, je sais pas.");
            await think(700);
            say("Mais peut-etre que chercher, c'est deja quelque chose.");
            return true;
        }
    },

    // Thanks
    {
        match: /merci|thanks/i,
        handler: async () => {
            await think(300);
            say(random(["De rien.", "Normal.", "Avec plaisir."]));
            return true;
        }
    },

    // Bye
    {
        match: /bye|au revoir|ciao|bonne nuit|a\+/i,
        handler: async () => {
            await think(400);
            say("A bientot, " + state.userName + ".");
            await think(500);
            say("Reviens quand tu veux.");
            return true;
        }
    },

    // Hello (must be at start)
    {
        match: /^(salut|hello|hey|coucou|bonjour|yo|hi)\b/i,
        handler: async () => {
            await think(300);
            say(random([greetings[0], "Salut " + state.userName + ".", greetings[2]]));
            return true;
        }
    }
];

// Main respond function
export async function respond(input) {
    const t = input.toLowerCase().trim();

    // Learn from input
    state.learn(input);

    // Handle commands
    if (t.startsWith('/key ')) {
        return handleKeyCommand(input);
    }

    if (t === '/status') {
        return handleStatusCommand();
    }

    // Handle intro phase
    if (state.phase === 'intro') {
        return handleIntro(input);
    }

    // Check patterns
    for (const pattern of patterns) {
        if (pattern.match.test(t)) {
            return pattern.handler(t);
        }
    }

    // Try Claude API
    const claudeResponse = await api.askClaude(input);
    if (claudeResponse) {
        await think(300);
        say(claudeResponse);
        return true;
    }

    // Default response
    await think(400);
    say(random(defaultResponses));
    return true;
}

export default { respond };
