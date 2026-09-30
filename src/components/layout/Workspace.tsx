import React from 'react';
import { HeaderBar } from './HeaderBar';
import { SpatialTreePanel } from '../panels/SpatialTreePanel';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { BimViewport } from '../bim/BimViewport';
import { BottomToolbar } from '../toolbar/BottomToolbar';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';

export const Workspace: React.FC = () => {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#0d0f12]">
      {/* Top Header */}
      <HeaderBar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Spatial BIM Tree */}
        <SpatialTreePanel />

        {/* Center: Viewport & Floating Tools */}
        <main className="flex-1 relative h-full overflow-hidden flex flex-col">
          <BimViewport />
          <PerformanceMonitor />
          <BottomToolbar />
        </main>

        {/* Right: Properties Inspector */}
        <PropertiesPanel />
      </div>
    </div>
  );
};
