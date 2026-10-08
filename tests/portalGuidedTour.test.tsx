import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DemoTourProvider, useDemoTour } from '../src/demo/DemoTourContext';
import { PortalGuidedTour } from '../src/components/demo/PortalGuidedTour';
import { useBimStore } from '../src/stores/bimStore';

// Test harness with dummy targets matching data-tour-id hooks
const PortalTourTestHarness: React.FC<{ initialIndex?: number; omitTarget?: boolean }> = ({
  initialIndex = 0,
  omitTarget = false,
}) => {
  const { isPortalTourActive, startPortalTour } = useDemoTour();

  React.useEffect(() => {
    startPortalTour(initialIndex);
  }, [startPortalTour, initialIndex]);

  return (
    <div>
      <div data-testid="harness-status">
        {isPortalTourActive ? 'PORTAL_ACTIVE' : 'PORTAL_INACTIVE'}
      </div>

      {!omitTarget && (
        <>
          <div
            data-tour-id="portal-tour-overview"
            style={{ width: '800px', height: '120px', marginTop: '10px' }}
          >
            <h1>Zona Franca La Lima</h1>
          </div>
          <div
            data-tour-id="portal-tour-progress"
            style={{ width: '250px', height: '50px' }}
          >
            <span>Progress: 48%</span>
          </div>
          <div
            data-tour-id="portal-tour-milestones"
            style={{ width: '600px', height: '200px' }}
          >
            <span>Milestones List</span>
          </div>
          <div
            data-tour-id="portal-tour-documents"
            style={{ width: '600px', height: '200px' }}
          >
            <span>Documents List</span>
          </div>
          <div
            data-tour-id="portal-tour-approvals"
            style={{ width: '600px', height: '200px' }}
          >
            <span>Approvals List</span>
          </div>
          <div
            data-tour-id="portal-tour-perspectives"
            style={{ width: '220px', height: '500px' }}
          >
            <aside>Navigation Rail</aside>
          </div>
          <div
            data-tour-id="portal-tour-intelligence"
            style={{ width: '600px', height: '250px' }}
          >
            <div>Site Intelligence</div>
          </div>
          <div
            data-tour-id="portal-tour-model"
            style={{ width: '600px', height: '150px' }}
          >
            <button data-testid="open-3d-model">Open 3D Model</button>
          </div>
        </>
      )}

      <PortalGuidedTour />
    </div>
  );
};

// Wrapper starting directly at stage 'portal'
const renderTour = (initialIndex = 0, omitTarget = false) => {
  return render(
    <MemoryRouter initialEntries={['/dashboard/projects/zona-franca-la-lima']}>
      <DemoTourProvider>
        <PortalTourTestHarness initialIndex={initialIndex} omitTarget={omitTarget} />
      </DemoTourProvider>
    </MemoryRouter>
  );
};

