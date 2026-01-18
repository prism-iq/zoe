// particles.js - Canvas particle animation
// ES Module

let canvas = null;
let ctx = null;
let particles = [];
let animationId = null;

const PARTICLE_COUNT = 30;
const PARTICLE_MAX = 50;

class Particle {
    constructor(x, y) {
        this.x = x ?? Math.random() * canvas.width;
        this.y = y ?? Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.life = 1;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.003;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,230,207,${this.life * 0.4})`;
        ctx.fill();
    }
}

// Initialize particle system
export function initParticles(canvasElement) {
    canvas = canvasElement;
    if (!canvas) return false;

    ctx = canvas.getContext('2d');
    if (!ctx) return false;

    resize();
    window.addEventListener('resize', resize);

    // Create initial particles
    for (let i = 0; i < PARTICLE_MAX; i++) {
        particles.push(new Particle());
    }

    // Start animation loop
    animate();

    // Expose burst function globally
    window.particleBurst = burst;

    return true;
}

// Handle resize
function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Animation loop
function animate() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Remove dead particles
    particles = particles.filter(p => p.life > 0);

    // Update and draw
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Maintain minimum particle count
    while (particles.length < PARTICLE_COUNT) {
        particles.push(new Particle());
    }

    animationId = requestAnimationFrame(animate);
}

// Create burst of particles at position
export function burst(x, y, count = 10) {
    if (!canvas) return;

    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
    }
}

// Stop animation
export function stop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Get particle count
export function getCount() {
    return particles.length;
}

export default {
    initParticles,
    burst,
    stop,
    getCount
};
