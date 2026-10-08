import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { DemoTourProvider, useDemoTour } from '../src/demo/DemoTourContext';
import { DemoTourBar } from '../src/components/demo/DemoTourBar';
import { DemoVideoStage } from '../src/components/demo/DemoVideoStage';
import { useBimStore } from '../src/stores/bimStore';
import { bimEngine } from '../src/bim/engine/BimEngine';
import { authService } from '../src/services/authService';
import { portalAuth, type ClientSession } from '../src/portal/demoAuth';
import { App } from '../src/App';

// Test consumer helper component
const TestConsumer: React.FC = () => {
  const location = useLocation();
  const { isTourActive, stage, activeVideo, isPortalTourActive, startTour, nextStage, previousStage, resetTour, exitTour, applyBimPreset, completeVideo } =
    useDemoTour();

  return (
    <div>
      <div data-testid="tour-status">
        {isTourActive ? `ACTIVE:${stage}` : 'INACTIVE'}
      </div>
      <div data-testid="video-status">{activeVideo ?? 'NONE'}</div>
      <div data-testid="route-status">{location.pathname}</div>
      <div data-testid="portal-tour-status">{isPortalTourActive ? 'ACTIVE' : 'INACTIVE'}</div>
      {location.pathname.startsWith('/dashboard') && <div data-tour-id="portal-tour-overview" />}
      <button data-testid="btn-start" onClick={() => startTour('intro')}>
        Start
      </button>
      <button data-testid="btn-start-landing" onClick={() => startTour('landing')}>
        Start Landing
      </button>
      <button data-testid="btn-next" onClick={nextStage}>
        Next
      </button>
      <button data-testid="btn-prev" onClick={previousStage}>
        Prev
      </button>
      <button data-testid="btn-reset" onClick={resetTour}>
        Reset
      </button>
      <button data-testid="btn-exit" onClick={exitTour}>
        Exit
      </button>
      <button data-testid="btn-complete-video" onClick={completeVideo}>
        Complete Video
      </button>
      <button data-testid="btn-preset-logistics" onClick={() => applyBimPreset('logistics')}>
        Logistics Preset
      </button>
    </div>
  );
};

