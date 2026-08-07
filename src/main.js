import { createIcons, icons } from 'lucide';
import {
  resumeData,
  workExperience,
  activitiesAndInternships,
  projectsData,
  skillsList,
  languagesList
} from './projectsData.js';
import { PortfolioScene3D } from './scene3d.js';
import { soundManager } from './audio.js';
import { FireCursor } from './fireCursor.js';

document.addEventListener('DOMContentLoaded', () => {
  // 0. Golden Preloader — Smooth 3-Second Loading Animation
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderPercentage = document.getElementById('preloader-percentage');
  const preloaderStatus = document.getElementById('preloader-status');

  const DURATION_MS = 3000; // Exactly 3 seconds load time
  const startTime = performance.now();

  function animatePreloader(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1.0, elapsed / DURATION_MS);
    
    // Eased percentage calculation
    const currentPercent = Math.floor(progress * 100);

    if (preloaderBar) preloaderBar.style.width = `${currentPercent}%`;
    if (preloaderPercentage) preloaderPercentage.textContent = `${currentPercent}%`;

    if (progress < 0.4) {
      if (preloaderStatus) preloaderStatus.textContent = 'INITIALIZING 3D ENGINE & ASSETS...';
    } else if (progress < 0.85) {
      if (preloaderStatus) preloaderStatus.textContent = 'BUILDING SHADERS & LIGHTING...';
    } else {
      if (preloaderStatus) preloaderStatus.textContent = 'READY';
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

  // 1. Initialize Lucide Icons
  createIcons({ icons });

  // 2. Initialize 3D WebGL Engine
  const canvasContainer = document.getElementById('canvas-container');
  const scene3d = new PortfolioScene3D(canvasContainer);

  // 3. Initialize Burning Fire & Ember Cursor Engine
  const fireCursor = new FireCursor();

  // 4. Custom Glow Cursor Ring
  const cursor = document.getElementById('cursor-follower');
  if (cursor) {
    window.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });

    document.querySelectorAll('a, button, input, textarea, .project-card, .timeline-card, .skill-card-simple').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
        soundManager.playHover();
      });
      el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
  }

  // 5. Mobile Hamburger Menu Toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const menuIcon = document.getElementById('menu-icon');

  if (menuToggle && navLinks) {
    const handleMenuToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      soundManager.playClick();
      const isOpen = navLinks.classList.toggle('open');
      if (menuIcon) {
        menuIcon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
        createIcons({ icons });
      }
    };

    menuToggle.addEventListener('click', handleMenuToggle);

    // Close mobile menu when clicking any nav link
    document.querySelectorAll('.nav-link, .btn-contact-pill').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        if (menuIcon) {
          menuIcon.setAttribute('data-lucide', 'menu');
          createIcons({ icons });
        }
      });
    });
  }

  // 6. Audio Control Toggle (Syncs both Desktop & Mobile Audio Buttons)
  const audioButtons = document.querySelectorAll('#audio-btn, #audio-btn-mobile');

  const updateAudioUI = (isUnmuted) => {
    audioButtons.forEach(btn => {
      const iconBox = btn.querySelector('.audio-icon-box');
      const textEl = btn.querySelector('.audio-btn-text');

      if (isUnmuted) {
        btn.style.borderColor = 'var(--color-gold-bright)';
        btn.style.background = 'rgba(212, 175, 55, 0.25)';
        if (iconBox) {
          iconBox.innerHTML = `<i data-lucide="volume-2" class="audio-icon"></i>`;
        }
        if (textEl) textEl.textContent = 'Audio On';
      } else {
        btn.style.borderColor = 'rgba(212, 175, 55, 0.25)';
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        if (iconBox) {
          iconBox.innerHTML = `<i data-lucide="volume-x" class="audio-icon"></i>`;
        }
        if (textEl) textEl.textContent = 'Audio Off';
      }
    });
    createIcons({ icons });
  };

  audioButtons.forEach(btn => {
    const handleAudioToggle = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const isUnmuted = soundManager.toggleSound();
      updateAudioUI(isUnmuted);
    };

    btn.addEventListener('click', handleAudioToggle);
    btn.addEventListener('touchend', (e) => {
      handleAudioToggle(e);
    });
  });

  // 7. Render Work Experience List
  const experienceList = document.getElementById('experience-list');
  if (experienceList) {
    experienceList.innerHTML = workExperience.map(exp => `
      <div class="timeline-card">
        <span class="timeline-period">${exp.period}</span>
        <h4 class="timeline-title">${exp.role}</h4>
        <div class="timeline-company">${exp.company}</div>
        <p class="timeline-desc">${exp.description}</p>
      </div>
    `).join('');
  }

  // 8. Render Real Projects Grid
  const projectsGrid = document.getElementById('projects-grid');
  if (projectsGrid) {
    projectsGrid.innerHTML = projectsData.map(proj => `
      <div class="project-card">
        <div class="project-image-wrapper">
          <img src="${proj.image}" alt="${proj.title}" class="project-image" loading="lazy">
        </div>
        <div class="project-content">
          <h3 class="project-title">${proj.title}</h3>
          <p class="project-tagline">${proj.tagline}</p>
          <div class="project-tags">
            ${proj.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
          </div>
          <div class="project-footer">
            <button class="btn-outline-gold view-modal-btn" data-id="${proj.id}" style="padding: 8px 18px; font-size: 0.85rem;">
              View Details <i data-lucide="arrow-right"></i>
            </button>
            <a href="${proj.demoUrl}" target="_blank" rel="noopener" class="btn-gold-action" style="padding: 8px 18px; font-size: 0.85rem;">
              Live Link
            </a>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 9. Render Skills Grid
  const skillsGrid = document.getElementById('skills-grid');
  if (skillsGrid) {
    skillsGrid.innerHTML = skillsList.map(skill => `
      <div class="skill-card-simple">
        <div class="skill-icon-box">
          <i data-lucide="${skill.icon || 'layers'}"></i>
        </div>
        <div>
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--color-gold-bright);">${skill.name}</div>
        </div>
      </div>
    `).join('');
  }

  // 10. Render Languages List
  const languageList = document.getElementById('language-list');
  if (languageList) {
    languageList.innerHTML = languagesList.map(lang => `
      <div class="language-item">
        <i data-lucide="check-circle" style="color: var(--color-gold-bright);"></i>
        <span>${lang}</span>
      </div>
    `).join('');
  }

  createIcons({ icons });

  // 11. Project Modal Handling
  const modal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  function openProjectModal(projectId) {
    const proj = projectsData.find(p => p.id === projectId);
    if (!proj || !modalBody) return;

    soundManager.playClick();
    modalBody.innerHTML = `
      <img src="${proj.image}" alt="${proj.title}" style="width:100%; height:260px; object-fit:cover; border-radius:12px; margin-bottom:20px; border: 1px solid rgba(212,175,55,0.3);">
      <h2 style="font-family:var(--font-heading); font-size:2rem; margin-bottom:8px; color: var(--color-gold-bright);">${proj.title}</h2>
      <p style="font-size:0.95rem; color:var(--color-gold); font-weight:600; margin-bottom:16px;">${proj.category}</p>
      <p style="font-size:1.05rem; color:var(--color-text-dim); margin-bottom:20px; line-height:1.7;">${proj.description}</p>
      
      <div style="display:flex; gap:16px; flex-wrap:wrap; margin-top: 24px;">
        <a href="${proj.demoUrl}" target="_blank" rel="noopener" class="btn-gold-action">
          <i data-lucide="external-link"></i> Visit Project Link
        </a>
        <a href="${resumeData.portfolioUrl}" target="_blank" rel="noopener" class="btn-outline-gold">
          <i data-lucide="globe"></i> Official EditorX Portfolio
        </a>
      </div>
    `;
    createIcons({ icons });
    modal.classList.add('open');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-modal-btn');
    if (btn) {
      const projId = btn.getAttribute('data-id');
      openProjectModal(projId);
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

  // 12. Scroll Progress & Active Nav Link Highlight
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
    scene3d.setScrollProgress(progress);

    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let currentSection = 'hero';

    sections.forEach(sec => {
      const top = sec.offsetTop - 200;
      if (window.scrollY >= top) {
        currentSection = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });

  // 13. Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      soundManager.playClick();
      alert(`✨ Message sent successfully to ${resumeData.name}! (${resumeData.email})`);
      contactForm.reset();
    });
  }

  // 14. Fire Typing Sound Effect on Keystrokes
  document.addEventListener('keydown', (e) => {
    const tag = e.target ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) {
      if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        soundManager.playFireTyping();
      }
    }
  });
});
