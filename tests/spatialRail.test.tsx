import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpatialRail, buildSpatialRailSlides } from '../src/components/gallery/SpatialRail';
import { getPublicProject } from '../src/portal/data';
import * as useReducedMotionModule from '../src/motion/useReducedMotion';

describe('ARCH_TECH SpatialRail showcase media', () => {
  const sampleProject = getPublicProject('zona-franca-la-lima')!;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds only unique locally mapped project photography', () => {
    const slides = buildSpatialRailSlides(sampleProject);

    expect(slides).toHaveLength(3);
    expect(slides.map((slide) => slide.id)).toEqual(['hero', 'gallery-1', 'gallery-2']);
    expect(slides.every((slide) => slide.fit === 'cover' && slide.aspect === 'wide')).toBe(true);
    expect(new Set(slides.map((slide) => slide.src)).size).toBe(3);
    expect(slides.every((slide) => slide.src.startsWith('/projects/zona-franca-la-lima/'))).toBe(true);
  });

  it('renders one active media frame with lazy thumbnail previews', () => {
    render(<SpatialRail project={sampleProject} />);

    const frame = screen.getByTestId('rail-frame');
    expect(screen.getByTestId('rail-index').textContent).toBe('01');
    expect(screen.getByText('/ 03')).toBeDefined();
    expect(frame.querySelectorAll('img')).toHaveLength(1);
    expect(frame.querySelector('img')?.getAttribute('loading')).toBe('eager');
    expect(screen.getByTestId('rail-thumbnails').querySelectorAll('img')).toHaveLength(3);
    expect(screen.getByTestId('rail-thumbnails').querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  it('supports bounded controls and keyboard navigation', () => {
    render(<SpatialRail project={sampleProject} />);
    const rail = screen.getByTestId('spatial-rail');
    const next = screen.getByTestId('rail-next-btn');
    const prev = screen.getByTestId('rail-prev-btn');

    expect(prev).toHaveProperty('disabled', true);
    fireEvent.keyDown(rail, { key: 'ArrowRight' });
    expect(screen.getByTestId('rail-index').textContent).toBe('02');
    fireEvent.click(next);
    expect(screen.getByTestId('rail-index').textContent).toBe('03');
    expect(next).toHaveProperty('disabled', true);
    fireEvent.click(prev);
    expect(screen.getByTestId('rail-index').textContent).toBe('02');
  });

  it('selects a thumbnail and keeps one active image in the main frame', () => {
    render(<SpatialRail project={sampleProject} />);
    fireEvent.click(screen.getByTestId('rail-thumb-gallery-2'));

    expect(screen.getByTestId('rail-index').textContent).toBe('03');
    expect(screen.getByTestId('rail-thumb-gallery-2').getAttribute('aria-current')).toBe('true');
    expect(screen.getByTestId('rail-frame').querySelectorAll('img')).toHaveLength(1);
  });

  it('opens fullscreen media, keeps navigation local, and restores focus', async () => {
    render(<SpatialRail project={sampleProject} />);
    const trigger = screen.getByRole('button', { name: 'Open fullscreen view of Project cover' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByTestId('rail-fullscreen')).toBeDefined();
    expect(document.activeElement).toBe(screen.getByTestId('rail-fullscreen-close'));
    fireEvent.click(screen.getByTestId('rail-fullscreen-next'));
    expect(screen.getByText(/02 \/ 03/i)).toBeDefined();
    fireEvent.keyDown(screen.getByTestId('rail-fullscreen-close'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('rail-fullscreen')).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(screen.getByTestId('rail-index').textContent).toBe('01');
  });

  it('renders a deliberate fallback when a project has no usable media', () => {
    const project = { ...sampleProject, id: 'runtime-project', image: '', media: {} };
    render(<SpatialRail project={project} />);
    expect(screen.getByTestId('rail-image-fallback')).toBeDefined();
    expect(screen.getByRole('img', { name: 'Zona Franca La Lima - Project cover image unavailable' })).toBeDefined();
  });

  it('settles immediately when reduced motion is preferred', () => {
    vi.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);
    render(<SpatialRail project={sampleProject} />);
    fireEvent.click(screen.getByTestId('rail-next-btn'));

    expect(screen.getByTestId('rail-index').textContent).toBe('02');
    expect(screen.getByTestId('rail-frame').querySelector('button > div')?.className).toContain('opacity-100');
  });

  it('keeps every public project mapped to its own local media directory', () => {
    const projectIds = [
      'zona-franca-la-lima',
      'el-cafetal',
      'santa-ana-country-club',
      'waldorf-astoria',
      'centro-corporativo-sabana',
      'universidad-latina',
    ];

    for (const id of projectIds) {
      const project = getPublicProject(id);
      expect(project).toBeDefined();
      const slides = buildSpatialRailSlides(project!);
      expect(slides.length).toBeGreaterThan(0);
      expect(slides.every((slide) => slide.src.startsWith(`/projects/${id}/`))).toBe(true);
    }
  });
});
