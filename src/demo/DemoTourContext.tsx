import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { getPortalProject, getPortalUser, getProjectsForUser } from '../portal/data';
import { useBimStore } from '../stores/bimStore';
import { bimEngine } from '../bim/engine/BimEngine';
import { IfcLoaderService } from '../bim/loaders/ifcLoaderService';
import { LA_LIMA_SITE_CONTEXT_ID, laLimaSiteContextService } from '../bim/site';

export type DemoTourStage = 'intro' | 'landing' | 'portal' | 'bim' | 'future';
export type DemoVideoId = 'intro' | 'portal' | 'bim' | 'future';

export const DEMO_VIDEOS: Record<DemoVideoId, { src: string; label: string; next?: DemoVideoId }> = {
  intro: { src: '/demo/videos/01-arch-tech-intro.mp4', label: 'ARCH_TECH / Introducción', next: 'portal' },
  portal: { src: '/demo/videos/02-portal.mp4', label: 'Portal', next: 'bim' },
  bim: { src: '/demo/videos/03-bim-engine.mp4', label: 'BIM / Motor 3D', next: 'future' },
  future: { src: '/demo/videos/04-nvidia-future.mp4', label: 'NVIDIA / Futuro' },
};

export interface PortalTourStep {
  id: string;
  stepNumber: string;
  title: string;
  copy: string;
  targetId: string;
  tab?: string;
  durationMs: number;
}

export const PORTAL_TOUR_STEPS: PortalTourStep[] = [
  {
    id: 'overview',
    stepNumber: '01',
    title: 'RESUMEN DEL PROYECTO',
    copy: 'Zona Franca La Lima reúne en un mismo espacio el estado general y el contexto operativo del proyecto.',
    targetId: 'portal-tour-overview',
    tab: 'Overview',
    durationMs: 6500,
  },
  {
    id: 'progress',
    stepNumber: '02',
    title: 'AVANCE Y MÉTRICAS',
    copy: 'Los indicadores permiten comprender rápidamente cómo avanza el proyecto y dónde se requiere atención.',
    targetId: 'portal-tour-progress',
    tab: 'Overview',
    durationMs: 6000,
  },
  {
    id: 'milestones',
    stepNumber: '03',
    title: 'HITOS CLAVE',
    copy: 'Los hitos muestran qué etapas se han completado, cuáles están activas y qué viene después.',
    targetId: 'portal-tour-milestones',
    tab: 'Milestones',
    durationMs: 6500,
  },
  {
    id: 'documents',
    stepNumber: '04',
    title: 'DOCUMENTACIÓN CENTRALIZADA',
    copy: 'Los documentos permanecen vinculados al mismo proyecto, reduciendo la dispersión de información entre diferentes herramientas.',
    targetId: 'portal-tour-documents',
    tab: 'Documents',
    durationMs: 6500,
  },
  {
    id: 'approvals',
    stepNumber: '05',
    title: 'APROBACIONES Y DECISIONES',
    copy: 'Las aprobaciones permiten identificar decisiones pendientes y mantener trazabilidad sobre las acciones del proyecto.',
    targetId: 'portal-tour-approvals',
    tab: 'Approvals',
    durationMs: 6500,
  },
  {
    id: 'perspectives',
    stepNumber: '06',
    title: 'MÚLTIPLES PERSPECTIVAS',
    copy: 'Cliente, arquitecto y administrador pueden consultar el mismo proyecto desde la perspectiva que necesita cada uno.',
    targetId: 'portal-tour-perspectives',
    tab: 'Overview',
    durationMs: 6500,
  },
  {
    id: 'intelligence',
    stepNumber: '07',
    title: 'INTELIGENCIA CONTEXTUAL',
    copy: 'ARCH_TECH conecta la información con el contexto del proyecto para facilitar consultas, análisis y toma de decisiones.',
    targetId: 'portal-tour-intelligence',
    tab: 'Overview',
    durationMs: 7000,
  },
  {
    id: 'digital-project',
    stepNumber: '08',
    title: 'PROYECTO DIGITAL',
    copy: 'Pero un proyecto no existe solamente como información.',
    targetId: 'portal-tour-model',
    tab: 'Model',
    durationMs: 9000,
  },
];

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
  activeVideo: DemoVideoId | null;
  completedVideos: DemoVideoId[];
  isPreparingStage: boolean;

  // Portal guided tour state
  isPortalTourActive: boolean;
  portalStepIndex: number;
  isPortalTourPaused: boolean;
  requestedPortalTab: string | null;
  portalSteps: PortalTourStep[];
  currentPortalStep: PortalTourStep | null;

  startTour: (initialStage?: DemoTourStage) => void;
  exitTour: () => void;
  resetTour: () => void;
  nextStage: () => void;
  previousStage: () => void;
  goToStage: (stage: DemoTourStage) => void;
  applyBimPreset: (presetId: string) => void;
  toggleFullscreen: () => void;
  completeVideo: () => void;

  // Portal tour actions
  startPortalTour: (initialIndex?: number) => void;
  exitPortalTour: () => void;
  nextPortalStep: () => void;
  prevPortalStep: () => void;
  togglePortalTourPause: () => void;
  setPortalTourPaused: (paused: boolean) => void;
  setRequestedPortalTab: (tab: string | null) => void;
  goToPortalStep: (index: number) => void;
}

