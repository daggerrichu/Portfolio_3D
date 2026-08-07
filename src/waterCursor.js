// Dynamic 60FPS Fluid Water Ripple Cursor Effect
export class WaterRippleCursor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'water-cursor-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    this.ripples = [];
    this.droplets = [];
    
    this.mouse = { x: -100, y: -100, lastX: -100, lastY: -100, vx: 0, vy: 0 };
    this.isMouseDown = false;

    this.init();
  }

  init() {
    // Style overlay canvas
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

    const speed = Math.sqrt(this.mouse.vx * this.mouse.vx + this.mouse.vy * this.mouse.vy);

    // Spawn water ripples based on movement speed
    if (speed > 2) {
      this.addRipple(x, y, Math.min(speed * 0.8 + 12, 45));
    }

    // Spawn subtle liquid droplets behind motion trail
    if (Math.random() < 0.45 && speed > 5) {
      this.addDroplet(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12);
    }

    this.mouse.lastX = x;
    this.mouse.lastY = y;
  }

  onMouseDown(e) {
    this.isMouseDown = true;
    // Splash ripple on click
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.addRipple(e.clientX, e.clientY, 35 + i * 20, 0.85);
      }, i * 70);
    }
  }

  addRipple(x, y, maxRadius, initialOpacity = 0.5) {
    this.ripples.push({
      x,
      y,
      radius: 4,
      maxRadius: maxRadius,
      opacity: initialOpacity,
      lineWidth: 2.5 + Math.random() * 1.5,
      speed: 1.8 + Math.random() * 0.8
    });
  }

  addDroplet(x, y) {
    this.droplets.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2 - 0.5,
      radius: 1.5 + Math.random() * 2.5,
      opacity: 0.7,
      life: 1.0
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Water Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.opacity *= 0.94; // Smooth liquid dampening decay

      if (r.opacity <= 0.01 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);

      // Gold-tinted liquid refraction gradient ring
      const grad = this.ctx.createRadialGradient(r.x, r.y, Math.max(0, r.radius - 4), r.x, r.y, r.radius + 4);
      grad.addColorStop(0, `rgba(255, 227, 149, 0)`);
      grad.addColorStop(0.5, `rgba(212, 175, 55, ${r.opacity * 0.6})`);
      grad.addColorStop(1, `rgba(153, 122, 21, 0)`);

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = r.lineWidth;
      this.ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 2. Render Liquid Droplets
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i];
      d.x += d.vx;
      d.y += d.vy;
      d.life -= 0.03;

      if (d.life <= 0) {
        this.droplets.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.radius * d.life, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 227, 149, ${d.life * 0.45})`;
      this.ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.restore();
    }
  }
}
