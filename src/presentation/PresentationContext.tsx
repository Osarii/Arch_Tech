import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useBimStore } from '@/stores/bimStore';
import type { ToolType } from '@/types/bim';
import { getPresentationComponent, presentationChapters, type PresentationAssistantContext, type PresentationChapter } from './componentRegistry';
import { audioNarration, type PlaybackTier } from './audioNarrationService';

export type { PresentationAssistantContext, PresentationChapter } from './componentRegistry';
export type { PlaybackTier } from './audioNarrationService';

type PresentationState = {
  isActive: boolean;
  isPaused: boolean;
  isExploring: boolean;
  isVoiceEnabled: boolean;
  playbackTier: PlaybackTier;
  chapterIndex: number;
  chapter: PresentationChapter;
  currentComponentId: string | null;
  assistantContext: PresentationAssistantContext;
  start: () => void;
  exit: () => void;
  restart: () => void;
  previous: () => void;
  next: () => void;
  goToChapter: (index: number) => void;
  setPaused: (paused: boolean) => void;
  setExploring: (exploring: boolean) => void;
  toggleVoice: () => void;
  setCurrentComponentId: (id: string | null) => void;
};

const noop = () => undefined;
const defaultChapter = presentationChapters[0];
const defaultContext: PresentationState = {
  isActive: false,
  isPaused: false,
  isExploring: false,
  isVoiceEnabled: true,
  playbackTier: 'audio',
  chapterIndex: 0,
  chapter: defaultChapter,
  currentComponentId: null,
  assistantContext: {
    chapter: 'ARCH_TECH',
    section: 'Opening',
    projectContext: 'ARCH_TECH platform overview',
    currentComponent: null,
  },
  start: noop,
  exit: noop,
  restart: noop,
  previous: noop,
  next: noop,
  goToChapter: noop,
  setPaused: noop,
  setExploring: noop,
  toggleVoice: noop,
  setCurrentComponentId: noop,
};

const PresentationContext = createContext<PresentationState>(defaultContext);

export const PresentationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setPausedState] = useState(false);
  const [isExploring, setExploringState] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [playbackTier, setPlaybackTier] = useState<PlaybackTier>('audio');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [currentComponentId, setCurrentComponentId] = useState<string | null>(null);

  const selectedElement = useBimStore((state) => state.selectedElement);
  const selectedSceneElements = useBimStore((state) => state.selectedSceneElements);

  // Store initial BIM state snapshot to restore on exit
  const snapshotRef = useRef<{
    activeTool: ToolType;
    selectedElement: typeof selectedElement;
  } | null>(null);

  const chapter = presentationChapters[chapterIndex] ?? presentationChapters[0];
  const currentComponent = getPresentationComponent(currentComponentId ?? chapter.componentIds[0] ?? null);
  const selectedBimContext =
    selectedElement?.name ?? (selectedSceneElements.map((element) => element.name).join(', ') || undefined);

  // Subscribe to audioNarration state
  useEffect(() => {
    setPlaybackTier(audioNarration.getPlaybackTier());
    const unsubscribe = audioNarration.subscribe((state) => {
      setPlaybackTier(state.tier);
    });
    return unsubscribe;
  }, []);

  // Safe non-destructive BIM tool selection for specific presentation chapters
  useEffect(() => {
    if (!isActive) return;

    if (chapter.id === 'analysis') {
      useBimStore.getState().setActiveTool('measure');
      useBimStore.getState().setMeasureMode('distance');
    } else if (chapter.id === 'bim-exploration') {
      useBimStore.getState().setActiveTool('select');
    }
  }, [isActive, chapter.id]);

  const start = useCallback(() => {
    const store = useBimStore.getState();
    snapshotRef.current = {
      activeTool: store.activeTool,
      selectedElement: store.selectedElement,
    };
    setChapterIndex(0);
    setCurrentComponentId(null);
    setExploringState(false);
    setPausedState(false);
    setIsActive(true);
  }, []);

  const exit = useCallback(() => {
    audioNarration.stop();
    // Restore BIM tool snapshot safely
    if (snapshotRef.current) {
      const store = useBimStore.getState();
      store.setActiveTool(snapshotRef.current.activeTool);
      snapshotRef.current = null;
    }
    setIsActive(false);
    setExploringState(false);
    setPausedState(false);
    setCurrentComponentId(null);
    setChapterIndex(0);
  }, []);

  const restart = useCallback(() => {
    audioNarration.stop();
    setChapterIndex(0);
    setCurrentComponentId(null);
    setExploringState(false);
    setPausedState(false);
  }, []);

  const previous = useCallback(() => {
    audioNarration.stop();
    setCurrentComponentId(null);
    setChapterIndex((index) => Math.max(0, index - 1));
  }, []);

  const next = useCallback(() => {
    audioNarration.stop();
    setCurrentComponentId(null);
    setChapterIndex((index) => Math.min(presentationChapters.length - 1, index + 1));
  }, []);

  const goToChapter = useCallback((index: number) => {
    audioNarration.stop();
    setCurrentComponentId(null);
    setChapterIndex(Math.max(0, Math.min(presentationChapters.length - 1, index)));
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    setPausedState(paused);
    if (paused) {
      audioNarration.pause();
    } else {
      audioNarration.resume();
    }
  }, []);

  const setExploring = useCallback((exploring: boolean) => {
    setExploringState(exploring);
    if (exploring) {
      // Pause narration and preserve position
      audioNarration.pause();
      setPausedState(true);
    } else {
      // Returning from explore allows resuming safely
      setPausedState(false);
      audioNarration.resume();
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled((prev) => {
      const nextVal = !prev;
      audioNarration.setMuted(!nextVal);
      return nextVal;
    });
  }, []);

  const value = useMemo<PresentationState>(
    () => ({
      isActive,
      isPaused,
      isExploring,
      isVoiceEnabled,
      playbackTier,
      chapterIndex,
      chapter,
      currentComponentId,
      assistantContext: {
        chapter: chapter.headline,
        section: chapter.section,
        projectContext: 'ARCH_TECH enterprise development platform',
        currentComponent,
        selectedBimContext,
        route: chapter.route,
      },
      start,
      exit,
      restart,
      previous,
      next,
      goToChapter,
      setPaused,
      setExploring,
      toggleVoice,
      setCurrentComponentId,
    }),
    [
      isActive,
      isPaused,
      isExploring,
      isVoiceEnabled,
      playbackTier,
      chapterIndex,
      chapter,
      currentComponentId,
      currentComponent,
      selectedBimContext,
      start,
      exit,
      restart,
      previous,
      next,
      goToChapter,
      setPaused,
      setExploring,
      toggleVoice,
    ]
  );

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
};

export const usePresentation = (): PresentationState => useContext(PresentationContext);
