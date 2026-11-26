(() => {
  'use strict';

  // Add real projects only. Fields: title, description, category, sphere, image, imageAlt, url.
  const projects = [];

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  const safeUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['https:', 'http:', 'file:'].includes(url.protocol) ? url.href : null;
    } catch (_) {
      return null;
    }
  };

  ready(() => {
    const slider = document.getElementById('portfolio-slider');
    const template = document.getElementById('portfolio-card-template');
    if (!slider || !(template instanceof HTMLTemplateElement)) return;

    const fragment = document.createDocumentFragment();
    projects.forEach((project) => {
      const card = template.content.cloneNode(true);
      ['title', 'description', 'category', 'sphere'].forEach((field) => {
        const element = card.querySelector(`[data-project-${field}]`);
        if (element) {
          element.textContent = typeof project[field] === 'string' ? project[field].trim() : '';
          element.hidden = !element.textContent;
        }
      });

      const image = card.querySelector('[data-project-image]');
      if (image instanceof HTMLImageElement) {
        const src = safeUrl(project.image);
        image.alt = typeof project.imageAlt === 'string' && project.imageAlt.trim()
          ? project.imageAlt.trim()
          : (typeof project.title === 'string' ? project.title.trim() : '');
        if (src) image.src = src;
        else image.removeAttribute('src');
        image.hidden = !src;
      }

      const link = card.querySelector('[data-project-link]');
      if (link instanceof HTMLAnchorElement) {
        const href = safeUrl(project.url);
        if (href) {
          link.href = href;
          if (typeof project.title === 'string' && project.title.trim()) {
            link.setAttribute('aria-label', `Смотреть проект «${project.title.trim()}»`);
          }
          if (link.target === '_blank') link.rel = 'noopener noreferrer';
        } else {
          link.removeAttribute('href');
          link.hidden = true;
        }
      }
      fragment.appendChild(card);
    });

    // Keep statically rendered projects visible, including when JavaScript is unavailable.
    slider.appendChild(fragment);
    if (projects.length) document.dispatchEvent(new CustomEvent('portfolio:updated'));

    const controls = document.querySelector('.portfolio-slider-controls');
    const prev = document.querySelector('[data-portfolio-prev]');
    const next = document.querySelector('[data-portfolio-next]');
    if (!(controls instanceof HTMLElement) || !(prev instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement)) return;

    const updateControls = () => {
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      controls.hidden = maxScroll <= 1;
      prev.disabled = slider.scrollLeft <= 1;
      next.disabled = slider.scrollLeft >= maxScroll - 1;
    };
    const scrollCard = (direction) => {
      const card = slider.querySelector('.portfolio-card');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(slider).columnGap) || 0;
      slider.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap) });
    };

    prev.addEventListener('click', () => scrollCard(-1));
    next.addEventListener('click', () => scrollCard(1));
    slider.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);
    updateControls();
  });
})();