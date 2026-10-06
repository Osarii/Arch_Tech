import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ArchitecturalLine,
  MetricCounter,
  ProjectRouteTransition,
  Reveal,
  ScrollProgressBar,
  WireframeToSolid,
  isProjectRouteTransition,
  useIntersectionReveal,
  useProjectRouteTransition,
  useScrollProgress,
} from '../src/components/motion';
import * as useReducedMotionModule from '../src/motion/useReducedMotion';

describe('Phase 8A Motion & Interaction System', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('portal-reduce-motion');
  });

  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove('portal-reduce-motion');
    vi.restoreAllMocks();
  });

  describe('useIntersectionReveal', () => {
    it('returns ref and isRevealed true in test mode', () => {
      const TestReveal = () => {
        const { ref, isRevealed } = useIntersectionReveal();
        return <div ref={ref} data-testid="reveal-status">{isRevealed ? 'revealed' : 'hidden'}</div>;
      };

      render(<TestReveal />);
      expect(screen.getByTestId('reveal-status').textContent).toBe('revealed');
    });
  });

  describe('useScrollProgress', () => {
    it('initializes scroll progress state', () => {
      const TestProgress = () => {
        const state = useScrollProgress();
        return <div data-testid="progress-val">{state.progress}</div>;
      };

      render(<TestProgress />);
      expect(screen.getByTestId('progress-val').textContent).toBe('0');
    });
  });

  describe('Reveal primitive', () => {
    it('renders children and marks revealed in test environment', () => {
      render(
        <Reveal variant="fade-up" delay={100} duration={500}>
          <span>Architectural content</span>
        </Reveal>
      );

      const el = screen.getByText('Architectural content');
      expect(el).toBeDefined();
      const container = el.closest('.motion-reveal');
      expect(container).toBeDefined();
      expect(container?.getAttribute('data-motion-revealed')).toBe('true');
    });

    it('supports custom element type', () => {
      render(
        <Reveal as="article" data-testid="custom-reveal">
          <p>Article content</p>
        </Reveal>
      );

      const el = screen.getByTestId('custom-reveal');
      expect(el.tagName.toLowerCase()).toBe('article');
    });

    it('supports mask and slide-right variants', () => {
      const { rerender } = render(
        <Reveal variant="mask" data-testid="mask-reveal">
          <div>Masked image</div>
        </Reveal>
      );
      expect(screen.getByTestId('mask-reveal')).toBeDefined();

      rerender(
        <Reveal variant="slide-right" data-testid="slide-reveal">
          <div>Sliding text</div>
        </Reveal>
      );
      expect(screen.getByTestId('slide-reveal')).toBeDefined();
    });
  });

  describe('WireframeToSolid signature motion', () => {
    it('renders CAD precision crosshairs, coordinate tag, and solid content', () => {
      render(
        <WireframeToSolid tag="TEST // CAD-01">
          <div data-testid="inner-content">Solid Architecture Model</div>
        </WireframeToSolid>
      );

      const container = screen.getByTestId('wireframe-to-solid');
      expect(container).toBeDefined();
      expect(screen.getByText('TEST // CAD-01')).toBeDefined();
      expect(screen.getByTestId('inner-content')).toBeDefined();

      // Precision corner crosshairs '+'
      const crosshairs = screen.getAllByText('+');
      expect(crosshairs.length).toBe(4);
    });

    it('resolves directly to solid state under reduced motion', () => {
      vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);
      render(
        <WireframeToSolid tag="REDUCED // 01">
          <div>Accessible Model</div>
        </WireframeToSolid>
      );

      const container = screen.getByTestId('wireframe-to-solid');
      expect(container.getAttribute('data-motion-state')).toBe('solid');
    });
  });

  describe('MetricCounter primitive', () => {
    it('renders full value immediately in test mode and reduced motion', () => {
      vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);
      render(<MetricCounter value="30 YEARS" />);
      expect(screen.getByText('30 YEARS')).toBeDefined();
    });

    it('renders text-only values unchanged', () => {
      render(<MetricCounter value="COSTA RICA" />);
      expect(screen.getByText('COSTA RICA')).toBeDefined();
    });
  });

  describe('ScrollProgressBar', () => {
    it('renders scroll indicator line when reduced motion is off', () => {
      vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);
      const { container } = render(<ScrollProgressBar />);
      expect(container.querySelector('div')).toBeDefined();
    });

    it('returns null when reduced motion is active', () => {
      vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);
      const { container } = render(<ScrollProgressBar />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ArchitecturalLine', () => {
    it('renders horizontal and vertical divider lines', () => {
      const { rerender, container } = render(<ArchitecturalLine orientation="horizontal" accent />);
      expect(container.firstChild).toBeDefined();

      rerender(<ArchitecturalLine orientation="vertical" />);
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Phase 8B Project Route Transition', () => {
    it('isProjectRouteTransition identifies forward, reverse, and ineligible transitions', () => {
      // Forward: Landing -> public project
      expect(isProjectRouteTransition('/', '/projects/zona-franca-la-lima')).toBe('forward');
      expect(isProjectRouteTransition('', '/projects/el-cafetal')).toBe('forward');

      // Reverse: Public project -> Landing (Development portfolio return)
      expect(isProjectRouteTransition('/projects/zona-franca-la-lima', '/')).toBe('reverse');
      expect(isProjectRouteTransition('/projects/el-cafetal', '')).toBe('reverse');

      // Ineligible routes: portal, login, workspace, errors
      expect(isProjectRouteTransition('/', '/dashboard')).toBeNull();
      expect(isProjectRouteTransition('/', '/login')).toBeNull();
      expect(isProjectRouteTransition('/projects/zona-franca-la-lima', '/login')).toBeNull();
      expect(isProjectRouteTransition('/projects/zona-franca-la-lima', '/workspace')).toBeNull();
      expect(isProjectRouteTransition('/dashboard', '/dashboard/projects/zona-franca-la-lima')).toBeNull();
      expect(isProjectRouteTransition('/', '/404')).toBeNull();
      expect(isProjectRouteTransition('/projects/zona-franca-la-lima', '/projects/zona-franca-la-lima')).toBeNull();
    });

    it('ProjectRouteTransition renders overlay, graphite curtain, and technical line when active', () => {
      const { rerender } = render(
        <ProjectRouteTransition
          state={{
            phase: 'entering',
            direction: 'forward',
            targetPath: '/projects/zona-franca-la-lima',
          }}
        />
      );

      const overlay = screen.getByTestId('project-route-transition');
      expect(overlay).toBeDefined();
      expect(overlay.getAttribute('data-transition-phase')).toBe('entering');
      expect(overlay.getAttribute('data-transition-direction')).toBe('forward');
      expect(screen.getByText('PROJECT DOSSIER TRANSITION')).toBeDefined();
      expect(screen.getByText('PHASE: MASK')).toBeDefined();

      // Exit phase
      rerender(
        <ProjectRouteTransition
          state={{
            phase: 'exiting',
            direction: 'reverse',
            targetPath: '/',
          }}
        />
      );
      expect(screen.getByTestId('project-route-transition').getAttribute('data-transition-phase')).toBe('exiting');
      expect(screen.getByText('PORTFOLIO REVERSAL')).toBeDefined();
      expect(screen.getByText('PHASE: REVEAL')).toBeDefined();

      // Idle phase returns null
      rerender(
        <ProjectRouteTransition
          state={{
            phase: 'idle',
            direction: 'forward',
            targetPath: null,
          }}
        />
      );
      expect(screen.queryByTestId('project-route-transition')).toBeNull();
    });

    it('ProjectRouteTransition returns null when reduced motion is enabled', () => {
      vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);
      render(
        <ProjectRouteTransition
          state={{
            phase: 'entering',
            direction: 'forward',
            targetPath: '/projects/zona-franca-la-lima',
          }}
        />
      );
      expect(screen.queryByTestId('project-route-transition')).toBeNull();
    });

    it('useProjectRouteTransition orchestrates entering, midpoint navigation, and exit phases', () => {
      vi.useFakeTimers();
      const navigate = vi.fn();
      const { result } = renderHook(() => useProjectRouteTransition(navigate, '/'));

      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.transitionState.phase).toBe('idle');

      let accepted = false;
      act(() => {
        accepted = result.current.navigateWithTransition('/projects/zona-franca-la-lima');
      });

      expect(accepted).toBe(true);
      expect(result.current.isTransitioning).toBe(true);
      expect(result.current.transitionState.phase).toBe('entering');
      expect(result.current.transitionState.direction).toBe('forward');
      // Navigation should not have occurred yet before midpoint
      expect(navigate).not.toHaveBeenCalled();

      // Rapid clicks are blocked during active transition
      let doubleTrigger = false;
      act(() => {
        doubleTrigger = result.current.navigateWithTransition('/projects/el-cafetal');
      });
      expect(doubleTrigger).toBe(false);

      // Fast-forward to midpoint (280ms)
      act(() => {
        vi.advanceTimersByTime(280);
      });
      expect(navigate).toHaveBeenCalledWith('/projects/zona-franca-la-lima');
      expect(result.current.transitionState.phase).toBe('exiting');

      // Fast-forward through exit phase (another 280ms)
      act(() => {
        vi.advanceTimersByTime(280);
      });
      expect(result.current.transitionState.phase).toBe('idle');
      expect(result.current.isTransitioning).toBe(false);

      vi.useRealTimers();
    });

    it('useProjectRouteTransition navigates immediately without transition under reduced motion', () => {
      vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);
      const navigate = vi.fn();
      const { result } = renderHook(() => useProjectRouteTransition(navigate, '/'));

      act(() => {
        result.current.navigateWithTransition('/projects/zona-franca-la-lima');
      });

      expect(navigate).toHaveBeenCalledWith('/projects/zona-franca-la-lima');
      expect(result.current.transitionState.phase).toBe('idle');
      expect(result.current.isTransitioning).toBe(false);
    });

    it('useProjectRouteTransition navigates non-project routes immediately without animation', () => {
      const navigate = vi.fn();
      const { result } = renderHook(() => useProjectRouteTransition(navigate, '/'));

      act(() => {
        result.current.navigateWithTransition('/dashboard');
      });

      expect(navigate).toHaveBeenCalledWith('/dashboard');
      expect(result.current.transitionState.phase).toBe('idle');
      expect(result.current.isTransitioning).toBe(false);
    });

    it('supports native View Transition API when available at midpoint', () => {
      vi.useFakeTimers();
      const navigate = vi.fn();
      const startViewTransition = vi.fn().mockImplementation((cb: () => void) => cb());
      (document as unknown as { startViewTransition: typeof startViewTransition }).startViewTransition = startViewTransition;

      const { result } = renderHook(() => useProjectRouteTransition(navigate, '/projects/zona-franca-la-lima'));

      act(() => {
        result.current.navigateWithTransition('/');
      });

      expect(result.current.transitionState.direction).toBe('reverse');

      // Advance to midpoint
      act(() => {
        vi.advanceTimersByTime(280);
      });

      expect(startViewTransition).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/');

      delete (document as unknown as { startViewTransition?: typeof startViewTransition }).startViewTransition;
      vi.useRealTimers();
    });
  });
});
