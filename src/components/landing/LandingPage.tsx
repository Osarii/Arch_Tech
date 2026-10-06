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

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onLogin: (trigger?: HTMLElement) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLogin }) => {
  const viewProjects = () => document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div data-landing-scroll-container className="h-screen w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[#0a0b0d] font-sans text-[#f4efe8] selection:bg-stone-300 selection:text-black">
      <ScrollProgressBar />
      <LandingNavbar onLogin={onLogin} />
      <main>
        <Hero onViewProjects={viewProjects} onOpenProject={(id) => onNavigate(`/projects/${id}`)} />
        <ProjectShowcase onOpenProject={(id) => onNavigate(`/projects/${id}`)} />
        <AboutSection />
        <CapabilityRegister />
        <TeamSection />
        <DevelopmentFrame onLogin={onLogin} />
      </main>
      <Footer onLogin={onLogin} />
    </div>
  );
};
