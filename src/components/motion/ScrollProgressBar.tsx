import React from 'react';
import { useScrollProgress } from './useScrollProgress';
import { useReducedMotion } from './useReducedMotion';

export interface ScrollProgressBarProps {
  containerSelector?: string;
  className?: string;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({
  containerSelector = '[data-landing-scroll-container]',
  className = '',
}) => {
  const { progress } = useScrollProgress(containerSelector);
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent pointer-events-none ${className}`.trim()}
    >
      <div
        className="h-full bg-gradient-to-r from-stone-400 via-[#D8C7AF] to-[#F4EFE8] transition-[transform] duration-150 ease-out origin-left"
        style={{
          transform: `scaleX(${progress})`,
        }}
      />
    </div>
  );
};
