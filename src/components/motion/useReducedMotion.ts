import { useEffect, useState } from 'react';

/**
 * Hook to detect reduced motion preference.
 * Synchronizes with both system `prefers-reduced-motion` and
 * the ARCH_TECH portal accessibility setting (`portal-reduce-motion` on <html>).
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const portalClass = document.documentElement?.classList?.contains('portal-reduce-motion') ?? false;
    return media || portalClass;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateFromMedia = () => {
      const media = mediaQuery?.matches ?? false;
      const portalClass = document.documentElement?.classList?.contains('portal-reduce-motion') ?? false;
      setReducedMotion(media || portalClass);
    };

    mediaQuery?.addEventListener?.('change', updateFromMedia);

    // Watch for .portal-reduce-motion class toggling on <html>
    const observer = new MutationObserver(() => {
      const media = mediaQuery?.matches ?? false;
      const portalClass = document.documentElement?.classList?.contains('portal-reduce-motion') ?? false;
      setReducedMotion(media || portalClass);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      mediaQuery?.removeEventListener?.('change', updateFromMedia);
      observer.disconnect();
    };
  }, []);

  return reducedMotion;
}