const STAGE_ORDER: DemoTourStage[] = ['landing', 'portal', 'bim', 'future'];

const noop = () => undefined;

const defaultState: DemoTourState = {
  isTourActive: false,
  stage: 'landing',
  isFullscreen: false,
  activeBimPreset: null,
  stepIndex: 1,
  totalSteps: 4,
  activeVideo: null,
  completedVideos: [],
  isPreparingStage: false,

  isPortalTourActive: false,
  portalStepIndex: 0,
  isPortalTourPaused: false,
  requestedPortalTab: null,
  portalSteps: PORTAL_TOUR_STEPS,
  currentPortalStep: PORTAL_TOUR_STEPS[0],

  startTour: noop,
  exitTour: noop,
  resetTour: noop,
  nextStage: noop,
  previousStage: noop,
  goToStage: noop,
  applyBimPreset: noop,
  toggleFullscreen: noop,
  completeVideo: noop,

  startPortalTour: noop,
  exitPortalTour: noop,
  nextPortalStep: noop,
  prevPortalStep: noop,
  togglePortalTourPause: noop,
  setPortalTourPaused: noop,
  setRequestedPortalTab: noop,
  goToPortalStep: noop,
};

const DemoTourContext = createContext<DemoTourState>(defaultState);

export const DemoTourProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [stage, setStage] = useState<DemoTourStage>('landing');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeBimPreset, setActiveBimPreset] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<DemoVideoId | null>(null);
  const [completedVideos, setCompletedVideos] = useState<DemoVideoId[]>([]);
  const [isPreparingStage, setIsPreparingStage] = useState(false);

  // Portal tour specific states
  const [isPortalTourActive, setIsPortalTourActive] = useState(false);
  const [portalStepIndex, setPortalStepIndex] = useState(0);
  const [isPortalTourPaused, setIsPortalTourPaused] = useState(false);
  const [requestedPortalTab, setRequestedPortalTab] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatingRef = useRef(false);

  // Sync stage with current location if tour is active
  useEffect(() => {
    if (!isTourActive || isNavigatingRef.current || activeVideo) return;

    if (location.pathname === '/' && stage !== 'intro' && stage !== 'landing') {
      setStage('landing');
      setIsPortalTourActive(false);
    } else if (
      (location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/architect') ||
        location.pathname.startsWith('/admin')) &&
      stage !== 'portal'
    ) {
      setStage('portal');
    } else if (location.pathname === '/workspace' && stage !== 'bim' && stage !== 'future') {
      setStage('bim');
      setIsPortalTourActive(false);
    }
  }, [location.pathname, isTourActive, stage, activeVideo]);

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

  const startPortalTour = useCallback((initialIndex: number = 0) => {
    const safeIndex = Math.max(0, Math.min(initialIndex, PORTAL_TOUR_STEPS.length - 1));
    setIsTourActive(true);
    setStage('portal');
    setIsPortalTourActive(true);
    setPortalStepIndex(safeIndex);
    setIsPortalTourPaused(false);
    setRequestedPortalTab(PORTAL_TOUR_STEPS[safeIndex].tab ?? 'Overview');
  }, []);

  const exitPortalTour = useCallback(() => {
    setIsPortalTourActive(false);
    setRequestedPortalTab(null);
  }, []);

  const goToPortalStep = useCallback((index: number) => {
    if (index >= 0 && index < PORTAL_TOUR_STEPS.length) {
      setPortalStepIndex(index);
      setRequestedPortalTab(PORTAL_TOUR_STEPS[index].tab ?? null);
    }
  }, []);

  const togglePortalTourPause = useCallback(() => {
    setIsPortalTourPaused((prev) => !prev);
  }, []);

  const establishDemoAccess = useCallback(async () => {
    const session = await authService.signIn('mariana.solano@arch-tech.studio', 'client-access');
    if (!session || session.role !== 'client') throw new Error('The demo portal session could not be established.');
    if (projectService.isRemote()) await projectService.list();
    const user = getPortalUser(session.email);
    const project = getPortalProject('zona-franca-la-lima');
    const canAccessProject = user && getProjectsForUser(user.id).some((candidate) => candidate.id === project?.id);
    if (!project || !canAccessProject) throw new Error('The demo account is not authorized for Zona Franca La Lima.');
    return session;
  }, []);

  const waitForPortalMount = useCallback(async () => {
    if (document.querySelector('[data-tour-id="portal-tour-overview"]')) return;
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-tour-id="portal-tour-overview"]')) return;
        observer.disconnect();
        resolve();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }, []);

  const enterDemoPortal = useCallback(async () => {
    await establishDemoAccess();
    setStage('portal');
    navigate('/dashboard/projects/zona-franca-la-lima');
    await waitForPortalMount();
    startPortalTour(0);
  }, [establishDemoAccess, navigate, startPortalTour, waitForPortalMount]);

  const prepareBim = useCallback(async (presetId: 'masterplan' | 'future-vision') => {
    await establishDemoAccess();
    setIsPortalTourActive(false);
    setRequestedPortalTab(null);
    setStage(presetId === 'future-vision' ? 'future' : 'bim');
    navigate('/workspace');

    for (let attempt = 0; attempt < 100 && !bimEngine.world?.scene?.three; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await bimEngine.waitForInit();
    const scene = bimEngine.world?.scene?.three;
    if (!scene) throw new Error('The BIM workspace did not initialize.');

    if (useBimStore.getState().activeSiteContextId !== LA_LIMA_SITE_CONTEXT_ID) {
      await IfcLoaderService.unload();
      const currentScene = bimEngine.world?.scene?.three;
      if (!currentScene) throw new Error('The BIM scene is unavailable.');
      laLimaSiteContextService.attach(currentScene);
      laLimaSiteContextService.load();
      const store = useBimStore.getState();
      store.setActiveSiteContextId(LA_LIMA_SITE_CONTEXT_ID);
      store.setActiveSiteContextLabel('La Lima Site');
      bimEngine.setCameraMode('perspective');
      store.setCameraMode('perspective');
    }
    applyBimPreset(presetId);
  }, [applyBimPreset, establishDemoAccess, navigate]);

  const enterStage = useCallback(async (targetStage: DemoTourStage) => {
    isNavigatingRef.current = true;
    try {
      if (targetStage === 'landing' || targetStage === 'intro') {
        setIsPortalTourActive(false);
        setStage(targetStage === 'intro' ? 'intro' : 'landing');
        if (location.pathname !== '/') navigate('/');
      } else if (targetStage === 'portal') {
        await enterDemoPortal();
      } else {
        await prepareBim(targetStage === 'future' ? 'future-vision' : 'masterplan');
      }
    } finally {
      isNavigatingRef.current = false;
    }
  }, [enterDemoPortal, location.pathname, navigate, prepareBim]);

  const goToStage = useCallback(
    (targetStage: DemoTourStage) => {
      if (targetStage === 'intro') {
        if (completedVideos.includes('intro')) {
          void enterStage('landing');
          return;
        }
        setStage('intro');
        setActiveVideo('intro');
        if (location.pathname !== '/') navigate('/');
        return;
      }
      const video = targetStage === 'portal' ? 'portal' : targetStage === 'bim' ? 'bim' : targetStage === 'future' ? 'future' : null;
      if (video && !completedVideos.includes(video)) {
        setActiveVideo(video);
        return;
      }
      void enterStage(targetStage);
    },
    [completedVideos, enterStage, location.pathname, navigate]
  );

  const completeVideo = useCallback(() => {
    if (!activeVideo || isPreparingStage) return;
    const video = activeVideo;
    const targetStage: DemoTourStage = video === 'intro' ? 'landing' : video;
    setCompletedVideos((current) => current.includes(video) ? current : [...current, video]);
    setIsPreparingStage(true);
    void enterStage(targetStage)
      .then(() => {
        setIsPreparingStage(false);
        setTimeout(() => setActiveVideo(null), 300);
      })
      .catch((error) => console.error('Demo stage preparation failed:', error))
      .finally(() => setIsPreparingStage(false));
  }, [activeVideo, enterStage, isPreparingStage]);

  const nextPortalStep = useCallback(() => {
    if (portalStepIndex < PORTAL_TOUR_STEPS.length - 1) {
      const nextIndex = portalStepIndex + 1;
      setPortalStepIndex(nextIndex);
      setRequestedPortalTab(PORTAL_TOUR_STEPS[nextIndex].tab ?? null);
    } else {
      // Step 08 transition into BIM
      exitPortalTour();
      goToStage('bim');
    }
  }, [portalStepIndex, exitPortalTour, goToStage]);

  const prevPortalStep = useCallback(() => {
    if (portalStepIndex > 0) {
      const prevIndex = portalStepIndex - 1;
      setPortalStepIndex(prevIndex);
      setRequestedPortalTab(PORTAL_TOUR_STEPS[prevIndex].tab ?? null);
    }
  }, [portalStepIndex]);

  const startTour = useCallback(
    (initialStage: DemoTourStage = 'intro') => {
      setIsTourActive(true);
      goToStage(initialStage);
    },
    [goToStage]
  );

  const exitTour = useCallback(() => {
    setIsTourActive(false);
    setActiveVideo(null);
    setIsPortalTourActive(false);
    setActiveBimPreset(null);
    setRequestedPortalTab(null);
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  const resetTour = useCallback(() => {
    setIsPortalTourActive(false);
    setRequestedPortalTab(null);
    setCompletedVideos([]);
    useBimStore.getState().resetModel();
    setStage('intro');
    setActiveVideo('intro');
    if (location.pathname !== '/') navigate('/');
  }, [location.pathname, navigate]);

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
  const currentPortalStep = PORTAL_TOUR_STEPS[portalStepIndex] ?? null;

  const value = useMemo<DemoTourState>(
    () => ({
      isTourActive,
      stage,
      isFullscreen,
      activeBimPreset,
      stepIndex,
      totalSteps: STAGE_ORDER.length,
      activeVideo,
      completedVideos,
      isPreparingStage,

      isPortalTourActive,
      portalStepIndex,
      isPortalTourPaused,
      requestedPortalTab,
      portalSteps: PORTAL_TOUR_STEPS,
      currentPortalStep,

      startTour,
      exitTour,
      resetTour,
      nextStage,
      previousStage,
      goToStage,
      applyBimPreset,
      toggleFullscreen,
      completeVideo,

      startPortalTour,
      exitPortalTour,
      nextPortalStep,
      prevPortalStep,
      togglePortalTourPause,
      setPortalTourPaused: setIsPortalTourPaused,
      setRequestedPortalTab,
      goToPortalStep,
    }),
    [
      isTourActive,
      stage,
      isFullscreen,
      activeBimPreset,
      stepIndex,
      activeVideo,
      completedVideos,
      isPreparingStage,
      isPortalTourActive,
      portalStepIndex,
      isPortalTourPaused,
      requestedPortalTab,
      currentPortalStep,
      startTour,
      exitTour,
      resetTour,
      nextStage,
      previousStage,
      goToStage,
      applyBimPreset,
      toggleFullscreen,
      completeVideo,
      startPortalTour,
      exitPortalTour,
      nextPortalStep,
      prevPortalStep,
      togglePortalTourPause,
      goToPortalStep,
    ]
  );

  return <DemoTourContext.Provider value={value}>{children}</DemoTourContext.Provider>;
};

export const useDemoTour = (): DemoTourState => useContext(DemoTourContext);
