import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export class VirtualRoomScene {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x181a24);

    // Camera - Wide Room Perspective matching exact user screenshot
    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 1000);
    this.defaultCamPos = new THREE.Vector3(13.5, 8.8, 13.5);
    this.defaultCamTarget = new THREE.Vector3(-1.8, 3.5, -2.5);

    this.camera.position.copy(this.defaultCamPos);
    this.targetLookAt = this.defaultCamTarget.clone();
    this.currentLookAt = this.defaultCamTarget.clone();

    // WebGL Renderer with Brave Browser & Low-Spec Optimization
    const isBrave = typeof navigator !== 'undefined' && navigator.brave && typeof navigator.brave.isBrave === 'function';
    const targetPixelRatio = isBrave ? 1.0 : Math.min(window.devicePixelRatio, 1.25);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isBrave,
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(targetPixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.6;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isBrave ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;

    this.isHighFpsMode = isBrave;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();

    // Orbit State
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.spherical = new THREE.Spherical();
    this.spherical.setFromVector3(this.camera.position.clone().sub(this.currentLookAt));

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-100, -100);
    this.hoveredObject = null;

    this.isNight = false; // Default to Daylight Mode
    this.clock = new THREE.Clock();
    this.interactiveObjects = [];
    this.targetCameraPos = this.defaultCamPos.clone();

    this.initLighting();
    this.createPhotorealisticRoom();
    this.loadBlenderGLBModels();
    this.initPostProcessing();
    this.bindEvents();
    this.animate();
  }

  initLighting() {
    // 1. High-Intensity Ambient Studio Light
    this.ambientLight = new THREE.AmbientLight(0xfffaed, 4.5);
    this.scene.add(this.ambientLight);

    // 2. Bright Key Window Sunlight
    this.windowLight = new THREE.DirectionalLight(0xfff0c4, 8.0);
    this.windowLight.position.set(16, 18, -12);
    this.windowLight.castShadow = true;
    this.windowLight.shadow.mapSize.width = 1024;
    this.windowLight.shadow.mapSize.height = 1024;
    this.windowLight.shadow.bias = -0.0001;
    this.scene.add(this.windowLight);

    // 3. Front Warm Fill Light (illuminates front of desk, keyboard, mouse & CPU)
    this.frontFillLight = new THREE.DirectionalLight(0xfff7e6, 6.0);
    this.frontFillLight.position.set(6, 12, 12);
    this.scene.add(this.frontFillLight);

    // 4. Overhead Ceiling Room Spotlights
    this.ceilingLight1 = new THREE.PointLight(0xfff5e6, 25.0, 30);
    this.ceilingLight1.position.set(0, 9.0, 1.0);
    this.scene.add(this.ceilingLight1);

    this.ceilingLight2 = new THREE.PointLight(0xfff0dd, 20.0, 25);
    this.ceilingLight2.position.set(-4.0, 9.0, -3.0);
    this.scene.add(this.ceilingLight2);

    // 5. Workstation Desk Key Light (Glow directly over table top)
    this.deskKeyLight = new THREE.PointLight(0xffe8bd, 18.0, 15);
    this.deskKeyLight.position.set(0, 4.8, 1.2);
    this.scene.add(this.deskKeyLight);
  }

  createPhotorealisticRoom() {
    this.roomGroup = new THREE.Group();

    // 1. Polished Architectural Floor Tiles
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 512;
    tileCanvas.height = 512;
    const tCtx = tileCanvas.getContext('2d');

    // Base Grout Color
    tCtx.fillStyle = '#0d1017';
    tCtx.fillRect(0, 0, 512, 512);

    // Draw Individual Square Tiles with Beveled Edges
    const tileSize = 64; // 8x8 tiles per texture block
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        tCtx.fillStyle = '#222736';
        tCtx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        tCtx.strokeStyle = '#2d3448';
        tCtx.lineWidth = 1;
        tCtx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
    }

    const floorTileTex = new THREE.CanvasTexture(tileCanvas);
    floorTileTex.wrapS = THREE.RepeatWrapping;
    floorTileTex.wrapT = THREE.RepeatWrapping;
    floorTileTex.repeat.set(4, 4);

    const floorGeo = new THREE.BoxGeometry(17, 0.4, 17);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTileTex,
      roughness: 0.18,
      metalness: 0.1,
      bumpMap: floorTileTex,
      bumpScale: 0.02
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // 2. Walls & Window (Brighter Architectural Walls)
    const backWallGeo = new THREE.BoxGeometry(17, 11, 0.4);
    this.wallMat = new THREE.MeshStandardMaterial({ color: 0x222533, roughness: 0.7 });
    const backWall = new THREE.Mesh(backWallGeo, this.wallMat);
    backWall.position.set(0, 5.3, -8.5);
    backWall.receiveShadow = true;
    this.roomGroup.add(backWall);

    const leftWallGeo = new THREE.BoxGeometry(0.4, 11, 17);
    const leftWall = new THREE.Mesh(leftWallGeo, this.wallMat);
    leftWall.position.set(-8.5, 5.3, 0);
    leftWall.receiveShadow = true;
    this.roomGroup.add(leftWall);

    // 3. Glowing Ceiling Light Fixtures
    const ceilingPanelGeo = new THREE.BoxGeometry(4.5, 0.1, 1.5);
    const ceilingPanelMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff5e6,
      emissiveIntensity: 3.5
    });
    const ceilingLightPanel1 = new THREE.Mesh(ceilingPanelGeo, ceilingPanelMat);
    ceilingLightPanel1.position.set(0, 10.7, 0);
    this.roomGroup.add(ceilingLightPanel1);

    const ceilingLightPanel2 = new THREE.Mesh(ceilingPanelGeo, ceilingPanelMat);
    ceilingLightPanel2.position.set(-4.0, 10.7, -3.5);
    this.roomGroup.add(ceilingLightPanel2);

    // 5. 3D Floor Typography Decal (Renders Title, Role & Badge Directly on Floor Tiles)
    this.createFloorTextDecal();

    // 4. Portfolio Showcase Wall Canvas & Billboard (Back Wall)
    this.createWallPortfolioCanvas();

    // 5. Experience, Skills & Contact Gallery Display (Left Wall)
    this.createLeftWallGalleryCanvas();

    this.scene.add(this.roomGroup);
    this.roomGroup.matrixAutoUpdate = false;
    this.roomGroup.updateMatrix();

    // Pre-compile WebGL shaders & upload textures during loading screen
    if (this.renderer && this.scene && this.camera) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  createWallPortfolioCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 2300;
    canvas.height = 1560;
    const ctx = canvas.getContext('2d');

    // Background: Dark Slate Gradient with Grid
    const bgGrad = ctx.createLinearGradient(0, 0, 2300, 1560);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2300, 1560);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 2300; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1560); ctx.stroke();
    }
    for (let y = 0; y < 1560; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2300, y); ctx.stroke();
    }

    // Top Accent Border Line
    const goldLineGrad = ctx.createLinearGradient(0, 0, 2300, 0);
    goldLineGrad.addColorStop(0, '#38bdf8');
    goldLineGrad.addColorStop(0.5, '#ffd700');
    goldLineGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = goldLineGrad;
    ctx.fillRect(0, 0, 2300, 18);

    // Header Pill
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(110, 65, 840, 75, 37);
    ctx.fill(); ctx.stroke();

    ctx.font = '800 33px "Outfit", "Inter", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('FEATURED UI/UX & PRODUCT PROJECTS', 150, 115);

    // Name & Role Header
    ctx.font = '900 94px "Cinzel", "Serif"';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.fillText('LIPIN KUMAR', 110, 245);

    ctx.font = '700 44px "Outfit", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 0;
    ctx.fillText('UI UX Designer & Game Developer', 110, 310);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(110, 345); ctx.lineTo(2190, 345); ctx.stroke();

    // Section 1: Featured Projects Grid (Left Column)
    ctx.font = '800 42px "Outfit", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('KEY SHIPPED PROJECTS', 110, 420);

    const projects = [
      { name: '🌐 Talentshealth.com & ionaught.com', desc: 'UI/UX Design for Healthcare & Tech Platforms' },
      { name: '🎮 frontendwarfare.com', desc: 'Gamified Leaderboard Rank & Training System Design' },
      { name: '🛍️ actonposh.com & Promptier', desc: 'E-Commerce POS & AI Prompting Web App UI/UX' },
      { name: '📱 Medicine & Stock Management Apps', desc: 'Mobile E-Commerce & Project Management Tools' },
      { name: '🚗 Drowsiness Detection System', desc: 'AI Computer Vision Safety System (Vidya Academy)' }
    ];

    projects.forEach((proj, idx) => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.88)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(110, 460 + (idx * 105), 980, 92, 14);
      ctx.fill(); ctx.stroke();

      ctx.font = '800 30px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(proj.name, 140, 502 + (idx * 105));

      ctx.font = '500 22px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(proj.desc, 140, 535 + (idx * 105));
    });

    // Section 2: Core Specialties & Stats (Right Column)
    ctx.font = '800 42px "Outfit", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('ACADEMIC & PRODUCT HIGHLIGHTS', 1180, 420);

    const stats = [
      { num: '8+', label: 'Shipped UI/UX Projects' },
      { num: 'B.Tech', label: 'Computer Science (2017-21)' },
      { num: '99%', label: 'SSLC Board Percentage' },
      { num: 'Cert.', label: 'Digital Marketing Pro' }
    ];

    stats.forEach((st, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = 1180 + (col * 490);
      const y = 460 + (row * 195);

      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y, 450, 165, 16);
      ctx.fill(); ctx.stroke();

      ctx.font = '900 56px "Cinzel", serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(st.num, x + 35, y + 72);

      ctx.font = '600 26px "Inter", sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(st.label, x + 35, y + 124);
    });

    // Core Tech Pill List
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(1180, 870, 940, 115, 16);
    ctx.fill(); ctx.stroke();

    ctx.font = '700 28px "Inter", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🛠️ Figma • Adobe XD • Photoshop • Illustrator • Sketch', 1210, 922);
    ctx.fillText('⚡ Android Studio • After Effects • Premiere Pro • Three.js', 1210, 962);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Outer Wooden Frame (Enlarged to 11.7m x 8.0m)
    const frameGeo = new THREE.BoxGeometry(11.7, 8.0, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.4 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(-2.5, 6.2, -8.3);
    this.roomGroup.add(frameMesh);

    // Canvas Display Board (Enlarged to 11.5m x 7.8m)
    const boardGeo = new THREE.PlaneGeometry(11.5, 7.8);
    const boardMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.1
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(-2.5, 6.2, -8.23);
    this.makeInteractive(boardMesh, 'backWall', 'Featured Projects Wall', 'Click to Focus Back Wall');
    this.roomGroup.add(boardMesh);
  }

  createLeftWallGalleryCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 2300;
    canvas.height = 1560;
    const ctx = canvas.getContext('2d');

    // Background: Dark Slate Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 2300, 1560);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2300, 1560);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.09)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 2300; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1560); ctx.stroke();
    }

    // Top Accent Border Line
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(0, 0, 2300, 18);

    // Header Pill
    ctx.fillStyle = 'rgba(255, 215, 0, 0.18)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(110, 65, 980, 75, 37);
    ctx.fill(); ctx.stroke();

    ctx.font = '800 33px "Outfit", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('WORK EXPERIENCE, EDUCATION & CONTACT', 150, 115);

    // Section 1: Work Experience Timeline
    ctx.font = '800 44px "Outfit", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('WORK EXPERIENCE', 110, 220);

    const experiences = [
      { role: 'UI/UX Designer', company: 'ALOKIN SOFTWARE PVT LTD.', period: '2023' },
      { role: 'Software Engineer (UI/UX Design & Multiple Roles)', company: 'IONAUGHT TECHNOLOGIES PVT LTD', period: '2021 — 2022' },
      { role: 'Android Application Dev & ML Internships', company: 'Srishti Innovative, Keltron & Areva Digital', period: '2018 — 2019' }
    ];

    experiences.forEach((exp, idx) => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(110, 260 + (idx * 135), 2080, 115, 16);
      ctx.fill(); ctx.stroke();

      ctx.font = '800 34px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(exp.role, 150, 310 + (idx * 135));

      ctx.font = '600 26px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(exp.company, 150, 350 + (idx * 135));

      ctx.font = '700 28px "Outfit", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'right';
      ctx.fillText(exp.period, 2140, 325 + (idx * 135));
      ctx.textAlign = 'left';
    });

    // Section 2: Education & Qualifications
    ctx.font = '800 44px "Outfit", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('EDUCATION & CERTIFICATIONS', 110, 710);

    const educationList = [
      { degree: 'B.Tech in Computer Science & Engineering', inst: 'Vidya Academy of Science & Technology (CGPA: 6.98)', year: '2017 — 2021' },
      { degree: 'Certified Digital Marketing Professional', inst: 'Areva Digital (ID: TMS000125)', year: '2018' },
      { degree: 'Plus Two (Biology Science, 76%) & SSLC (99%)', inst: 'GHSS Anchal East & GHS Nettayam', year: '2015 — 2017' }
    ];

    educationList.forEach((ed, idx) => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(110, 745 + (idx * 125), 2080, 105, 16);
      ctx.fill(); ctx.stroke();

      ctx.font = '800 30px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ed.degree, 150, 792 + (idx * 125));

      ctx.font = '600 24px "Inter", sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(ed.inst, 150, 830 + (idx * 125));

      ctx.font = '700 28px "Outfit", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'right';
      ctx.fillText(ed.year, 2140, 808 + (idx * 125));
      ctx.textAlign = 'left';
    });

    // Section 3: Direct Contact & Location Info
    ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(110, 1160, 2080, 240, 20);
    ctx.fill(); ctx.stroke();

    ctx.font = '800 38px "Outfit", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('📬 CONTACT DETAILS & LOCATION', 160, 1225);

    ctx.font = '700 30px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Email: lipinkumarcs20@gmail.com', 160, 1285);
    ctx.fillText('Phone: +91 9995921453', 1160, 1285);

    ctx.fillText('Address: Vipin Bhavanam, Nettayam, Nediyara (P.O), 691306', 160, 1345);

    const leftTex = new THREE.CanvasTexture(canvas);
    leftTex.generateMipmaps = false;
    leftTex.minFilter = THREE.LinearFilter;
    leftTex.colorSpace = THREE.SRGBColorSpace;

    // Left Wall Outer Wooden Frame (Enlarged to 11.7m x 8.0m)
    const frameGeo = new THREE.BoxGeometry(0.12, 8.0, 11.7);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.4 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(-8.3, 6.2, -0.5);
    this.roomGroup.add(frameMesh);

    // Left Wall Display Board (Enlarged to 11.5m x 7.8m)
    const boardGeo = new THREE.PlaneGeometry(11.5, 7.8);
    const boardMat = new THREE.MeshStandardMaterial({
      map: leftTex,
      roughness: 0.25,
      metalness: 0.1
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.rotation.y = Math.PI / 2;
    boardMesh.position.set(-8.23, 6.2, -0.5);
    this.makeInteractive(boardMesh, 'leftWall', 'Experience & Skills Wall', 'Click to Focus Left Wall');
    this.roomGroup.add(boardMesh);
  }

  createFloorTextDecal() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 2048, 768);

    // 1. Main Title: "LIPIN KUMAR" (Platinum Silver & White Metallic Gradient)
    ctx.save();
    ctx.font = '900 165px "Cinzel", "Times New Roman", serif';
    ctx.textAlign = 'center';

    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 35;

    const titleGrad = ctx.createLinearGradient(0, 150, 0, 360);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.4, '#f8fafc');
    titleGrad.addColorStop(0.75, '#cbd5e1');
    titleGrad.addColorStop(1, '#94a3b8');

    ctx.fillStyle = titleGrad;
    ctx.fillText('LIPIN KUMAR', 1024, 320);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText('LIPIN KUMAR', 1024, 320);
    ctx.restore();

    // 2. Subtitle: "UI/UX Designer, Game Developer" (Vibrant Electric Cyan)
    ctx.save();
    ctx.font = '700 56px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 22;
    ctx.fillText('UI UX Designer & Game Developer', 1024, 435);
    ctx.restore();

    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.generateMipmaps = false;
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.colorSpace = THREE.SRGBColorSpace;

    const floorTextGeo = new THREE.PlaneGeometry(10.5, 3.9);
    const floorTextMat = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const floorTextMesh = new THREE.Mesh(floorTextGeo, floorTextMat);
    floorTextMesh.rotation.x = -Math.PI / 2;
    floorTextMesh.position.set(0, 0.015, 4.8);
    this.roomGroup.add(floorTextMesh);
  }

  // Helper: Ground model 100% flush on top of dark glass desk top surface (Y=1.60)
  alignOnDesk(model, targetX, targetZ, targetSize, rotateY = 0) {
    this.scene.add(model);
    if (rotateY !== 0) model.rotation.y = rotateY;
    model.updateMatrixWorld(true);

    // Compute Box3 strictly from VISIBLE meshes (ignores hidden base circle)
    const box = new THREE.Box3();
    let hasVisibleMesh = false;
    model.traverse((child) => {
      if (child.isMesh && child.visible) {
        child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
        box.union(childBox);
        hasVisibleMesh = true;
      }
    });

    if (!hasVisibleMesh) box.setFromObject(model);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = targetSize / (maxDim || 1);
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    model.updateMatrixWorld(true);

    // Re-compute visible Box3 after scaling
    const scaledBox = new THREE.Box3();
    model.traverse((child) => {
      if (child.isMesh && child.visible) {
        child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
        scaledBox.union(childBox);
      }
    });

    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    model.position.x = targetX - scaledCenter.x;
    model.position.y = 1.60 - scaledBox.min.y;
    model.position.z = targetZ - scaledCenter.z;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  // Helper: Ground model 100% flush on top of room floor (Y=0)
  alignOnFloor(model, targetX, targetZ, targetSize, rotateY = 0) {
    this.scene.add(model);
    if (rotateY !== 0) model.rotation.y = rotateY;
    model.updateMatrixWorld(true);

    const box = new THREE.Box3();
    let hasVisibleMesh = false;
    model.traverse((child) => {
      if (child.isMesh && child.visible) {
        child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
        box.union(childBox);
        hasVisibleMesh = true;
      }
    });

    if (!hasVisibleMesh) box.setFromObject(model);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = targetSize / (maxDim || 1);
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    model.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3();
    model.traverse((child) => {
      if (child.isMesh && child.visible) {
        child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
        scaledBox.union(childBox);
      }
    });

    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    model.position.x = targetX - scaledCenter.x;
    model.position.y = 0.0 - scaledBox.min.y;
    model.position.z = targetZ - scaledCenter.z;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  // --------------------------------------------------------------------------
  // Load Blender 4.5 Exported GLB Models into WebGL Scene
  // --------------------------------------------------------------------------
  loadBlenderGLBModels() {
    // 1. Work Desk Table
    this.gltfLoader.load('models/work_desk.glb', (gltf) => {
      const deskTable = gltf.scene;
      deskTable.position.set(0, 0, 0);
      deskTable.scale.set(0.03, 0.03, 0.03);

      deskTable.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(deskTable);
      console.log('[work_desk.glb] Desk Table Loaded!');
    }, undefined, (err) => console.warn('[work_desk.glb] Error:', err));

    // 2. Xiaomi 4K Monitor (Centered on Desk)
    this.gltfLoader.load('models/xiaomi_4k_27_monitor.glb', (gltf) => {
      const monitorObj = gltf.scene;
      monitorObj.position.set(0, 2.18, -0.15);
      monitorObj.scale.set(2.2, 2.2, 2.2);

      monitorObj.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material && child.material.emissive) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      });

      this.makeInteractive(monitorObj, 'monitors', 'Xiaomi 4K Display', 'View Featured Projects');
      this.scene.add(monitorObj);
      console.log('[xiaomi_4k_27_monitor.glb] Monitor Aligned!');
    }, undefined, (err) => console.warn('[xiaomi_4k_27_monitor.glb] Error:', err));

    // 3. Premium Textured Gaming Deskmat / Mousepad
    const texLoader = new THREE.TextureLoader();
    texLoader.load('textures/deskmat.jpg', (deskmatTex) => {
      deskmatTex.colorSpace = THREE.SRGBColorSpace;
      const deskmatGeo = new THREE.PlaneGeometry(1.8, 0.75);
      const deskmatMat = new THREE.MeshStandardMaterial({
        map: deskmatTex,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const deskmatMesh = new THREE.Mesh(deskmatGeo, deskmatMat);
      deskmatMesh.rotation.x = -Math.PI / 2;
      deskmatMesh.position.set(0.18, 1.602, 0.20);
      deskmatMesh.receiveShadow = true;
      this.scene.add(deskmatMesh);
      console.log('[deskmat.jpg] Premium Deskmat Mousepad loaded on table surface!');
    });

    // 4. Mechanical Keyboard (Rotated 90 deg and placed 100% flush on deskmat at Y=1.605)
    this.gltfLoader.load('models/mechanical_keyboard.glb', (gltf) => {
      this.alignOnDesk(gltf.scene, -0.15, 0.20, 0.90, Math.PI / 2);
      console.log('[mechanical_keyboard.glb] Keyboard rotated & placed flush on deskmat!');
    }, undefined, (err) => console.warn('[mechanical_keyboard.glb] Error:', err));

    // 5. Computer Mouse (Rotated -90 deg to face monitor and placed 100% flush on deskmat at Y=1.605)
    this.gltfLoader.load('models/computer_mouse.glb', (gltf) => {
      this.alignOnDesk(gltf.scene, 0.55, 0.20, 0.22, -Math.PI / 2);
      console.log('[computer_mouse.glb] Mouse rotated facing monitor and placed flush on deskmat!');
    }, undefined, (err) => console.warn('[computer_mouse.glb] Error:', err));

    // 6. PC Tower / CPU Rig (PC.fbx - Rotated 90 degrees on left side of monitor, base circle removed)
    this.fbxLoader.load('models/PC.fbx', (pcModel) => {
      // Remove any black circle/cylinder base platform under the CPU
      pcModel.traverse((child) => {
        if (child.isMesh) {
          const name = (child.name || '').toLowerCase();
          const geoType = (child.geometry ? child.geometry.type : '').toLowerCase();
          
          child.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(child);
          const size = new THREE.Vector3();
          box.getSize(size);
          const isFlatDisc = size.x > 0.1 && Math.abs(size.x - size.z) < 0.25 * Math.max(size.x, size.z) && size.y < 0.15 * Math.max(size.x, size.z);

          if (name.includes('circle') || name.includes('cylinder') || name.includes('base') || name.includes('stand') || name.includes('podium') || name.includes('disc') || name.includes('shadow') || name.includes('plane') || geoType.includes('cylinder') || isFlatDisc) {
            console.log('[PC.fbx] Removing base circle mesh:', child.name);
            child.visible = false;
          }
        }
      });

      this.alignOnDesk(pcModel, -1.05, 0.05, 1.20, Math.PI / 2);
      this.makeInteractive(pcModel, 'skills', 'Gaming PC Tower', 'View Technical Skills');
      console.log('[PC.fbx] Loaded PC CPU model rotated 90 degrees on left side of monitor!');
    }, undefined, (err) => console.warn('[PC.fbx] Error loading PC.fbx model:', err));

    // 7. Ergonomic Gaming Chair (Placed in front of workstation desk, resting flush on floor Y=0)
    this.gltfLoader.load('models/gaming_chair.glb', (gltf) => {
      this.alignOnFloor(gltf.scene, 0, 1.55, 2.55, Math.PI);
      this.makeInteractive(gltf.scene, 'bookshelf', 'Ergonomic Gaming Chair', 'View Work Experience');
      console.log('[gaming_chair.glb] Gaming Chair loaded on room floor in front of workstation!');
    }, undefined, (err) => console.warn('[gaming_chair.glb] Error loading gaming chair:', err));

    // 8. Data Center Server Rack (Placed standing tall near the back wall on room floor Y=0)
    this.gltfLoader.load('models/data_center_rack.glb', (gltf) => {
      this.alignOnFloor(gltf.scene, 3.8, -7.5, 4.2, 0);
      this.makeInteractive(gltf.scene, 'skills', 'Data Center Rack', 'View Technical Matrix');
      console.log('[data_center_rack.glb] Data Center Rack loaded near back wall on room floor!');
    }, undefined, (err) => console.warn('[data_center_rack.glb] Error loading data center rack:', err));
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Subtle bloom to eliminate blue glare
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.1, 0.4, 0.85
    );
    this.composer.addPass(this.bloomPass);

    this.fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = this.renderer.getPixelRatio();
    this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (this.width * pixelRatio);
    this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (this.height * pixelRatio);
    this.composer.addPass(this.fxaaPass);
  }

  makeInteractive(object, nodeKey, title, actionText) {
    object.userData = { nodeKey, title, actionText, isInteractive: true };
    this.interactiveObjects.push(object);
  }

  focusOnNode(nodeKey) {
    const focusConfigs = {
      hero: { cam: new THREE.Vector3(13.5, 8.8, 13.5), target: new THREE.Vector3(-1.8, 3.5, -2.5) },
      backWall: { cam: new THREE.Vector3(-2.5, 6.2, 3.5), target: new THREE.Vector3(-2.5, 6.2, -8.23) },
      leftWall: { cam: new THREE.Vector3(3.5, 6.2, -0.5), target: new THREE.Vector3(-8.23, 6.2, -0.5) },
      monitors: { cam: new THREE.Vector3(0, 2.42, 1.85), target: new THREE.Vector3(0, 2.42, -0.15) },
      bookshelf: { cam: new THREE.Vector3(0, 2.0, 1.45), target: new THREE.Vector3(0, 2.0, 0) },
      skills: { cam: new THREE.Vector3(3.8, 3.2, -2.5), target: new THREE.Vector3(3.8, 3.2, -7.5) },
      phone: { cam: new THREE.Vector3(-1.05, 2.2, 1.5), target: new THREE.Vector3(-1.05, 2.2, 0.05) }
    };

    const cfg = focusConfigs[nodeKey] || focusConfigs.hero;
    this.targetCameraPos.copy(cfg.cam);
    this.targetLookAt.copy(cfg.target);
  }

  setDayNightMode(mode) {
    this.isNight = mode === 'night';
    if (this.isNight) {
      this.ambientLight.color.setHex(0x282c3f);
      this.ambientLight.intensity = 1.4;
      this.windowLight.intensity = 2.0;
      this.windowLight.color.setHex(0x5c6d9c);
      this.lampLight.intensity = 8.0;
      this.monitorLight.intensity = 4.0;
      this.rgbLight.intensity = 4.5;
      this.wallMat.color.setHex(0x1a1d2e);
      this.glassMat.color.setHex(0x00f0ff);
      if (this.bloomPass) this.bloomPass.strength = 0.85;
      this.renderer.toneMappingExposure = 1.55;
    } else {
      this.ambientLight.color.setHex(0xfffaed);
      this.ambientLight.intensity = 2.8;
      this.windowLight.intensity = 6.5;
      this.windowLight.color.setHex(0xffe6a3);
      this.lampLight.intensity = 1.5;
      this.monitorLight.intensity = 1.8;
      this.rgbLight.intensity = 1.0;
      this.wallMat.color.setHex(0x3d3932);
      this.glassMat.color.setHex(0xffbd2e);
      if (this.bloomPass) this.bloomPass.strength = 0.35;
      this.renderer.toneMappingExposure = 1.85;
    }
  }

  bindEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        const offset = this.camera.position.clone().sub(this.currentLookAt);
        this.spherical.setFromVector3(offset);

        this.spherical.theta -= deltaX * 0.005;
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.spherical.phi - deltaY * 0.005));

        offset.setFromSpherical(this.spherical);
        this.targetCameraPos.copy(this.currentLookAt).add(offset);

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      this.checkRaycastHover();
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.01;
      const offset = this.camera.position.clone().sub(this.currentLookAt);
      const newRadius = Math.max(4, Math.min(32, offset.length() + zoomFactor));
      offset.setLength(newRadius);
      this.targetCameraPos.copy(this.currentLookAt).add(offset);
    }, { passive: false });

    dom.addEventListener('click', () => {
      if (this.hoveredObject && this.callbacks.onSelectObject) {
        this.callbacks.onSelectObject(this.hoveredObject.userData);
      }
    });

    window.addEventListener('resize', () => {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
      if (this.composer) this.composer.setSize(this.width, this.height);

      if (this.fxaaPass) {
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (this.width * pixelRatio);
        this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (this.height * pixelRatio);
      }
    });
  }

  checkRaycastHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let topObject = intersects[0].object;
      while (topObject.parent && !topObject.userData.isInteractive) {
        topObject = topObject.parent;
      }
      if (topObject.userData.isInteractive) {
        if (this.hoveredObject !== topObject) {
          this.hoveredObject = topObject;
          document.body.style.cursor = 'pointer';
          if (this.callbacks.onHoverObject) {
            this.callbacks.onHoverObject(topObject.userData);
          }
        }
        return;
      }
    }

    if (this.hoveredObject) {
      this.hoveredObject = null;
      document.body.style.cursor = 'default';
      if (this.callbacks.onHoverObject) {
        this.callbacks.onHoverObject(null);
      }
    }
  }

  toggleHighFpsMode() {
    this.isHighFpsMode = !this.isHighFpsMode;
    return this.isHighFpsMode;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();
    const lerpFactor = 1.0 - Math.exp(-7.5 * delta);

    this.camera.position.lerp(this.targetCameraPos, lerpFactor);
    this.currentLookAt.lerp(this.targetLookAt, lerpFactor);
    this.camera.lookAt(this.currentLookAt);

    if (this.monitorLight) {
      this.monitorLight.intensity = (this.isNight ? 2.8 : 1.2) + Math.sin(elapsedTime * 3) * 0.4;
    }

    if (this.composer && !this.isHighFpsMode) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
