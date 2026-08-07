// Photorealistic Golden Fire Pit-Viper Engine — Slithering Website Companion
export class SnakeEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'snake-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    this.numSegments = 60; // 60 smooth articulated body segments
    this.segmentLength = 8;
    this.segments = [];
    
    // Initial Head & Target Coordinates
    this.head = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.3 };
    this.target = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.4 };
    
    this.angle = 0;
    this.speed = 3.6;
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

    // Initialize articulated body segments behind head
    for (let i = 0; i < this.numSegments; i++) {
      this.segments.push({
        x: this.head.x - i * this.segmentLength,
        y: this.head.y,
        angle: 0
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
    const margin = 100;
    this.target.x = margin + Math.random() * (this.width - margin * 2);
    this.target.y = margin + Math.random() * (this.height - margin * 2);
  }

  // Realistic Anatomical Radius along snake body
  getSegmentRadius(index) {
    if (index === 0) return 13; // Head snout
    if (index === 1) return 16; // Broad pit-viper jaw
    if (index === 2) return 12; // Neck narrowing

    const t = index / this.numSegments; // 0.0 to 1.0
    if (t < 0.6) {
      // Muscular main body bulge
      return 12 + Math.sin((t / 0.6) * Math.PI) * 4.5;
    }
    // Smooth tapering tail
    const tailProgress = (t - 0.6) / 0.4;
    return Math.max(1.5, 14.5 * (1 - tailProgress));
  }

  update() {
    this.wavePhase += 0.12;

    // Follow mouse when nearby, otherwise slither autonomously
    let destinationX = this.target.x;
    let destinationY = this.target.y;

    if (this.mouse.active) {
      const dxMouse = this.mouse.x - this.head.x;
      const dyMouse = this.mouse.y - this.head.y;
      const distMouse = Math.hypot(dxMouse, dyMouse);

      if (distMouse < 360 && distMouse > 50) {
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
    
    // Smooth natural turning angle
    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    this.angle += diff * 0.045;

    // Organic Serpentine Lateral Undulation
    const waveOffset = Math.sin(this.wavePhase) * 1.6;
    const currentAngle = this.angle + waveOffset * 0.14;

    this.head.x += Math.cos(currentAngle) * this.speed;
    this.head.y += Math.sin(currentAngle) * this.speed;

    // Boundary avoidance
    const pad = 50;
    if (this.head.x < pad || this.head.x > this.width - pad || this.head.y < pad || this.head.y > this.height - pad) {
      this.angle += Math.PI * 0.4;
      this.pickNewTarget();
    }

    // Inverse Kinematics chain follow
    this.segments[0].x = this.head.x;
    this.segments[0].y = this.head.y;
    this.segments[0].angle = currentAngle;

    for (let i = 1; i < this.numSegments; i++) {
      const segPrev = this.segments[i - 1];
      const segCurr = this.segments[i];

      const segDx = segPrev.x - segCurr.x;
      const segDy = segPrev.y - segCurr.y;
      const segDist = Math.hypot(segDx, segDy);

      if (segDist > 0) {
        segCurr.x = segPrev.x - (segDx / segDist) * this.segmentLength;
        segCurr.y = segPrev.y - (segDy / segDist) * this.segmentLength;
        segCurr.angle = Math.atan2(segDy, segDx);
      }
    }

    // Spawn floating ember sparks trailing behind serpent
    if (Math.random() < 0.4) {
      const tailIndex = Math.floor(Math.random() * (this.numSegments - 8)) + 6;
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

  drawHead(h, next) {
    const headAngle = Math.atan2(h.y - next.y, h.x - next.x);

    this.ctx.save();
    this.ctx.translate(h.x, h.y);
    this.ctx.rotate(headAngle);

    // 1. Triangular Pit-Viper Head Geometry
    this.ctx.beginPath();
    this.ctx.moveTo(18, 0); // Snout tip
    this.ctx.bezierCurveTo(12, -12, -4, -16, -14, -8); // Left jaw
    this.ctx.lineTo(-14, 8); // Neck base
    this.ctx.bezierCurveTo(-4, 16, 12, 12, 18, 0); // Right jaw
    this.ctx.closePath();

    const headGrad = this.ctx.createLinearGradient(18, 0, -14, 0);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(0.35, '#ffd700');
    headGrad.addColorStop(0.8, '#d48806');
    headGrad.addColorStop(1, '#804000');

    this.ctx.fillStyle = headGrad;
    this.ctx.shadowColor = 'rgba(255, 180, 0, 0.95)';
    this.ctx.shadowBlur = 18;
    this.ctx.fill();

    // 2. Flicking Forked Snake Tongue
    const flickCycle = Math.sin(this.wavePhase * 0.7);
    if (flickCycle > 0.3) {
      const flickLen = (flickCycle - 0.3) * 18;
      this.ctx.beginPath();
      this.ctx.moveTo(18, 0);
      this.ctx.lineTo(18 + flickLen, 0);
      // Forked tips
      this.ctx.lineTo(18 + flickLen + 5, -4);
      this.ctx.moveTo(18 + flickLen, 0);
      this.ctx.lineTo(18 + flickLen + 5, 4);

      this.ctx.strokeStyle = '#ff3333';
      this.ctx.lineWidth = 1.8;
      this.ctx.shadowColor = '#ff0000';
      this.ctx.shadowBlur = 6;
      this.ctx.stroke();
    }

    // 3. Glowing Eyes with Vertical Slit Pupils
    [-6.5, 6.5].forEach((sideY) => {
      // Outer Eye Glow Ring
      this.ctx.beginPath();
      this.ctx.arc(5, sideY, 3.8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();

      // White Sclera
      this.ctx.beginPath();
      this.ctx.arc(5, sideY, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();

      // Vertical Slit Pupil
      this.ctx.beginPath();
      this.ctx.ellipse(5, sideY, 0.9, 2.4, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = '#050505';
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Floating Embers Trail
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
      this.ctx.fillStyle = `rgba(255, 215, 0, ${e.life * 0.85})`;
      this.ctx.fill();
    }

    // 2. Render Realistic Body Segments with 3D Drop Shadow & Scale Textures (Tail to Neck)
    for (let i = this.numSegments - 1; i >= 2; i--) {
      const seg = this.segments[i];
      const ratio = 1 - i / this.numSegments;
      const radius = this.getSegmentRadius(i);

      this.ctx.save();

      // 3D Elevation Drop Shadow over Webpage Cards
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      this.ctx.shadowOffsetY = 5;
      this.ctx.shadowBlur = 8;

      this.ctx.beginPath();
      this.ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);

      // Realistic 3D Volumetric Body Shading Gradient
      const grad = this.ctx.createRadialGradient(
        seg.x - radius * 0.3,
        seg.y - radius * 0.3,
        0,
        seg.x,
        seg.y,
        radius
      );
      grad.addColorStop(0, `rgba(255, 255, 220, ${0.6 + ratio * 0.4})`); // Spine highlight
      grad.addColorStop(0.3, `rgba(255, 215, 0, ${0.5 + ratio * 0.45})`); // Golden scales
      grad.addColorStop(0.75, `rgba(200, 130, 15, ${0.4 + ratio * 0.4})`); // Flank shading
      grad.addColorStop(1, `rgba(100, 45, 0, 0.1)`);

      this.ctx.fillStyle = grad;
      this.ctx.fill();

      // Diamond Scale Pattern Overlay along Dorsal Ridge
      if (i % 2 === 0 && radius > 4) {
        this.ctx.beginPath();
        this.ctx.arc(seg.x, seg.y, radius * 0.45, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 245, 180, ${0.25 + ratio * 0.35})`;
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // 3. Render Pit-Viper Head & Jaw (Index 0 & 1)
    if (this.segments.length > 1) {
      this.drawHead(this.segments[0], this.segments[1]);
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.update();
    this.draw();
  }
}
