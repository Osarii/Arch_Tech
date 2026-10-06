import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityPreferences,
  DEFAULT_A11Y_PREFERENCES,
  applyAccessibilityClasses,
  extractMainContentWithMap,
  filterAndRankVoices,
  getBestVoiceForLocale,
  getHoveredWordAtPoint,
  getRectForCharIndex,
  loadAccessibilityPreferences,
  saveAccessibilityPreferences,
} from './accessibility';
import { SiteLocale, useLocale } from './locale';

export interface UseAccessibilityOptions {
  forcedLocale?: SiteLocale;
  currentPath?: string;
}

export function useAccessibility(options?: UseAccessibilityOptions) {
  const { locale: contextLocale } = useLocale();
  const activeLocale = options?.forcedLocale ?? contextLocale;

  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() =>
    loadAccessibilityPreferences()
  );
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const a11yTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [speechState, setSpeechState] = useState<'unsupported' | 'idle' | 'playing' | 'paused'>('idle');
  const speechStateRef = useRef(speechState);
  speechStateRef.current = speechState;

  const [rawVoices, setRawVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechHighlightRect, setSpeechHighlightRect] = useState<DOMRect | null>(null);

  const [pointerY, setPointerY] = useState<number | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const hoverTimerRef = useRef<any>(null);
  const lastHoverWordRef = useRef<string | null>(null);

  // Filtered and prioritized voices according to active locale
  const availableVoices = filterAndRankVoices(rawVoices, activeLocale);

  // Initialize SpeechSynthesis and voice collection
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechState('unsupported');
      return;
    }

    const loadVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) setRawVoices(v);
      } catch {
        // Voice loading fallback
      }
    };

    loadVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window.speechSynthesis.removeEventListener === 'function') {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      } else if (window.speechSynthesis.onvoiceschanged === loadVoices) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Synchronize CSS classes and localStorage when preferences change
  useEffect(() => {
    applyAccessibilityClasses(preferences);
    saveAccessibilityPreferences(preferences);
  }, [preferences]);

  // When active locale changes, auto-resolve compatible voice if previously selected voice is incompatible
  useEffect(() => {
    if (rawVoices.length === 0) return;
    const currentVoiceURI = preferences.voiceURI;
    const currentVoice = rawVoices.find((v) => v.voiceURI === currentVoiceURI);
    const isVoiceCompatible =
      currentVoice &&
      (activeLocale === 'es'
        ? (currentVoice.lang || '').toLowerCase().startsWith('es')
        : (currentVoice.lang || '').toLowerCase().startsWith('en'));

    if (!isVoiceCompatible && currentVoiceURI) {
      // Find stored voice preference for this locale or best available voice
      const preferredForLocale = preferences.voiceByLocale?.[activeLocale];
      const bestVoice = getBestVoiceForLocale(rawVoices, activeLocale, preferredForLocale);
      if (bestVoice && bestVoice.voiceURI !== preferences.voiceURI) {
        setPreferences((prev) => ({
          ...prev,
          voiceURI: bestVoice.voiceURI,
        }));
      }
    }
  }, [activeLocale, rawVoices]);

  // Full-page narrator methods
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      setSpeechState('idle');
      setSpeechHighlightRect(null);
      setAnnouncement(activeLocale === 'es' ? 'Voz detenida' : 'Speech stopped');
    }
  };

  const startSpeech = () => {
    if (speechState === 'unsupported' || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setHoverRect(null);

    const mainNode = document.querySelector('main');
    if (!mainNode) return;

    const extracted = extractMainContentWithMap(mainNode);
    if (!extracted.fullText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(extracted.fullText);
    utterance.rate = preferences.speed;

    // Pick best voice for active locale
    const chosenVoice = getBestVoiceForLocale(rawVoices, activeLocale, preferences.voiceURI);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang || (activeLocale === 'es' ? 'es-CR' : 'en-US');
    } else {
      utterance.lang = activeLocale === 'es' ? 'es-CR' : 'en-US';
    }

    utterance.onstart = () => {
      setSpeechState('playing');
      setAnnouncement(activeLocale === 'es' ? 'Narración iniciada' : 'Narration started');
    };
    utterance.onpause = () => {
      setSpeechState('paused');
      setAnnouncement(activeLocale === 'es' ? 'Narración pausada' : 'Narration paused');
    };
    utterance.onresume = () => {
      setSpeechState('playing');
      setAnnouncement(activeLocale === 'es' ? 'Narración reanudada' : 'Narration resumed');
    };
    utterance.onend = () => {
      setSpeechState('idle');
      setSpeechHighlightRect(null);
      setAnnouncement(activeLocale === 'es' ? 'Narración finalizada' : 'Narration ended');
    };
    utterance.onerror = () => {
      setSpeechState('idle');
      setSpeechHighlightRect(null);
    };

    // Boundary events for word highlighting
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (preferences.spokenWordHighlight) {
        const rect = getRectForCharIndex(extracted, event.charIndex, (event as any).charLength);
        if (rect) {
          setSpeechHighlightRect(rect);
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechPause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speechState === 'playing') {
      window.speechSynthesis.pause();
    } else if (speechState === 'paused') {
      window.speechSynthesis.resume();
    }
  };

  // Route change cancels narration
  useEffect(() => {
    if (options?.currentPath !== undefined) {
      stopSpeech();
    }
  }, [options?.currentPath]);

  // Pointer tracking for Reading Guide, Reading Mask, and Hover Reader
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!preferences.readingGuide && !preferences.readingMask && !preferences.hoverReader) {
      setPointerY(null);
      setHoverRect(null);
      return;
    }

    const handlePointerMove = (e: MouseEvent) => {
      if (preferences.readingGuide || preferences.readingMask) {
        setPointerY(e.clientY);
      }

      if (!preferences.hoverReader) return;

      // Full-page narration takes priority over Hover Reader
      if (speechState === 'playing' || speechState === 'paused') {
        if (hoverRect) setHoverRect(null);
        return;
      }

      // Check if pointer is still inside current hovered word box
      if (hoverRect) {
        if (
          e.clientX >= hoverRect.left &&
          e.clientX <= hoverRect.right &&
          e.clientY >= hoverRect.top &&
          e.clientY <= hoverRect.bottom
        ) {
          return;
        } else {
          setHoverRect(null);
          lastHoverWordRef.current = null;
        }
      }

      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
        if (speechStateRef.current === 'playing' || speechStateRef.current === 'paused') return;
        const result = getHoveredWordAtPoint(e.clientX, e.clientY);
        if (!result) {
          setHoverRect(null);
          lastHoverWordRef.current = null;
          return;
        }

        setHoverRect(result.rect);
        if (lastHoverWordRef.current === result.word) return;
        lastHoverWordRef.current = result.word;

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(result.word);
          utterance.rate = preferences.speed;
          const chosenVoice = getBestVoiceForLocale(rawVoices, activeLocale, preferences.voiceURI);
          if (chosenVoice) {
            utterance.voice = chosenVoice;
            utterance.lang = chosenVoice.lang || (activeLocale === 'es' ? 'es-CR' : 'en-US');
          } else {
            utterance.lang = activeLocale === 'es' ? 'es-CR' : 'en-US';
          }
          window.speechSynthesis.speak(utterance);
        }
      }, 150);
    };

    const handlePointerLeave = () => {
      if (preferences.readingGuide || preferences.readingMask) {
        setPointerY(null);
      }
      setHoverRect(null);
      lastHoverWordRef.current = null;
      clearTimeout(hoverTimerRef.current);
    };

    window.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      clearTimeout(hoverTimerRef.current);
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [
    preferences.readingGuide,
    preferences.readingMask,
    preferences.hoverReader,
    preferences.speed,
    preferences.voiceURI,
    speechState,
    hoverRect,
    rawVoices,
    activeLocale,
  ]);

  const handleUpdatePreferences = (updates: Partial<AccessibilityPreferences>) => {
    setPreferences((prev) => {
      const nextVoiceByLocale = { ...prev.voiceByLocale };
      if (updates.voiceURI !== undefined) {
        nextVoiceByLocale[activeLocale] = updates.voiceURI;
      }
      return {
        ...prev,
        ...updates,
        voiceByLocale: nextVoiceByLocale,
      };
    });
    const key = Object.keys(updates)[0];
    if (key) {
      setAnnouncement(
        activeLocale === 'es'
          ? `Preferencia de accesibilidad actualizada: ${key}`
          : `Updated accessibility preference: ${key}`
      );
    }
  };

  const handleResetPreferences = () => {
    setPreferences({ ...DEFAULT_A11Y_PREFERENCES });
    setAnnouncement(
      activeLocale === 'es'
        ? 'Preferencias de accesibilidad restablecidas'
        : 'Accessibility preferences reset to default'
    );
  };

  return {
    preferences,
    updatePreferences: handleUpdatePreferences,
    resetPreferences: handleResetPreferences,
    isA11yPanelOpen,
    setIsA11yPanelOpen,
    a11yTriggerRef,
    speechState,
    startSpeech,
    stopSpeech,
    toggleSpeechPause,
    availableVoices,
    speechHighlightRect,
    pointerY,
    hoverRect,
    announcement,
    activeLocale,
  };
}
