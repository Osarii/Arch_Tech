import React from 'react';
import { useIntersectionReveal } from './useIntersectionReveal';
import { useReducedMotion } from '../../motion/useReducedMotion';

export interface ArchitecturalLineProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  delay?: number;
  duration?: number;
  accent?: boolean;
}

export const ArchitecturalLine: React.FC<ArchitecturalLineProps> = ({
  orientation = 'horizontal',
  className = '',
  delay = 0,
  duration = 750,
  accent = false,
}) => {
  const { ref, isRevealed } = useIntersectionReveal<HTMLDivElement>();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none ${
          orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'
        } ${accent ? 'bg-[#D8C7AF]/40' : 'bg-current opacity-15'} ${className}`.trim()}
      />
    );
  }

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none ${
        isHorizontal ? 'h-px w-full origin-left' : 'w-px h-full origin-top'
      } ${accent ? 'bg-[#D8C7AF]/40' : 'bg-current opacity-15'} ${className}`.trim()}
      style={{
        transform: isRevealed
          ? 'scale(1)'
          : isHorizontal
          ? 'scaleX(0)'
          : 'scaleY(0)',
        transition: `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: isRevealed ? 'auto' : 'transform',
      }}
    />
  );
};