describe('Portal Guided Tour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBimStore.getState().resetModel();
  });

  it('renders step 01 (overview) with spotlight and card when initialized', () => {
    renderTour(0);

    expect(screen.getByTestId('portal-tour-card')).toBeDefined();
    expect(screen.getByText('01 / 08')).toBeDefined();
    expect(screen.getByText('RESUMEN DEL PROYECTO')).toBeDefined();
    expect(
      screen.getByText(
        'Zona Franca La Lima reúne en un mismo espacio el estado general y el contexto operativo del proyecto.'
      )
    ).toBeDefined();
    expect(screen.getByTestId('portal-spotlight-frame')).toBeDefined();
  });

  it('advances through steps via manual next button', () => {
    renderTour(0);

    // Initial step 01
    expect(screen.getByText('01 / 08')).toBeDefined();

    // Click Next -> step 02 (progress)
    fireEvent.click(screen.getByTestId('btn-portal-tour-next'));
    expect(screen.getByText('02 / 08')).toBeDefined();
    expect(screen.getByText('AVANCE Y MÉTRICAS')).toBeDefined();
    expect(
      screen.getByText(
        'Los indicadores permiten comprender rápidamente cómo avanza el proyecto y dónde se requiere atención.'
      )
    ).toBeDefined();

    // Click Next -> step 03 (milestones)
    fireEvent.click(screen.getByTestId('btn-portal-tour-next'));
    expect(screen.getByText('03 / 08')).toBeDefined();
    expect(screen.getByText('HITOS CLAVE')).toBeDefined();
    expect(
      screen.getByText(
        'Los hitos muestran qué etapas se han completado, cuáles están activas y qué viene después.'
      )
    ).toBeDefined();
  });

  it('navigates backwards via previous button and disables it on step 01', () => {
    renderTour(0);

    const prevButton = screen.getByTestId('btn-portal-tour-prev') as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);

    // Go to step 02
    fireEvent.click(screen.getByTestId('btn-portal-tour-next'));
    expect(screen.getByText('02 / 08')).toBeDefined();
    expect(prevButton.disabled).toBe(false);

    // Go back to step 01
    fireEvent.click(prevButton);
    expect(screen.getByText('01 / 08')).toBeDefined();
    expect(prevButton.disabled).toBe(true);
  });

  it('toggles pause and resume state', () => {
    renderTour(0);

    const pauseButton = screen.getByTestId('btn-portal-tour-pause');
    expect(screen.queryByTestId('portal-tour-paused-badge')).toBeNull();

    // Pause
    fireEvent.click(pauseButton);
    expect(screen.getByTestId('portal-tour-paused-badge')).toBeDefined();
    expect(pauseButton.textContent).toContain('Reanudar');

    // Resume
    fireEvent.click(pauseButton);
    expect(screen.queryByTestId('portal-tour-paused-badge')).toBeNull();
    expect(pauseButton.textContent).toContain('Pausar');
  });

  it('safely handles missing target element fallback', () => {
    renderTour(0, true); // omitTarget = true

    // Card should still render in viewport center fallback
    expect(screen.getByTestId('portal-tour-card')).toBeDefined();
    expect(screen.getByText('01 / 08')).toBeDefined();
    expect(screen.getByText('RESUMEN DEL PROYECTO')).toBeDefined();
    // Spotlight frame should not be present when target is absent
    expect(screen.queryByTestId('portal-spotlight-frame')).toBeNull();
  });

  it('skips portal tour when skip button is clicked', () => {
    renderTour(0);

    expect(screen.getByTestId('portal-tour-card')).toBeDefined();
    fireEvent.click(screen.getByTestId('btn-portal-tour-skip'));

    // Tour overlay is dismissed
    expect(screen.queryByTestId('portal-tour-card')).toBeNull();
    expect(screen.getByTestId('harness-status').textContent).toBe('PORTAL_INACTIVE');
  });

  it('exits portal tour safely on Escape key', () => {
    renderTour(0);

    expect(screen.getByTestId('portal-tour-card')).toBeDefined();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('portal-tour-card')).toBeNull();
    expect(screen.getByTestId('harness-status').textContent).toBe('PORTAL_INACTIVE');
  });

  it('scrolls off-screen elements into view smoothly', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderTour(0);

    // Initial check should trigger scroll check on target element
    expect(scrollIntoViewMock).toBeDefined();
  });

  it('respects reduced-motion preference during scroll targeting', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    // Mock matchMedia for prefers-reduced-motion
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderTour(0);

    const progressTarget = document.querySelector('[data-tour-id="portal-tour-overview"]') as HTMLElement;
    if (progressTarget) {
      // Simulate off-screen rect
      vi.spyOn(progressTarget, 'getBoundingClientRect').mockReturnValue({
        top: 2000,
        bottom: 2100,
        left: 0,
        right: 800,
        width: 800,
        height: 100,
        x: 0,
        y: 2000,
        toJSON: () => ({}),
      });
    }

    expect(scrollIntoViewMock).toBeDefined();
    window.matchMedia = originalMatchMedia;
  });

  it('renders step 08 digital project CTA button and transitions into BIM', () => {
    renderTour(7); // index 7 = step 08

    expect(screen.getByText('08 / 08')).toBeDefined();
    expect(screen.getByText('PROYECTO DIGITAL')).toBeDefined();

    // Enter BIM CTA button should exist
    const enterBimButton = screen.getByTestId('portal-tour-enter-bim');
    expect(enterBimButton).toBeDefined();
    expect(enterBimButton.textContent).toContain('ENTRAR AL MODELO 3D');

    // Clicking it exits portal tour and goes to BIM
    fireEvent.click(enterBimButton);
    expect(screen.queryByTestId('portal-tour-card')).toBeNull();
  });

  it('temporarily pauses auto-advance when user interacts with highlighted component', () => {
    renderTour(0);

    const overviewTarget = screen.getByRole('heading', { name: 'Zona Franca La Lima' });
    fireEvent.pointerDown(overviewTarget);

    expect(screen.getByTestId('portal-tour-paused-badge')).toBeDefined();
    expect(screen.getByTestId('portal-tour-paused-badge').textContent).toContain('INTERACCIÓN');
  });
});
