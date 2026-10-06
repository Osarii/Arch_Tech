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

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onLogin: (trigger?: HTMLElement) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLogin }) => {
  const viewProjects = () => document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div data-landing-scroll-container className="landing-surface h-screen w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[#000000] font-sans text-[#EDF4ED] selection:bg-[#ABD1B5] selection:text-black">
      <ScrollProgressBar />
      <LandingNavbar onLogin={onLogin} onNavigate={onNavigate} />
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
    </div>
  );
};
