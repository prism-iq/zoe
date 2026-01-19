// State module
export const state = {
    name: '',
    turn: 0,
    patterns: null,
    defaults: null
};

export function setName(n) {
    state.name = n;
}

export function nextTurn() {
    state.turn++;
    return state.turn;
}
