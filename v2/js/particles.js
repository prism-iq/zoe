// ZOE v2 - Particle System

let canvas, ctx;
let particles = [];

export function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    resize();

    // Create particles
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5
        });
    }

    // Start animation
    animate();
}

export function resize() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,230,207,${p.alpha})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
    });

    requestAnimationFrame(animate);
}

// React to input (game mode)
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

// Add particles (evolution)
export function addParticles(count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5
        });
    }
}
