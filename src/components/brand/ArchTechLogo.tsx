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
    'full-color': '/brand/arch-tech/architectural-full.png',
    black: '/brand/arch-tech/architectural-full.png',
    'mint-cream': '/brand/arch-tech/geometric-mint.png',
    celadon: '/brand/arch-tech/geometric-mint.png',
  },
  stacked: {
    'full-color': '/brand/arch-tech/architectural-full.png',
    black: '/brand/arch-tech/architectural-full.png',
    'mint-cream': '/brand/arch-tech/geometric-mint.png',
  },
  mark: {
    'full-color': '/brand/arch-tech/penrose-mint-charcoal.png',
    black: '/brand/arch-tech/penrose-mint-charcoal.png',
    'mint-cream': '/brand/arch-tech/penrose-mint-charcoal.png',
    celadon: '/brand/arch-tech/penrose-mint-charcoal.png',
    'muted-teal': '/brand/arch-tech/penrose-mint-charcoal.png',
    'amber-gold': '/brand/arch-tech/penrose-mint-charcoal.png',
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
