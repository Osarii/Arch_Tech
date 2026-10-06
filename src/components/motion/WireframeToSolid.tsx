import React, { useState } from 'react';
import { useIntersectionReveal } from './useIntersectionReveal';
import { useReducedMotion } from '../../motion/useReducedMotion';

export interface WireframeToSolidProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tag?: string;
  trigger?: 'scroll' | 'hover' | 'auto';
  className?: string;
}

export const WireframeToSolid: React.FC<WireframeToSolidProps> = ({
  children,
  tag = 'STR.COORD // MODEL-01',
  trigger = 'auto',
  className = '',
  ...rest
}) => {
  const { ref, isRevealed } = useIntersectionReveal<HTMLDivElement>({ threshold: 0.2 });
  const reducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // If reduced motion, always stay solid
  const isSolid = reducedMotion ? true : (trigger === 'hover' ? isHovered : isRevealed);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`motion-wireframe-container relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`.trim()}
      data-motion-state={isSolid ? 'solid' : 'wireframe'}
      data-testid="wireframe-to-solid"
      {...rest}
    >
      {/* Precision corner crosshairs */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-2 top-2 z-20 font-mono text-[9px] transition-opacity duration-500 ${
          isSolid ? 'text-white/30' : 'text-[#D8C7AF]'
        }`}
      >
        +
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-2 top-2 z-20 font-mono text-[9px] transition-opacity duration-500 ${
          isSolid ? 'text-white/30' : 'text-[#D8C7AF]'
        }`}
      >
        +
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-2 left-2 z-20 font-mono text-[9px] transition-opacity duration-500 ${
          isSolid ? 'text-white/30' : 'text-[#D8C7AF]'
        }`}
      >
        +
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-2 right-2 z-20 font-mono text-[9px] transition-opacity duration-500 ${
          isSolid ? 'text-white/30' : 'text-[#D8C7AF]'
        }`}
      >
        +
      </span>

      {/* Wireframe CAD coordinate badge */}
      {tag && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-4 top-4 z-20 font-mono text-[8px] uppercase tracking-[0.2em] transition-all duration-500 ${
            isSolid ? 'text-white/40' : 'text-[#D8C7AF] bg-black/60 px-1.5 py-0.5 border border-[#D8C7AF]/40'
          }`}
        >
          {tag}
        </span>
      )}

      {/* Wireframe vector mesh grid overlay */}
      {!reducedMotion && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSolid ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(216, 199, 175, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(216, 199, 175, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* Solid Content Layer */}
      <div
        className={`relative h-full w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSolid ? 'opacity-100 filter-none' : 'opacity-85 filter contrast-125'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
