/**
 * Header behaviour: transparent → solid over the hero, hide on scroll down /
 * reveal on scroll up, accessible services dropdown and mobile menu.
 */
export function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const transparent = header.dataset.transparent === 'true';
  let lastY = window.scrollY;
  let ticking = false;
  let menuOpen = false;

  const update = () => {
    const y = window.scrollY;
    const threshold = transparent ? window.innerHeight * 0.12 : 8;
    header.dataset.state = !transparent || y > threshold ? 'solid' : 'top';
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (!menuOpen) {
      if (goingDown && y > window.innerHeight * 0.6) header.dataset.hidden = 'true';
      else if (goingUp || y < 80) header.dataset.hidden = 'false';
    }
    if (Math.abs(y - lastY) > 4) lastY = y;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );
  update();

  // If focus moves into a hidden header (keyboard users), show it.
  header.addEventListener('focusin', () => (header.dataset.hidden = 'false'));

  // Services dropdown (click/keyboard; hover handled in CSS)
  header.querySelectorAll<HTMLElement>('[data-dropdown]').forEach((dd) => {
    const btn = dd.querySelector<HTMLButtonElement>('[data-dropdown-toggle]');
    if (!btn) return;
    const set = (open: boolean) => {
      dd.dataset.open = String(open);
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => set(dd.dataset.open !== 'true'));
    dd.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        set(false);
        btn.focus();
      }
    });
    dd.addEventListener('focusout', (e) => {
      if (!dd.contains(e.relatedTarget as Node)) set(false);
    });
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target as Node)) set(false);
    });
  });

  // Mobile menu
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = header.querySelector<HTMLElement>('[data-mobile-menu]');
  const label = header.querySelector<HTMLElement>('[data-menu-label]');
  if (!toggle || !menu) return;

  const setMenu = (open: boolean) => {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close' : 'Menu';
    document.documentElement.style.overflow = open ? 'hidden' : '';
    header.dataset.menu = String(open);
    if (open) {
      menu.hidden = false;
      header.dataset.hidden = 'false';
      const items = menu.querySelectorAll('.mm-item');
      items.forEach((el, i) => {
        (el as HTMLElement).animate(
          [
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 600, delay: 60 * i, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'backwards' },
        );
      });
      menu.querySelector<HTMLElement>('a')?.focus();
    } else {
      menu.hidden = true;
    }
  };

  toggle.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches && menuOpen) setMenu(false);
  });
}
