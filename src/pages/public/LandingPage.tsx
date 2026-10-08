import React, { useEffect, useState } from 'react';
import { Footer } from '../../components/landing/Footer';
import { Hero } from '../../components/landing/Hero';
import { LandingNavbar } from '../../components/landing/LandingNavbar';
import { ProjectShowcase } from '../../components/landing/ProjectShowcase';
import { CapabilityRegister } from '../../components/landing/CapabilityRegister';
import { DevelopmentFrame } from '../../components/landing/DevelopmentFrame';
import { AboutSection } from '../../components/landing/AboutSection';
import { TeamSection } from '../../components/landing/TeamSection';
import { ScrollProgressBar } from '../../components/motion/ScrollProgressBar';
import { NewsSection } from '../../components/news/NewsSection';
import { useAccessibility } from '../../portal/useAccessibility';
import { AccessibilityOverlay } from '../../components/portal/AccessibilityOverlay';
import { AccessibilityPanel } from '../../components/portal/AccessibilityPanel';
import { LandingAssistantLauncher } from '../../components/landing/LandingAssistantLauncher';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onLogin: (trigger?: HTMLElement) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLogin }) => {
  const [lightTheme, setLightTheme] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('garnier-public-theme') === 'light');
  useEffect(() => { window.localStorage.setItem('garnier-public-theme', lightTheme ? 'light' : 'dark'); }, [lightTheme]);
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
      className={`landing-surface ${
        lightTheme
          ? 'landing-light bg-[#F5F3EF] text-[#17181A] selection:bg-[#D4E7DC] selection:text-[#17181A]'
          : 'bg-[#000000] text-[#EDF4ED] selection:bg-[#ABD1B5] selection:text-black'
      } h-screen w-full overflow-y-auto overflow-x-hidden scroll-smooth font-sans`}
    >
      <ScrollProgressBar />
      <LandingNavbar
        onLogin={onLogin}
        onNavigate={onNavigate}
        onOpenA11y={() => setIsA11yPanelOpen(true)}
        isA11yPanelOpen={isA11yPanelOpen}
        lightTheme={lightTheme}
        onToggleTheme={() => setLightTheme((value) => !value)}
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
      <LandingAssistantLauncher lightTheme={lightTheme} />

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
