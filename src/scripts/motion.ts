import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const EASE = 'expo.out';

/**
 * Declarative scroll motion driven by data attributes:
 *  data-reveal="lines"  — masked line-by-line headline reveal
 *  data-reveal="words"  — words brighten as the block scrolls through (scrubbed)
 *  data-reveal="fade"   — soft rise + fade
 *  data-reveal="image"  — clip-path wipe with inner zoom-out
 *  data-parallax="12"   — scrubbed vertical drift (yPercent amplitude)
 *  data-stagger         — children of this element reveal in sequence
 */
export async function initMotion() {
  const root = document.documentElement;
  root.classList.add('motion-ready');

  if (prefersReducedMotion() || !root.classList.contains('motion-ok')) {
    root.classList.remove('motion-ok');
    return;
  }

  // Wait for fonts so line splitting measures correctly.
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
  } catch {
    /* ignore */
  }

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Lines
    gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
      if (el.closest('[data-hero]')) return; // hero handles its own intro
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line-inner' });
      gsap.set(el, { visibility: 'visible' });
      const pinContainer = el.closest<HTMLElement>('[data-gallery-pin]');
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 1.3,
        ease: EASE,
        stagger: 0.09,
        scrollTrigger: {
          trigger: pinContainer ? el.closest('[data-gallery]') ?? el : el,
          start: 'top 90%',
          once: true,
          fastScrollEnd: true,
        },
      });
    });

    // Words — scrubbed brightness
    gsap.utils.toArray<HTMLElement>('[data-reveal="words"]').forEach((el) => {
      const split = SplitText.create(el, { type: 'words' });
      gsap.fromTo(
        split.words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        },
      );
    });

    // Fade
    gsap.utils.toArray<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
      if (el.closest('[data-hero]')) return;
      const pinContainer = el.closest<HTMLElement>('[data-gallery-pin]');
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          ease: EASE,
          delay: Number(el.dataset.delay ?? 0),
          scrollTrigger: {
            trigger: pinContainer ? el.closest('[data-gallery]') ?? el : el,
            start: 'top 92%',
            once: true,
            fastScrollEnd: true,
          },
        },
      );
    });

    // Staggered groups
    gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
      const items = Array.from(group.children) as HTMLElement[];
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          ease: EASE,
          stagger: 0.07,
          scrollTrigger: { trigger: group, start: 'top 90%', once: true, fastScrollEnd: true },
        },
      );
    });

    // Image wipes
    gsap.utils.toArray<HTMLElement>('[data-reveal="image"]').forEach((el) => {
      const media = el.querySelector('img, video');
      const dir = el.dataset.from ?? 'bottom';
      const start =
        dir === 'left' ? 'inset(0% 100% 0% 0%)' : dir === 'right' ? 'inset(0% 0% 0% 100%)' : 'inset(100% 0% 0% 0%)';
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true, fastScrollEnd: true } });
      tl.fromTo(el, { clipPath: start }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
      if (media) tl.fromTo(media, { scale: 1.25 }, { scale: 1, duration: 2.0, ease: EASE }, 0);
    });

    // Parallax
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
      const amt = Number(el.dataset.parallax || 10);
      gsap.fromTo(
        el,
        { yPercent: -amt },
        {
          yPercent: amt,
          ease: 'none',
          scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });
  });

  // Sort triggers in DOM/priority order and refresh once everything has mounted.
  ScrollTrigger.sort();
  requestAnimationFrame(() => ScrollTrigger.refresh());

  // Refresh after all page assets finish loading (even if load already fired).
  if (document.readyState === 'complete') {
    ScrollTrigger.refresh();
  } else {
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }
}
