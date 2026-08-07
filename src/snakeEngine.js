// Photorealistic Slim & Calm Golden Fire Pit-Viper Engine — Slithering Website Companion
export class SnakeEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'snake-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    this.numSegments = 60; // 60 smooth articulated body segments
    this.segmentLength = 6.5; // Slimmer, tighter joint spacing
    this.segments = [];
    
    // Initial Head & Target Coordinates
    this.head = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.3 };
    this.target = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.4 };
    
    this.angle = 0;
    this.speed = 1.5; // Calm, slow, majestic slithering speed
    this.wavePhase = 0;
    
    // AI State Machine ('SLITHERING' or 'RESTING')
    this.state = 'SLITHERING';
    this.restTimer = 0;
    this.isCardTarget = false;
    
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
    // 65% Chance to target the top border/edge of a visible website card!
    const cards = document.querySelectorAll('.timeline-card, .project-card, .skill-card-simple, .language-card, .contact-container');
    const visibleCards = Array.from(cards).filter(card => {
      const r = card.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0;
    });

    if (visibleCards.length > 0 && Math.random() < 0.65) {
      const card = visibleCards[Math.floor(Math.random() * visibleCards.length)];
      const rect = card.getBoundingClientRect();
      
      // Target top surface of the card
      this.target.x = rect.left + 25 + Math.random() * Math.max(20, rect.width - 50);
      this.target.y = rect.top + 12 + Math.random() * 15;
      this.isCardTarget = true;
    } else {
      // Random open space on screen
      const margin = 80;
      this.target.x = margin + Math.random() * (this.width - margin * 2);
      this.target.y = margin + Math.random() * (this.height - margin * 2);
      this.isCardTarget = false;
    }
  }

  // Slimmer & Elegant Anatomical Radius Function
  getSegmentRadius(index) {
    if (index === 0) return 7.5; // Slim head snout
    if (index === 1) return 9.5; // Slim pit-viper jaw
    if (index === 2) return 7.0; // Neck narrowing

    const t = index / this.numSegments; // 0.0 to 1.0
    if (t < 0.65) {
      // Sleek body bulge
      return 7.0 + Math.sin((t / 0.65) * Math.PI) * 2.2; // Max thickness ~9.2px
    }
    // Smooth tapering tail
    const tailProgress = (t - 0.65) / 0.35;
    return Math.max(1.0, 8.5 * (1 - tailProgress));
  }

  update() {
    // Handling Resting AI State on Top of Cards
    if (this.state === 'RESTING') {
      this.restTimer--;
      // Gentle breathing phase while resting on card
      this.wavePhase += 0.035;

      // Spawn occasional resting embers
      if (Math.random() < 0.15) {
        const seg = this.segments[Math.floor(Math.random() * this.numSegments)];
        this.embers.push({
          x: seg.x + (Math.random() - 0.5) * 6,
          y: seg.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.5 - 0.4,
          radius: Math.random() * 1.8 + 0.6,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.02
        });
      }

      if (this.restTimer <= 0) {
        // Wake up and continue slithering!
        this.state = 'SLITHERING';
        this.pickNewTarget();
      }
      return;
    }

    // Slithering Navigation Logic
    this.wavePhase += 0.075; // Slower wave phase for calm motion

    let destinationX = this.target.x;
    let destinationY = this.target.y;

    if (this.mouse.active) {
      const dxMouse = this.mouse.x - this.head.x;
      const dyMouse = this.mouse.y - this.head.y;
      const distMouse = Math.hypot(dxMouse, dyMouse);

      if (distMouse < 280 && distMouse > 50) {
        destinationX = this.mouse.x;
        destinationY = this.mouse.y;
      }
    }

    const dx = destinationX - this.head.x;
    const dy = destinationY - this.head.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 40) {
      if (this.isCardTarget) {
        // Reach top of card: Enter RESTING state for 6 to 10 seconds!
        this.state = 'RESTING';
        this.restTimer = 360 + Math.floor(Math.random() * 240); // ~6 to 10 seconds resting
      } else {
        this.pickNewTarget();
      }
    }

    const targetAngle = Math.atan2(dy, dx);
    
    // Calm, smooth turning radius
    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    this.angle += diff * 0.035;

    // Organic Serpentine Lateral Undulation
    const waveOffset = Math.sin(this.wavePhase) * 1.4;
    const currentAngle = this.angle + waveOffset * 0.12;

    this.head.x += Math.cos(currentAngle) * this.speed;
    this.head.y += Math.sin(currentAngle) * this.speed;

    // Boundary avoidance
    const pad = 40;
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

    // Spawn subtle floating ember sparks
    if (Math.random() < 0.3) {
      const tailIndex = Math.floor(Math.random() * (this.numSegments - 8)) + 6;
      const tail = this.segments[tailIndex];
      this.embers.push({
        x: tail.x + (Math.random() - 0.5) * 6,
        y: tail.y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.0,
        vy: -Math.random() * 1.8 - 0.4,
        radius: Math.random() * 2.0 + 0.6,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  drawHead(h, next) {
    const headAngle = Math.atan2(h.y - next.y, h.x - next.x);

    this.ctx.save();
    this.ctx.translate(h.x, h.y);
    this.ctx.rotate(headAngle);

    // 1. Slim Triangular Pit-Viper Head Geometry
    this.ctx.beginPath();
    this.ctx.moveTo(12, 0); // Snout tip
    this.ctx.bezierCurveTo(8, -8, -2, -10, -9, -5); // Left jaw
    this.ctx.lineTo(-9, 5); // Neck base
    this.ctx.bezierCurveTo(-2, 10, 8, 8, 12, 0); // Right jaw
    this.ctx.closePath();

    const headGrad = this.ctx.createLinearGradient(12, 0, -9, 0);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(0.35, '#ffd700');
    headGrad.addColorStop(0.8, '#d48806');
    headGrad.addColorStop(1, '#804000');

    this.ctx.fillStyle = headGrad;
    this.ctx.shadowColor = 'rgba(255, 180, 0, 0.85)';
    this.ctx.shadowBlur = 12;
    this.ctx.fill();

    // 2. Flicking Forked Snake Tongue
    const flickCycle = Math.sin(this.wavePhase * 0.6);
    if (flickCycle > 0.4) {
      const flickLen = (flickCycle - 0.4) * 14;
      this.ctx.beginPath();
      this.ctx.moveTo(12, 0);
      this.ctx.lineTo(12 + flickLen, 0);
      // Forked tips
      this.ctx.lineTo(12 + flickLen + 4, -3);
      this.ctx.moveTo(12 + flickLen, 0);
      this.ctx.lineTo(12 + flickLen + 4, 3);

      this.ctx.strokeStyle = '#ff3333';
      this.ctx.lineWidth = 1.4;
      this.ctx.shadowColor = '#ff0000';
      this.ctx.shadowBlur = 5;
      this.ctx.stroke();
    }

    // 3. Glowing Eyes with Vertical Slit Pupils
    [-4.2, 4.2].forEach((sideY) => {
      // Outer Eye Glow Ring
      this.ctx.beginPath();
      this.ctx.arc(3.5, sideY, 2.6, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();

      // White Sclera
      this.ctx.beginPath();
      this.ctx.arc(3.5, sideY, 1.8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();

      // Vertical Slit Pupil
      this.ctx.beginPath();
      this.ctx.ellipse(3.5, sideY, 0.6, 1.8, 0, 0, Math.PI * 2);
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
      this.ctx.fillStyle = `rgba(255, 215, 0, ${e.life * 0.8})`;
      this.ctx.fill();
    }

    // 2. Render Slim Body Segments with 3D Drop Shadow & Scale Textures (Tail to Neck)
    for (let i = this.numSegments - 1; i >= 2; i--) {
      const seg = this.segments[i];
      const ratio = 1 - i / this.numSegments;
      const radius = this.getSegmentRadius(i);

      this.ctx.save();

      // 3D Elevation Drop Shadow over Webpage Cards
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      this.ctx.shadowOffsetY = 3.5;
      this.ctx.shadowBlur = 6;

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
      if (i % 2 === 0 && radius > 3) {
        this.ctx.beginPath();
        this.ctx.arc(seg.x, seg.y, radius * 0.4, 0, Math.PI * 2);
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
