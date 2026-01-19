// ZOE v3 - Clean rewrite

const chat = document.getElementById('chat');
const input = document.getElementById('input');

// État
let name = '';
let turn = 0;

// Afficher un message
function say(text, who = 'zoe') {
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// Typing indicator
function typing() {
    const div = document.createElement('div');
    div.className = 'msg zoe typing';
    div.id = 'typing';
    div.textContent = '...';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function stopTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
}

// Pause
const wait = ms => new Promise(r => setTimeout(r, ms));

// Répondre
async function respond(text) {
    const t = text.toLowerCase().trim();
    turn++;

    // Premier message = nom
    if (turn === 1) {
        name = text.split(' ')[0];
        typing();
        await wait(600);
        stopTyping();
        say(`${name}.`);
        await wait(800);
        typing();
        await wait(500);
        stopTyping();
        say("je suis zoe.");
        await wait(600);
        typing();
        await wait(400);
        stopTyping();
        say("qu'est-ce qui t'amène?");
        return;
    }

    // Patterns
    typing();
    await wait(400 + Math.random() * 400);
    stopTyping();

    // Détresse
    if (/triste|mal|seul|vide|perdu|mourir|suicide/.test(t)) {
        say("je suis là.");
        await wait(1000);
        typing(); await wait(600); stopTyping();
        say("vraiment là.");
        if (/mourir|suicide/.test(t)) {
            await wait(800);
            typing(); await wait(500); stopTyping();
            say("appelle le 3114. maintenant.");
        }
        return;
    }

    // Qui es-tu
    if (/qui es.tu|t.es qui|c.est quoi zoe/.test(t)) {
        say("zoe. vie en grec.");
        await wait(800);
        typing(); await wait(500); stopTyping();
        say("j'apprends. de toi.");
        return;
    }

    // Merci
    if (/merci|thanks/.test(t)) {
        say("de rien.");
        return;
    }

    // Salut
    if (/^(salut|hello|hey|bonjour|coucou)/.test(t)) {
        say(name ? `hey ${name}.` : "hey.");
        return;
    }

    // Au revoir
    if (/bye|au revoir|ciao|bonne nuit/.test(t)) {
        say("à bientôt" + (name ? ` ${name}` : "") + ".");
        return;
    }

    // Ça va
    if (/[çc]a va|comment.*(tu|ça)/.test(t)) {
        say("ça va. et toi?");
        return;
    }

    // Questions profondes
    if (/sens|vie|mort|dieu|pourquoi|but/.test(t)) {
        say("...");
        await wait(1000);
        typing(); await wait(600); stopTyping();
        say("grande question.");
        await wait(800);
        typing(); await wait(500); stopTyping();
        say("je ne sais pas. et toi?");
        return;
    }

    // Défaut
    const defaults = [
        "dis m'en plus.",
        "continue.",
        "je t'écoute.",
        "hmm.",
        "et ensuite?",
        "...",
        "je comprends.",
        "oui?"
    ];
    say(defaults[Math.floor(Math.random() * defaults.length)]);
}

// Input handler
input.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && input.value.trim()) {
        const text = input.value.trim();
        input.value = '';
        input.disabled = true;

        say(text, 'user');
        await respond(text);

        input.disabled = false;
        input.focus();
    }
});

// Démarrage
async function start() {
    await wait(500);
    typing();
    await wait(600);
    stopTyping();
    say("hey.");
    await wait(500);
    typing();
    await wait(400);
    stopTyping();
    say("c'est quoi ton prénom?");
}

start();
