(() => {
  'use strict';

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  // Configure data-api-url on #project-form with the actual endpoint.
  // The endpoint must accept POST JSON; an HTTP 2xx response means success.
  // Without an endpoint no request is sent and the user's data stays in the form.
  const sendProject = async (endpoint, payload) => {
    if (!endpoint) throw new Error('not-configured');

    let url;
    try {
      url = new URL(endpoint, window.location.href);
    } catch (_) {
      throw new Error('not-configured');
    }

    const localHttp = url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password) {
      throw new Error('not-configured');
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        redirect: 'error',
        signal: controller.signal
      });
      if (!response.ok) throw new Error('http-error');
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const initForm = (form) => {
    if (!(form instanceof HTMLFormElement)) return;

    let status = form.querySelector('[data-form-status]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('data-form-status', '');
      form.appendChild(status);
    }
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    const fields = ['name', 'contact', 'projectType', 'message', 'consent'];
    const controls = {};
    for (const name of fields) {
      const control = form.elements.namedItem(name);
      if (!(control instanceof HTMLElement) || !('value' in control)) {
        // Never allow a broken integration to fall back to a native form submission.
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          status.textContent = 'Форма временно недоступна. Пожалуйста, свяжитесь с нами другим способом.';
        });
        form.noValidate = true;
        return;
      }
      controls[name] = control;
    }

    const submit = form.querySelector('button:not([type]), button[type="submit"], input[type="submit"], input[type="image"]');
    let sending = false;

    // Native validation is replaced only after all expected controls are found.
    form.noValidate = true;
    if (submit) submit.disabled = false;

    const setStatus = (message) => {
      status.textContent = message;
    };

    const setError = (name, message) => {
      const control = controls[name];
      const error = form.querySelector(`[data-error-for="${name}"]`);
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');

      if (error) {
        if (!error.id) error.id = `project-form-error-${name}`;
        const describedBy = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (!describedBy.includes(error.id)) describedBy.push(error.id);
        control.setAttribute('aria-describedby', describedBy.join(' '));
        error.textContent = message;
      }
    };

    const validate = () => {
      const values = {
        name: controls.name.value.trim(),
        contact: controls.contact.value.trim(),
        projectType: controls.projectType.value.trim(),
        message: controls.message.value.trim(),
        consent: controls.consent instanceof HTMLInputElement && controls.consent.type === 'checkbox' && controls.consent.checked
      };
      const errors = {
        name: !values.name ? 'Укажите ваше имя.' : values.name.length > 100 ? 'Имя должно содержать не более 100 символов.' : '',
        contact: !values.contact ? 'Укажите способ связи.' : values.contact.length > 200 ? 'Контакт должен содержать не более 200 символов.' : controls.contact.validity && controls.contact.validity.typeMismatch ? 'Укажите корректный контакт.' : '',
        projectType: !values.projectType ? 'Выберите тип проекта.' : values.projectType.length > 200 ? 'Тип проекта слишком длинный.' : '',
        message: !values.message ? 'Расскажите о проекте.' : values.message.length > 5000 ? 'Сообщение должно содержать не более 5000 символов.' : '',
        consent: !values.consent ? 'Необходимо согласие на обработку данных.' : ''
      };

      fields.forEach((name) => setError(name, errors[name]));
      const firstInvalid = fields.find((name) => errors[name]);
      if (firstInvalid) {
        setStatus('Проверьте заполнение формы.');
        controls[firstInvalid].focus();
        return null;
      }
      return values;
    };

    fields.forEach((name) => {
      const eventName = name === 'consent' || controls[name].tagName === 'SELECT' ? 'change' : 'input';
      controls[name].addEventListener(eventName, () => {
        if (controls[name].getAttribute('aria-invalid') === 'true') setError(name, '');
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (sending) return;

      const payload = validate();
      if (!payload) return;

      sending = true;
      const wasDisabled = submit ? submit.disabled : false;
      const disabledStates = fields.map((name) => controls[name].disabled);
      fields.forEach((name) => { controls[name].disabled = true; });
      if (submit) submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      setStatus('Отправляем заявку…');

      try {
        await sendProject((form.dataset.apiUrl || '').trim(), payload);
        form.reset();
        fields.forEach((name) => setError(name, ''));
        setStatus('Заявка принята к отправке. Спасибо!');
      } catch (error) {
        if (error && error.message === 'not-configured') {
          setStatus('Отправка заявок пока не настроена. Пожалуйста, свяжитесь с нами другим способом.');
        } else {
          setStatus('Не удалось подтвердить отправку заявки. Проверьте соединение и попробуйте ещё раз.');
        }
      } finally {
        sending = false;
        fields.forEach((name, index) => { controls[name].disabled = disabledStates[index]; });
        if (submit) submit.disabled = wasDisabled;
        form.removeAttribute('aria-busy');
      }
    });
  };

  ready(() => {
    initForm(document.getElementById('project-form'));
    document.addEventListener('project-form:added', (event) => {
      initForm(event.detail);
    });
  });
})();