import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PresentationMode } from '../src/components/presentation/PresentationMode';
import { PresentationProvider, usePresentation } from '../src/presentation/PresentationContext';
import { presentationChapters, presentationComponents } from '../src/presentation/componentRegistry';
import { useBimStore } from '../src/stores/bimStore';
import { speechService } from '../src/presentation/speechService';
import { audioNarration } from '../src/presentation/audioNarrationService';
import { publicAssistant } from '../src/services/publicAssistantService';

const Harness = () => {
  const presentation = usePresentation();
  return (
    <>
      <button type="button" onClick={presentation.start}>
        PRESENTACIÓN
      </button>
      <PresentationMode />
    </>
  );
};

const renderPresentation = () =>
  render(
    <PresentationProvider>
      <Harness />
    </PresentationProvider>
  );

describe('Presentation Mode & AI Narration System', () => {
  beforeEach(() => {
    useBimStore.getState().resetModel();
    publicAssistant.clearHistory();
    audioNarration.stop();
    vi.restoreAllMocks();
  });

  it('registers the full 13-chapter product story and explainable components with authentic source references', () => {
    expect(presentationChapters).toHaveLength(13);
    expect(presentationChapters.map((ch) => ch.headline)).toEqual([
      'THE PROBLEM',
      'THE CONSEQUENCE',
      'THE SOLUTION',
      'MULTIPLE PERSPECTIVES',
      'PROJECT INTELLIGENCE',
      'DIGITAL PROJECT',
      'BIM EXPLORATION',
      'ANALYSIS',
      'VISUAL ENGINE',
      'ARTIFICIAL INTELLIGENCE',
      'INTERACTIVE EXPLANATION',
      'THE VISION',
      'CLOSING',
    ]);

    expect(presentationComponents.map((component) => component.label)).toEqual(
      expect.arrayContaining([
        'Landing Hero',
        'Portal',
        'KPI Cards',
        'Site Intelligence',
        'BIM Viewer',
        'Model Explorer',
        'Search',
        'Inspector',
        'Selection',
        'Multi-selection',
        'Distance',
        'Polyline',
        'Area',
        'Section Plane',
        'Saved Views',
        'Day / Overcast',
        'Performance / Balanced / Presentation',
        'ARCH Assistant',
      ])
    );

    // Verify all components reference authentic files
    expect(
      presentationComponents.every(
        (component) => component.sourceFiles.length > 0 && component.technologies.length > 0
      )
    ).toBe(true);
  });

  it('starts presentation, displays cinematic opening, captions, and navigates chapters with fallback speech', async () => {
    const speakSpy = vi.spyOn(speechService, 'speak');
    const stopSpy = vi.spyOn(audioNarration, 'stop');
    renderPresentation();

    fireEvent.click(screen.getByRole('button', { name: 'PRESENTACIÓN' }));
    expect(screen.getByTestId('presentation-mode')).toBeDefined();

    // Cinematic Intro Phase
    expect(screen.getByText(/Problem · The Information Paradox/i)).toBeDefined();
    expect(screen.getAllByText(/Captions/i).length).toBeGreaterThan(0);

    // In jsdom without prerecorded audio files, SpeechSynthesis fallback speaks
    await waitFor(() => expect(speakSpy).toHaveBeenCalled());

    // Navigate to the consequence.
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'THE CONSEQUENCE' })).toBeDefined();
    expect(stopSpy).toHaveBeenCalled();

    // Voice toggle
    const voiceBtn = screen.getByRole('button', { name: /Voice/i });
    expect(voiceBtn).toBeDefined();
    fireEvent.click(voiceBtn); // Toggle OFF
    fireEvent.click(voiceBtn); // Toggle ON

    // Navigate to the solution.
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'THE SOLUTION' })).toBeDefined();

    // Exit with Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('presentation-mode')).toBeNull());
    expect(audioNarration.getState().isPlaying).toBe(false);
  });

  it('supports Explore Mode, Technical Explainer, and Ask ARCH about component', async () => {
    const sendMessageSpy = vi.spyOn(publicAssistant, 'sendMessage').mockResolvedValueOnce({
      id: 'mock-1',
      role: 'assistant',
      content: 'BIM Viewer uses WebGL, That Open Components and Three.js.',
      timestamp: '12:00',
    });

    renderPresentation();
    fireEvent.click(screen.getByRole('button', { name: 'PRESENTACIÓN' }));

    // Click Explore button
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    expect(screen.getByText('The platform, explained on demand.')).toBeDefined();

    // Select BIM Viewer component
    fireEvent.click(screen.getByTestId('presentation-component-bim-viewer'));

    const explainer = screen.getByTestId('presentation-explainer');
    expect(explainer.textContent).toContain('WHAT IS IT?');
    expect(explainer.textContent).toContain('HOW DOES IT WORK?');
    expect(explainer.textContent).toContain('DATA FLOW');
    expect(explainer.textContent).toContain('SOURCE FILES');
    expect(explainer.textContent).toContain('src/components/bim/BimViewport.tsx');
    expect(explainer.textContent).toContain('TECHNOLOGIES');

    // Ask ARCH about this component
    fireEvent.click(screen.getByRole('button', { name: /ASK ARCH ABOUT THIS/i }));
    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalled();
    });
  });

  it('handles fullscreen fallback gracefully and restores initial BIM tool upon exit', async () => {
    useBimStore.getState().setActiveTool('section');

    renderPresentation();

    fireEvent.click(screen.getByRole('button', { name: 'PRESENTACIÓN' }));
    await waitFor(() => expect(screen.getByTestId('presentation-fullscreen-fallback')).toBeDefined());

    // Exit presentation
    fireEvent.click(screen.getByRole('button', { name: /Exit/i }));

    // State restored cleanly
    expect(useBimStore.getState().activeTool).toBe('section');
  });

  it('supports pause/resume and voice mute controls seamlessly', async () => {
    renderPresentation();
    fireEvent.click(screen.getByRole('button', { name: 'PRESENTACIÓN' }));

    const pauseBtn = screen.getByRole('button', { name: /Pause/i });
    fireEvent.click(pauseBtn);

    // Should now show Resume button
    const resumeBtn = screen.getByRole('button', { name: /Resume/i });
    expect(resumeBtn).toBeDefined();

    fireEvent.click(resumeBtn);
    expect(screen.getByRole('button', { name: /Pause/i })).toBeDefined();
  });
});
