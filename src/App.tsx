import React, { useState, useEffect } from 'react';
import { Workspace } from './components/layout/Workspace';
import { LandingPage } from './components/landing/LandingPage';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('view') === 'workspace' ||
        params.get('app') === 'true' ||
        window.location.hash === '#workspace' ||
        window.location.hash === '#/workspace'
      ) {
        return 'workspace';
      }
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#workspace' || hash === '#/workspace') {
        setCurrentView('workspace');
      } else if (hash === '' || hash === '#landing' || hash === '#/landing' || hash === '#hero') {
        setCurrentView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenWorkspace = () => {
    window.location.hash = '#workspace';
    setCurrentView('workspace');
  };

  const handleBackToLanding = () => {
    window.location.hash = '#landing';
    setCurrentView('landing');
  };

  return (
    <div className="w-full h-full">
      {currentView === 'landing' ? (
        <LandingPage onOpenWorkspace={handleOpenWorkspace} />
      ) : (
        <div className="relative w-full h-full">
          <button
            onClick={handleBackToLanding}
            data-testid="btn-back-to-landing"
            className="fixed top-2.5 right-64 z-50 px-2 py-1 rounded bg-[#181c26]/90 hover:bg-[#222736] text-[11px] font-mono text-stone-300 hover:text-white border border-white/10 shadow-sm backdrop-blur transition flex items-center space-x-1"
            title="Return to Architectural Landing Page"
          >
            <span>← Landing</span>
          </button>
          <Workspace />
        </div>
      )}
    </div>
  );
};

export default App;
