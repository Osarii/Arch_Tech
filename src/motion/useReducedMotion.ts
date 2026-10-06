import { useEffect, useState } from 'react';
import {
  REDUCED_MOTION_QUERY,
  resolveReducedMotion,
  type MotionPreferenceInput,
} from './motionSupport';
import { loadAccessibilityPreferences } from '../portal/accessibility';
import type { AccessibilityPreferences } from '../portal/accessibility';

export type ReducedMotionPreference =
  | boolean
  | MotionPreferenceInput
  | Pick<AccessibilityPreferences, 'reduceMotion'>
  | undefined;

const readSystemPreference = (): boolean => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia(REDUCED_MOTION_QUERY).matches
);

const readStoredPreference = (): boolean => loadAccessibilityPreferences().reduceMotion;

export const useReducedMotion = (preference?: ReducedMotionPreference): boolean => {
  const [systemReducedMotion, setSystemReducedMotion] = useState(readSystemPreference);
  const [storedReducedMotion, setStoredReducedMotion] = useState(readStoredPreference);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setSystemReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener?.('change', update);
    return () => mediaQuery.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const update = (event: StorageEvent) => {
      if (event.key === null || event.key === 'arch-tech-a11y-preferences' || event.key === 'arch-tech-portal-reduce-motion') {
        setStoredReducedMotion(readStoredPreference());
      }
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  const manualReducedMotion = typeof preference === 'boolean'
    ? preference
    : preference && 'reduceMotion' in preference
      ? preference.reduceMotion
      : preference && 'manualReducedMotion' in preference
        ? preference.manualReducedMotion ?? storedReducedMotion
        : storedReducedMotion;

  return resolveReducedMotion({ systemReducedMotion, manualReducedMotion });
};
