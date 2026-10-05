import React from 'react';

export type ArchTechLogoVariant = 'full' | 'mark';
export type ArchTechLogoTheme = 'light' | 'dark' | 'inherit';

interface ArchTechLogoProps {
  variant?: ArchTechLogoVariant;
  theme?: ArchTechLogoTheme;
  className?: string;
  label?: string;
}

const palette = {
  light: {
    primary: '#2D2E2C',
    secondary: '#8B6C49',
    shadow: '#211E1A',
    wireframe: '#6F735C',
    wordmark: '#211E1A',
  },
  dark: {
    primary: '#F4EFE8',
    secondary: '#D8C7AF',
    shadow: '#B9B4AA',
    wireframe: '#E8DDCB',
    wordmark: '#F4EFE8',
  },
  inherit: {
    primary: 'currentColor',
    secondary: 'currentColor',
    shadow: 'currentColor',
    wireframe: 'currentColor',
    wordmark: 'currentColor',
  },
} as const;

export const ArchTechLogo: React.FC<ArchTechLogoProps> = ({ variant = 'full', theme = 'inherit', className = '', label }) => {
  const colors = palette[theme];
  const accessibleProps = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  return (
    <span className={`arch-tech-logo arch-tech-logo-${variant} arch-tech-logo-theme-${theme} ${className}`.trim()} {...accessibleProps}>
      <svg className="arch-tech-logo-symbol" viewBox="0 0 80 56" role="presentation" focusable="false" aria-hidden="true">
        <path d="M5 49V15L26 5l20 11v11l-10 5v-10l-10-5-10 5v19l10-5v11Z" fill={colors.primary} />
        <polygon points="26,5 46,16 56,10 36,0" fill={colors.secondary} opacity="0.9" />
        <polygon points="46,16 56,10 56,40 46,46" fill={colors.shadow} opacity="0.9" />
        <path d="m36 22 20-12 18 10v10l-10 5v-9l-8-4-10 6Z" fill={colors.primary} />
        <g className="arch-tech-logo-wireframe" fill="none" stroke={colors.wireframe} strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.15" vectorEffect="non-scaling-stroke">
          <path d="m56 10 18 10v18L56 48V29l18-9M56 29l18 9" />
          <path d="M62 13.5v19M68 16.8v19M56 29l18-10" />
        </g>
      </svg>
      {variant === 'full' && <span className="arch-tech-logo-wordmark" style={{ color: colors.wordmark }}>ARCH_TECH</span>}
    </span>
  );
};
