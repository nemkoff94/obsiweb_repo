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
    const gsap = window.gsap;
    if (!gsap || typeof gsap.from !== 'function') return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animated = new WeakSet();
    const active = new Set();
    const scrollTrigger = window.ScrollTrigger;
    if (scrollTrigger && typeof gsap.registerPlugin === 'function') {
      gsap.registerPlugin(scrollTrigger);
    }

    const animate = () => {
      if (motion.matches) return;
      const targets = document.querySelectorAll('[data-reveal], [data-stagger]');
      targets.forEach((target) => {
        if (animated.has(target)) return;
        const items = target.hasAttribute('data-stagger')
          ? Array.from(target.children)
          : [target];
        if (!items.length) return;
        animated.add(target);

        const options = {
          opacity: 0,
          y: 16,
          duration: 0.6,
          ease: 'power2.out',
          stagger: items.length > 1 ? 0.08 : 0,
          clearProps: 'opacity,transform'
        };
        if (scrollTrigger) {
          options.scrollTrigger = { trigger: target, start: 'top 90%', once: true };
        }
        const tween = gsap.from(items, options);
        active.add(tween);
      });
    };

    const onMotionChange = () => {
      if (motion.matches) {
        active.forEach((tween) => {
          if (tween.scrollTrigger) tween.scrollTrigger.kill();
          tween.progress(1).kill();
        });
        active.clear();
      } else {
        animate();
      }
    };

    animate();
    document.addEventListener('portfolio:updated', animate);
    if (typeof motion.addEventListener === 'function') motion.addEventListener('change', onMotionChange);
    else if (typeof motion.addListener === 'function') motion.addListener(onMotionChange);
  });
})();