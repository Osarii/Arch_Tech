import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DemoTourProvider, useDemoTour } from '../src/demo/DemoTourContext';
import { DemoTourBar } from '../src/components/demo/DemoTourBar';
import { DemoIntroModal } from '../src/components/demo/DemoIntroModal';
import { useBimStore } from '../src/stores/bimStore';
import { bimEngine } from '../src/bim/engine/BimEngine';

// Test consumer helper component
const TestConsumer: React.FC = () => {
  const { isTourActive, stage, startTour, nextStage, previousStage, resetTour, exitTour, applyBimPreset } =
    useDemoTour();

  return (
    <div>
      <div data-testid="tour-status">
        {isTourActive ? `ACTIVE:${stage}` : 'INACTIVE'}
      </div>
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
      <button data-testid="btn-preset-logistics" onClick={() => applyBimPreset('logistics')}>
        Logistics Preset
      </button>
    </div>
  );
};

describe('DemoTour System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('advances through stages: intro -> landing -> portal -> bim', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');

      fireEvent.click(screen.getByTestId('btn-next'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:landing');

      fireEvent.click(screen.getByTestId('btn-next'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:portal');

      fireEvent.click(screen.getByTestId('btn-next'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:bim');

      // Next does nothing on last stage
      fireEvent.click(screen.getByTestId('btn-next'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:bim');

      // Previous navigates backwards
      fireEvent.click(screen.getByTestId('btn-prev'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:portal');
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

  describe('DemoIntroModal', () => {
    it('renders intro video modal when active on intro stage', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoIntroModal />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('demo-intro-modal')).toBeDefined();
      expect(screen.getByTestId('demo-intro-video')).toBeDefined();
      expect(screen.getByTestId('demo-intro-skip')).toBeDefined();
    });

    it('skips intro video when skip button is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoIntroModal />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');

      fireEvent.click(screen.getByTestId('demo-intro-skip'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:landing');
    });

    it('skips intro video on Escape key', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <DemoTourProvider>
            <TestConsumer />
            <DemoIntroModal />
          </DemoTourProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('btn-start'));
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:intro');

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:landing');
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

      expect(screen.getByTestId('tour-status').textContent).toBe('ACTIVE:bim');
      expect(screen.getByTestId('bim-preset-masterplan')).toBeDefined();
      expect(screen.getByTestId('bim-preset-logistics')).toBeDefined();
      expect(screen.getByTestId('bim-preset-measure')).toBeDefined();
      expect(screen.getByTestId('bim-preset-future-vision')).toBeDefined();
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
