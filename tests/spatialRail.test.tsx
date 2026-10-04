import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpatialRail, buildSpatialRailSlides } from '../src/components/gallery/SpatialRail';
import { getPublicProject } from '../src/portal/data';

describe('ARCH_TECH SpatialRail Carousel', () => {
  const sampleProject = getPublicProject('pacific-nexus-free-zone')!;

  it('builds exactly 8 development infrastructure slides following exact media order and fit rules', () => {
    const slides = buildSpatialRailSlides(sampleProject);
    expect(slides).toHaveLength(8);

    // Exact media order: hero, aerial, campus overview, masterplan, site plan, program/floor plan, interior, concept board
    expect(slides.map((s) => s.id)).toEqual([
      'hero',
      'aerial',
      'campusOverview',
      'masterplan',
      'sitePlan',
      'floorPlan',
      'interior',
      'conceptBoard',
    ]);

    // Fit rules: cover for photographic/render views, contain for plans/masterplans/technical sheets
    expect(slides.find((s) => s.id === 'hero')?.fit).toBe('cover');
    expect(slides.find((s) => s.id === 'aerial')?.fit).toBe('cover');
    expect(slides.find((s) => s.id === 'campusOverview')?.fit).toBe('cover');
    expect(slides.find((s) => s.id === 'masterplan')?.fit).toBe('contain');
    expect(slides.find((s) => s.id === 'sitePlan')?.fit).toBe('contain');
    expect(slides.find((s) => s.id === 'floorPlan')?.fit).toBe('contain');
    expect(slides.find((s) => s.id === 'interior')?.fit).toBe('cover');
    expect(slides.find((s) => s.id === 'conceptBoard')?.fit).toBe('contain');

    // Language rules: developer/infrastructure terminology
    expect(slides.find((s) => s.id === 'hero')?.label).toBe('Facility Overview');
    expect(slides.find((s) => s.id === 'aerial')?.label).toBe('Regional Context');
    expect(slides.find((s) => s.id === 'campusOverview')?.label).toBe('Campus Structure');
    expect(slides.find((s) => s.id === 'masterplan')?.label).toBe('Masterplan');
    expect(slides.find((s) => s.id === 'sitePlan')?.label).toBe('Site Strategy');
    expect(slides.find((s) => s.id === 'floorPlan')?.label).toBe('Program Study');
    expect(slides.find((s) => s.id === 'interior')?.label).toBe('Operations');
    expect(slides.find((s) => s.id === 'conceptBoard')?.label).toBe('Systems');
  });

  it('renders the spatial rail with 01 / 08 index, progress rail, and native scroll snap track', () => {
    render(<SpatialRail project={sampleProject} />);

    const rail = screen.getByTestId('spatial-rail');
    expect(rail).toBeDefined();
    expect(rail.getAttribute('aria-label')).toContain('Spatial Rail');

    // Index & counter
    expect(screen.getByTestId('rail-index').textContent).toBe('01');
    expect(screen.getByText(/\/ 08/i)).toBeDefined();

    // Track exists with snap-x snap-mandatory
    const track = screen.getByTestId('rail-track');
    expect(track.className).toContain('snap-x');
    expect(track.className).toContain('snap-mandatory');

    // Exactly 8 slides rendered in track without duplicates
    const slides = screen.getAllByTestId(/^rail-slide-/);
    expect(slides).toHaveLength(8);

    // Eager loading on first image, lazy loading on remaining images
    const images = track.querySelectorAll('img');
    expect(images).toHaveLength(8);
    expect(images[0].getAttribute('loading')).toBe('eager');
    expect(images[1].getAttribute('loading')).toBe('lazy');
    expect(images[0].getAttribute('decoding')).toBe('async');
    expect(images[0].getAttribute('src')).toContain('/projects/');
    expect(images[1].getAttribute('src')).toContain('/projects/');
    expect(images[2].getAttribute('src')).toBeNull();
  });

  it('navigates next and prev slides using rail controls', () => {
    render(<SpatialRail project={sampleProject} />);

    const prevBtn = screen.getByTestId('rail-prev-btn');
    const nextBtn = screen.getByTestId('rail-next-btn');

    // Prev disabled on slide 0
    expect(prevBtn).toHaveProperty('disabled', true);
    expect(nextBtn).toHaveProperty('disabled', false);

    // Advance to next
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('rail-index').textContent).toBe('02');
    expect(prevBtn).toHaveProperty('disabled', false);

    // Click Prev
    fireEvent.click(prevBtn);
    expect(screen.getByTestId('rail-index').textContent).toBe('01');
    expect(prevBtn).toHaveProperty('disabled', true);
  });

  it('scopes keyboard navigation to the rail container or fullscreen modal', async () => {
    render(
      <div>
        <button data-testid="outside-focus">Outside Element</button>
        <SpatialRail project={sampleProject} />
      </div>
    );

    const outsideBtn = screen.getByTestId('outside-focus');
    const rail = screen.getByTestId('spatial-rail');

    // Focus outside: Arrow keys do NOT advance rail
    outsideBtn.focus();
    fireEvent.keyDown(outsideBtn, { key: 'ArrowRight' });
    expect(screen.getByTestId('rail-index').textContent).toBe('01');

    // Focus rail: Arrow keys navigate rail
    rail.focus();
    fireEvent.keyDown(rail, { key: 'ArrowRight' });
    expect(screen.getByTestId('rail-index').textContent).toBe('02');

    fireEvent.keyDown(rail, { key: 'ArrowLeft' });
    expect(screen.getByTestId('rail-index').textContent).toBe('01');
  });

  it('opens and closes fullscreen inspection modal without duplicating media elements', async () => {
    render(<SpatialRail project={sampleProject} />);

    expect(screen.queryByTestId('rail-fullscreen')).toBeNull();

    // Click on slide to open fullscreen
    const heroSlideBtn = screen.getByRole('button', { name: /Open fullscreen view of Facility Overview/i });
    fireEvent.click(heroSlideBtn);

    const modal = screen.getByTestId('rail-fullscreen');
    expect(modal).toBeDefined();
    expect(modal.getAttribute('role')).toBe('dialog');

    // Close fullscreen via close button
    const closeBtn = screen.getByTestId('rail-fullscreen-close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('rail-fullscreen')).toBeNull();
    });
  });

  it('assigns wide aspect ratio for visual media and technical aspect ratio for architectural sheets', () => {
    const slides = buildSpatialRailSlides(sampleProject);
    // Visual media: wide
    expect(slides.find((s) => s.id === 'hero')?.aspect).toBe('wide');
    expect(slides.find((s) => s.id === 'aerial')?.aspect).toBe('wide');
    expect(slides.find((s) => s.id === 'campusOverview')?.aspect).toBe('wide');
    expect(slides.find((s) => s.id === 'interior')?.aspect).toBe('wide');

    // Technical media: technical
    expect(slides.find((s) => s.id === 'masterplan')?.aspect).toBe('technical');
    expect(slides.find((s) => s.id === 'sitePlan')?.aspect).toBe('technical');
    expect(slides.find((s) => s.id === 'floorPlan')?.aspect).toBe('technical');
    expect(slides.find((s) => s.id === 'conceptBoard')?.aspect).toBe('technical');
  });

  it('handles rapid next clicks smoothly without desynchronizing bounds', () => {
    render(<SpatialRail project={sampleProject} />);

    const nextBtn = screen.getByTestId('rail-next-btn');
    const prevBtn = screen.getByTestId('rail-prev-btn');

    // Click 7 times rapidly to reach the last slide (index 08)
    for (let i = 0; i < 7; i++) {
      fireEvent.click(nextBtn);
    }

    expect(screen.getByTestId('rail-index').textContent).toBe('08');
    expect(nextBtn).toHaveProperty('disabled', true);
    expect(prevBtn).toHaveProperty('disabled', false);

    // One more click should not advance past boundary
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('rail-index').textContent).toBe('08');
  });

  it('navigates next and prev slides inside fullscreen viewer', async () => {
    render(<SpatialRail project={sampleProject} />);

    // Open fullscreen
    const heroBtn = screen.getByRole('button', { name: /Open fullscreen view of Facility Overview/i });
    fireEvent.click(heroBtn);

    const fsNextBtn = screen.getByTestId('rail-fullscreen-next');
    const fsPrevBtn = screen.getByTestId('rail-fullscreen-prev');

    expect(fsPrevBtn).toHaveProperty('disabled', true);
    expect(fsNextBtn).toHaveProperty('disabled', false);

    fireEvent.click(fsNextBtn);
    expect(screen.getByText(/02 \/ 08/i)).toBeDefined();
    expect(fsPrevBtn).toHaveProperty('disabled', false);

    fireEvent.click(fsPrevBtn);
    expect(screen.getByText(/01 \/ 08/i)).toBeDefined();
  });

  it('handles each fullscreen arrow exactly once without navigating the underlying rail', () => {
    render(<SpatialRail project={sampleProject} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open fullscreen view of Campus Structure' }));

    const closeBtn = screen.getByTestId('rail-fullscreen-close');
    closeBtn.focus();

    expect(fireEvent.keyDown(closeBtn, { key: 'ArrowRight' })).toBe(false);
    expect(screen.getByText('04 / 08')).toBeDefined();
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe(sampleProject.media?.masterplan);

    expect(fireEvent.keyDown(closeBtn, { key: 'ArrowLeft' })).toBe(false);
    expect(screen.getByText('03 / 08')).toBeDefined();
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe(sampleProject.media?.campusOverview);
    expect(screen.getByTestId('rail-index').textContent).toBe('01');
  });

  it('keeps fullscreen keyboard navigation within the first and last images', () => {
    render(<SpatialRail project={sampleProject} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open fullscreen view of Facility Overview' }));

    const closeBtn = screen.getByTestId('rail-fullscreen-close');
    fireEvent.keyDown(closeBtn, { key: 'ArrowLeft' });
    expect(screen.getByText('01 / 08')).toBeDefined();
    expect(screen.getByTestId('rail-fullscreen-prev')).toHaveProperty('disabled', true);

    for (let i = 0; i < 7; i++) {
      fireEvent.keyDown(closeBtn, { key: 'ArrowRight' });
    }
    expect(screen.getByText('08 / 08')).toBeDefined();
    expect(screen.getByTestId('rail-fullscreen-next')).toHaveProperty('disabled', true);
    fireEvent.keyDown(closeBtn, { key: 'ArrowRight' });
    expect(screen.getByText('08 / 08')).toBeDefined();
  });

  it.each(['button', 'Escape'])('focuses fullscreen and restores the exact opening trigger once after %s close', (method) => {
    render(<SpatialRail project={sampleProject} />);
    const trigger = screen.getByRole('button', { name: 'Open fullscreen view of Regional Context' });
    trigger.focus();
    fireEvent.click(trigger);

    const closeBtn = screen.getByTestId('rail-fullscreen-close');
    expect(document.activeElement).toBe(closeBtn);
    fireEvent.keyDown(closeBtn, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(closeBtn);
    const restoreFocus = vi.spyOn(trigger, 'focus');

    if (method === 'Escape') {
      expect(fireEvent.keyDown(closeBtn, { key: 'Escape' })).toBe(false);
    } else {
      fireEvent.click(closeBtn);
    }

    expect(screen.queryByTestId('rail-fullscreen')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(restoreFocus).toHaveBeenCalledTimes(1);
    restoreFocus.mockRestore();

    fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    expect(screen.getByTestId('rail-index').textContent).toBe('02');
  });

  it('contains Tab focus in fullscreen and skips disabled navigation controls', () => {
    render(<SpatialRail project={sampleProject} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open fullscreen view of Facility Overview' }));

    const closeBtn = screen.getByTestId('rail-fullscreen-close');
    const nextBtn = screen.getByTestId('rail-fullscreen-next');
    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(nextBtn);
    fireEvent.keyDown(nextBtn, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    fireEvent.keyDown(closeBtn, { key: 'ArrowRight' });
    const prevBtn = screen.getByTestId('rail-fullscreen-prev');
    prevBtn.focus();
    expect(fireEvent.keyDown(prevBtn, { key: 'Tab' })).toBe(true);
    fireEvent.click(screen.getByTestId('rail-fullscreen-close'));
  });

  it.each(['', 'scroll', 'hidden'])('locks body scrolling and restores previous overflow %j on close and unmount', (overflow) => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = overflow;
    const { unmount } = render(<SpatialRail project={sampleProject} />);

    try {
      const trigger = screen.getByRole('button', { name: 'Open fullscreen view of Facility Overview' });
      fireEvent.click(trigger);
      expect(document.body.style.overflow).toBe('hidden');
      fireEvent.click(screen.getByTestId('rail-fullscreen-next'));
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(screen.getByTestId('rail-fullscreen-close'));
      expect(document.body.style.overflow).toBe(overflow);
      fireEvent.click(trigger);
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe(overflow);
    } finally {
      unmount();
      document.body.style.overflow = previousOverflow;
    }
  });

  it('renders all 6 published public projects correctly with valid media arrays and aspect ratios', () => {
    const projectIds = [
      'pacific-nexus-free-zone',
      'summit-point-corporate-district',
      'mar-vista-hospitality-district',
      'caribbean-ai-compute-campus',
      'guanacaste-renewable-compute-campus',
      'pacific-regional-medical-campus',
    ];

    projectIds.forEach((id) => {
      const proj = getPublicProject(id);
      expect(proj).toBeDefined();
      const slides = buildSpatialRailSlides(proj!);
      expect(slides).toHaveLength(8);
      expect(slides.every((s) => Boolean(s.src))).toBe(true);
    });
  });
});
