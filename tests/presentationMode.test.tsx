import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PresentationMode } from '../src/components/presentation/PresentationMode';
import { PresentationProvider, usePresentation } from '../src/presentation/PresentationContext';
import { presentationChapters, presentationComponents } from '../src/presentation/componentRegistry';
import { useBimStore } from '../src/stores/bimStore';

const Harness = () => {
  const presentation = usePresentation();
  return (
    <>
      <button type="button" onClick={presentation.start}>PRESENTACIÓN</button>
      <PresentationMode />
    </>
  );
};

const renderPresentation = () => render(
  <PresentationProvider>
    <Harness />
  </PresentationProvider>,
);

describe('Presentation Mode', () => {
  beforeEach(() => {
    useBimStore.getState().resetModel();
  });

  it('registers the requested chapters and explainable components with real source references', () => {
    expect(presentationChapters.map((chapter) => chapter.headline)).toEqual([
      'ARCH_TECH',
      'Large-Scale Development',
      'Platform',
      'Project Intelligence',
      'La Lima BIM',
      'BIM Exploration',
      'BIM Analysis',
      'Visual Engine',
      'Garnier Assistant',
      'Closing',
    ]);
    expect(presentationComponents.map((component) => component.label)).toEqual(expect.arrayContaining([
      'Landing Hero', 'Portal', 'KPI Cards', 'Site Intelligence', 'Garnier Assistant', 'BIM Viewer',
      'Model Explorer', 'Search', 'Inspector', 'Selection', 'Multi-selection', 'Distance', 'Polyline',
      'Area', 'Section Plane', 'Saved Views', 'Day / Overcast', 'Performance / Balanced / Presentation',
    ]));
    expect(presentationComponents.every((component) => component.sourceFiles.length > 0 && component.technologies.length > 0)).toBe(true);
  });

  it('progresses deterministically, supports exploration, and exits with Escape', async () => {
    renderPresentation();

    fireEvent.click(screen.getByRole('button', { name: 'PRESENTACIÓN' }));
    expect(screen.getByTestId('presentation-mode')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'ARCH_TECH' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Large-Scale Development' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    expect(screen.getByText('The platform, explained on demand.')).toBeDefined();
    fireEvent.click(screen.getByTestId('presentation-component-bim-viewer'));
    expect(screen.getByTestId('presentation-explainer').textContent).toContain('WHAT IS IT?');
    expect(screen.getByTestId('presentation-explainer').textContent).toContain('src/components/bim/BimViewport.tsx');

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('presentation-mode')).toBeNull());
  });

  it('continues in page view when fullscreen is unavailable and leaves BIM state unchanged', async () => {
    useBimStore.getState().setActiveTool('section');
    renderPresentation();

    fireEvent.click(screen.getByRole('button', { name: 'PRESENTACIÓN' }));
    await waitFor(() => expect(screen.getByTestId('presentation-fullscreen-fallback')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));

    expect(useBimStore.getState().activeTool).toBe('section');
  });
});
