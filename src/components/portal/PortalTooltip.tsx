import React, { useState } from 'react';

export interface PortalTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<{
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    'aria-describedby'?: string;
  }>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const PortalTooltip: React.FC<PortalTooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = React.useId();

  if (!content) return children;

  const positionClasses =
    position === 'bottom'
      ? 'top-full left-1/2 -translate-x-1/2 mt-1.5'
      : position === 'left'
        ? 'right-full top-1/2 -translate-y-1/2 mr-1.5'
        : position === 'right'
          ? 'left-full top-1/2 -translate-y-1/2 ml-1.5'
          : 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {React.cloneElement(children, {
        'aria-describedby': visible ? tooltipId : undefined,
      })}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-2xs border border-[var(--portal-border-strong)] bg-[#0d0f12] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#EDF4ED] shadow-md transition-opacity duration-150 ${positionClasses} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
