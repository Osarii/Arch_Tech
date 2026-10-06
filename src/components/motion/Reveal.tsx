import React from 'react';
import { useIntersectionReveal } from './useIntersectionReveal';
import { useReducedMotion } from './useReducedMotion';

export type RevealVariant = 'fade-up' | 'fade' | 'slide-right' | 'mask';

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: React.ElementType;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 650,
  className = '',
  as: Component = 'div',
  style,
  ...rest
}) => {
  const { ref, isRevealed } = useIntersectionReveal<HTMLElement>();
  const reducedMotion = useReducedMotion();

  const getVariantStyles = (): React.CSSProperties => {
    if (reducedMotion) {
      return {
        opacity: 1,
        transform: 'none',
        clipPath: 'none',
      };
    }

    const transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, clip-path ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    switch (variant) {
      case 'fade':
        return {
          opacity: isRevealed ? 1 : 0,
          transition,
          willChange: isRevealed ? 'auto' : 'opacity',
        };
      case 'slide-right':
        return {
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? 'none' : 'translateX(-16px)',
          transition,
          willChange: isRevealed ? 'auto' : 'opacity, transform',
        };
      case 'mask':
        return {
          clipPath: isRevealed ? 'inset(0% 0% 0% 0%)' : 'inset(0% 100% 0% 0%)',
          opacity: isRevealed ? 1 : 0.4,
          transition,
          willChange: isRevealed ? 'auto' : 'clip-path, opacity',
        };
      case 'fade-up':
      default:
        return {
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? 'none' : 'translateY(16px)',
          transition,
          willChange: isRevealed ? 'auto' : 'opacity, transform',
        };
    }
  };

  return (
    <Component
      ref={ref}
      className={`motion-reveal ${isRevealed ? 'motion-reveal-in' : 'motion-reveal-out'} ${className}`.trim()}
      style={{
        ...getVariantStyles(),
        ...style,
      }}
      data-motion-revealed={isRevealed ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </Component>
  );
};
