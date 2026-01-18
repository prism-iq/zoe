// constants.js - All numeric constants for Zoe
// ES Module - No magic numbers, all named

// Mathematical constants
export const PHI = 1.618033988749;      // Golden ratio
export const EULER = 2.718281828459;     // Euler's number
export const PI = 3.141592653589;        // Pi
export const SQRT2 = 1.414213562373;     // Square root of 2

// Fibonacci sequence
export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];

// Timing (in milliseconds)
export const TIMING = {
    TICK: 1000,                          // Base tick
    BREATH: 2000,                        // Breathing rhythm
    THOUGHT_MIN: 3000,                   // Minimum thought delay
    THOUGHT_MAX: 18000,                  // Maximum thought delay
    INSIGHT_CHECK: 30000,                // Check for book insights
    HOT_RELOAD: 30000,                   // Version check interval
    TOAST_DURATION: 5000,                // Toast notification duration
    TOAST_FADE: 300,                     // Toast fade animation
    API_TIMEOUT: 30000,                  // API request timeout
    API_BACKOFF: 1000,                   // Base backoff for retries
    MESSAGE_DELAY_SHORT: 300,            // Short delay between messages
    MESSAGE_DELAY_MEDIUM: 500,           // Medium delay
    MESSAGE_DELAY_LONG: 1000,            // Long delay
    INTRO_DELAY: 600,                    // Initial greeting delay
    INTRO_PAUSE: 800,                    // Pause during intro
};

// Limits
export const LIMITS = {
    MAX_MESSAGES: 25,                    // Max messages in DOM
    MAX_LOG_SIZE: 100,                   // Max error log entries
    MAX_APPRENTISSAGE: 50,               // Max learning history
    MAX_PARTICLES: 50,                   // Max particles
    MIN_PARTICLES: 30,                   // Min particles to maintain
    PARTICLE_BURST: 10,                  // Particles per burst
    MAX_KEYSTROKE_PATTERNS: 50,          // Keystroke pattern history
    MAX_INTERACTIONS: 100,               // Interaction history
    MAX_INSIGHTS_HISTORY: 20,            // Insights to keep
};

// API
export const API = {
    RETRIES: 3,                          // Number of retry attempts
    MAX_TOKENS: 300,                     // Claude max tokens
    CHUNK_SIZE: 2000,                    // Book chunk size (chars)
};

// Thresholds
export const THRESHOLD = {
    IDLE_THINK: 3,                       // Idle count to trigger thought
    IDLE_MENTOR: 5,                      // Idle count for mentor
    IDLE_TIME: 10000,                    // Idle time threshold (ms)
    MIN_CHUNK_LENGTH: 100,               // Minimum book chunk length
    MIN_INSIGHT_LENGTH: 10,              // Minimum insight length
    SPEAK_PROBABILITY: 0.5,              // Base speak probability
    MENTOR_PROBABILITY: 0.3,             // Mentor speak probability
};

// Wave modulation
export const WAVE = {
    PHASE1_PERIOD: 1000 * PHI,           // First wave period
    PHASE2_PERIOD: 1000 * EULER,         // Second wave period
    PHASE3_PERIOD: 1000 * PI,            // Third wave period
    AMPLITUDE1: 0.3,
    AMPLITUDE2: 0.2,
    AMPLITUDE3: 0.2,
    BASELINE: 0.5,
};

// UI dimensions
export const UI = {
    MESSAGE_RADIUS: 20,                  // Border radius
    INPUT_RADIUS: 30,                    // Input border radius
    ORB1_SIZE: 400,                      // First orb size
    ORB2_SIZE: 300,                      // Second orb size
    ORB3_SIZE: 500,                      // Third orb size
};

// Particle physics
export const PARTICLE = {
    VELOCITY_RANGE: 0.5,                 // Max velocity
    LIFE_DECAY: 0.003,                   // Life decay rate
    SIZE_MIN: 1,                         // Minimum size
    SIZE_RANGE: 2,                       // Size variation
    OPACITY_FACTOR: 0.4,                 // Opacity multiplier
};

export default {
    PHI, EULER, PI, SQRT2, FIBONACCI,
    TIMING, LIMITS, API, THRESHOLD, WAVE, UI, PARTICLE
};
