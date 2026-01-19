// UI module
const chat = document.getElementById('chat');

export function say(text, who = 'zoe') {
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

export function typing() {
    const div = document.createElement('div');
    div.className = 'msg zoe typing';
    div.id = 'typing';
    div.textContent = '...';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

export function stopTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
}

export const wait = ms => new Promise(r => setTimeout(r, ms));