describe('DemoTour System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    portalAuth.signOut();
    useBimStore.getState().resetModel();
  });

  describe('DemoTourContext & State Transitions', () => {
    it('initializes in inactive state', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
          </DemoTourProvider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('tour-status').textContent).toBe('INACTIVE');
    });

    it('starts tour at specified stage', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');
    });

    it('places each video before its live destination and does not replay completed videos', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');
      expect(screen.getByTestId('video-status').textContent).toBe('intro');

      fireEvent.click(screen.getByTestId('btn-complete-video'));
      await waitFor(() => expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:landing'));

      fireEvent.click(screen.getByTestId('btn-next'));
      expect(screen.getByTestId('video-status').textContent).toBe('portal');

      fireEvent.click(screen.getByTestId('btn-complete-video'));
      await waitFor(() => expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:portal'));

      fireEvent.click(screen.getByTestId('btn-prev'));
      await waitFor(() => expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:landing'));

      fireEvent.click(screen.getByTestId('btn-next'));
      await waitFor(() => expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:portal'));
      await waitFor(() => expect(screen.getByTestId('video-status').textContent).toBe('NONE'));
    });

    it('waits for confirmed demo authentication before entering the protected Portal route', async () => {
      let resolveSignIn!: (session: ClientSession | null) => void;
      vi.spyOn(authService, 'signIn').mockReturnValue(new Promise((resolve) => {
        resolveSignIn = resolve;
      }));

      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider><TestConsumer /></DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start-landing'));
      fireEvent.click(screen.getByTestId('btn-next'));
      fireEvent.click(screen.getByTestId('btn-complete-video'));
      expect(screen.getByTestId('route-status').textContent).toBe('/');

      await act(async () => resolveSignIn({
        name: 'Mariana Solano',
        email: 'mariana.solano@arch-tech.studio',
        role: 'client',
      }));

      await waitFor(() => expect(screen.getByTestId('route-status').textContent).toBe('/dashboard/projects/zona-franca-la-lima'));
      await waitFor(() => expect(screen.getByTestId('portal-tour-status').textContent).toBe('ACTIVE'));
    });

    it('repairs a stale non-client session before entering Portal', async () => {
      portalAuth.signIn('sebastian.araya@arch-tech.studio', 'architect-access');

      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider><TestConsumer /></DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start-landing'));
      fireEvent.click(screen.getByTestId('btn-next'));
      fireEvent.click(screen.getByTestId('btn-complete-video'));

      await waitFor(() => expect(screen.getByTestId('route-status').textContent).toBe('/dashboard/projects/zona-franca-la-lima'));
      expect(portalAuth.getSession()?.email).toBe('mariana.solano@arch-tech.studio');
      expect(portalAuth.getSession()?.role).toBe('client');
    });

    it('exits tour and resets cleanly', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');

      fireEvent.click(screen.getByTestId('btn-exit'));
      expect(screen.getByTestId('tour-status').textContent).toBe('INACTIVE');
    });

    it('applies BIM presets and updates store/engine', () => {
      const restoreVpSpy = vi.spyOn(bimEngine, 'restoreViewpoint').mockImplementation(async () => {});

      render(
        <MemoryRouter initialEntries={['/workspace']}>
          <DemoTourProvider>
            <TestConsumer />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      fireEvent.click(screen.getByTestId('btn-preset-logistics'));

      expect(restoreVpSpy).toHaveBeenCalled();
    });
  });

  describe('DemoVideoStage', () => {
    it('enters the real Portal after Video 2 without rendering 403', async () => {
      window.history.replaceState({}, '', '/');
      render(<App />);

      fireEvent.click(screen.getAllByText('INICIAR RECORRIDO')[0]);
      fireEvent.ended(screen.getByTestId('demo-video'));
      await waitFor(() => expect(screen.getByTestId('tour-stage-landing')).toBeDefined());

      fireEvent.click(screen.getByTestId('tour-next-stage'));
      expect((screen.getByTestId('demo-video') as HTMLVideoElement).src).toContain('02-portal.mp4');
      fireEvent.ended(screen.getByTestId('demo-video'));

      await waitFor(() => expect(window.location.pathname).toBe('/dashboard/projects/zona-franca-la-lima'));
      expect(screen.queryByText(/403 \/ (Access restricted|ACCESO RESTRINGIDO)/i)).toBeNull();
    });

    it('renders the reusable video stage for the active tour video', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoVideoStage />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('demo-video-stage')).toBeDefined();
      expect(screen.getByTestId('demo-video')).toBeDefined();
      expect(screen.getByTestId('demo-video-skip')).toBeDefined();
    });

    it('skips intro video when skip button is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoVideoStage />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');

      fireEvent.click(screen.getByTestId('demo-video-skip'));
      await waitFor(() => expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:landing'));
    });

    it('skips intro video on Escape key', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoVideoStage />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');

      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:landing'));
    });
  });

  describe('DemoTourBar', () => {
    it('renders control bar when tour is active on non-intro stage', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoTourBar />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start-landing'));
      expect(screen.getByTestId('demo-tour-bar')).toBeDefined();
      expect(screen.getByTestId('tour-stage-landing')).toBeDefined();
      expect(screen.getByTestId('tour-stage-portal')).toBeDefined();
      expect(screen.getByTestId('tour-stage-bim')).toBeDefined();
      expect(screen.getByTestId('tour-stage-future')).toBeDefined();
    });

    it('navigates directly to stages when breadcrumb buttons clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoTourBar />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start-landing'));
      fireEvent.click(screen.getByTestId('tour-stage-bim'));

      expect(screen.getByTestId('video-status').textContent).toBe('bim');
    });

    it('exits tour when close button in tour bar is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoTourBar />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start-landing'));
      expect(screen.getByTestId('demo-tour-bar')).toBeDefined();

      fireEvent.click(screen.getByTestId('tour-exit'));
      expect(screen.getByTestId('tour-status').textContent).toBe('INACTIVE');
    });
  });
});
