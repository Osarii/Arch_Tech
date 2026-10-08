import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

export type PortalButtonVariant = 'primary' | 'secondary' | 'tertiary';

export interface PortalActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PortalButtonVariant;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  showArrow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const PortalActionButton: React.FC<PortalActionButtonProps> = ({
  variant = 'secondary',
  icon: Icon,
  iconPosition = 'left',
  showArrow = false,
  size = 'md',
  className = '',
  disabled,
  children,
  ...rest
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-[9px]'
      : size === 'lg'
        ? 'px-6 py-3 text-[11px]'
        : 'px-4.5 py-2.5 text-[10px]';

  let variantClasses = '';
  if (variant === 'primary') {
    // Cairn/Penumbra Primary: Inverted high-contrast with subtle mint focus/hover
    variantClasses =
      'border border-[var(--portal-text)] bg-[var(--portal-text)] text-[var(--portal-surface)] hover:opacity-90 hover:border-[var(--portal-accent)] active:scale-[0.99] shadow-xs';
  } else if (variant === 'secondary') {
    // Hairline border, restrained surface
    variantClasses =
      'border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] hover:bg-[var(--portal-surface-raised)] active:scale-[0.99] shadow-2xs';
  } else if (variant === 'tertiary') {
    // Minimal text action
    variantClasses =
      'border border-transparent bg-transparent text-[var(--portal-muted)] hover:text-[var(--portal-text)] hover:bg-[var(--portal-surface-raised)]';
  }

  return (
    <button
      disabled={disabled}
      className={`group inline-flex items-center justify-center gap-2 rounded-sm font-mono uppercase tracking-[0.16em] transition-all duration-180 focus-visible:outline-2 focus-visible:outline-[var(--portal-accent)] disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${variantClasses} ${className}`}
      {...rest}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-105" />
      )}
      <span className="leading-none">{children}</span>
      {Icon && iconPosition === 'right' && (
        <Icon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-105" />
      )}
      {showArrow && (
        <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-160 group-hover:translate-x-0.5" />
      )}
    </button>
  );
};
