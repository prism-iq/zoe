// errors.js - Centralized error handling
// ES Module

const MAX_LOG_SIZE = 100;

const errors = {
    log: [],

    // Notify with level: info, warn, error
    notify(msg, level = 'warn') {
        const entry = { msg, level, t: Date.now() };
        this.log.push(entry);

        // Trim log size
        if (this.log.length > MAX_LOG_SIZE) {
            this.log.shift();
        }

        // Console output
        const prefix = `[zoe:${level}]`;
        switch(level) {
            case 'error':
                console.error(prefix, msg);
                this.showToast(msg, level);
                this.saveToStorage();
                break;
            case 'warn':
                console.warn(prefix, msg);
                break;
            default:
                console.log(prefix, msg);
        }

        return entry;
    },

    info(msg) {
        return this.notify(msg, 'info');
    },

    warn(msg) {
        return this.notify(msg, 'warn');
    },

    error(msg) {
        return this.notify(msg, 'error');
    },

    // Wrap async function with error handling
    wrap(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch(e) {
                this.notify(e.message, 'error');
                return null;
            }
        };
    },

    // Wrap sync function
    wrapSync(fn) {
        return (...args) => {
            try {
                return fn(...args);
            } catch(e) {
                this.notify(e.message, 'error');
                return null;
            }
        };
    },

    // Show toast notification
    showToast(msg, level = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${level}`;
        toast.textContent = msg;
        container.appendChild(toast);

        // Auto-remove after 5s
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    // Save errors to localStorage for debugging
    saveToStorage() {
        try {
            const errorLog = this.log.filter(e => e.level === 'error').slice(-20);
            localStorage.setItem('zoe_errors', JSON.stringify(errorLog));
        } catch(e) {
            console.warn('[zoe:errors] Cannot save to localStorage');
        }
    },

    // Get recent errors
    getRecent(count = 10) {
        return this.log.slice(-count);
    },

    // Clear log
    clear() {
        this.log = [];
        localStorage.removeItem('zoe_errors');
    }
};

// Global error handler
window.onerror = function(msg, url, line, col, error) {
    errors.notify(`${msg} (${url}:${line})`, 'error');
    return false;
};

// Unhandled promise rejection
window.onunhandledrejection = function(event) {
    errors.notify(`Promise rejected: ${event.reason}`, 'error');
};

export default errors;
