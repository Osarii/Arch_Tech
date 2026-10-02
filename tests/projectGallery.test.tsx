import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectGallery, buildProjectGallerySlides } from '../src/components/gallery/ProjectGallery';
import { getPublicProject } from '../src/portal/data';

describe('ARCH_TECH ProjectGallery (Embla Carousel)', () => {
  const sampleProject = getPublicProject('pacific-nexus-free-zone')!;

  it('builds exactly 8 development infrastructure slides from project media and hero image', () => {
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

  it('renders the gallery with 01 / 08 counter, infrastructure category tag, and compact thumbnails', () => {
    render(<ProjectGallery project={sampleProject} />);

    const gallery = screen.getByTestId('project-gallery');
    expect(gallery).toBeDefined();
    expect(gallery.getAttribute('aria-label')).toContain('Development Gallery');
    expect(screen.getByText(/Study 01/i)).toBeDefined();
    expect(screen.getAllByText(/Campus \/ Infrastructure Overview/i).length).toBeGreaterThan(0);

    // Check thumbnail strip
    const strip = screen.getByTestId('gallery-thumbnail-strip');
    const thumbButtons = strip.querySelectorAll('button');
    expect(thumbButtons).toHaveLength(8);

    // Verify thumbnail images are lazy loaded
    const thumbImages = strip.querySelectorAll('img');
    thumbImages.forEach((img) => {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
    });

    // Verify all 8 slides exist in the Embla track
    const slides = screen.getAllByTestId(/^gallery-slide-/);
    expect(slides).toHaveLength(8);
  });

  it('advances slides using next and prev navigation controls', () => {
    render(<ProjectGallery project={sampleProject} />);

    expect(screen.getByText(/Study 01/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Facility Overview/i })).toBeDefined();

    // Click Next
    fireEvent.click(screen.getByTestId('gallery-next-btn'));
    expect(screen.getByText(/Study 02/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Aerial Overview/i })).toBeDefined();

    // Click Prev
    fireEvent.click(screen.getByTestId('gallery-prev-btn'));
    expect(screen.getByText(/Study 01/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Facility Overview/i })).toBeDefined();
  });

  it('switches slide on thumbnail click', () => {
    render(<ProjectGallery project={sampleProject} />);

    // Click Masterplan thumbnail (4th item, index 3)
    fireEvent.click(screen.getByTestId('gallery-thumb-masterplan'));
    expect(screen.getByText(/Study 04/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Masterplan/i })).toBeDefined();

    // Click Program Study thumbnail (6th item, index 5)
    fireEvent.click(screen.getByTestId('gallery-thumb-floorPlan'));
    expect(screen.getByText(/Study 06/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: /Program Study/i })).toBeDefined();
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

  it('scopes keyboard navigation to the gallery container or open lightbox without intercepting global keys', async () => {
    render(
      <div>
        <button data-testid="outside-button">Outside Page Focus</button>
        <ProjectGallery project={sampleProject} />
      </div>
    );

    const outsideBtn = screen.getByTestId('outside-button');
    const gallery = screen.getByTestId('project-gallery');

    // Focus outside the gallery
    outsideBtn.focus();
    expect(document.activeElement).toBe(outsideBtn);

    // Global arrow right does NOT advance gallery when focus is elsewhere
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/Study 01/i)).toBeDefined();

    // Focus inside gallery
    gallery.focus();
    expect(document.activeElement).toBe(gallery);

    // Right arrow advances when gallery is focused
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/Study 02/i)).toBeDefined();

    // Left arrow goes back
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/Study 01/i)).toBeDefined();

    // F key toggles lightbox when focused
    fireEvent.keyDown(window, { key: 'f' });
    expect(screen.getByTestId('gallery-lightbox')).toBeDefined();

    // When lightbox is open, Escape closes lightbox
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
