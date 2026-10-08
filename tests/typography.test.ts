import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const css = readFileSync(resolve(root, 'src/index.css'), 'utf8');
const tailwind = readFileSync(resolve(root, 'tailwind.config.js'), 'utf8');

describe('global typography system', () => {
  it('loads and maps only the approved UI and display families', () => {
    expect(css).toContain('family=IBM+Plex+Sans');
    expect(css).toContain('family=IBM+Plex+Serif');
    expect(css).toContain("--font-ui: 'IBM Plex Sans', sans-serif");
    expect(css).toContain("--font-display: 'IBM Plex Serif', serif");
    expect(css).not.toMatch(/Manrope|Cormorant|ui-monospace|Roboto/);
  });

  it('routes Tailwind aliases through the two semantic font tokens', () => {
    expect(tailwind).toContain('sans: ["var(--font-ui)"]');
    expect(tailwind).toContain('serif: ["var(--font-display)"]');
    expect(tailwind).toContain('mono: ["var(--font-ui)"]');
    expect(css).toContain('font-variant-numeric: tabular-nums');

    const declarations = [...css.matchAll(/font-family:\s*([^;]+);/g)].map(([, value]) => value.trim());
    expect(new Set(declarations)).toEqual(new Set([
      'var(--font-ui)',
      'var(--font-ui) !important',
      'var(--font-display) !important',
      'inherit',
    ]));
  });
});
