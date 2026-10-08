import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface PortalMetricCardProps {
  label: string;
  value: string | number;
  supportingText?: React.ReactNode;
  badge?: string;
  statusColor?: 'mint' | 'amber' | 'muted' | 'rose';
  onClick?: () => void;
  testId?: string;
  className?: string;
  interactive?: boolean;
  valueClassName?: string;
}

export const PortalMetricCard: React.FC<PortalMetricCardProps> = ({
  label,
  value,
  supportingText,
  badge,
  statusColor = 'mint',
  onClick,
  testId,
  className = '',
  interactive = true,
  valueClassName = '',
}) => {
  const isClickable = Boolean(onClick && interactive);
  const Component = isClickable ? 'button' : 'div';

  const dotColorClass =
    statusColor === 'mint'
      ? 'bg-[var(--portal-accent)]'
      : statusColor === 'amber'
        ? 'bg-[#FFBF00]'
        : statusColor === 'rose'
          ? 'bg-red-500'
          : 'bg-[var(--portal-muted)]';

  return (
    <Component
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      data-testid={testId}
      className={`portal-overview-tile group relative flex flex-col justify-between rounded-sm border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 text-left transition-all duration-180 shadow-2xs ${
        isClickable
          ? 'cursor-pointer hover:border-[var(--portal-accent)] hover:bg-[var(--portal-surface-raised)] focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)]'
          : ''
      } ${className}`}
    >
      {/* Top Header: Monospace Label + Corner Badge / Indicator */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--portal-muted)] truncate">
          {label}
        </span>
        {badge ? (
          <span className="shrink-0 rounded-3xs border border-[var(--portal-border)] bg-[var(--portal-surface-raised)] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--portal-muted)] opacity-75">
            {badge}
          </span>
        ) : (
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColorClass}`} />
        )}
      </div>

      {/* Hero Metric Number */}
      <div className="my-4 flex items-baseline justify-between">
        <p
          className={`font-sans text-4xl lg:text-5xl font-light tracking-[-0.03em] tabular-nums text-[var(--portal-text)] transition-colors ${
            isClickable ? 'group-hover:text-[var(--portal-accent)]' : ''
          } ${valueClassName}`}
        >
          {value}
        </p>
        {isClickable && (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--portal-muted)] opacity-0 -translate-x-1 translate-y-1 transition-all duration-180 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-[var(--portal-accent)]" />
        )}
      </div>

      {/* Supporting State & Status Indicator */}
      {supportingText && (
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--portal-muted)]">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColorClass}`} />
          <span className="truncate">{supportingText}</span>
        </div>
      )}
    </Component>
  );
};
