import React from 'react';

export type ArchTechLogoVariant = 'full' | 'mark' | 'stacked';
export type ArchTechLogoTheme = 'light' | 'dark' | 'inherit';

interface ArchTechLogoProps {
  variant?: ArchTechLogoVariant;
  theme?: ArchTechLogoTheme;
  className?: string;
  label?: string;
}

const assets = {
  light: {
    mark: '/brand/garnier-architecture/03_symbol_monochrome_graphite_transparent.png',
    lockup: '/brand/garnier-architecture/05_logo_lockup_light_transparent.png',
  },
  dark: {
    mark: '/brand/garnier-architecture/04_symbol_monochrome_stone_transparent.png',
    lockup: '/brand/garnier-architecture/06_logo_lockup_dark_transparent.png',
  },
  inherit: {
    mark: '/brand/garnier-architecture/03_symbol_monochrome_graphite_transparent.png',
    lockup: '/brand/garnier-architecture/05_logo_lockup_light_transparent.png',
  },
} as const;

export const ArchTechLogo: React.FC<ArchTechLogoProps> = ({ variant = 'full', theme = 'inherit', className = '', label }) => {
  const accessibleProps = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  const asset = assets[theme];

  return (
    <span className={`arch-tech-logo arch-tech-logo-${variant} arch-tech-logo-theme-${theme} ${className}`.trim()} {...accessibleProps}>
      <img
        className={variant === 'mark' ? 'arch-tech-logo-symbol' : 'arch-tech-logo-lockup'}
        src={variant === 'mark' ? asset.mark : asset.lockup}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </span>
  );
};
