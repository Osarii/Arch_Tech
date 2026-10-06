import { useEffect, useState } from 'react';

export interface ScrollProgressState {
  progress: number;
  scrollY: number;
  isScrolled: boolean;
  scrollDirection: 'up' | 'down';
}

export function useScrollProgress(containerSelector: string = '[data-landing-scroll-container]'): ScrollProgressState {
  const [state, setState] = useState<ScrollProgressState>({
    progress: 0,
    scrollY: 0,
    isScrolled: false,
    scrollDirection: 'up',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetEl: HTMLElement | Window = window;
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (container) {
      targetEl = container;
    }

    let lastScrollY = 0;
    let ticking = false;

    const calculateScroll = () => {
      let currentScrollY = 0;
      let maxScroll = 0;

      if (targetEl instanceof HTMLElement) {
        currentScrollY = targetEl.scrollTop;
        maxScroll = targetEl.scrollHeight - targetEl.clientHeight;
      } else {
        currentScrollY = window.scrollY || document.documentElement.scrollTop;
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      }

      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, currentScrollY / maxScroll)) : 0;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      const isScrolled = currentScrollY > 30;

      lastScrollY = currentScrollY;

      setState({
        progress,
        scrollY: currentScrollY,
        isScrolled,
        scrollDirection: direction,
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(calculateScroll);
        ticking = true;
      }
    };

    targetEl.addEventListener('scroll', onScroll, { passive: true });
    // Initial measure
    calculateScroll();

    return () => {
      targetEl.removeEventListener('scroll', onScroll);
    };
  }, [containerSelector]);

  return state;
}
