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
    const grid = document.getElementById('portfolio-grid');
    const template = document.getElementById('portfolio-card-template');
    if (!grid || !(template instanceof HTMLTemplateElement) || projects.length === 0) return;

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
    grid.appendChild(fragment);
    document.dispatchEvent(new CustomEvent('portfolio:updated'));
  });
})();