// Response module
import { state, setName, nextTurn } from './state.js';
import { say, typing, stopTyping, wait } from './ui.js';
import { findPattern, getDefault, pick } from './patterns.js';

export async function respond(text) {
    const turn = nextTurn();

    // Premier message = nom
    if (turn === 1) {
        setName(text.split(' ')[0]);
        typing();
        await wait(600);
        stopTyping();
        say(`${state.name}.`);
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

    // Cherche un pattern
    const pattern = findPattern(text);

    typing();
    await wait(400 + Math.random() * 400);
    stopTyping();

    if (pattern) {
        // Réponses du pattern
        for (let i = 0; i < pattern.responses.length; i++) {
            let response = pattern.responses[i];

            // Remplace {name} par le nom
            if (state.name) {
                response = response.replace('{name}', state.name);
            }

            say(response);

            if (i < pattern.responses.length - 1) {
                await wait(800);
                typing();
                await wait(500);
                stopTyping();
            }
        }

        // Message de crise si présent
        if (pattern.crisis && /mourir|suicide/i.test(text)) {
            await wait(800);
            typing();
            await wait(500);
            stopTyping();
            say(pattern.crisis);
        }
    } else {
        // Réponse par défaut
        say(getDefault());
    }
}
