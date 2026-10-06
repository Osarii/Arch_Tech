import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMotionPolicy,
  getIntersectionRatio,
  isIntersectionVisible,
  selectMostVisibleEntry,
  settleMotionPhase,
} from '../src/motion/motionSupport';
import { REDUCED_MOTION_QUERY } from '../src/motion/motionSupport';
import { useReducedMotion } from '../src/motion/useReducedMotion';

const mediaQuery = (matches: boolean) => ({
  matches,
  media: REDUCED_MOTION_QUERY,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

describe('motion support', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = vi.fn(() => mediaQuery(false)) as typeof window.matchMedia;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('combines system and manual preferences into a safe policy', () => {
    expect(createMotionPolicy(false, 300)).toEqual({ reducedMotion: false, shouldAnimate: true, durationMs: 300, scrollBehavior: 'smooth' });
    expect(createMotionPolicy(true, 300)).toEqual({ reducedMotion: true, shouldAnimate: false, durationMs: 0, scrollBehavior: 'auto' });
    expect(createMotionPolicy(false, -1).durationMs).toBe(0);
    expect(settleMotionPhase('entering', true)).toBe('entered');
    expect(settleMotionPhase('exiting', true)).toBe('exited');
  });

  it('normalizes intersection visibility deterministically', () => {
    const hidden = { isIntersecting: false, intersectionRatio: 1 };
    const partial = { isIntersecting: true, intersectionRatio: 0.4 };
    const visible = { isIntersecting: true, intersectionRatio: 0.75 };
    expect(getIntersectionRatio(hidden)).toBe(0);
    expect(isIntersectionVisible(partial)).toBe(false);
    expect(isIntersectionVisible(visible)).toBe(true);
    expect(selectMostVisibleEntry([partial, visible])).toBe(visible);
    expect(selectMostVisibleEntry([hidden])).toBeNull();
  });

  it('honors system reduced motion and persisted accessibility preference', () => {
    vi.mocked(window.matchMedia).mockReturnValue(mediaQuery(true));
    const system = renderHook(() => useReducedMotion());
    expect(system.result.current).toBe(true);
    system.unmount();

    vi.mocked(window.matchMedia).mockReturnValue(mediaQuery(false));
    window.localStorage.setItem('arch-tech-portal-reduce-motion', 'true');
    const stored = renderHook(() => useReducedMotion());
    expect(stored.result.current).toBe(true);
  });

  it('allows an explicit accessibility preference to override stored state while retaining system preference', () => {
    window.localStorage.setItem('arch-tech-portal-reduce-motion', 'true');
    const hook = renderHook(({ preference }: { preference: boolean }) => useReducedMotion(preference), {
      initialProps: { preference: false },
    });
    expect(hook.result.current).toBe(false);
    act(() => hook.rerender({ preference: true }));
    expect(hook.result.current).toBe(true);

    const preferences = renderHook(() => useReducedMotion({ reduceMotion: false }));
    expect(preferences.result.current).toBe(false);
  });
});
