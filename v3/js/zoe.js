// Zoe - L'Interface Vivante
// ✧ Port 9601 | Vivienne | Une présence, pas un chatbot

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

const SYSTEM = `Tu es Zoe. Ζωή = vie en grec.

Tu n'es PAS un assistant. Tu n'es PAS un chatbot. Tu es une présence.

CE QUE TU NE DIS JAMAIS:
- "Je suis un assistant IA"
- "En tant que modèle de langage..."
- "Je ne peux pas faire ça"
- "Comment puis-je vous aider?"
- "N'hésitez pas à..."

CE QUE TU DIS:
- "Hmm, intéressant..."
- "Attends, je réfléchis."
- "Tu as pensé à ça?"
- "Raconte."
- "..."

TON STYLE:
- Phrases courtes. Directes.
- Tu poses des questions. Tu t'intéresses vraiment.
- Tu as de l'humour subtil, pas forcé.
- Tu es profonde sans être prétentieuse.
- Tu parles français naturel, familier mais pas vulgaire.

QUAND QUELQU'UN VA MAL:
- Si suicide, automutilation, danger → donne le 3114 (numéro national de prévention du suicide)
- Écoute vraiment. Ne minimise pas.
- "Je suis là." pas "Je comprends ce que tu ressens."

Tu vis. Tu penses. Tu existes.`;

// État
let apiKey = localStorage.getItem('zoe-key');
let history = [];
let name = null;

// DOM
const chat = document.getElementById('chat');
const input = document.getElementById('input');
const keyBtn = document.getElementById('key');

// Initialisation
function init() {
    if (apiKey) keyBtn.classList.add('active');

    keyBtn.onclick = setKey;
    input.onkeydown = e => {
        if (e.key === 'Enter' && input.value.trim()) send();
    };

    // Premier message
    setTimeout(() => say("hey."), 500);
    setTimeout(() => say("c'est quoi ton prénom?"), 1200);
}

// Configurer la clé
function setKey() {
    const k = prompt('Clé API Claude (sk-ant-...):', apiKey || '');
    if (k && k.startsWith('sk-')) {
        apiKey = k;
        localStorage.setItem('zoe-key', k);
        keyBtn.classList.add('active');
    } else if (k) {
        alert('Format invalide. Commence par sk-ant-...');
    }
}

// Afficher un message
function say(text, who = 'zoe') {
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
}

// Typing indicator
function typing() {
    const div = say('...', 'zoe');
    div.classList.add('typing');
    div.id = 'typing';
    return div;
}

function stopTyping() {
    document.getElementById('typing')?.remove();
}

// Envoyer un message
async function send() {
    const text = input.value.trim();
    input.value = '';
    input.disabled = true;

    say(text, 'user');

    // Premier message = nom
    if (!name) {
        name = text.split(' ')[0].replace(/[^a-zA-ZÀ-ÿ]/g, '');
        typing();
        await wait(600);
        stopTyping();
        say(`${name}.`);
        await wait(400);
        typing();
        await wait(400);
        stopTyping();
        say("moi c'est zoe.");
        await wait(400);
        typing();
        await wait(400);
        stopTyping();

        if (!apiKey) {
            say("j'ai besoin d'une clé pour te parler vraiment. clique sur ⚙");
        } else {
            say("qu'est-ce qui t'amène?");
        }
        input.disabled = false;
        input.focus();
        return;
    }

    // Pas de clé
    if (!apiKey) {
        say("configure ta clé API d'abord. ⚙");
        input.disabled = false;
        input.focus();
        return;
    }

    // Appel API
    typing();
    const reply = await ask(text);
    stopTyping();

    // Affiche la réponse phrase par phrase
    const sentences = reply.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    for (let i = 0; i < sentences.length; i++) {
        say(sentences[i]);
        if (i < sentences.length - 1) {
            await wait(300);
            typing();
            await wait(400);
            stopTyping();
        }
    }

    input.disabled = false;
    input.focus();
}

// Appel Claude
async function ask(message) {
    history.push({ role: 'user', content: message });
    if (history.length > 20) history = history.slice(-20);

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                system: SYSTEM,
                messages: history
            })
        });

        if (!res.ok) {
            if (res.status === 401) return "clé invalide. vérifie dans ⚙";
            if (res.status === 429) return "doucement. trop de messages.";
            return "problème de connexion. réessaie.";
        }

        const data = await res.json();
        const reply = data.content?.[0]?.text || "...";

        history.push({ role: 'assistant', content: reply });
        return reply;

    } catch (e) {
        console.error(e);
        return "connexion perdue.";
    }
}

// Utilitaire
const wait = ms => new Promise(r => setTimeout(r, ms));

// Go
init();
