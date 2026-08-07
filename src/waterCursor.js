// Calm Heavy-Viscosity Water Surface Engine with Ultra-Slow Mouse Repulsion & Wave Ripples
export class WaterRippleCursor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'water-cursor-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.ripples = [];
    
    this.mouse = { x: -1000, y: -1000, radius: 160 };
    this.particleCount = 130;

    this.init();
  }

  init() {
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9995';
    document.body.appendChild(this.canvas);

    this.onResize();
    this.createFloatingParticles();

    window.addEventListener('resize', () => {
      this.onResize();
      this.createFloatingParticles();
    });
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    window.addEventListener('mousedown', this.onMouseDown.bind(this));

    this.animate();
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * Math.min(window.devicePixelRatio, 2);
    this.canvas.height = this.height * Math.min(window.devicePixelRatio, 2);
    this.ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));
  }

  createFloatingParticles() {
    this.particles = [];
    const count = window.innerWidth < 768 ? 70 : this.particleCount;
    for (let i = 0; i < count; i++) {
      const homeX = Math.random() * this.width;
      const homeY = Math.random() * this.height;
      this.particles.push({
        x: homeX,
        y: homeY,
        homeX: homeX,
        homeY: homeY,
        vx: 0,
        vy: 0,
        radius: Math.random() * 2.5 + 1.5,
        baseRadius: Math.random() * 2.5 + 1.5,
        alpha: Math.random() * 0.45 + 0.3,
        floatOffset: Math.random() * Math.PI * 2
      });
    }
  }

  onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    if (Math.random() < 0.08) {
      this.addRipple(e.clientX, e.clientY, 40, 0.35);
    }
  }

  onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      this.mouse.x = e.touches[0].clientX;
      this.mouse.y = e.touches[0].clientY;
      if (Math.random() < 0.1) {
        this.addRipple(this.mouse.x, this.mouse.y, 40, 0.35);
      }
    }
  }

  onMouseDown(e) {
    this.addRipple(e.clientX, e.clientY, 60, 0.6);
  }

  addRipple(x, y, maxRadius, initialOpacity = 0.5) {
    this.ripples.push({
      x,
      y,
      radius: 6,
      maxRadius: maxRadius,
      opacity: initialOpacity,
      speed: 0.3 + Math.random() * 0.15 // Ultra-slow wave expansion speed
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.ctx.clearRect(0, 0, this.width, this.height);
    const time = performance.now() * 0.0006; // Ultra-slow time scale

    // 1. Update & Render Ultra-Slow Calm Water Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.opacity *= 0.985; // Slow, lingering wave decay

      if (r.opacity <= 0.01 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);

      const grad = this.ctx.createRadialGradient(r.x, r.y, Math.max(0, r.radius - 6), r.x, r.y, r.radius + 6);
      grad.addColorStop(0, `rgba(255, 227, 149, 0)`);
      grad.addColorStop(0.5, `rgba(212, 175, 55, ${r.opacity * 0.45})`);
      grad.addColorStop(1, `rgba(153, 122, 21, 0)`);

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 2. Update & Render Heavy Viscous Water Particles with Ultra-Slow Mouse Repulsion
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Ultra-slow, gentle floating on water
      p.homeY += Math.sin(time + p.floatOffset) * 0.04;
      p.homeX += Math.cos(time * 0.8 + p.floatOffset) * 0.03;

      // Mouse Repulsion Physics (Ultra-Gentle, Slow Push)
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius && dist > 0) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        const pushAngle = Math.atan2(dy, dx);
        const pushSpeed = force * 1.6; // Ultra-slow gentle push away

        p.vx += Math.cos(pushAngle) * pushSpeed * 0.12;
        p.vy += Math.sin(pushAngle) * pushSpeed * 0.12;
      }

      // Smooth Gentle Restoring force back to home position
      const homeDx = p.homeX - p.x;
      const homeDy = p.homeY - p.y;
      p.vx += homeDx * 0.008;
      p.vy += homeDy * 0.008;

      // Heavy Liquid Viscosity Friction
      p.vx *= 0.86;
      p.vy *= 0.86;

      p.x += p.vx;
      p.y += p.vy;

      // Render Floating Liquid Particles
      this.ctx.save();
      this.ctx.beginPath();
      const currentRadius = p.baseRadius + Math.sin(time * 1.5 + p.floatOffset) * 0.3;
      this.ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);

      const isPushed = dist < this.mouse.radius;
      const glowAlpha = isPushed ? Math.min(1, p.alpha + 0.25) : p.alpha;

      this.ctx.fillStyle = `rgba(255, 227, 149, ${glowAlpha})`;
      this.ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
      this.ctx.shadowBlur = isPushed ? 10 : 5;
      this.ctx.fill();
      this.ctx.restore();
    }
  }
}
