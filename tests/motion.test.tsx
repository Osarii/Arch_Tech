import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ArchitecturalLine,
  MetricCounter,
  Reveal,
  ScrollProgressBar,
  WireframeToSolid,
  useIntersectionReveal,
  useReducedMotion,
  useScrollProgress,
} from '../src/components/motion';

describe('Phase 8A Motion & Interaction System', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('portal-reduce-motion');
  });

  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove('portal-reduce-motion');
    vi.restoreAllMocks();
  });

  describe('useReducedMotion', () => {
    it('detects portal-reduce-motion accessibility class on root html', () => {
      document.documentElement.classList.add('portal-reduce-motion');
      const TestComponent = () => {
        const reduced = useReducedMotion();
        return <div data-testid="reduced-val">{reduced ? 'reduced' : 'normal'}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('reduced-val').textContent).toBe('reduced');
    });

    it('defaults to normal when neither media query nor class is active', () => {
      const TestComponent = () => {
        const reduced = useReducedMotion();
        return <div data-testid="reduced-val">{reduced ? 'reduced' : 'normal'}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('reduced-val').textContent).toBe('normal');
    });
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
      document.documentElement.classList.add('portal-reduce-motion');
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
      const { container } = render(<ScrollProgressBar />);
      expect(container.querySelector('div')).toBeDefined();
    });

    it('returns null when reduced motion is active', () => {
      document.documentElement.classList.add('portal-reduce-motion');
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
});
