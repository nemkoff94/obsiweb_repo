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
    const dialog = document.createElement('dialog');
    if (typeof dialog.showModal !== 'function') return;

    dialog.className = 'project-popup';
    dialog.setAttribute('aria-label', 'Обсудить проект');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'project-popup__close';
    close.setAttribute('aria-label', 'Закрыть форму');
    close.textContent = '×';
    dialog.appendChild(close);

    const message = document.createElement('div');
    message.className = 'project-popup__message';
    message.setAttribute('role', 'status');
    dialog.appendChild(message);

    let panel = document.querySelector('.contact .form-panel');
    let loading = false;
    let opener = null;
    let previousOverflow = '';
    document.body.appendChild(dialog);

    if (panel) {
      dialog.appendChild(panel);
      message.hidden = true;
      const contactLink = document.querySelector('.contact-popup-link');
      if (contactLink) contactLink.hidden = false;
    }

    const loadForm = async (url) => {
      loading = true;
      message.hidden = false;
      message.textContent = 'Загружаем форму…';
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const source = new DOMParser().parseFromString(html, 'text/html');
        const loadedPanel = source.querySelector('.contact .form-panel');
        const form = loadedPanel && loadedPanel.querySelector('#project-form');
        if (!(loadedPanel instanceof HTMLElement) || !(form instanceof HTMLFormElement)) {
          throw new Error('Форма не найдена');
        }
        form.dataset.apiUrl = new URL(form.dataset.apiUrl, url).href;
        panel = loadedPanel;
        dialog.appendChild(panel);
        document.dispatchEvent(new CustomEvent('project-form:added', { detail: form }));
        message.hidden = true;
      } catch (error) {
        console.error('Не удалось загрузить форму проекта:', error);
        message.textContent = 'Не удалось загрузить форму. ';
        const link = document.createElement('a');
        link.href = url;
        link.textContent = 'Перейти к форме на главной странице';
        message.appendChild(link);
      } finally {
        loading = false;
      }
    };

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a.button[href="#contact"], a.text-link[href="#contact"], .case-end a.button[href="../index.html#contact"]');
      if (!link || dialog.open) return;
      event.preventDefault();
      opener = link;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      if (!panel && !loading) loadForm(link.href);
    });

    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      if (opener && opener.closest('[data-mobile-menu][hidden]')) {
        const toggle = document.querySelector('[data-menu-toggle]');
        if (toggle) toggle.focus();
      } else if (opener) {
        opener.focus();
      }
    });
  });
})();
