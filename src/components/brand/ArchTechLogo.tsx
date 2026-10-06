import React from 'react';

export type ArchTechLogoVariant = 'full' | 'mark' | 'stacked';
export type ArchTechLogoTheme = 'light' | 'dark' | 'inherit';
export type ArchTechLogoTone = 'full-color' | 'black' | 'mint-cream' | 'celadon' | 'muted-teal' | 'amber-gold';

interface ArchTechLogoProps {
  variant?: ArchTechLogoVariant;
  theme?: ArchTechLogoTheme;
  tone?: ArchTechLogoTone;
  className?: string;
  label?: string;
}

const assets: Record<ArchTechLogoVariant, Partial<Record<ArchTechLogoTone, string>>> = {
  full: {
    'full-color': '/brand/garnier-architecture/01_logo_horizontal_full_color.png',
    black: '/brand/garnier-architecture/02_logo_horizontal_black.png',
    'mint-cream': '/brand/garnier-architecture/03_logo_horizontal_mint_cream.png',
    celadon: '/brand/garnier-architecture/04_logo_horizontal_celadon.png',
  },
  stacked: {
    'full-color': '/brand/garnier-architecture/05_logo_stacked_full_color.png',
    black: '/brand/garnier-architecture/06_logo_stacked_black.png',
    'mint-cream': '/brand/garnier-architecture/07_logo_stacked_mint_cream.png',
  },
  mark: {
    'full-color': '/brand/garnier-architecture/08_symbol_full_color.png',
    black: '/brand/garnier-architecture/09_symbol_black.png',
    'mint-cream': '/brand/garnier-architecture/10_symbol_mint_cream.png',
    celadon: '/brand/garnier-architecture/11_symbol_celadon.png',
    'muted-teal': '/brand/garnier-architecture/12_symbol_muted_teal.png',
    'amber-gold': '/brand/garnier-architecture/13_symbol_amber_gold.png',
  },
};

const themeTone: Record<ArchTechLogoTheme, ArchTechLogoTone> = {
  light: 'black',
  dark: 'mint-cream',
  inherit: 'full-color',
};

export const ArchTechLogo: React.FC<ArchTechLogoProps> = ({ variant = 'full', theme = 'inherit', tone, className = '', label }) => {
  const accessibleProps = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  const selectedTone = tone ?? themeTone[theme];
  const src = assets[variant][selectedTone] ?? assets[variant]['full-color'];

  return (
    <span className={`arch-tech-logo arch-tech-logo-${variant} arch-tech-logo-theme-${theme} ${className}`.trim()} {...accessibleProps}>
      <img
        className={variant === 'mark' ? 'arch-tech-logo-symbol' : variant === 'stacked' ? 'arch-tech-logo-stacked' : 'arch-tech-logo-lockup'}
        src={src}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </span>
  );
};
