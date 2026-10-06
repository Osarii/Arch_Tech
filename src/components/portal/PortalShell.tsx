import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { LogOut, Moon, Sun, Sliders } from 'lucide-react';
import { useInRouterContext, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ArchTechLogo } from '../brand/ArchTechLogo';
import { PortalRole, getPortalUser } from '../../portal/data';
import { portalAuth } from '../../portal/demoAuth';
import { roleHome } from '../../router/guards';
import {
  AccessibilityPreferences,
  DEFAULT_A11Y_PREFERENCES,
  applyAccessibilityClasses,
  extractMainContentWithMap,
  getHoveredWordAtPoint,
  getRectForCharIndex,
  loadAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../../portal/accessibility';
import { AccessibilityPanel } from './AccessibilityPanel';
import { AccessibilityOverlay } from './AccessibilityOverlay';

export interface PortalShellProps {
  role: PortalRole;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
  children?: React.ReactNode;
}

export interface NavItemConfig {
  key: string;
  label: string;
  path: string;
}

export const PORTAL_NAV_ITEMS: Record<PortalRole, NavItemConfig[]> = {
  client: [
    { key: 'overview', label: 'Overview', path: '/dashboard' },
    { key: 'projects', label: 'Projects', path: '/dashboard/projects' },
    { key: 'documents', label: 'Documents', path: '/dashboard/documents' },
    { key: 'approvals', label: 'Approvals', path: '/dashboard/approvals' },
    { key: 'insights', label: 'Insights', path: '/dashboard/insights' },
    { key: 'assistant', label: 'Assistant', path: '/dashboard/assistant' },
  ],
  architect: [
    { key: 'overview', label: 'Overview', path: '/architect' },
    { key: 'projects', label: 'Projects', path: '/architect/projects' },
    { key: 'approvals', label: 'Approvals', path: '/architect/approvals' },
    { key: 'documents', label: 'Documents', path: '/architect/documents' },
    { key: 'insights', label: 'Insights', path: '/architect/insights' },
    { key: 'assistant', label: 'Assistant', path: '/architect/assistant' },
  ],
  admin: [
    { key: 'overview', label: 'Overview', path: '/admin' },
    { key: 'projects', label: 'Projects', path: '/admin/projects' },
    { key: 'people', label: 'People', path: '/admin/people' },
    { key: 'approvals', label: 'Approvals', path: '/admin/approvals' },
    { key: 'analytics', label: 'Analytics', path: '/admin/analytics' },
    { key: 'assistant', label: 'Assistant', path: '/admin/assistant' },
  ],
};

export interface PortalShellContextValue {
  insideShell: boolean;
  navigate: (path: string) => void;
}

export const PortalShellContext = createContext<PortalShellContextValue>({
  insideShell: false,
  navigate: (path: string) => {
    if (typeof window !== 'undefined') window.location.pathname = path;
  },
});

export const usePortalShell = () => useContext(PortalShellContext);

interface ShellCoreProps extends PortalShellProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const PortalShellCore: React.FC<ShellCoreProps> = ({
  role,
  onSignOut,
  children,
  currentPath,
  navigate,
}) => {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('arch-tech-portal-theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() =>
    loadAccessibilityPreferences()
  );
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const a11yTriggerRef = useRef<HTMLButtonElement>(null);

  const [speechState, setSpeechState] = useState<'unsupported' | 'idle' | 'playing' | 'paused'>('idle');
  const speechStateRef = useRef(speechState);
  speechStateRef.current = speechState;
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechHighlightRect, setSpeechHighlightRect] = useState<DOMRect | null>(null);

  const [pointerY, setPointerY] = useState<number | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const hoverTimerRef = useRef<any>(null);
  const lastHoverWordRef = useRef<string | null>(null);

  // Check speech synthesis support and load voices with clean lifecycle
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechState('unsupported');
      return;
    }

    const loadVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) setAvailableVoices(v);
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

  // Theme synchronization
  useEffect(() => {
    document.documentElement.classList.toggle('portal-dark', dark);
    try {
      window.localStorage.setItem('arch-tech-portal-theme', dark ? 'dark' : 'light');
    } catch {
      // theme in memory
    }
  }, [dark]);

  // Apply accessibility classes & persist
  useEffect(() => {
    applyAccessibilityClasses(preferences);
    saveAccessibilityPreferences(preferences);
  }, [preferences]);

  // Full-page narrator methods
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeechState('idle');
      setSpeechHighlightRect(null);
      setAnnouncement('Speech stopped');
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
    if (preferences.voiceURI) {
      const v = availableVoices.find((voice) => voice.voiceURI === preferences.voiceURI);
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => {
      setSpeechState('playing');
      setAnnouncement('Narration started');
    };
    utterance.onpause = () => {
      setSpeechState('paused');
      setAnnouncement('Narration paused');
    };
    utterance.onresume = () => {
      setSpeechState('playing');
      setAnnouncement('Narration resumed');
    };
    utterance.onend = () => {
      setSpeechState('idle');
      setSpeechHighlightRect(null);
      setAnnouncement('Narration ended');
    };
    utterance.onerror = () => {
      setSpeechState('idle');
      setSpeechHighlightRect(null);
    };

    // Boundary events for real-time word highlighting
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
    stopSpeech();
    return () => {
      stopSpeech();
    };
  }, [currentPath]);

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

      // Check if pointer is still inside the current hovered word box
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
          if (preferences.voiceURI) {
            const v = availableVoices.find((voice) => voice.voiceURI === preferences.voiceURI);
            if (v) utterance.voice = v;
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
    availableVoices,
  ]);

  const handleUpdatePreferences = (updates: Partial<AccessibilityPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
    const key = Object.keys(updates)[0];
    if (key) setAnnouncement(`Updated accessibility preference: ${key}`);
  };

  const handleResetPreferences = () => {
    setPreferences({ ...DEFAULT_A11Y_PREFERENCES });
    setAnnouncement('Accessibility preferences reset to default');
  };

  const hasActivePreferences =
    preferences.speed !== 1 ||
    preferences.hoverReader ||
    !preferences.spokenWordHighlight ||
    preferences.readingGuide ||
    preferences.readingMask ||
    preferences.textScale !== '100' ||
    preferences.textSpacing ||
    preferences.colorSafe ||
    preferences.highContrast ||
    preferences.highlightLinks ||
    preferences.reduceMotion;

  const navItems = PORTAL_NAV_ITEMS[role];
  const homePath = roleHome(role);
  const session = portalAuth.getSession();
  const currentUser = session ? getPortalUser(session.email) : null;

  const handleSignOut = () => {
    stopSpeech();
    if (onSignOut) {
      onSignOut();
    } else {
      portalAuth.signOut();
      navigate('/');
    }
  };

  const roleLabel =
    role === 'admin'
      ? 'Executive Administration'
      : role === 'architect'
        ? 'Architect Studio'
        : 'Client Workspace';

  return (
    <PortalShellContext.Provider value={{ insideShell: true, navigate }}>
      <div className={`portal-surface ${role === 'admin' ? 'portal-admin' : ''} h-screen overflow-y-auto bg-[#D6CBB9] text-[#211E1A]`}>
        <header className="portal-header border-b border-black/20 bg-[#ABD1B5]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="GARNIER ARCHITECTURE home"
                className="flex items-center gap-3 text-left text-[#211E1A]"
              >
                <ArchTechLogo variant="mark" theme="dark" className="arch-tech-logo-portal" />
                <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-stone-400 sm:inline">
                  Portfolio Showcase / Concept Prototype
                </span>
              </button>
              <span className="hidden rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-stone-300 md:inline-block">
                {roleLabel}
              </span>
            </div>

            <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600">
              <button
                type="button"
                onClick={() => navigate(homePath)}
                className="transition-colors hover:text-black"
              >
                {role === 'admin' ? 'Register' : role === 'architect' ? 'Workboard' : 'Projects'}
              </button>

              <button
                type="button"
                onClick={() => setDark((value) => !value)}
                aria-label={dark ? 'Use light mode' : 'Use dark mode'}
                data-testid="theme-toggle"
                className="inline-flex items-center gap-2 transition-colors hover:text-black"
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}{' '}
                {dark ? 'Light' : 'Dark'}
              </button>

              {/* Compact GARNIER ARCHITECTURE accessibility control */}
              <button
                ref={a11yTriggerRef}
                type="button"
                onClick={() => setIsA11yPanelOpen(true)}
                aria-label="Open accessibility panel"
                aria-expanded={isA11yPanelOpen}
                data-testid="accessibility-panel-trigger"
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 transition-colors ${
                  hasActivePreferences
                    ? 'border-black/30 bg-black/10 text-black font-semibold'
                    : 'border-black/10 bg-transparent text-stone-500 hover:text-black hover:border-black/30'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>A11y</span>
                {hasActivePreferences && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Adjustments active" />
                )}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 transition-colors hover:text-black"
              >
                Sign out <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-navigation bar with real routes */}
          <div className="border-t border-black/15 bg-[#79B791]/35">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
              <nav
                aria-label={`${role} navigation`}
                className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none"
              >
                {navItems.map((item) => {
                  const isExact = currentPath === item.path;
                  const isSub =
                    item.path !== homePath &&
                    (currentPath === item.path || currentPath.startsWith(item.path + '/'));
                  const isActive = isExact || isSub;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      data-testid={`portal-nav-${item.key}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => navigate(item.path)}
                      className={`whitespace-nowrap px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                        isActive
                          ? 'border-b-2 border-black font-semibold text-black'
                          : 'text-stone-600 hover:text-black'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {currentUser && (
                <span className="hidden font-mono text-[9px] text-stone-400 lg:inline-block">
                  {currentUser.name} ({currentUser.email})
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
          {children ?? <Outlet />}
        </main>

        {/* Presentation-only reading overlay (Reading guide, mask, single word highlight) */}
        <AccessibilityOverlay
          highlightRect={speechHighlightRect || hoverRect}
          readingGuide={preferences.readingGuide}
          readingMask={preferences.readingMask}
          pointerY={pointerY}
          announcement={announcement}
        />

        {/* Unified GARNIER ARCHITECTURE accessibility panel */}
        <AccessibilityPanel
          isOpen={isA11yPanelOpen}
          onClose={() => setIsA11yPanelOpen(false)}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onResetPreferences={handleResetPreferences}
          speechState={speechState}
          onStartSpeech={startSpeech}
          onTogglePauseSpeech={toggleSpeechPause}
          onStopSpeech={stopSpeech}
          availableVoices={availableVoices}
          triggerRef={a11yTriggerRef}
        />
      </div>
    </PortalShellContext.Provider>
  );
};

const ShellInnerWithRouter: React.FC<PortalShellProps> = (props) => {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const navigate = (path: string) => {
    if (props.onNavigate) {
      props.onNavigate(path);
    } else {
      routerNavigate(path);
    }
  };
  return <PortalShellCore {...props} currentPath={location.pathname} navigate={navigate} />;
};

const ShellInnerWithoutRouter: React.FC<PortalShellProps> = (props) => {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return roleHome(props.role);
    const path = window.location.pathname;
    const home = roleHome(props.role);
    return path.startsWith(home) ? path : home;
  });

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (props.onNavigate) {
      props.onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  return <PortalShellCore {...props} currentPath={currentPath} navigate={navigate} />;
};

export const PortalShell: React.FC<PortalShellProps> = (props) => {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <ShellInnerWithRouter {...props} />;
  }
  return <ShellInnerWithoutRouter {...props} />;
};
