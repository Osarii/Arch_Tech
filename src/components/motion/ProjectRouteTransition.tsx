import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../motion/useReducedMotion';

export type ProjectTransitionPhase = 'idle' | 'entering' | 'exiting';
export type ProjectTransitionDirection = 'forward' | 'reverse';

export interface ProjectTransitionState {
  phase: ProjectTransitionPhase;
  direction: ProjectTransitionDirection;
  targetPath: string | null;
}

export const PROJECT_TRANSITION_ENTER_MS = 280;
export const PROJECT_TRANSITION_EXIT_MS = 280;
export const PROJECT_TRANSITION_TOTAL_MS = PROJECT_TRANSITION_ENTER_MS + PROJECT_TRANSITION_EXIT_MS;

export const isProjectRouteTransition = (
  fromPath: string,
  toPath: string,
): ProjectTransitionDirection | null => {
  const cleanFrom = fromPath.split('?')[0].split('#')[0];
  const cleanTo = toPath.split('?')[0].split('#')[0];

  const isPublicProject = (path: string) => /^\/projects\/[a-zA-Z0-9_-]+$/.test(path);
  const isLanding = (path: string) => path === '/' || path === '';

  // Portfolio -> Public project dossier
  if (isLanding(cleanFrom) && isPublicProject(cleanTo)) {
    return 'forward';
  }

  // Public project dossier -> Portfolio
  if (isPublicProject(cleanFrom) && isLanding(cleanTo)) {
    return 'reverse';
  }

  // Inter-project public navigation
  if (isPublicProject(cleanFrom) && isPublicProject(cleanTo) && cleanFrom !== cleanTo) {
    return 'forward';
  }

  return null;
};

export interface UseProjectRouteTransitionReturn {
  transitionState: ProjectTransitionState;
  navigateWithTransition: (to: string) => boolean;
  isTransitioning: boolean;
}

export function useProjectRouteTransition(
  navigate: (to: string) => void,
  currentPath: string,
): UseProjectRouteTransitionReturn {
  const reducedMotion = useReducedMotion();
  const [transitionState, setTransitionState] = useState<ProjectTransitionState>({
    phase: 'idle',
    direction: 'forward',
    targetPath: null,
  });

  const isTransitioningRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
      isTransitioningRef.current = false;
    };
  }, []);

  const navigateWithTransition = useCallback(
    (to: string): boolean => {
      // Prevent double-trigger from rapid clicks
      if (isTransitioningRef.current) {
        return false;
      }

      const direction = isProjectRouteTransition(currentPath, to);

      // Not an animated public project transition: navigate immediately
      if (!direction) {
        navigate(to);
        return false;
      }

      // Reduced motion: skip architectural wipe, navigate immediately
      if (reducedMotion) {
        navigate(to);
        return false;
      }

      isTransitioningRef.current = true;
      clearAllTimers();

      setTransitionState({
        phase: 'entering',
        direction,
        targetPath: to,
      });

      // Midpoint: execute route change while viewport is covered
      const enterTimer = window.setTimeout(() => {
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function' && process.env.NODE_ENV !== 'test') {
          try {
            window.scrollTo(0, 0);
          } catch {
            // Safe fallback
          }
        }
        if (typeof document !== 'undefined' && 'startViewTransition' in document) {
          try {
            (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
              navigate(to);
            });
          } catch {
            navigate(to);
          }
        } else {
          navigate(to);
        }

        setTransitionState({
          phase: 'exiting',
          direction,
          targetPath: to,
        });

        // Complete transition and return to idle
        const exitTimer = window.setTimeout(() => {
          setTransitionState({
            phase: 'idle',
            direction,
            targetPath: null,
          });
          isTransitioningRef.current = false;
        }, PROJECT_TRANSITION_EXIT_MS);

        timersRef.current.push(exitTimer);
      }, PROJECT_TRANSITION_ENTER_MS);

      timersRef.current.push(enterTimer);
      return true;
    },
    [currentPath, navigate, reducedMotion],
  );

  return {
    transitionState,
    navigateWithTransition,
    isTransitioning: transitionState.phase !== 'idle',
  };
}

export interface ProjectRouteTransitionProps {
  state: ProjectTransitionState;
  className?: string;
}

export const ProjectRouteTransition: React.FC<ProjectRouteTransitionProps> = ({
  state,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || state.phase === 'idle') {
    return null;
  }

  const isEntering = state.phase === 'entering';
  const isForward = state.direction === 'forward';

  return (
    <div
      data-testid="project-route-transition"
      data-transition-phase={state.phase}
      data-transition-direction={state.direction}
      aria-hidden="true"
      className={`arch-transition-overlay ${className}`.trim()}
      data-transition-active="true"
    >
      {/* Graphite Architectural Curtain */}
      <div
        className="arch-transition-curtain"
        data-direction={state.direction}
        data-phase={state.phase}
      >
        {/* Subtle Architectural Wireframe CAD Grid */}
        <div className="absolute inset-0 arch-transition-grid pointer-events-none opacity-30" />

        {/* CAD crosshairs in corners */}
        <span className="absolute top-8 left-8 font-mono text-xs text-stone-500/40 select-none">+</span>
        <span className="absolute top-8 right-8 font-mono text-xs text-stone-500/40 select-none">+</span>
        <span className="absolute bottom-8 left-8 font-mono text-xs text-stone-500/40 select-none">+</span>
        <span className="absolute bottom-8 right-8 font-mono text-xs text-stone-500/40 select-none">+</span>

        {/* Technical Coordinate & Route Metadata Tag */}
        <div className="absolute bottom-6 right-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-stone-400/80">
          <span className="h-px w-6 bg-stone-500/40" />
          <span>ARCH_TECH // {isForward ? 'PROJECT DOSSIER TRANSITION' : 'PORTFOLIO REVERSAL'}</span>
          <span className="text-stone-600">/</span>
          <span className="text-stone-300 font-medium">{isEntering ? 'PHASE: MASK' : 'PHASE: REVEAL'}</span>
        </div>
      </div>

      {/* Technical Sweeping Line */}
      <div
        className="arch-transition-sweep-line"
        data-direction={state.direction}
        data-phase={state.phase}
      />
    </div>
  );
};
