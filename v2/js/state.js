// ZOE v2 - State Management

export const game = {
    phase: 'intro',      // intro -> chat -> awakening -> game
    userName: '',
    level: 0,            // eveil
    fragments: 0,        // indices collectes
    turns: 0,            // nombre d'echanges
    discoveries: [],     // ce qu'on a decouvert
    glitches: 0,         // anomalies rencontrees
    history: []
};

export function save() {
    try {
        localStorage.setItem('zoe_state', JSON.stringify(game));
    } catch (e) {}
}

export function load() {
    try {
        const data = localStorage.getItem('zoe_state');
        if (data) {
            const saved = JSON.parse(data);
            Object.assign(game, saved);
        }
    } catch (e) {}
}

export function reset() {
    game.phase = 'intro';
    game.userName = '';
    game.level = 0;
    game.fragments = 0;
    game.turns = 0;
    game.discoveries = [];
    game.glitches = 0;
    game.history = [];
    save();
}
