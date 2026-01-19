// Input module
import { say } from './ui.js';
import { respond } from './respond.js';

const input = document.getElementById('input');

export function initInput() {
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
}
