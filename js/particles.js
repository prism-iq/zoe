// particles.js - Canvas particle system (v1 class + v2 react/add)

let canvas = null;
let ctx = null;
let particles = [];
let animationId = null;

const PARTICLE_MIN = 30;
const PARTICLE_MAX = 50;

class Particle {
    constructor(x, y) {
        this.x = x ?? Math.random() * canvas.width;
        this.y = y ?? Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.life = 1;
        this.size = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.003;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,230,207,${Math.min(this.life, this.alpha) * 0.8})`;
        ctx.fill();
    }
}

// Initialize particle system
export function init(canvasElement) {
    canvas = canvasElement;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_MAX; i++) {
        particles.push(new Particle());
    }

    animate();
}

function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Remove dead particles
    particles = particles.filter(p => p.life > 0);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Maintain minimum count
    while (particles.length < PARTICLE_MIN) {
        particles.push(new Particle());
    }

    animationId = requestAnimationFrame(animate);
}

// Burst particles at position
export function burst(x, y, count = 10) {
    if (!canvas) return;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
    }
}

// React to input (game mode) - accelerate particles
export function react(intensity = 1) {
    particles.forEach(p => {
        p.vx += (Math.random() - 0.5) * 2 * intensity;
        p.vy += (Math.random() - 0.5) * 2 * intensity;
    });

    // Calm down after 1s
    setTimeout(() => {
        particles.forEach(p => {
            p.vx *= 0.5;
            p.vy *= 0.5;
        });
    }, 1000);
}

// Add more particles (evolution)
export function addParticles(count = 10) {
    if (!canvas) return;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

export function getCount() {
    return particles.length;
}
