(() => {
  'use strict';

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  ready(() => {
    const header = document.querySelector('[data-header]');

    if (header) {
      let scheduled = false;
      const updateHeader = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
        scheduled = false;
      };

      updateHeader();
      window.addEventListener('scroll', () => {
        if (!scheduled) {
          scheduled = true;
          window.requestAnimationFrame(updateHeader);
        }
      }, { passive: true });
    }

    const renderIcons = () => {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    };

    renderIcons();
    document.addEventListener('portfolio:updated', renderIcons);
  });
})();