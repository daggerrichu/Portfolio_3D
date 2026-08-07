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

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  createIcons({ icons });

  // 2. Initialize 3D WebGL Engine
  const canvasContainer = document.getElementById('canvas-container');
  const scene3d = new PortfolioScene3D(canvasContainer);

  // 3. Custom Glow Cursor Ring
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

  // 4. Mobile Hamburger Menu Toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const menuIcon = document.getElementById('menu-icon');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      soundManager.playClick();
      const isOpen = navLinks.classList.toggle('open');
      if (menuIcon) {
        menuIcon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
        createIcons({ icons });
      }
    });

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

  // 5. Audio Control Toggle
  const audioBtn = document.getElementById('audio-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const isUnmuted = soundManager.toggleSound();
      if (isUnmuted) {
        audioBtn.style.borderColor = 'var(--color-gold-bright)';
        audioBtn.innerHTML = `<i data-lucide="volume-2"></i> Audio On`;
      } else {
        audioBtn.style.borderColor = 'rgba(212, 175, 55, 0.25)';
        audioBtn.innerHTML = `<i data-lucide="volume-x"></i> Audio Off`;
      }
      createIcons({ icons });
    });
  }

  // 6. Render Work Experience List
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

  // 7. Render Real Projects Grid
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

  // 8. Render Skills Grid
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

  // 9. Render Languages List
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

  // 10. Project Modal Handling
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

  // 11. Scroll Progress & Active Nav Link Highlight
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

  // 12. Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      soundManager.playClick();
      alert(`✨ Message sent successfully to ${resumeData.name}! (${resumeData.email})`);
      contactForm.reset();
    });
  }
});
