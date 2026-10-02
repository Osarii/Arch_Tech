import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectGallery, buildProjectGallerySlides } from '../src/components/gallery/ProjectGallery';
import { getPublicProject } from '../src/portal/data';

describe('ARCH_TECH ProjectGallery', () => {
  const sampleProject = getPublicProject('pacific-nexus-free-zone')!;

  it('builds exactly 8 architectural slides from project media and hero image', () => {
    const slides = buildProjectGallerySlides(sampleProject);
    expect(slides).toHaveLength(8);
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
  });

  it('renders the gallery with 01 / 08 counter, category tag and all thumbnails', () => {
    render(<ProjectGallery project={sampleProject} />);

    expect(screen.getByTestId('project-gallery')).toBeDefined();
    expect(screen.getByText(/Study 01/i)).toBeDefined();
    expect(screen.getAllByText(/Primary Architecture/i).length).toBeGreaterThan(0);

    // Check thumbnail strip
    const strip = screen.getByTestId('gallery-thumbnail-strip');
    expect(strip.querySelectorAll('button')).toHaveLength(8);

    // Check bento grid
    const bento = screen.getByTestId('gallery-bento-grid');
    expect(bento.querySelectorAll('[data-testid^="bento-tile-"]')).toHaveLength(8);
  });

  it('advances slides using next and prev navigation controls', () => {
    render(<ProjectGallery project={sampleProject} />);

    expect(screen.getByText(/Study 01/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Hero Exterior/i })).toBeDefined();

    // Click Next
    fireEvent.click(screen.getByTestId('gallery-next-btn'));
    expect(screen.getByText(/Study 02/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Aerial Overview/i })).toBeDefined();

    // Click Prev
    fireEvent.click(screen.getByTestId('gallery-prev-btn'));
    expect(screen.getByText(/Study 01/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Hero Exterior/i })).toBeDefined();
  });

  it('switches slide on thumbnail click and bento tile click', () => {
    render(<ProjectGallery project={sampleProject} />);

    // Click Masterplan thumbnail (4th item, index 3)
    fireEvent.click(screen.getByTestId('gallery-thumb-masterplan'));
    expect(screen.getByText(/Study 04/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Masterplan/i })).toBeDefined();

    // Click Floor Plan bento tile (6th item, index 5)
    fireEvent.click(screen.getByTestId('bento-tile-floorPlan'));
    expect(screen.getByText(/Study 06/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Program Study/i })).toBeDefined();
  });

  it('toggles autoplay and advances on timer', () => {
    vi.useFakeTimers();
    try {
      render(<ProjectGallery project={sampleProject} />);

      const toggle = screen.getByTestId('gallery-autoplay-toggle');
      expect(toggle.textContent).toContain('Autoplay');

      // Turn autoplay ON
      fireEvent.click(toggle);
      expect(toggle.textContent).toContain('Autoplay on');

      // Fast forward timer
      act(() => {
        vi.advanceTimersByTime(6600);
      });

      expect(screen.getByText(/Study 02/i)).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens, navigates, and closes the high-res lightbox modal', async () => {
    render(<ProjectGallery project={sampleProject} />);

    expect(screen.queryByTestId('gallery-lightbox')).toBeNull();

    // Open lightbox
    fireEvent.click(screen.getByTestId('gallery-expand-btn'));
    expect(screen.getByTestId('gallery-lightbox')).toBeDefined();

    // Lightbox navigation
    fireEvent.click(screen.getByTestId('lightbox-next-btn'));
    expect(screen.getByText(/02 \/ 08/i)).toBeDefined();

    // Close lightbox
    fireEvent.click(screen.getByTestId('lightbox-close-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('gallery-lightbox')).toBeNull();
    });
  });

  it('supports keyboard navigation for arrows and escape', async () => {
    render(<ProjectGallery project={sampleProject} />);

    // Right arrow
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/Study 02/i)).toBeDefined();

    // Left arrow
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/Study 01/i)).toBeDefined();

    // F key to toggle lightbox
    fireEvent.keyDown(window, { key: 'f' });
    expect(screen.getByTestId('gallery-lightbox')).toBeDefined();

    // Escape to close lightbox
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('gallery-lightbox')).toBeNull();
    });
  });

  it('renders correctly for all 6 published public projects', () => {
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
      const slides = buildProjectGallerySlides(proj!);
      expect(slides).toHaveLength(8);
      expect(slides.every((s) => Boolean(s.src))).toBe(true);
    });
  });
});
