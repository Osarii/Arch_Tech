import React from 'react';

export interface AccessibilityOverlayProps {
  highlightRect: DOMRect | null;
  readingGuide: boolean;
  readingMask: boolean;
  pointerY: number | null;
  announcement?: string;
}

export const AccessibilityOverlay: React.FC<AccessibilityOverlayProps> = ({
  highlightRect,
  readingGuide,
  readingMask,
  pointerY,
  announcement,
}) => {
  return (
    <>
      {/* Live announcement region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="a11y-live-announcer"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Reading Mask: Dims content outside the active reading band */}
      {readingMask && pointerY !== null && (
        <div
          data-testid="reading-mask"
          aria-hidden="true"
          className="portal-reading-mask pointer-events-none fixed left-0 right-0 z-[9997]"
          style={{
            top: `${Math.max(0, pointerY - 45)}px`,
            height: '90px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            borderTop: '1px solid rgba(255, 255, 255, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        />
      )}

      {/* Reading Guide: Horizontal pointer-following ruler */}
      {readingGuide && pointerY !== null && (
        <div
          data-testid="reading-guide"
          aria-hidden="true"
          className="portal-reading-guide pointer-events-none fixed left-0 right-0 z-[9998]"
          style={{
            top: `${pointerY}px`,
            height: '2px',
          }}
        />
      )}

      {/* One reusable Word Highlight Overlay */}
      {highlightRect && (
        <div
          data-testid="word-highlight-overlay"
          aria-hidden="true"
          className="portal-word-highlight pointer-events-none fixed z-[9999]"
          style={{
            top: `${highlightRect.top}px`,
            left: `${highlightRect.left}px`,
            width: `${highlightRect.width}px`,
            height: `${highlightRect.height}px`,
          }}
        />
      )}
    </>
  );
};
