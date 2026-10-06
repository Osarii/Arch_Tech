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
    mark: '/brand/garnier-architecture/09_symbol_black.png',
    full: '/brand/garnier-architecture/01_logo_horizontal_full_color.png',
    stacked: '/brand/garnier-architecture/05_logo_stacked_full_color.png',
  },
  dark: {
    mark: '/brand/garnier-architecture/10_symbol_mint_cream.png',
    full: '/brand/garnier-architecture/03_logo_horizontal_mint_cream.png',
    stacked: '/brand/garnier-architecture/07_logo_stacked_mint_cream.png',
  },
  inherit: {
    mark: '/brand/garnier-architecture/08_symbol_full_color.png',
    full: '/brand/garnier-architecture/01_logo_horizontal_full_color.png',
    stacked: '/brand/garnier-architecture/05_logo_stacked_full_color.png',
  },
} as const;

export const ArchTechLogo: React.FC<ArchTechLogoProps> = ({ variant = 'full', theme = 'inherit', className = '', label }) => {
  const accessibleProps = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  const asset = assets[theme];
  const src = asset[variant];

  return (
    <span className={`arch-tech-logo arch-tech-logo-${variant} arch-tech-logo-theme-${theme} ${className}`.trim()} {...accessibleProps}>
      <img
        className={
          variant === 'mark'
            ? 'arch-tech-logo-symbol'
            : variant === 'stacked'
            ? 'arch-tech-logo-stacked'
            : 'arch-tech-logo-lockup'
        }
        src={src}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </span>
  );
};
