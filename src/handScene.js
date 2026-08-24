import * as THREE from 'three';

export class HandDrippingGoldScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 18);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.clock = new THREE.Clock();

    this.drips = [];
    this.hueShift = 45; // Default gold
    this.isNightMode = true;

    this.initLighting();
    this.createGoldHandSculpture();
    this.createLiquidDrips();
    this.createBackgroundGlow();
    this.bindEvents();
    this.animate();
  }

  initLighting() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffdf00, 0.5);
    this.scene.add(this.ambientLight);

    // Key Light
    this.keyLight = new THREE.DirectionalLight(0xffe680, 2.5);
    this.keyLight.position.set(10, 15, 12);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.scene.add(this.keyLight);

    // Fill Light
    this.fillLight = new THREE.DirectionalLight(0x7000ff, 1.2);
    this.fillLight.position.set(-12, -10, -8);
    this.scene.add(this.fillLight);

    // Point Light
    this.pointLight = new THREE.PointLight(0xffdf00, 3, 30);
    this.pointLight.position.set(0, 2, 6);
    this.scene.add(this.pointLight);
  }

  createGoldHandSculpture() {
    this.handGroup = new THREE.Group();

    // High Gloss Metallic Gold Material
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
      envMapIntensity: 2.0
    });

    // Palm / Hand Base Geometry
    const palmGeo = new THREE.CylinderGeometry(1.8, 1.3, 3.2, 32);
    const palmMesh = new THREE.Mesh(palmGeo, this.goldMaterial);
    palmMesh.rotation.z = -0.2;
    palmMesh.rotation.x = 0.3;
    palmMesh.position.set(0, -0.5, 0);
    palmMesh.castShadow = true;
    palmMesh.receiveShadow = true;
    this.handGroup.add(palmMesh);

    // Wrist Base
    const wristGeo = new THREE.CylinderGeometry(1.2, 1.5, 2.5, 32);
    const wristMesh = new THREE.Mesh(wristGeo, this.goldMaterial);
    wristMesh.position.set(-0.6, -2.8, -0.4);
    wristMesh.rotation.z = -0.3;
    this.handGroup.add(wristMesh);

    // 5 Fingers
    const fingerConfigs = [
      { x: -1.3, y: 1.6, z: 0.2, len: 2.2, rotZ: 0.3, rotX: 0.2 },
      { x: -0.7, y: 1.9, z: 0.4, len: 2.8, rotZ: 0.1, rotX: 0.4 },
      { x: 0.0,  y: 2.2, z: 0.5, len: 3.1, rotZ: 0.0, rotX: 0.45 },
      { x: 0.7,  y: 2.0, z: 0.4, len: 2.7, rotZ: -0.1, rotX: 0.4 },
      { x: 1.3,  y: 1.6, z: 0.2, len: 2.1, rotZ: -0.25, rotX: 0.3 }
    ];

    this.fingerTips = [];

    fingerConfigs.forEach(cfg => {
      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(cfg.x, cfg.y, cfg.z);
      fingerGroup.rotation.z = cfg.rotZ;
      fingerGroup.rotation.x = cfg.rotX;

      const seg1Geo = new THREE.CylinderGeometry(0.32, 0.38, cfg.len * 0.45, 16);
      const seg1 = new THREE.Mesh(seg1Geo, this.goldMaterial);
      seg1.position.y = cfg.len * 0.22;
      fingerGroup.add(seg1);

      const seg2Geo = new THREE.CylinderGeometry(0.26, 0.32, cfg.len * 0.35, 16);
      const seg2 = new THREE.Mesh(seg2Geo, this.goldMaterial);
      seg2.position.y = cfg.len * 0.58;
      seg2.rotation.x = 0.2;
      fingerGroup.add(seg2);

      const tipGeo = new THREE.SphereGeometry(0.26, 16, 16);
      const tipMesh = new THREE.Mesh(tipGeo, this.goldMaterial);
      const tipY = cfg.len * 0.85;
      tipMesh.position.set(0, tipY, 0.1);
      fingerGroup.add(tipMesh);

      this.handGroup.add(fingerGroup);
      this.fingerTips.push(fingerGroup);
    });

    this.handGroup.position.set(0, 0.5, 0);
    this.scene.add(this.handGroup);
  }

  createLiquidDrips() {
    this.dripGroup = new THREE.Group();
    const dripGeo = new THREE.SphereGeometry(0.18, 16, 16);

    for (let i = 0; i < 24; i++) {
      const dripMesh = new THREE.Mesh(dripGeo, this.goldMaterial);
      const sourceFingerIndex = i % 5;
      const finger = this.fingerTips[sourceFingerIndex];
      
      dripMesh.position.set(
        finger.position.x + (Math.random() - 0.5) * 0.3,
        finger.position.y + 1.5 - Math.random() * 0.5,
        finger.position.z + (Math.random() - 0.5) * 0.3
      );
      dripMesh.scale.set(1, 1.4, 1);
      
      this.drips.push({
        mesh: dripMesh,
        startY: dripMesh.position.y,
        speed: 0.03 + Math.random() * 0.04,
        scaleY: 1.2 + Math.random() * 0.6,
        fingerIndex: sourceFingerIndex
      });

      this.dripGroup.add(dripMesh);
    }

    const poolGeo = new THREE.CylinderGeometry(4.5, 5.0, 0.3, 32);
    const poolMesh = new THREE.Mesh(poolGeo, this.goldMaterial);
    poolMesh.position.set(0, -5.5, 0);
    poolMesh.receiveShadow = true;
    this.scene.add(poolMesh);

    this.scene.add(this.dripGroup);
  }

  createBackgroundGlow() {
    const bgGeo = new THREE.PlaneGeometry(35, 25);
    this.bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x120e06,
      side: THREE.DoubleSide
    });
    const bgMesh = new THREE.Mesh(bgGeo, this.bgMaterial);
    bgMesh.position.z = -10;
    this.scene.add(bgMesh);
  }

  setDayNightMode(mode) {
    this.isNightMode = mode === 'night';
    if (this.isNightMode) {
      this.ambientLight.intensity = 0.4;
      this.keyLight.intensity = 2.2;
      this.keyLight.color.setHex(0xffe680);
      this.fillLight.color.setHex(0x7000ff);
      this.bgMaterial.color.setHex(0x0a0805);
      this.renderer.toneMappingExposure = 1.1;
    } else {
      // Day Mode - Bright Daylight Virtual Office Room Lighting
      this.ambientLight.intensity = 1.2;
      this.keyLight.intensity = 3.5;
      this.keyLight.color.setHex(0xffffff);
      this.fillLight.color.setHex(0x00f0ff);
      this.bgMaterial.color.setHex(0x2a2418);
      this.renderer.toneMappingExposure = 1.5;
    }
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    if (this.handGroup) {
      this.handGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.15 + this.mouseX * 0.35;
      this.handGroup.rotation.x = Math.cos(elapsedTime * 0.4) * 0.1 + this.mouseY * 0.25;
      this.handGroup.position.y = 0.3 + Math.sin(elapsedTime * 1.2) * 0.15;
    }

    this.drips.forEach(drip => {
      drip.mesh.position.y -= drip.speed;
      const fallDistance = drip.startY - drip.mesh.position.y;
      drip.mesh.scale.y = 1 + fallDistance * 0.2;
      drip.mesh.scale.x = Math.max(0.4, 1 - fallDistance * 0.05);
      drip.mesh.scale.z = drip.mesh.scale.x;

      if (drip.mesh.position.y < -5.2) {
        const finger = this.fingerTips[drip.fingerIndex];
        drip.mesh.position.set(
          finger.position.x + (Math.random() - 0.5) * 0.4,
          finger.position.y + 1.2,
          finger.position.z + (Math.random() - 0.5) * 0.4
        );
        drip.mesh.scale.set(1, 1, 1);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}
