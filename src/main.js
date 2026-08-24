import { createIcons, icons } from 'lucide';
import {
  resumeData,
  workExperience,
  activitiesAndInternships,
  projectsData,
  skillsList,
  languagesList
} from './projectsData.js';
import { VirtualRoomScene } from './virtualRoomScene.js';
import { soundManager } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  // Spatial Cards & Tooltip Elements
  const roomTooltip = document.getElementById('room-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipAction = document.getElementById('tooltip-action');
  const daynightBtn = document.getElementById('daynight-btn');
  const daynightIcon = document.getElementById('daynight-icon');
  const daynightText = document.getElementById('daynight-text');
  const spatialCards = document.querySelectorAll('.spatial-card');
  const navBtns = document.querySelectorAll('.nav-btn');

  let isNight = false;

  // 0. Initialize 3D Virtual Room Engine
  const roomContainer = document.getElementById('virtual-room-container');
  let roomScene = null;

  if (roomContainer) {
    roomScene = new VirtualRoomScene(roomContainer, {
      onHoverObject: (data) => {
        if (data && roomTooltip) {
          if (tooltipTitle) tooltipTitle.textContent = data.title;
          if (tooltipAction) tooltipAction.textContent = data.actionText;
          roomTooltip.classList.remove('hidden');
        } else if (roomTooltip) {
          roomTooltip.classList.add('hidden');
        }
      },
      onSelectObject: (data) => {
        if (!data) return;
        playBeep(620, 'sine', 0.12);

        if (data.nodeKey === 'lamp') {
          toggleDayNightMode();
        } else {
          activateSpatialNode(data.nodeKey);
        }
      }
    });
  }

  function activateSpatialNode(nodeKey) {
    if (roomScene) {
      roomScene.focusOnNode(nodeKey);
    }

    // Toggle active card
    spatialCards.forEach(card => card.classList.remove('active'));
    const targetCard = document.getElementById(`card-${nodeKey}`);
    if (targetCard) {
      targetCard.classList.add('active');
    } else {
      const heroCard = document.getElementById('card-hero');
      if (heroCard) heroCard.classList.add('active');
    }

    // Toggle active nav button
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.node === nodeKey);
    });

    playBeep(520, 'sine', 0.1);
  }

  // Bind Nav Buttons
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nodeKey = btn.dataset.node || 'hero';
      activateSpatialNode(nodeKey);
    });
  });

  const logoBrand = document.getElementById('nav-brand-logo');
  if (logoBrand) {
    logoBrand.addEventListener('click', (e) => {
      e.preventDefault();
      activateSpatialNode('hero');
    });
  }

  function toggleDayNightMode() {
    isNight = !isNight;
    const mode = isNight ? 'night' : 'day';

    if (roomScene) roomScene.setDayNightMode(mode);
    document.body.className = `${mode}-mode spatial-portfolio-mode`;

    if (daynightIcon) daynightIcon.setAttribute('data-lucide', isNight ? 'moon' : 'sun');
    if (daynightText) daynightText.textContent = isNight ? 'Night Mode' : 'Day Mode';
    createIcons({ icons });

    playBeep(isNight ? 440 : 880, 'triangle', 0.15);
  }

  if (daynightBtn) {
    daynightBtn.addEventListener('click', toggleDayNightMode);
  }

  // 1. Golden Preloader Timer
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderPercentage = document.getElementById('preloader-percentage');
  const preloaderStatus = document.getElementById('preloader-status');

  const DURATION_MS = 2400;
  const startTime = performance.now();

  function animatePreloader(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1.0, elapsed / DURATION_MS);
    const currentPercent = Math.floor(progress * 100);

    if (preloaderBar) preloaderBar.style.width = `${currentPercent}%`;
    if (preloaderPercentage) preloaderPercentage.textContent = `${currentPercent}%`;

    if (progress < 0.4) {
      if (preloaderStatus) preloaderStatus.textContent = 'EMBEDDING PORTFOLIO CONTENT INTO 3D MODEL...';
    } else if (progress < 0.85) {
      if (preloaderStatus) preloaderStatus.textContent = 'BUILDING SPATIAL CARDS & SHADERS...';
    } else {
      if (preloaderStatus) preloaderStatus.textContent = 'INTERACTIVE 3D MODEL READY';
    }

    if (progress < 1.0) {
      requestAnimationFrame(animatePreloader);
    } else {
      setTimeout(() => {
        if (preloader) preloader.classList.add('fade-out');
      }, 300);
    }
  }

  requestAnimationFrame(animatePreloader);

  // 2. Initialize Lucide Icons
  createIcons({ icons });

  // 3. Audio Engine
  let audioEnabled = false;
  let audioCtx = null;

  function playBeep(freq = 440, type = 'sine', duration = 0.1) {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  const audioButtons = document.querySelectorAll('#audio-btn, #audio-btn-mobile');
  audioButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      audioEnabled = !audioEnabled;
      
      audioButtons.forEach(b => {
        const textEl = b.querySelector('.audio-btn-text');
        const iconBox = b.querySelector('.audio-icon-box');
        if (audioEnabled) {
          b.style.borderColor = 'var(--color-gold-bright)';
          b.style.background = 'rgba(212, 175, 55, 0.25)';
          if (iconBox) iconBox.innerHTML = `<i data-lucide="volume-2"></i>`;
          if (textEl) textEl.textContent = 'Audio On';
        } else {
          b.style.borderColor = 'rgba(212, 175, 55, 0.25)';
          b.style.background = 'rgba(212, 175, 55, 0.1)';
          if (iconBox) iconBox.innerHTML = `<i data-lucide="volume-x"></i>`;
          if (textEl) textEl.textContent = 'Audio Off';
        }
      });
      createIcons({ icons });

      if (audioEnabled) playBeep(580, 'sine', 0.15);
    });
  });

  // 4. Render Work Experience List
  const experienceList = document.getElementById('experience-list');
  if (experienceList) {
    experienceList.innerHTML = workExperience.map(exp => `
      <div class="timeline-card">
        <span class="timeline-period">${exp.period}</span>
        <h3 class="timeline-title">${exp.role}</h3>
        <div class="timeline-company">${exp.company}</div>
        <p class="timeline-desc">${exp.description}</p>
      </div>
    `).join('');
  }

  // 5. Render Featured Projects Grid
  const projectsGrid = document.getElementById('projects-grid');
  if (projectsGrid) {
    projectsGrid.innerHTML = projectsData.map(proj => `
      <div class="project-card">
        <h3 class="project-title">${proj.title}</h3>
        <p class="project-tagline">${proj.tagline}</p>
        <div class="project-tags">
          ${proj.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
        </div>
        <div class="project-footer">
          <button class="btn-outline-gold view-modal-btn" data-id="${proj.id}" style="padding: 5px 12px; font-size: 0.8rem;">
            Details <i data-lucide="arrow-right"></i>
          </button>
          <a href="${proj.demoUrl}" target="_blank" rel="noopener" class="btn-gold-action" style="padding: 5px 12px; font-size: 0.8rem;">
            Live Link
          </a>
        </div>
      </div>
    `).join('');
  }

  // 6. Render Skills Grid
  const skillsGrid = document.getElementById('skills-grid');
  if (skillsGrid) {
    skillsGrid.innerHTML = skillsList.map(skill => `
      <div class="skill-card-simple">
        <div>${skill.name}</div>
      </div>
    `).join('');
  }

  // 7. Render Languages
  const languageList = document.getElementById('language-list');
  if (languageList) {
    languageList.innerHTML = languagesList.map(lang => `
      <div class="language-item">
        <i data-lucide="check-circle-2" style="color: var(--color-gold-bright);"></i>
        <span>${lang}</span>
      </div>
    `).join('');
  }

  createIcons({ icons });

  // 8. Project Modal Handling
  const modal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  function openProjectModal(projectId) {
    const proj = projectsData.find(p => p.id === projectId);
    if (!proj || !modalBody) return;

    playBeep(520, 'sine', 0.1);
    modalBody.innerHTML = `
      <img src="${proj.image}" alt="${proj.title}" style="width:100%; height:240px; object-fit:cover; border-radius:12px; margin-bottom:1rem; border: 1px solid rgba(212,175,55,0.3);">
      <h2 style="font-family:var(--font-serif); font-size:1.7rem; margin-bottom:4px; color: var(--color-gold-bright);">${proj.title}</h2>
      <p style="font-size:0.85rem; color:var(--color-gold); font-weight:600; margin-bottom:10px;">${proj.category}</p>
      <p style="font-size:0.95rem; color:var(--text-secondary); margin-bottom:1.25rem; line-height:1.6;">${proj.description}</p>
      
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a href="${proj.demoUrl}" target="_blank" rel="noopener" class="btn-gold-action">
          <i data-lucide="external-link"></i> Visit Live Project
        </a>
        <a href="${resumeData.portfolioUrl}" target="_blank" rel="noopener" class="btn-outline-gold">
          <i data-lucide="globe"></i> EditorX Profile
        </a>
      </div>
    `;
    createIcons({ icons });
    if (modal) modal.classList.add('open');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-modal-btn');
    if (btn) {
      openProjectModal(btn.getAttribute('data-id'));
    }
  });

  if (modalClose) {
    modalClose.addEventListener('click', () => modal.classList.remove('open'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  // 9. Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      playBeep(700, 'sine', 0.2);
      alert(`✨ Message sent to ${resumeData.name} (${resumeData.email}).`);
      contactForm.reset();
    });
  }
});
