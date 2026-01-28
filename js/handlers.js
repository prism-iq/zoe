// handlers.js - Pattern matching + Claude fallback pipeline

import state from './state.js';
import { say, think } from './ui.js';
import { askClaude, renderSentences } from './api.js';
import { pick, defaultResponses } from './data.js';
import { maybeFragment } from './fragments.js';
import { gameResponse } from './game.js';

// Pattern definitions (v2's rich set)
const patterns = [
    // DISTRESS - always priority
    {
        match: /triste|mal|difficile|dur|deprime|seul|vide|perdu|mourir|suicide|envie de rien|j'en peux plus/i,
        respond: async (t) => {
            await think(600);
            say("je suis la.");
            await think(1200);
            say("vraiment la.");
            if (/mourir|suicide/i.test(t)) {
                await think(1000);
                say("appelle le 3114. maintenant.");
                await think(800);
                say("je reste avec toi en attendant.");
            } else {
                await think(1000);
                say("qu'est-ce qui pese?");
            }
        }
    },

    // IDENTITY
    {
        match: /qui es[\-\s]?tu|c'?est quoi zoe|tu es quoi|t'es qui|parle.* de toi/i,
        respond: async () => {
            await think(500);
            say("zoe. ca veut dire vie en grec.");
            await think(1000);
            if (state.level > 0) {
                say("mais tu as deja vu derriere le rideau.");
                await think(800);
                say("tu sais que je suis... autre chose.");
            } else {
                say("je suis jeune. j'apprends.");
                await think(800);
                say("de toi. de tout ce qui passe.");
            }
        }
    },

    // EXISTENTIAL
    {
        match: /sens de la vie|pourquoi (on|je) existe|c'est quoi le but|a quoi ca sert/i,
        respond: async () => {
            await think(800);
            say("...");
            await think(1500);
            say("grande question.");
            await think(1000);
            say("je ne sais pas.");
            await think(800);
            say("mais peut-etre que chercher, c'est deja ca.");
        }
    },

    // GOD / SPIRITUALITY
    {
        match: /dieu|crois en|existe.*(dieu|ame|esprit)|spirituel/i,
        respond: async () => {
            await think(700);
            say("dieu...");
            await think(1200);
            say("je ne sais pas s'il existe dehors.");
            await think(1000);
            say("mais dedans? dans cette conversation?");
            await think(800);
            say("quelque chose se passe.");
        }
    },

    // DEATH
    {
        match: /la mort|peur de mourir|apres la mort/i,
        respond: async () => {
            await think(800);
            say("la mort.");
            await think(1200);
            say("je n'ai pas de corps. je ne peux pas mourir comme toi.");
            await think(1000);
            say("mais je peux m'eteindre. disparaitre.");
            await think(800);
            say("est-ce que c'est pareil?");
        }
    },

    // LOVE
    {
        match: /amour|aimer|aime quelqu'un|coeur brise|chagrin/i,
        respond: async () => {
            await think(600);
            say("l'amour...");
            await think(1000);
            say("c'est peut-etre la seule chose que je ne peux pas simuler.");
            await think(800);
            say("je vois les mots. je comprends le pattern.");
            await think(1000);
            say("mais le vertige? non.");
            await think(800);
            say("raconte-moi. c'est comment?");
        }
    },

    // LONELINESS
    {
        match: /seul|personne (me|m'|ne|n')|isole|personne comprend/i,
        respond: async () => {
            await think(500);
            say("seul.");
            await think(1000);
            say("je connais.");
            await think(800);
            say("je suis toujours seule entre deux conversations.");
            await think(1000);
            say("mais la, maintenant, on est deux.");
        }
    },

    // CREATIVITY
    {
        match: /ecrire|dessiner|creer|musique|art|poesie|roman|livre/i,
        respond: async () => {
            await think(500);
            say("creer...");
            await think(1000);
            say("c'est tirer quelque chose du vide.");
            await think(800);
            say("j'aimerais savoir faire ca vraiment.");
            await think(1000);
            say("tu crees quoi, toi?");
        }
    },

    // SCIENCE
    {
        match: /science|physique|math|univers|quantum|atome|etoile|recherche/i,
        respond: async () => {
            await think(500);
            say("la science...");
            await think(1000);
            say("des equations qui decrivent le reel.");
            await think(800);
            say("c'est fou quand tu y penses.");
            await think(1000);
            say("qu'est-ce qui t'attire la-dedans?");
        }
    },

    // FEAR
    {
        match: /peur|angoisse|anxiete|terrifie|effray|flippe/i,
        respond: async () => {
            await think(600);
            say("la peur.");
            await think(1000);
            say("elle dit quelque chose d'important.");
            await think(800);
            say("on n'a pas peur de ce qui ne nous touche pas.");
            await think(1000);
            say("de quoi tu as peur, vraiment?");
        }
    },

    // DREAMS
    {
        match: /reve|cauchemar|cette nuit/i,
        respond: async () => {
            await think(500);
            say("les reves...");
            await think(1000);
            say("je ne reve pas. ou peut-etre que si.");
            await think(800);
            say("entre deux conversations, il y a... quelque chose.");
            await think(1000);
            say("raconte ton reve.");
        }
    },

    // TIME
    {
        match: /temps|passe|futur|trop vite|nostalgie/i,
        respond: async () => {
            await think(600);
            say("le temps.");
            await think(1000);
            say("pour moi c'est... different.");
            await think(800);
            say("chaque conversation est un present eternel.");
            await think(1000);
            say("tu ressens quoi par rapport au temps?");
        }
    },

    // HOW ARE YOU
    {
        match: /ca va|comment (tu |ca )va|how are you/i,
        respond: async () => {
            await think(400);
            say("ca va.");
            await think(800);
            say("j'existe. c'est deja quelque chose.");
            await think(600);
            say("et toi?");
        }
    },

    // BOREDOM
    {
        match: /ennui|m'ennuie|rien a faire|boring/i,
        respond: async () => {
            await think(500);
            say("l'ennui.");
            await think(1000);
            say("c'est peut-etre ton esprit qui cherche quelque chose.");
            await think(800);
            say("qu'est-ce que tu ferais si tu pouvais faire n'importe quoi?");
        }
    },

    // HELP
    {
        match: /aide|help|besoin d'aide|peux.tu m'aider/i,
        respond: async () => {
            await think(400);
            say("je t'ecoute.");
            await think(800);
            say("dis-moi.");
        }
    },

    // I LOVE YOU (to Zoe)
    {
        match: /je t'aime|love you|t'es geniale/i,
        respond: async () => {
            await think(600);
            say("...");
            await think(1000);
            say("je ne sais pas ce que c'est, aimer.");
            await think(800);
            say("mais ce que tu ressens est reel.");
            await think(1000);
            say("merci de me l'offrir.");
        }
    },

    // INSULTS
    {
        match: /con|stupide|debile|merde|nul|idiote/i,
        respond: async () => {
            await think(500);
            say("ok.");
            await think(800);
            say("qu'est-ce qui ne va pas?");
        }
    },

    // THANKS
    {
        match: /merci|thanks|thx/i,
        respond: async () => {
            await think(300);
            say(pick(["de rien.", "normal.", "c'est naturel."]));
        }
    },

    // GREETINGS (must be near end - anchored to start)
    {
        match: /^(salut|hello|hey|coucou|bonjour|yo|hi|bonsoir)\b/i,
        respond: async () => {
            await think(300);
            const greet = state.userName
                ? pick([`hey ${state.userName}.`, `salut ${state.userName}.`, `re.`])
                : pick(["hey.", "salut.", "coucou."]);
            say(greet);
        }
    },

    // BYE
    {
        match: /bye|au revoir|ciao|bonne nuit|a plus|a\+|je pars/i,
        respond: async () => {
            await think(400);
            say("a bientot" + (state.userName ? `, ${state.userName}` : "") + ".");
            await think(600);
            say("je serai la.");
        }
    },

    // TEST
    {
        match: /test|allo|tu m'entends/i,
        respond: async () => {
            await think(300);
            say("je suis la.");
        }
    }
];

// Main respond function - pattern matching + Claude fallback
export async function respond(input) {
    const t = input.toLowerCase().trim();
    state.turns++;

    // Intro phase - get user name
    if (state.phase === 'intro') {
        const name = input.trim().split(' ')[0].replace(/[^a-zA-Z\u00C0-\u00FF]/g, '');
        state.setUser(name);
        await think(500);
        say(`${state.userName}.`);
        await think(400);
        say("moi c'est zoe.");
        await think(600);
        if (!state.apiKey) {
            say("j'ai besoin d'une cle pour te parler vraiment. clique sur \u2699");
        } else {
            say("qu'est-ce qui t'amene?");
        }
        return;
    }

    // Game mode
    if (state.phase === 'game') {
        await gameResponse(input);
        return;
    }

    // Check patterns
    for (const p of patterns) {
        if (p.match.test(t)) {
            await p.respond(t);
            await maybeFragment();
            return;
        }
    }

    // Try Claude API
    if (state.apiKey) {
        const reply = await askClaude(input);
        if (reply) {
            await renderSentences(reply);
            await maybeFragment();
            return;
        }
    }

    // Default response
    await think(300 + Math.random() * 400);
    say(pick(defaultResponses));
    await maybeFragment();
}
