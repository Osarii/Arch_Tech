import React, { useEffect, useState } from 'react';
import { useIntersectionReveal } from './useIntersectionReveal';
import { useReducedMotion } from '../../motion/useReducedMotion';

export interface MetricCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

export const MetricCounter: React.FC<MetricCounterProps> = ({
  value,
  duration = 1000,
  className = '',
}) => {
  const { ref, isRevealed } = useIntersectionReveal<HTMLSpanElement>();
  const reducedMotion = useReducedMotion();
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  // Check if string contains an integer to count (e.g., "30 YEARS" -> 30)
  const match = value.match(/^(\d+)(.*)$/);
  const targetNumber = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';

  const [currentNumber, setCurrentNumber] = useState<number>(0);

  useEffect(() => {
    if (targetNumber === null || reducedMotion || isTest || !isRevealed) {
      if (targetNumber !== null) setCurrentNumber(targetNumber);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out quart: 1 - pow(1 - x, 4)
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      const nextVal = Math.round(easeProgress * targetNumber);
      setCurrentNumber(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetNumber, isRevealed, duration, reducedMotion, isTest]);

  // If not a number, or reduced motion, render original string
  if (targetNumber === null || reducedMotion || isTest) {
    return (
      <span ref={ref} className={className} data-metric-value={value}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className} data-metric-value={value}>
      {isRevealed ? `${currentNumber}${suffix}` : value}
    </span>
  );
};
