/**
 * Star field particle effect
 * Creates floating star dust particles in the background
 */

class StarField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animating = false;
    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 15000);
    this.particles = [];

    for (let i = 0; i < numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  animate() {
    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around edges
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Pulse effect
      p.pulse += 0.02;
      const currentOpacity = p.opacity * (0.5 + Math.sin(p.pulse) * 0.5);

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(139, 92, 246, ${currentOpacity})`;
      this.ctx.fill();

      // Draw glow for larger particles
      if (p.size > 1) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(139, 92, 246, ${currentOpacity * 0.3})`;
        this.ctx.fill();
      }
    });

    requestAnimationFrame(() => this.loop());
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('starCanvas');
  if (canvas) {
    new StarField(canvas);
  }
});
