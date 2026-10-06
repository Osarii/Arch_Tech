import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/components/motion/Reveal', () => ({
  Reveal: ({ children, variant, delay }: { children: React.ReactNode; variant?: string; delay?: number }) => (
    <div data-reveal-variant={variant} data-reveal-delay={delay}>{children}</div>
  ),
}));

import { TeamSection } from '../src/components/landing/TeamSection';

describe('TeamSection leadership group image', () => {
  it('uses a safe reveal variant so the desktop group photo cannot remain clip-path closed', () => {
    render(<TeamSection />);

    const groupPhoto = screen.getByRole('img', {
      name: 'Garnier & Garnier leadership team gathered in an outdoor courtyard',
    });
    expect(groupPhoto.getAttribute('src')).toBe('/team/garnier-team-group.png');
    expect(groupPhoto.closest('[data-reveal-variant]')?.getAttribute('data-reveal-variant')).toBe('fade-up');
    expect(groupPhoto.closest('[data-reveal-variant]')?.getAttribute('data-reveal-delay')).toBe('150');
  });
});
