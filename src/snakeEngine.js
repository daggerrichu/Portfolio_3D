// Subtle Dark Golden Pit-Viper & Food Particle Hunting Engine
export class SnakeEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'snake-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    this.numSegments = 55; // 55 smooth articulated body segments
    this.segmentLength = 6.0; // Slim, sleek joint spacing
    this.segments = [];
    
    // Initial Head & Target Coordinates
    this.head = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.3 };
    this.target = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.4 };
    
    this.angle = 0;
    this.speed = 0.65; // Ultra-slow, calm, mysterious slithering speed
    this.wavePhase = 0;
    
    // AI State Machine ('SLITHERING' or 'RESTING')
    this.state = 'SLITHERING';
    this.restTimer = 0;
    this.isCardTarget = false;
    
    // Food & Particle Systems
    this.foods = [];
    this.maxFoods = 4;
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
    this.canvas.style.zIndex = '1'; // Behind all main content & website cards
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

    this.spawnFoodParticles();
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

  spawnFoodParticles() {
    const margin = 100;
    while (this.foods.length < this.maxFoods) {
      this.foods.push({
        x: margin + Math.random() * (this.width - margin * 2),
        y: margin + Math.random() * (this.height - margin * 2),
        radius: 2.5 + Math.random() * 1.5,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  pickNewTarget() {
    // 1. First priority: Seek closest food particle on screen!
    if (this.foods.length > 0 && Math.random() < 0.75) {
      let closest = null;
      let minDist = Infinity;

      this.foods.forEach((f) => {
        const d = Math.hypot(f.x - this.head.x, f.y - this.head.y);
        if (d < minDist) {
          minDist = d;
          closest = f;
        }
      });

      if (closest) {
        this.target.x = closest.x;
        this.target.y = closest.y;
        this.isCardTarget = false;
        return;
      }
    }

    // 2. Second priority: Target top of a visible website card!
    const cards = document.querySelectorAll('.timeline-card, .project-card, .skill-card-simple, .language-card, .contact-container');
    const visibleCards = Array.from(cards).filter(card => {
      const r = card.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0;
    });

    if (visibleCards.length > 0 && Math.random() < 0.6) {
      const card = visibleCards[Math.floor(Math.random() * visibleCards.length)];
      const rect = card.getBoundingClientRect();
      
      this.target.x = rect.left + 25 + Math.random() * Math.max(20, rect.width - 50);
      this.target.y = rect.top + 12 + Math.random() * 15;
      this.isCardTarget = true;
    } else {
      // 3. Open space exploration
      const margin = 80;
      this.target.x = margin + Math.random() * (this.width - margin * 2);
      this.target.y = margin + Math.random() * (this.height - margin * 2);
      this.isCardTarget = false;
    }
  }

  spawnEatSparks(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1.0;
      this.embers.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        radius: Math.random() * 2.0 + 0.8,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.03
      });
    }
  }

  // Slim, Subtle Anatomical Radius along snake body
  getSegmentRadius(index) {
    if (index === 0) return 6.5; // Slim head snout
    if (index === 1) return 8.0; // Slim pit-viper jaw
    if (index === 2) return 5.8; // Neck narrowing

    const t = index / this.numSegments; // 0.0 to 1.0
    if (t < 0.65) {
      // Sleek body bulge
      return 5.8 + Math.sin((t / 0.65) * Math.PI) * 1.8; // Max thickness ~7.6px
    }
    // Smooth tapering tail
    const tailProgress = (t - 0.65) / 0.35;
    return Math.max(0.8, 7.2 * (1 - tailProgress));
  }

  update() {
    // Pulse food particles gently
    this.foods.forEach((f) => {
      f.pulse += 0.04;
    });

    // Check if snake head reached food particle
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      const dHead = Math.hypot(f.x - this.head.x, f.y - this.head.y);
      if (dHead < 14) {
        // Snake eats the food particle!
        this.spawnEatSparks(f.x, f.y);
        this.foods.splice(i, 1);
        this.spawnFoodParticles();
        this.pickNewTarget();
        break;
      }
    }

    // Handling Resting AI State on Top of Cards
    if (this.state === 'RESTING') {
      this.restTimer--;
      this.wavePhase += 0.03;

      if (Math.random() < 0.1) {
        const seg = this.segments[Math.floor(Math.random() * this.numSegments)];
        this.embers.push({
          x: seg.x + (Math.random() - 0.5) * 5,
          y: seg.y + (Math.random() - 0.5) * 5,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 1.2 - 0.3,
          radius: Math.random() * 1.5 + 0.5,
          life: 0.8,
          decay: 0.02 + Math.random() * 0.02
        });
      }

      if (this.restTimer <= 0) {
        this.state = 'SLITHERING';
        this.pickNewTarget();
      }
      return;
    }

    // Slithering Navigation Logic
    this.wavePhase += 0.035;

    let destinationX = this.target.x;
    let destinationY = this.target.y;

    if (this.mouse.active) {
      const dxMouse = this.mouse.x - this.head.x;
      const dyMouse = this.mouse.y - this.head.y;
      const distMouse = Math.hypot(dxMouse, dyMouse);

      if (distMouse < 260 && distMouse > 50) {
        destinationX = this.mouse.x;
        destinationY = this.mouse.y;
      }
    }

    const dx = destinationX - this.head.x;
    const dy = destinationY - this.head.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 35) {
      if (this.isCardTarget) {
        // Enter RESTING state on top of card for 6 to 9 seconds!
        this.state = 'RESTING';
        this.restTimer = 340 + Math.floor(Math.random() * 200);
      } else {
        this.pickNewTarget();
      }
    }

    const targetAngle = Math.atan2(dy, dx);
    
    // Ultra-smooth, ultra-gentle turning radius
    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    this.angle += diff * 0.018;

    // Subtle Organic Serpentine Undulation
    const waveOffset = Math.sin(this.wavePhase) * 1.3;
    const currentAngle = this.angle + waveOffset * 0.11;

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

    // Subtle floating ember sparks
    if (Math.random() < 0.2) {
      const tailIndex = Math.floor(Math.random() * (this.numSegments - 8)) + 6;
      const tail = this.segments[tailIndex];
      this.embers.push({
        x: tail.x + (Math.random() - 0.5) * 5,
        y: tail.y + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 1.5 - 0.3,
        radius: Math.random() * 1.6 + 0.5,
        life: 0.7,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  drawHead(h, next) {
    const headAngle = Math.atan2(h.y - next.y, h.x - next.x);

    this.ctx.save();
    this.ctx.translate(h.x, h.y);
    this.ctx.rotate(headAngle);

    // 1. Subtle Dark Metallic Pit-Viper Head Geometry
    this.ctx.beginPath();
    this.ctx.moveTo(10, 0); // Snout tip
    this.ctx.bezierCurveTo(7, -6, -2, -8, -7, -4); // Left jaw
    this.ctx.lineTo(-7, 4); // Neck base
    this.ctx.bezierCurveTo(-2, 8, 7, 6, 10, 0); // Right jaw
    this.ctx.closePath();

    const headGrad = this.ctx.createLinearGradient(10, 0, -7, 0);
    headGrad.addColorStop(0, 'rgba(230, 200, 100, 0.75)');
    headGrad.addColorStop(0.4, 'rgba(180, 140, 30, 0.65)');
    headGrad.addColorStop(1, 'rgba(90, 60, 10, 0.5)');

    this.ctx.fillStyle = headGrad;
    this.ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
    this.ctx.shadowBlur = 4;
    this.ctx.fill();

    // 2. Flicking Forked Snake Tongue
    const flickCycle = Math.sin(this.wavePhase * 0.6);
    if (flickCycle > 0.45) {
      const flickLen = (flickCycle - 0.45) * 12;
      this.ctx.beginPath();
      this.ctx.moveTo(10, 0);
      this.ctx.lineTo(10 + flickLen, 0);
      this.ctx.lineTo(10 + flickLen + 3, -2.5);
      this.ctx.moveTo(10 + flickLen, 0);
      this.ctx.lineTo(10 + flickLen + 3, 2.5);

      this.ctx.strokeStyle = 'rgba(220, 60, 40, 0.7)';
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    }

    // 3. Subtle Eyes with Vertical Slit Pupils
    [-3.5, 3.5].forEach((sideY) => {
      this.ctx.beginPath();
      this.ctx.arc(3, sideY, 1.8, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
      this.ctx.fill();

      // Vertical Slit Pupil
      this.ctx.beginPath();
      this.ctx.ellipse(3, sideY, 0.5, 1.3, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(5, 5, 5, 0.85)';
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Glowing Food Particles
    this.ctx.globalCompositeOperation = 'lighter';
    this.foods.forEach((f) => {
      const pulseRadius = f.radius + Math.sin(f.pulse) * 0.8;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, pulseRadius, 0, Math.PI * 2);

      const fGrad = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, pulseRadius);
      fGrad.addColorStop(0, 'rgba(255, 235, 160, 0.85)');
      fGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.5)');
      fGrad.addColorStop(1, 'rgba(180, 100, 0, 0)');

      this.ctx.fillStyle = fGrad;
      this.ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.restore();
    });

    // 2. Render Floating Embers Trail
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
      this.ctx.fillStyle = `rgba(212, 175, 55, ${e.life * 0.55})`;
      this.ctx.fill();
    }

    // 3. Render Subtle, Refined Body Segments (Tail to Neck)
    for (let i = this.numSegments - 1; i >= 2; i--) {
      const seg = this.segments[i];
      const ratio = 1 - i / this.numSegments;
      const radius = this.getSegmentRadius(i);

      this.ctx.save();

      // Subtle, Soft Shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      this.ctx.shadowOffsetY = 2.5;
      this.ctx.shadowBlur = 4;

      this.ctx.beginPath();
      this.ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);

      // Subtle Refined Metallic Shading (Low Opacity so it blends into background)
      const grad = this.ctx.createRadialGradient(
        seg.x - radius * 0.25,
        seg.y - radius * 0.25,
        0,
        seg.x,
        seg.y,
        radius
      );
      grad.addColorStop(0, `rgba(230, 200, 110, ${0.35 + ratio * 0.3})`); // Subtle spine highlight
      grad.addColorStop(0.4, `rgba(180, 140, 30, ${0.3 + ratio * 0.3})`); // Refined dark gold
      grad.addColorStop(1, `rgba(60, 40, 5, 0.05)`);

      this.ctx.fillStyle = grad;
      this.ctx.fill();

      this.ctx.restore();
    }

    // 4. Render Pit-Viper Head & Jaw (Index 0 & 1)
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
