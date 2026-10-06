import type { AccessibilityPreferences } from '../portal/accessibility';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export type MotionPhase = 'idle' | 'entering' | 'entered' | 'exiting' | 'exited';

export interface MotionPolicy {
  reducedMotion: boolean;
  shouldAnimate: boolean;
  durationMs: number;
  scrollBehavior: ScrollBehavior;
}

export interface MotionPreferenceInput {
  systemReducedMotion?: boolean;
  manualReducedMotion?: boolean;
}

export const resolveReducedMotion = ({
  systemReducedMotion = false,
  manualReducedMotion = false,
}: MotionPreferenceInput = {}): boolean => systemReducedMotion || manualReducedMotion;

export const createMotionPolicy = (
  reducedMotion: boolean,
  durationMs = 240,
): MotionPolicy => {
  const safeDuration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;
  return {
    reducedMotion,
    shouldAnimate: !reducedMotion && safeDuration > 0,
    durationMs: reducedMotion ? 0 : safeDuration,
    scrollBehavior: reducedMotion ? 'auto' : 'smooth',
  };
};

export const settleMotionPhase = (phase: MotionPhase, reducedMotion: boolean): MotionPhase => {
  if (!reducedMotion) return phase;
  if (phase === 'entering') return 'entered';
  if (phase === 'exiting') return 'exited';
  return phase;
};

export const getIntersectionRatio = (entry: Pick<IntersectionObserverEntry, 'intersectionRatio' | 'isIntersecting'>): number => (
  entry.isIntersecting ? Math.max(0, Math.min(1, entry.intersectionRatio)) : 0
);

export const isIntersectionVisible = (
  entry: Pick<IntersectionObserverEntry, 'intersectionRatio' | 'isIntersecting'>,
  threshold = 0.5,
): boolean => getIntersectionRatio(entry) >= Math.max(0, Math.min(1, threshold));

export const selectMostVisibleEntry = <T extends Pick<IntersectionObserverEntry, 'intersectionRatio' | 'isIntersecting'>>(
  entries: readonly T[],
): T | null => entries.reduce<T | null>((best, entry) => {
  if (!entry.isIntersecting) return best;
  if (!best || getIntersectionRatio(entry) > getIntersectionRatio(best)) return entry;
  return best;
}, null);

export const hasManualReducedMotion = (
  preferences?: Pick<AccessibilityPreferences, 'reduceMotion'>,
): boolean => preferences?.reduceMotion === true;
