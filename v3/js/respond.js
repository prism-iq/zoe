// Response module - Zoe parle vraiment
import { state, setName, nextTurn, addContext } from './state.js';
import { say, typing, stopTyping, wait } from './ui.js';
import { findPattern, getDefault } from './patterns.js';

// Contexte de conversation
let context = {
    name: null,
    mood: 'neutral',
    topics: [],
    lastTopic: null,
    turnCount: 0
};

// Analyse le sentiment
function analyzeMood(text) {
    const t = text.toLowerCase();
    if (/triste|mal|seul|vide|perdu|peur|angoisse|déprim|pleurer|mourir|suicide/.test(t)) return 'sad';
    if (/content|heureux|bien|super|génial|cool|merci|love|aime/.test(t)) return 'happy';
    if (/colère|énervé|rage|merde|putain|con|chier/.test(t)) return 'angry';
    if (/\?|pourquoi|comment|quoi|qui|c.est quoi/.test(t)) return 'curious';
    return 'neutral';
}

// Extrait le sujet principal
function extractTopic(text) {
    const t = text.toLowerCase();
    if (/famille|parent|père|mère|frère|soeur/.test(t)) return 'famille';
    if (/amour|coeur|crush|relation|copain|copine/.test(t)) return 'amour';
    if (/travail|boulot|job|patron|collègue/.test(t)) return 'travail';
    if (/école|cours|exam|études|prof/.test(t)) return 'études';
    if (/ami|pote|copain|seul|solitude/.test(t)) return 'relations';
    if (/vie|mort|sens|exister|pourquoi/.test(t)) return 'existentiel';
    if (/rêve|dormir|nuit|cauchemar/.test(t)) return 'rêves';
    if (/peur|angoisse|anxiété|stress/.test(t)) return 'anxiété';
    return null;
}

// Génère une réponse contextuelle
function generateResponse(text, pattern) {
    const mood = analyzeMood(text);
    const topic = extractTopic(text);
    context.mood = mood;
    if (topic) {
        context.topics.push(topic);
        context.lastTopic = topic;
    }
    context.turnCount++;

    // Si pattern trouvé, utilise ses réponses
    if (pattern && pattern.responses) {
        return pattern.responses;
    }

    // Sinon génère selon le contexte
    const responses = [];

    // Réponses selon le mood
    if (mood === 'sad') {
        responses.push(pickOne([
            "je t'entends. c'est pas facile ce que tu traverses.",
            "merci de me faire confiance avec ça.",
            "t'as le droit de te sentir comme ça.",
            "je suis là. prends ton temps."
        ]));
        responses.push(pickOne([
            "tu veux m'en dire plus?",
            "c'est depuis quand?",
            "qu'est-ce qui s'est passé?",
            "y'a eu un déclencheur?"
        ]));
    } else if (mood === 'angry') {
        responses.push(pickOne([
            "je sens que ça bouillonne.",
            "ok, y'a de la colère. c'est légitime.",
            "la colère c'est souvent un signal."
        ]));
        responses.push(pickOne([
            "c'est contre qui ou quoi?",
            "qu'est-ce qui t'a mis dans cet état?"
        ]));
    } else if (mood === 'curious') {
        responses.push(pickOne([
            "bonne question.",
            "hmm, laisse-moi réfléchir.",
            "c'est une question que je me pose aussi."
        ]));
    } else if (mood === 'happy') {
        responses.push(pickOne([
            "ça fait plaisir de te voir comme ça.",
            "c'est bien, profite.",
            "cool. raconte?"
        ]));
    } else {
        // Réponses neutres mais engageantes
        if (context.turnCount > 3 && context.lastTopic) {
            responses.push(`tu parlais de ${context.lastTopic} tout à l'heure. ça va mieux?`);
        } else {
            responses.push(pickOne([
                "continue, je t'écoute.",
                "ok. et après?",
                "dis-m'en plus.",
                "je vois. comment tu te sens par rapport à ça?",
                "hmm. développe?",
                "et toi, t'en penses quoi?"
            ]));
        }
    }

    return responses;
}

function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function respond(text) {
    const turn = nextTurn();

    // Premier message = nom
    if (turn === 1) {
        const name = text.split(' ')[0].replace(/[^a-zA-ZÀ-ÿ]/g, '');
        setName(name);
        context.name = name;
        
        typing();
        await wait(500);
        stopTyping();
        say(`${name}.`);
        
        await wait(600);
        typing();
        await wait(400);
        stopTyping();
        say("moi c'est zoe.");
        
        await wait(500);
        typing();
        await wait(400);
        stopTyping();
        say("qu'est-ce qui t'amène ici?");
        return;
    }

    // Détection de crise
    if (/suicide|me tuer|en finir|mourir|me faire du mal/.test(text.toLowerCase())) {
        typing();
        await wait(600);
        stopTyping();
        say("ce que tu dis est important. je t'écoute vraiment.");
        
        await wait(800);
        typing();
        await wait(500);
        stopTyping();
        say("t'es pas obligé de porter ça seul.");
        
        await wait(600);
        typing();
        await wait(400);
        stopTyping();
        say("le 3114 c'est gratuit, 24h/24. ils sont formés pour ça. appelle-les.");
        return;
    }

    // Cherche un pattern
    const pattern = findPattern(text);
    const responses = generateResponse(text, pattern);

    // Affiche les réponses avec timing naturel
    for (let i = 0; i < responses.length; i++) {
        typing();
        await wait(400 + Math.random() * 400);
        stopTyping();
        
        let response = responses[i];
        if (context.name && Math.random() < 0.1) {
            response = response.replace(/\.$/, `, ${context.name}.`);
        }
        say(response);

        if (i < responses.length - 1) {
            await wait(600 + Math.random() * 400);
        }
    }
}
