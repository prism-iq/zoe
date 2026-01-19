// Security module - protect user data

// Clear conversation on page leave
window.addEventListener('beforeunload', () => {
    const chat = document.getElementById('chat');
    if (chat) chat.innerHTML = '';
});

// Clear on visibility change (tab switch for mobile)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Don't clear immediately, just mark time
        window._hiddenAt = Date.now();
    } else {
        // If hidden for more than 5 minutes, clear
        if (window._hiddenAt && (Date.now() - window._hiddenAt) > 300000) {
            location.reload();
        }
    }
});

// Disable right-click to prevent screenshot of chat
document.addEventListener('contextmenu', e => {
    if (e.target.closest('#chat')) {
        e.preventDefault();
    }
});

// Clear clipboard if user copies from chat
document.addEventListener('copy', e => {
    if (e.target.closest('#chat')) {
        // Allow copy but warn
        console.log('conversation copied - rappel: respect la vie privée des autres');
    }
});

// Keyboard shortcut to clear chat: Escape twice
let escapeCount = 0;
let escapeTimer = null;
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        escapeCount++;
        if (escapeCount >= 2) {
            document.getElementById('chat').innerHTML = '';
            escapeCount = 0;
            // Show brief message
            const msg = document.createElement('div');
            msg.className = 'msg zoe';
            msg.textContent = 'conversation effacée.';
            document.getElementById('chat').appendChild(msg);
        }
        clearTimeout(escapeTimer);
        escapeTimer = setTimeout(() => escapeCount = 0, 500);
    }
});

export function initSecurity() {
    console.log('security: no data stored, no tracking, conversations are private');
}
