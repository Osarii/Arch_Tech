import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { useBimStore } from '@/stores/bimStore';
import { getPresentationComponent, presentationChapters, type PresentationAssistantContext } from './componentRegistry';

export type { PresentationAssistantContext } from './componentRegistry';

type PresentationState = {
  isActive: boolean;
  isPaused: boolean;
  isExploring: boolean;
  chapterIndex: number;
  currentComponentId: string | null;
  assistantContext: PresentationAssistantContext;
  start: () => void;
  exit: () => void;
  previous: () => void;
  next: () => void;
  setPaused: (paused: boolean) => void;
  setExploring: (exploring: boolean) => void;
  setCurrentComponentId: (id: string | null) => void;
};

const noop = () => undefined;
const defaultContext: PresentationState = {
  isActive: false,
  isPaused: false,
  isExploring: false,
  chapterIndex: 0,
  currentComponentId: null,
  assistantContext: { chapter: 'ARCH_TECH', section: 'Opening', projectContext: 'ARCH_TECH platform overview', currentComponent: null },
  start: noop,
  exit: noop,
  previous: noop,
  next: noop,
  setPaused: noop,
  setExploring: noop,
  setCurrentComponentId: noop,
};

const PresentationContext = createContext<PresentationState>(defaultContext);

export const PresentationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [isExploring, setExploring] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [currentComponentId, setCurrentComponentId] = useState<string | null>(null);
  const selectedElement = useBimStore((state) => state.selectedElement);
  const selectedSceneElements = useBimStore((state) => state.selectedSceneElements);
  const snapshotRef = useRef<unknown>(null);

  const chapter = presentationChapters[chapterIndex];
  const currentComponent = getPresentationComponent(currentComponentId ?? chapter.componentIds[0] ?? null);
  const selectedBimContext = selectedElement?.name ?? (selectedSceneElements.map((element) => element.name).join(', ') || undefined);

  const value = useMemo<PresentationState>(() => ({
    isActive,
    isPaused,
    isExploring,
    chapterIndex,
    currentComponentId,
    assistantContext: {
      chapter: chapter.headline,
      section: chapter.section,
      projectContext: 'ARCH_TECH large-scale development platform',
      currentComponent,
      selectedBimContext,
    },
    start: () => {
      // Presentation is read-only; this snapshot documents the state it must never overwrite.
      snapshotRef.current = { activeTool: useBimStore.getState().activeTool, selectedElement: useBimStore.getState().selectedElement };
      setChapterIndex(0);
      setCurrentComponentId(null);
      setExploring(false);
      setPaused(false);
      setIsActive(true);
    },
    exit: () => {
      snapshotRef.current = null;
      setIsActive(false);
      setExploring(false);
      setPaused(false);
      setCurrentComponentId(null);
    },
    previous: () => {
      setCurrentComponentId(null);
      setChapterIndex((index) => Math.max(0, index - 1));
    },
    next: () => {
      setCurrentComponentId(null);
      setChapterIndex((index) => Math.min(presentationChapters.length - 1, index + 1));
    },
    setPaused,
    setExploring: (exploring) => {
      setExploring(exploring);
      if (exploring) setPaused(true);
    },
    setCurrentComponentId,
  }), [chapter, chapterIndex, currentComponent, currentComponentId, isActive, isExploring, isPaused, selectedBimContext]);

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
};

export const usePresentation = (): PresentationState => useContext(PresentationContext);
