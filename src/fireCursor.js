// Fiery Fire & Ember Trail Cursor Engine
export class FireCursor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fire-cursor-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    this.flames = [];
    this.embers = [];
    
    this.mouse = { x: -1000, y: -1000, lastX: -1000, lastY: -1000, vx: 0, vy: 0 };
    this.isMouseDown = false;

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

    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', () => { this.isMouseDown = false; });

    this.animate();
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * Math.min(window.devicePixelRatio, 2);
    this.canvas.height = this.height * Math.min(window.devicePixelRatio, 2);
    this.ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));
  }

  onMouseMove(e) {
    this.updateMouse(e.clientX, e.clientY);
  }

  onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      this.updateMouse(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  updateMouse(x, y) {
    if (this.mouse.lastX < 0) {
      this.mouse.lastX = x;
      this.mouse.lastY = y;
    }

    this.mouse.x = x;
    this.mouse.y = y;

    this.mouse.vx = x - this.mouse.lastX;
    this.mouse.vy = y - this.mouse.lastY;

    // Spawn flame fire particles continuously
    for (let i = 0; i < 4; i++) {
      this.addFlameParticle(x, y);
    }

    // Spawn floating embers trailing behind
    if (Math.random() < 0.7) {
      this.addEmberParticle(x, y);
    }

    this.mouse.lastX = x;
    this.mouse.lastY = y;
  }

  onMouseDown(e) {
    this.isMouseDown = true;
    // Fire burst explosion on click
    for (let i = 0; i < 35; i++) {
      this.addFlameParticle(e.clientX, e.clientY, true);
      this.addEmberParticle(e.clientX, e.clientY, true);
    }
  }

  addFlameParticle(x, y, isBurst = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = isBurst ? (Math.random() * 5 + 2) : (Math.random() * 2 + 0.5);
    
    this.flames.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: isBurst ? Math.cos(angle) * speed : (Math.random() - 0.5) * 1.5 - this.mouse.vx * 0.15,
      vy: isBurst ? Math.sin(angle) * speed : -Math.random() * 2.5 - 1 - Math.abs(this.mouse.vy * 0.1),
      radius: Math.random() * 14 + 10,
      life: 1.0,
      decay: 0.03 + Math.random() * 0.03
    });
  }

  addEmberParticle(x, y, isBurst = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = isBurst ? (Math.random() * 6 + 3) : (Math.random() * 2.5 + 0.8);

    this.embers.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx: isBurst ? Math.cos(angle) * speed : (Math.random() - 0.5) * 2,
      vy: isBurst ? Math.sin(angle) * speed : -Math.random() * 3.5 - 1.5,
      radius: Math.random() * 2.5 + 1.0,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.02
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Use Additive Blending for glowing fire effect
    this.ctx.globalCompositeOperation = 'lighter';

    // 1. Render Flame Fire Particles
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const f = this.flames[i];
      f.x += f.vx;
      f.y += f.vy;
      f.radius *= 0.95; // Shrink as flame rises
      f.life -= f.decay;

      if (f.life <= 0 || f.radius <= 0.5) {
        this.flames.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);

      // Gold fire color ramp: White hot center -> Intense gold -> Deep fiery orange
      const grad = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      if (f.life > 0.6) {
        grad.addColorStop(0, `rgba(255, 255, 240, ${f.life})`);
        grad.addColorStop(0.4, `rgba(255, 227, 149, ${f.life * 0.85})`);
        grad.addColorStop(1, `rgba(212, 175, 55, 0)`);
      } else {
        grad.addColorStop(0, `rgba(255, 200, 80, ${f.life})`);
        grad.addColorStop(0.5, `rgba(212, 120, 20, ${f.life * 0.7})`);
        grad.addColorStop(1, `rgba(150, 50, 0, 0)`);
      }

      this.ctx.fillStyle = grad;
      this.ctx.fill();
      this.ctx.restore();
    }

    // 2. Render Floating Golden Embers
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.x += e.vx;
      e.y += e.vy;
      e.vx += (Math.random() - 0.5) * 0.2; // Turbulence
      e.life -= e.decay;

      if (e.life <= 0) {
        this.embers.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 227, 149, ${e.life * 0.9})`;
      this.ctx.shadowColor = 'rgba(255, 180, 50, 0.9)';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }
}
