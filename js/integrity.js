// integrity.js - Recursive hashing and unified integrity system
// ES Module - Verifies 120% integrity of all metabolites and global state

import { PHI, FIBONACCI, TIMING } from './constants.js';
import errors from './errors.js';

// Simple hash function (djb2 algorithm)
function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    return h >>> 0; // Convert to unsigned 32-bit
}

// Recursive hash - combines multiple hashes with golden ratio
function recursiveHash(values, depth = 0) {
    if (values.length === 0) return 0;
    if (values.length === 1) return hash(String(values[0]));

    const mid = Math.floor(values.length / PHI);
    const left = recursiveHash(values.slice(0, mid), depth + 1);
    const right = recursiveHash(values.slice(mid), depth + 1);

    // Combine with Fibonacci-based mixing
    const fib = FIBONACCI[depth % FIBONACCI.length];
    return ((left * fib) ^ (right * PHI)) >>> 0;
}

// Metabolite: smallest unit of functionality
class Metabolite {
    constructor(name, checkFn) {
        this.name = name;
        this.checkFn = checkFn;
        this.lastHash = 0;
        this.lastCheck = 0;
        this.healthy = true;
        this.history = [];
    }

    async check() {
        try {
            const value = await this.checkFn();
            const currentHash = hash(JSON.stringify(value));

            this.history.push({
                time: Date.now(),
                hash: currentHash,
                changed: currentHash !== this.lastHash
            });

            // Keep last 20 checks
            if (this.history.length > 20) this.history.shift();

            this.lastHash = currentHash;
            this.lastCheck = Date.now();
            this.healthy = true;

            return { name: this.name, hash: currentHash, healthy: true, value };
        } catch (e) {
            this.healthy = false;
            errors.warn(`Metabolite ${this.name} failed: ${e.message}`);
            return { name: this.name, hash: 0, healthy: false, error: e.message };
        }
    }
}

// Integrity system
const integrity = {
    metabolites: new Map(),
    globalHash: 0,
    lastCheck: 0,
    checkCount: 0,
    running: false,

    // Register a metabolite
    register(name, checkFn) {
        this.metabolites.set(name, new Metabolite(name, checkFn));
    },

    // Check all metabolites
    async checkAll() {
        const results = [];
        const hashes = [];

        for (const [name, metabolite] of this.metabolites) {
            const result = await metabolite.check();
            results.push(result);
            hashes.push(result.hash);
        }

        // Calculate global recursive hash
        this.globalHash = recursiveHash(hashes);
        this.lastCheck = Date.now();
        this.checkCount++;

        const healthy = results.every(r => r.healthy);
        const healthPercent = Math.round((results.filter(r => r.healthy).length / results.length) * 120);

        return {
            globalHash: this.globalHash,
            metabolites: results,
            healthy,
            healthPercent,
            checkCount: this.checkCount,
            timestamp: this.lastCheck
        };
    },

    // Get status report
    status() {
        const metaboliteStatus = [];
        for (const [name, m] of this.metabolites) {
            metaboliteStatus.push({
                name,
                healthy: m.healthy,
                lastCheck: m.lastCheck,
                hash: m.lastHash
            });
        }

        return {
            globalHash: this.globalHash,
            lastCheck: this.lastCheck,
            checkCount: this.checkCount,
            metabolites: metaboliteStatus
        };
    },

    // Start continuous monitoring
    async startMonitoring(interval = TIMING.BREATH) {
        if (this.running) return;
        this.running = true;

        const monitor = async () => {
            if (!this.running) return;

            const result = await this.checkAll();

            if (!result.healthy) {
                errors.error(`Integrity check failed: ${result.healthPercent}%`);
            }

            // Organic timing based on health
            const delay = result.healthy
                ? interval * PHI
                : interval / PHI;

            setTimeout(monitor, delay);
        };

        monitor();
    },

    stopMonitoring() {
        this.running = false;
    }
};

// Register default metabolites
function initDefaultMetabolites() {
    // DOM integrity
    integrity.register('dom.messages', () => {
        const el = document.getElementById('messages');
        return el ? el.children.length : -1;
    });

    integrity.register('dom.input', () => {
        const el = document.getElementById('input');
        return el ? { exists: true, disabled: el.disabled } : { exists: false };
    });

    integrity.register('dom.canvas', () => {
        const el = document.getElementById('particules');
        return el ? { width: el.width, height: el.height } : null;
    });

    // State integrity
    integrity.register('state.phase', () => {
        return window.zoe?.state?.()?.phase || 'unknown';
    });

    integrity.register('state.online', () => {
        return navigator.onLine;
    });

    // Module integrity
    integrity.register('modules.loaded', () => {
        return {
            zoe: typeof window.zoe !== 'undefined',
            observe: typeof window.zoe?.observe === 'function',
            wave: typeof window.zoe?.wave === 'function'
        };
    });

    // Network integrity
    integrity.register('network.api', async () => {
        try {
            const res = await fetch('/version.json?t=' + Date.now());
            return { ok: res.ok, status: res.status };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    });

    // Performance integrity
    integrity.register('performance.memory', () => {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
            };
        }
        return null;
    });
}

// Initialize
export function init() {
    initDefaultMetabolites();
    errors.info('Integrity system initialized');
}

// Export
export { hash, recursiveHash, integrity, Metabolite };

export default {
    init,
    hash,
    recursiveHash,
    integrity,
    Metabolite
};
