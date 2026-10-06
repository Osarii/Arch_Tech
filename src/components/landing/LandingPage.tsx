import React from 'react';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { LandingNavbar } from './LandingNavbar';
import { ProjectShowcase } from './ProjectShowcase';
import { CapabilityRegister } from './CapabilityRegister';
import { DevelopmentFrame } from './DevelopmentFrame';
import { AboutSection } from './AboutSection';
import { TeamSection } from './TeamSection';
import { ScrollProgressBar } from '../motion/ScrollProgressBar';
import { NewsSection } from '../news/NewsSection';
import { useAccessibility } from '../../portal/useAccessibility';
import { AccessibilityOverlay } from '../portal/AccessibilityOverlay';
import { AccessibilityPanel } from '../portal/AccessibilityPanel';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onLogin: (trigger?: HTMLElement) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLogin }) => {
  const {
    preferences,
    updatePreferences,
    resetPreferences,
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
  } = useAccessibility();

  const viewProjects = () => document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div
      data-landing-scroll-container
      className="landing-surface h-screen w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[#000000] font-sans text-[#EDF4ED] selection:bg-[#ABD1B5] selection:text-black"
    >
      <ScrollProgressBar />
      <LandingNavbar
        onLogin={onLogin}
        onNavigate={onNavigate}
        onOpenA11y={() => setIsA11yPanelOpen(true)}
        isA11yPanelOpen={isA11yPanelOpen}
      />
      <main>
        <Hero onViewProjects={viewProjects} onOpenProject={(id) => onNavigate(`/projects/${id}`)} />
        <ProjectShowcase onOpenProject={(id) => onNavigate(`/projects/${id}`)} />
        <NewsSection onNavigate={onNavigate} />
        <AboutSection />
        <CapabilityRegister />
        <TeamSection />
        <DevelopmentFrame onLogin={onLogin} />
      </main>
      <Footer onLogin={onLogin} />

      {/* Shared accessibility reading overlays */}
      <AccessibilityOverlay
        highlightRect={speechHighlightRect || hoverRect}
        readingGuide={preferences.readingGuide}
        readingMask={preferences.readingMask}
        pointerY={pointerY}
        announcement={announcement}
      />

      {/* Unified accessibility panel */}
      <AccessibilityPanel
        isOpen={isA11yPanelOpen}
        onClose={() => setIsA11yPanelOpen(false)}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
        onResetPreferences={resetPreferences}
        speechState={speechState}
        onStartSpeech={startSpeech}
        onTogglePauseSpeech={toggleSpeechPause}
        onStopSpeech={stopSpeech}
        availableVoices={availableVoices}
        triggerRef={a11yTriggerRef}
        locale={activeLocale}
      />
    </div>
  );
};
