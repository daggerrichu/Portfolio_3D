// Golden Dark Fire Serpent — Slithering Website Companion Engine
export class SnakeEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'snake-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    this.numSegments = 45;
    this.segmentLength = 12;
    this.segments = [];
    
    // Initial Head & Target Coordinates
    this.head = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.3 };
    this.target = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.4 };
    
    this.angle = 0;
    this.speed = 4.2;
    this.wavePhase = 0;
    
    this.embers = [];
    this.mouse = { x: -1000, y: -1000, active: false };

    this.init();
  }

  init() {
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9990';
    document.body.appendChild(this.canvas);

    this.onResize();

    // Initialize articulated segments behind head
    for (let i = 0; i < this.numSegments; i++) {
      this.segments.push({
        x: this.head.x - i * this.segmentLength,
        y: this.head.y
      });
    }

    this.pickNewTarget();

    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    this.animate();
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * Math.min(window.devicePixelRatio, 2);
    this.canvas.height = this.height * Math.min(window.devicePixelRatio, 2);
    this.ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));
  }

  pickNewTarget() {
    const margin = 90;
    this.target.x = margin + Math.random() * (this.width - margin * 2);
    this.target.y = margin + Math.random() * (this.height - margin * 2);
  }

  update() {
    this.wavePhase += 0.14;

    // Follow mouse when nearby, otherwise slither autonomously
    let destinationX = this.target.x;
    let destinationY = this.target.y;

    if (this.mouse.active) {
      const dxMouse = this.mouse.x - this.head.x;
      const dyMouse = this.mouse.y - this.head.y;
      const distMouse = Math.hypot(dxMouse, dyMouse);

      if (distMouse < 340 && distMouse > 50) {
        destinationX = this.mouse.x;
        destinationY = this.mouse.y;
      }
    }

    const dx = destinationX - this.head.x;
    const dy = destinationY - this.head.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 60) {
      this.pickNewTarget();
    }

    const targetAngle = Math.atan2(dy, dx);
    
    // Smooth angle turning (slithering curve)
    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    this.angle += diff * 0.055;

    // Add sinusoidal slither wave motion
    const waveOffset = Math.sin(this.wavePhase) * 1.8;
    const currentAngle = this.angle + waveOffset * 0.15;

    this.head.x += Math.cos(currentAngle) * this.speed;
    this.head.y += Math.sin(currentAngle) * this.speed;

    // Bounce off screen boundaries
    const pad = 50;
    if (this.head.x < pad || this.head.x > this.width - pad || this.head.y < pad || this.head.y > this.height - pad) {
      this.angle += Math.PI * 0.5;
      this.pickNewTarget();
    }

    // Inverse Kinematics chain follow
    this.segments[0].x = this.head.x;
    this.segments[0].y = this.head.y;

    for (let i = 1; i < this.numSegments; i++) {
      const segPrev = this.segments[i - 1];
      const segCurr = this.segments[i];

      const segDx = segPrev.x - segCurr.x;
      const segDy = segPrev.y - segCurr.y;
      const segDist = Math.hypot(segDx, segDy);

      if (segDist > 0) {
        segCurr.x = segPrev.x - (segDx / segDist) * this.segmentLength;
        segCurr.y = segPrev.y - (segDy / segDist) * this.segmentLength;
      }
    }

    // Spawn floating embers trailing behind serpent
    if (Math.random() < 0.45) {
      const tailIndex = Math.floor(Math.random() * (this.numSegments - 6)) + 5;
      const tail = this.segments[tailIndex];
      this.embers.push({
        x: tail.x + (Math.random() - 0.5) * 8,
        y: tail.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.random() * 2 - 0.5,
        radius: Math.random() * 2.2 + 0.8,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.025
      });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Embers Trail
    this.ctx.globalCompositeOperation = 'lighter';
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.x += e.vx;
      e.y += e.vy;
      e.life -= e.decay;

      if (e.life <= 0) {
        this.embers.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 215, 0, ${e.life * 0.8})`;
      this.ctx.fill();
    }

    // 2. Draw Fiery Golden Serpent Body (Tail to Head)
    for (let i = this.numSegments - 1; i >= 0; i--) {
      const seg = this.segments[i];
      const ratio = 1 - i / this.numSegments;
      const radius = Math.max(2, 13 * ratio);

      this.ctx.beginPath();
      this.ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);

      const grad = this.ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, radius);
      if (i === 0) {
        // Glowing White-Hot Head Core
        grad.addColorStop(0, 'rgba(255, 255, 240, 1.0)');
        grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.95)');
        grad.addColorStop(1, 'rgba(255, 140, 0, 0.4)');
      } else {
        // Body Scales Gradient
        grad.addColorStop(0, `rgba(255, 215, 0, ${0.45 + ratio * 0.45})`);
        grad.addColorStop(0.7, `rgba(212, 140, 20, ${0.3 + ratio * 0.4})`);
        grad.addColorStop(1, `rgba(180, 80, 0, 0)`);
      }

      this.ctx.fillStyle = grad;
      this.ctx.fill();
    }

    // 3. Draw Glowing Serpent Eyes & Tongue
    if (this.segments.length > 1) {
      const h = this.segments[0];
      const next = this.segments[1];
      const headAngle = Math.atan2(h.y - next.y, h.x - next.x);

      // Eye placement offsets
      const eyeOffset = 6;
      const eyeAngle1 = headAngle + Math.PI / 3.2;
      const eyeAngle2 = headAngle - Math.PI / 3.2;

      const eye1X = h.x + Math.cos(eyeAngle1) * eyeOffset;
      const eye1Y = h.y + Math.sin(eyeAngle1) * eyeOffset;
      const eye2X = h.x + Math.cos(eyeAngle2) * eyeOffset;
      const eye2Y = h.y + Math.sin(eyeAngle2) * eyeOffset;

      // Draw Eyes
      this.ctx.beginPath();
      this.ctx.arc(eye1X, eye1Y, 2.5, 0, Math.PI * 2);
      this.ctx.arc(eye2X, eye2Y, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.update();
    this.draw();
  }
}
