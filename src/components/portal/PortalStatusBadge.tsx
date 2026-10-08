import React from 'react';

export type PortalStatusType =
  | 'active'
  | 'pending'
  | 'review'
  | 'upcoming'
  | 'success'
  | 'approved'
  | 'complete'
  | 'current'
  | 'warning'
  | 'danger'
  | 'rejected';

export interface PortalStatusBadgeProps {
  status: PortalStatusType | string;
  label?: string;
  className?: string;
  variant?: 'dot' | 'chip';
}

export const PortalStatusBadge: React.FC<PortalStatusBadgeProps> = ({
  status,
  label,
  className = '',
  variant = 'chip',
}) => {
  const normalized = status.toLowerCase();

  let dotColor = 'bg-[var(--portal-muted)]';
  let badgeClasses = 'border-[var(--portal-border)] text-[var(--portal-muted)] bg-[var(--portal-surface-raised)]';

  if (normalized === 'active' || normalized === 'approved' || normalized === 'complete' || normalized === 'success') {
    dotColor = 'bg-[var(--portal-accent)]';
    badgeClasses = 'border-[var(--portal-accent)]/30 text-[var(--portal-text)] bg-[var(--portal-accent-soft)]';
  } else if (normalized === 'pending' || normalized === 'review' || normalized === 'current' || normalized === 'warning') {
    dotColor = 'bg-[#FFBF00]';
    badgeClasses = 'border-[#FFBF00]/30 text-[var(--portal-text)] bg-[#FFBF00]/10';
  } else if (normalized === 'danger' || normalized === 'rejected') {
    dotColor = 'bg-red-500';
    badgeClasses = 'border-red-500/30 text-red-500 bg-red-500/10';
  } else if (normalized === 'upcoming') {
    dotColor = 'bg-[var(--portal-muted)]';
    badgeClasses = 'border-[var(--portal-border)] text-[var(--portal-muted)] bg-[var(--portal-surface-raised)]';
  }

  const displayLabel = label || status;

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--portal-muted)] ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span>{displayLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-3xs border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${badgeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
