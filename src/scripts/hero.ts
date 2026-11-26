import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from './motion';

const HOLD = 6.5; // seconds each scene is held
const FADE = 1.8; // crossfade duration
const DRIFT = HOLD + FADE + 0.6; // Ken Burns duration (outlives the hold to avoid stalls)

/** Cinematic hero: image-sequence crossfades with Ken Burns drift, entrance, scroll-out. */
export function initHero() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;

  const reduced = prefersReducedMotion();
  const slides = gsap.utils.toArray<HTMLElement>('[data-hero-slide]', hero);
  const bars = gsap.utils.toArray<HTMLElement>('[data-hero-bar]', hero);
  const caption = hero.querySelector<HTMLElement>('[data-hero-caption]');
  const count = hero.querySelector<HTMLElement>('[data-hero-count]');
  const video = hero.querySelector<HTMLVideoElement>('[data-hero-videoel]');

  // Reduced motion: static first frame (the server-rendered fallback), paused video.
  if (reduced) {
    video?.pause();
    bars[0] && gsap.set(bars[0], { scaleX: 1 });
    return;
  }

  /* ---------- Entrance ---------- */
  const intro = async () => {
    const title = hero.querySelector<HTMLElement>('[data-hero-title]');
    const introEls = gsap.utils.toArray<HTMLElement>('[data-hero-intro]', hero);
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]);
    } catch {
      /* noop */
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('[data-hero-media]', { scale: 1.08 }, { scale: 1, duration: 2.6, ease: 'power3.out' }, 0);
    if (title) {
      const split = SplitText.create(title.querySelectorAll('span'), { type: 'lines', mask: 'lines' });
      gsap.set(title, { visibility: 'visible' });
      tl.from(split.lines, { yPercent: 115, duration: 1.6, stagger: 0.12 }, 0.15);
    }
    tl.fromTo(introEls, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.4, stagger: 0.12 }, 0.65);
  };
  intro();

  /* ---------- Scroll-out parallax ---------- */
  gsap.to('[data-hero-media]', {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('[data-hero-content]', {
    yPercent: -12,
    autoAlpha: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: '35% top', end: 'bottom top', scrub: true },
  });

  if (video || slides.length < 2) return;

  /* ---------- Image sequence ---------- */
  let current = 0;
  let timer: gsap.core.Tween | null = null;
  let barTween: gsap.core.Tween | null = null;
  const imgs = slides.map((s) => s.querySelector<HTMLElement>('img')!);
  // Alternate drift direction and zoom origin for variety without randomness.
  const moves = [
    { from: { scale: 1.16, xPercent: 2.5, yPercent: 0 }, to: { scale: 1.04, xPercent: -1.5, yPercent: 0 } },
    { from: { scale: 1.04, xPercent: -2, yPercent: 1 }, to: { scale: 1.14, xPercent: 1.5, yPercent: -1 } },
    { from: { scale: 1.15, xPercent: 0, yPercent: -2 }, to: { scale: 1.05, xPercent: -2, yPercent: 1 } },
    { from: { scale: 1.05, xPercent: 2, yPercent: 0 }, to: { scale: 1.15, xPercent: -1, yPercent: 0 } },
  ];

  const drift = (i: number) => {
    const m = moves[i % moves.length];
    gsap.fromTo(imgs[i], m.from, { ...m.to, duration: DRIFT, ease: 'none', overwrite: true });
  };

  const setCaption = (i: number) => {
    if (count) count.textContent = String(i + 1).padStart(2, '0');
    if (!caption) return;
    gsap
      .timeline()
      .to(caption, { yPercent: -110, duration: 0.5, ease: 'power3.in' })
      .add(() => {
        caption.textContent = slides[i].dataset.caption ?? '';
      })
      .fromTo(caption, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' });
  };

  const runBar = (i: number) => {
    bars.forEach((b, j) => {
      if (j < i) gsap.set(b, { scaleX: 1, transformOrigin: 'left' });
      else if (j > i) gsap.set(b, { scaleX: 0, transformOrigin: 'left' });
    });
    if (i === 0) bars.forEach((b, j) => j > 0 && gsap.set(b, { scaleX: 0 }));
    barTween = gsap.fromTo(bars[i], { scaleX: 0 }, { scaleX: 1, duration: HOLD + FADE * 0.5, ease: 'none' });
  };

  const show = (next: number) => {
    const prev = slides[current];
    const incoming = slides[next];
    gsap.set(incoming, { zIndex: 2 });
    gsap.set(prev, { zIndex: 1 });
    drift(next);
    gsap.fromTo(incoming, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE, ease: 'power2.inOut' });
    gsap.to(prev, { autoAlpha: 0, duration: FADE, delay: FADE * 0.6, ease: 'power1.in' });
    current = next;
    setCaption(next);
    runBar(next);
    schedule();
  };

  const schedule = () => {
    timer?.kill();
    timer = gsap.delayedCall(HOLD, () => show((current + 1) % slides.length));
  };

  // Start
  gsap.set(slides, { autoAlpha: 0, zIndex: 0 });
  gsap.set(slides[0], { autoAlpha: 1, zIndex: 2 });
  drift(0);
  runBar(0);
  schedule();

  // Pause when the hero is off-screen or the tab is hidden (saves CPU/GPU).
  let visible = true;
  const playState = () => {
    const run = visible && document.visibilityState === 'visible';
    const tweens = [timer, barTween, ...imgs.flatMap((im) => gsap.getTweensOf(im))];
    tweens.forEach((t) => (run ? t?.resume() : t?.pause()));
  };
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onToggle: (self) => {
      visible = self.isActive;
      playState();
    },
  });
  document.addEventListener('visibilitychange', playState);
}
