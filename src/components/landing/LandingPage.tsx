import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { Hero } from './Hero';
import { ProductPreview } from './ProductPreview';
import { Capabilities } from './Capabilities';
import { Workflow } from './Workflow';
import { ProjectShowcase } from './ProjectShowcase';
import { TechnologyStrip } from './TechnologyStrip';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

interface LandingPageProps {
  onOpenWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenWorkspace }) => {
  return (
    <div className="w-full h-screen overflow-y-auto overflow-x-hidden bg-[#0a0b0d] text-[#f4efe8] scroll-smooth selection:bg-stone-300 selection:text-black font-sans">
      {/* Editorial Architectural Header / Navigation */}
      <LandingNavbar onOpenWorkspace={onOpenWorkspace} />

      <main className="relative">
        {/* 01. Hero Section: Large architectural image + typography */}
        <Hero onOpenWorkspace={onOpenWorkspace} />

        {/* 02. Product: One large real screenshot of the existing BIM workspace */}
        <ProductPreview onOpenWorkspace={onOpenWorkspace} />

        {/* 03. Capabilities: 3 large editorial rows */}
        <Capabilities />

        {/* 04. Workflow: Horizontal architectural diagram */}
        <Workflow />

        {/* 05. Selected Models: Large image-based architectural gallery */}
        <ProjectShowcase onOpenWorkspace={onOpenWorkspace} />

        {/* 06. Technology: Small understated footer-like strip */}
        <TechnologyStrip />

        {/* 07. Final Call to Action */}
        <FinalCTA onOpenWorkspace={onOpenWorkspace} />
      </main>

      {/* 08. Architectural Studio Footer */}
      <Footer onOpenWorkspace={onOpenWorkspace} />
    </div>
  );
};
