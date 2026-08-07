import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class PortfolioScene3D {
  constructor(canvasContainer, onProgressCallback, onCompleteCallback) {
    this.container = canvasContainer;
    this.onProgress = onProgressCallback;
    this.onComplete = onCompleteCallback;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollProgress = 0;
    this.dustCount = window.innerWidth < 768 ? 600 : 1200;
    this.activeMode = 'knight';

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pmremGenerator = null;
    
    // Model Group
    this.knightGroup = null;

    // Golden Dark Theme Elements
    this.darkFloor = null;
    this.goldenEmbers = null;

    // Lighting
    this.ambientLight = null;
    this.spotLight = null;
    this.goldRimLight = null;
    this.goldGlowLight = null;
    this.dirLight = null;

    this.gltfLoader = new GLTFLoader();

    // Base Y-Rotations
    this.modelYRotations = {
      knight: -Math.PI / 2
    };

    this.init();
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040507, 0.032);

    // 2. Camera Setup
    const width = window.innerWidth;
    const height = window.innerHeight;
    const fov = width < 768 ? 62 : 52;
    this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    this.camera.position.set(0, 0.5, width < 768 ? 6.5 : 5.5);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // 4. PMREM Generator for HDRI Reflections
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.buildGoldenDarkHDRIEnvironment();

    // 5. Lighting
    this.ambientLight = new THREE.AmbientLight(0x1a1408, 1.8);
    this.scene.add(this.ambientLight);

    this.spotLight = new THREE.SpotLight(0xfbe395, 20, 40, Math.PI / 4, 0.4, 1);
    this.spotLight.position.set(2.0, 8, 6);
    this.scene.add(this.spotLight);

    this.goldRimLight = new THREE.PointLight(0xd4af37, 14, 25);
    this.goldRimLight.position.set(-3.5, 3, -2);
    this.scene.add(this.goldRimLight);

    this.goldGlowLight = new THREE.PointLight(0x997a15, 10, 20);
    this.goldGlowLight.position.set(2.0, -1.8, 2);
    this.scene.add(this.goldGlowLight);

    this.dirLight = new THREE.DirectionalLight(0xfff1ca, 1.8);
    this.dirLight.position.set(2.0, 5, 8);
    this.scene.add(this.dirLight);

    // 6. Deep Dark Reflective Mirror Stage Floor Grid
    this.buildDarkStageFloor();

    // 7. Centerpiece 3D Model Group
    this.knightGroup = new THREE.Group();
    this.updateModelGroupPosition();
    this.knightGroup.visible = true;
    this.scene.add(this.knightGroup);
    
    this.loadGLTFModel('models/fallen_angel_demon_knight.glb', this.knightGroup, 'knight');

    // 8. Golden Dust Particles
    this.buildGoldenEmbers();

    // 9. Event Listeners & Touch Controls
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    
    this.animate();
  }

  updateModelGroupPosition() {
    if (!this.knightGroup) return;
    const isMobile = window.innerWidth < 768;
    this.knightGroup.position.x = isMobile ? 0 : 2.0;
    this.knightGroup.position.y = isMobile ? 0.8 : 0;
  }

  buildGoldenDarkHDRIEnvironment() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#040302');
    grad.addColorStop(0.5, '#120d05');
    grad.addColorStop(1, '#020101');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#fbe395';
    ctx.fillRect(90, 20, 110, 45);

    ctx.fillStyle = '#d4af37';
    ctx.fillRect(290, 55, 75, 35);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
    this.scene.environment = envMap;
  }

  buildDarkStageFloor() {
    const floorGeom = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      metalness: 0.94,
      roughness: 0.1,
      emissive: 0x0f0b03,
      emissiveIntensity: 0.1
    });
    this.darkFloor = new THREE.Mesh(floorGeom, floorMat);
    this.darkFloor.rotation.x = -Math.PI / 2;
    this.darkFloor.position.y = -2.2;
    this.scene.add(this.darkFloor);

    const grid = new THREE.GridHelper(60, 35, 0x997a15, 0x141006);
    grid.position.y = -2.18;
    this.scene.add(grid);
  }

  loadGLTFModel(url, targetGroup, modelKey) {
    this.gltfLoader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const isMobile = window.innerWidth < 768;
        const targetScale = isMobile ? 3.2 : 4.4;
        const scale = targetScale / (maxDim || 1);
        model.scale.set(scale, scale, scale);

        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const pivot = new THREE.Group();
        const yRot = this.modelYRotations[modelKey] !== undefined ? this.modelYRotations[modelKey] : (-Math.PI / 2);
        pivot.rotation.y = yRot;
        pivot.add(model);

        targetGroup.clear();
        targetGroup.add(pivot);

        if (this.onComplete) {
          this.onComplete();
        }
      },
      (xhr) => {
        if (xhr.lengthComputable && this.onProgress) {
          const percent = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
          this.onProgress(percent);
        }
      },
      (err) => {
        console.error(`Error loading GLTF model ${url}:`, err);
        if (this.onComplete) this.onComplete();
      }
    );
  }

  getActiveGroup() {
    return this.knightGroup;
  }

  buildGoldenEmbers() {
    if (this.goldenEmbers) {
      this.scene.remove(this.goldenEmbers);
    }
    const positions = new Float32Array(this.dustCount * 3);
    for (let i = 0; i < this.dustCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 227, 149, 1)');
    grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.4)');
    grad.addColorStop(1, 'rgba(153, 122, 21, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color: 0xfbe395,
      size: 0.12,
      map: texture,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.goldenEmbers = new THREE.Points(geometry, material);
    this.scene.add(this.goldenEmbers);
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      this.mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress;
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.fov = width < 768 ? 62 : 52;
    this.camera.aspect = width / height;
    this.camera.position.z = width < 768 ? 6.5 : 5.5;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.updateModelGroupPosition();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const time = performance.now() * 0.0012;

    if (this.goldGlowLight) {
      this.goldGlowLight.intensity = 10 + Math.sin(time * 2.0) * 2;
    }

    const activeGroup = this.getActiveGroup();
    if (activeGroup) {
      const baseY = window.innerWidth < 768 ? 0.8 : 0;
      activeGroup.position.y = baseY + Math.sin(time) * 0.14;
      activeGroup.rotation.y = this.mouse.x * 0.35;
      activeGroup.rotation.x = -this.mouse.y * 0.2;
    }

    if (this.goldenEmbers) {
      const positions = this.goldenEmbers.geometry.attributes.position.array;
      for (let i = 0; i < this.dustCount; i++) {
        positions[i * 3 + 1] += 0.005;
        if (positions[i * 3 + 1] > 14) {
          positions[i * 3 + 1] = -12;
        }
      }
      this.goldenEmbers.geometry.attributes.position.needsUpdate = true;
      this.goldenEmbers.rotation.y += 0.0002;
    }

    // Scroll Camera Positioning
    const targetZ = (window.innerWidth < 768 ? 6.5 : 5.5) - this.scrollProgress * 2.2;
    const targetY = -this.scrollProgress * 3.8;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
    this.camera.lookAt(0, targetY, 0);

    this.renderer.render(this.scene, this.camera);
  }
}
