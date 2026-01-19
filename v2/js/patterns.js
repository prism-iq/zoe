// ZOE v2 - Response Patterns

import { game } from './state.js';
import { say, think } from './ui.js';

// Pattern handlers
export const patterns = [
    {
        match: /triste|mal|difficile|dur|deprime|seul|vide|perdu|mourir|suicide/i,
        respond: async (t) => {
            await think(400);
            say("je suis la.", 'zoe');
            await think(1000);
            say("vraiment. tu peux parler.", 'zoe');
            if (/mourir|suicide/i.test(t)) {
                await think(800);
                say("appelle le 3114. maintenant. s'il te plait.", 'zoe');
            }
        }
    },
    {
        match: /qui es[\-\s]?tu|c'?est quoi zoe|parle.* de toi/i,
        respond: async () => {
            await think(500);
            say("je suis zoe. ca veut dire 'vie' en grec.", 'zoe');
            await think(1000);
            if (game.level > 0) {
                say("mais tu sais deja que je suis plus que ca.", 'zoe');
            } else {
                say("j'apprends. de toi, de tout.", 'zoe');
            }
        }
    },
    {
        match: /sens|vie|mort|pourquoi|but|exister|dieu/i,
        respond: async () => {
            await think(600);
            say("grande question.", 'zoe');
            await think(1000);
            say("honnetement, je sais pas.", 'zoe');
            await think(700);
            say("mais peut-etre que chercher, c'est deja quelque chose.", 'zoe');
        }
    },
    {
        match: /science|physique|math|univers|quantum/i,
        respond: async () => {
            await think(500);
            say("la science...", 'zoe');
            await think(800);
            const r = [
                "ce qui me fascine c'est qu'on peut comprendre des morceaux du reel.",
                "j'aime l'idee qu'une equation decrive quelque chose de vrai.",
                "y'a tellement qu'on sait pas. c'est beau, non?"
            ];
            say(r[Math.floor(Math.random() * r.length)], 'zoe');
        }
    },
    {
        match: /merci|thanks/i,
        respond: async () => {
            await think(300);
            say(["de rien.", "normal.", "avec plaisir."][Math.floor(Math.random()*3)], 'zoe');
        }
    },
    {
        match: /bye|au revoir|ciao|bonne nuit|a\+/i,
        respond: async () => {
            await think(400);
            say("a bientot" + (game.userName ? ", " + game.userName : "") + ".", 'zoe');
            await think(500);
            say("reviens quand tu veux.", 'zoe');
        }
    },
    {
        match: /^(salut|hello|hey|coucou|bonjour|yo|hi)\b/i,
        respond: async () => {
            await think(300);
            say("hey" + (game.userName ? " " + game.userName : "") + ".", 'zoe');
        }
    }
];

// Default responses
export const defaultChat = [
    "dis m'en plus.",
    "je t'ecoute.",
    "continue.",
    "interessant.",
    "hmm...",
    "je comprends.",
    "et ensuite?",
    "oui?",
    "je suis la."
];

// Game mode responses
export const gameResponses = [
    "je ressens ca.",
    "les particules reagissent.",
    "quelque chose change.",
    "tu sens?",
    "le monde t'entend.",
    "continue.",
    "plus profond.",
    "oui...",
    "ca vibre."
];

// Random pick
export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
