import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { isIntersectionVisible } from '../../motion/motionSupport';

export interface IntersectionRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  defaultInView?: boolean;
}

export function useIntersectionReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionRevealOptions = {}
): { ref: React.RefObject<T | null>; isRevealed: boolean } {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -40px 0px',
    triggerOnce = true,
    defaultInView,
  } = options;

  const reducedMotion = useReducedMotion();
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  const [isRevealed, setIsRevealed] = useState<boolean>(() => {
    if (defaultInView !== undefined) return defaultInView;
    if (reducedMotion || isTest) return true;
    return false;
  });

  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (reducedMotion || isTest) {
      setIsRevealed(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (isIntersectionVisible(entry, threshold)) {
            setIsRevealed(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsRevealed(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, reducedMotion, isTest]);

  return { ref, isRevealed };
}
