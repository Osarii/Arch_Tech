import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { portalAuth } from '../portal/demoAuth';
import { useBimStore } from '../stores/bimStore';
import { bimEngine } from '../bim/engine/BimEngine';

export type DemoTourStage = 'intro' | 'landing' | 'portal' | 'bim';

export interface BimTourPreset {
  id: string;
  label: string;
  description: string;
  tool?: 'select' | 'measure' | 'section';
  measureMode?: 'distance' | 'area';
  camera?: {
    eye: [number, number, number];
    target: [number, number, number];
  };
}

export const BIM_TOUR_PRESETS: BimTourPreset[] = [
  {
    id: 'masterplan',
    label: 'Masterplan',
    description: 'Vista isométrica general del campus La Lima',
    camera: {
      eye: [180, 140, 180],
      target: [0, 0, 0],
    },
  },
  {
    id: 'logistics',
    label: 'Hub Logístico',
    description: 'Enfoque en naves industriales y accesos logísticos',
    camera: {
      eye: [80, 45, 60],
      target: [20, 5, 10],
    },
  },
  {
    id: 'measure',
    label: 'Medición',
    description: 'Herramienta de medición de distancias en obra activada',
    tool: 'measure',
    measureMode: 'distance',
  },
  {
    id: 'future-vision',
    label: 'NVIDIA / Futuro',
    description: 'Perspectiva arquitectónica para la visión futura y gemelos digitales',
    camera: {
      eye: [40, 22, -30],
      target: [0, 10, 0],
    },
  },
];

export interface DemoTourState {
  isTourActive: boolean;
  stage: DemoTourStage;
  isFullscreen: boolean;
  activeBimPreset: string | null;
  stepIndex: number;
  totalSteps: number;
  startTour: (initialStage?: DemoTourStage) => void;
  exitTour: () => void;
  resetTour: () => void;
  nextStage: () => void;
  previousStage: () => void;
  goToStage: (stage: DemoTourStage) => void;
  applyBimPreset: (presetId: string) => void;
  toggleFullscreen: () => void;
}

const STAGE_ORDER: DemoTourStage[] = ['intro', 'landing', 'portal', 'bim'];

const noop = () => undefined;

const defaultState: DemoTourState = {
  isTourActive: false,
  stage: 'landing',
  isFullscreen: false,
  activeBimPreset: null,
  stepIndex: 1,
  totalSteps: 4,
  startTour: noop,
  exitTour: noop,
  resetTour: noop,
  nextStage: noop,
  previousStage: noop,
  goToStage: noop,
  applyBimPreset: noop,
  toggleFullscreen: noop,
};

const DemoTourContext = createContext<DemoTourState>(defaultState);

export const DemoTourProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [stage, setStage] = useState<DemoTourStage>('landing');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeBimPreset, setActiveBimPreset] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatingRef = useRef(false);

  // Sync stage with current location if tour is active
  useEffect(() => {
    if (!isTourActive || isNavigatingRef.current) return;

    if (location.pathname === '/' && stage !== 'intro' && stage !== 'landing') {
      setStage('landing');
    } else if (
      (location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/architect') ||
        location.pathname.startsWith('/admin')) &&
      stage !== 'portal'
    ) {
      setStage('portal');
    } else if (location.pathname === '/workspace' && stage !== 'bim') {
      setStage('bim');
    }
  }, [location.pathname, isTourActive, stage]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  const applyBimPreset = useCallback((presetId: string) => {
    setActiveBimPreset(presetId);
    const preset = BIM_TOUR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.tool) {
      useBimStore.getState().setActiveTool(preset.tool);
      if (preset.measureMode) {
        useBimStore.getState().setMeasureMode(preset.measureMode);
      }
    }

    if (preset.camera) {
      const { eye, target } = preset.camera;
      void bimEngine.restoreViewpoint({
        id: `preset-${preset.id}`,
        title: preset.label,
        cameraPosition: eye,
        cameraTarget: target,
        cameraMode: 'perspective',
        selectedElements: [],
        createdAt: new Date().toLocaleTimeString(),
      });
    }
  }, []);

  const goToStage = useCallback(
    (targetStage: DemoTourStage) => {
      isNavigatingRef.current = true;
      setStage(targetStage);

      if (targetStage === 'intro') {
        if (location.pathname !== '/') {
          navigate('/');
        }
      } else if (targetStage === 'landing') {
        if (location.pathname !== '/') {
          navigate('/');
        }
      } else if (targetStage === 'portal') {
        // Ensure valid demo session
        if (!portalAuth.getSession()) {
          portalAuth.signIn('client@arch-tech.demo', 'client');
        }
        navigate('/dashboard');
      } else if (targetStage === 'bim') {
        // Ensure session and navigate to workspace
        if (!portalAuth.getSession()) {
          portalAuth.signIn('client@arch-tech.demo', 'client');
        }
        navigate('/workspace');

        // Prepare BIM defaults
        setTimeout(() => {
          applyBimPreset('masterplan');
        }, 300);
      }

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 200);
    },
    [location.pathname, navigate, applyBimPreset]
  );

  const startTour = useCallback(
    (initialStage: DemoTourStage = 'intro') => {
      setIsTourActive(true);
      goToStage(initialStage);
    },
    [goToStage]
  );

  const exitTour = useCallback(() => {
    setIsTourActive(false);
    setActiveBimPreset(null);
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  const resetTour = useCallback(() => {
    useBimStore.getState().resetModel();
    goToStage('intro');
  }, [goToStage]);

  const nextStage = useCallback(() => {
    const currentIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      goToStage(STAGE_ORDER[currentIndex + 1]);
    }
  }, [stage, goToStage]);

  const previousStage = useCallback(() => {
    const currentIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex > 0) {
      goToStage(STAGE_ORDER[currentIndex - 1]);
    }
  }, [stage, goToStage]);

  const stepIndex = STAGE_ORDER.indexOf(stage);

  const value = useMemo<DemoTourState>(
    () => ({
      isTourActive,
      stage,
      isFullscreen,
      activeBimPreset,
      stepIndex,
      totalSteps: STAGE_ORDER.length,
      startTour,
      exitTour,
      resetTour,
      nextStage,
      previousStage,
      goToStage,
      applyBimPreset,
      toggleFullscreen,
    }),
    [
      isTourActive,
      stage,
      isFullscreen,
      activeBimPreset,
      stepIndex,
      startTour,
      exitTour,
      resetTour,
      nextStage,
      previousStage,
      goToStage,
      applyBimPreset,
      toggleFullscreen,
    ]
  );

  return <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>;
};

export const useDemoTour = (): DemoTourState => useContext(DemoTourContext);
