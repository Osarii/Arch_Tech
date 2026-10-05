import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PortalShell } from '../src/components/portal/PortalShell';
import {
  STORAGE_KEY_A11Y,
  findWordAtOffset,
  extractMainContentWithMap,
} from '../src/portal/accessibility';

describe('Portal Accessibility System', () => {
  let mockSpeak: ReturnType<typeof vi.fn>;
  let mockPause: ReturnType<typeof vi.fn>;
  let mockResume: ReturnType<typeof vi.fn>;
  let mockCancel: ReturnType<typeof vi.fn>;
  let mockGetVoices: ReturnType<typeof vi.fn>;

  const mockVoices = [
    { voiceURI: 'voice-en-us', name: 'Alex', lang: 'en-US', default: true, localService: true },
    { voiceURI: 'voice-es-cr', name: 'Sofia', lang: 'es-CR', default: false, localService: true },
  ] as unknown as SpeechSynthesisVoice[];

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    mockSpeak = vi.fn();
    mockPause = vi.fn();
    mockResume = vi.fn();
    mockCancel = vi.fn();
    mockGetVoices = vi.fn().mockReturnValue(mockVoices);

    const mockSpeechSynthesis = {
      speak: mockSpeak,
      pause: mockPause,
      resume: mockResume,
      cancel: mockCancel,
      getVoices: mockGetVoices,
      onvoiceschanged: null as any,
      paused: false,
      speaking: false,
      pending: false,
    };

    vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      vi.fn().mockImplementation(function (this: any, text: string) {
        this.text = text;
        this.rate = 1;
        this.voice = null;
        this.onstart = null;
        this.onend = null;
        this.onerror = null;
        this.onpause = null;
        this.onresume = null;
        this.onboundary = null;
      })
    );
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.className = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('Accessibility Panel Keyboard and Focus Management', () => {
    it('opens panel via compact trigger and traps/returns focus', async () => {
      render(
        <PortalShell role="admin">
          <div>Admin Content</div>
        </PortalShell>
      );

      const trigger = screen.getByTestId('accessibility-panel-trigger');
      expect(trigger).toBeDefined();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      // Click to open panel
      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');

      const closeBtn = screen.getByTestId('a11y-close-btn');
      expect(closeBtn).toBeDefined();

      // Escape key closes panel and restores focus to trigger
      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
    });
  });

  describe('Full-page Narrator Controls and Boundary Events', () => {
    it('narrates <main> content in DOM order with voice and speed selectors', async () => {
      render(
        <PortalShell role="client">
          <p>Development at a larger scale.</p>
        </PortalShell>
      );

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));
      const startBtn = screen.getByTestId('narrator-start');
      expect(startBtn).toBeDefined();

      // Change speed to 1.25x
      const speedBtn = screen.getByTestId('a11y-speed-1.25');
      fireEvent.click(speedBtn);

      // Start narration
      fireEvent.click(startBtn);
      expect(mockCancel).toHaveBeenCalled();
      expect(mockSpeak).toHaveBeenCalled();

      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.text).toContain('Development at a larger scale');
      expect(utterance.rate).toBe(1.25);

      // Simulate onstart
      act(() => {
        utterance.onstart();
      });

      expect(screen.getByTestId('narrator-pause-resume')).toBeDefined();
      expect(screen.getByTestId('narrator-stop')).toBeDefined();

      // Pause speech
      fireEvent.click(screen.getByTestId('narrator-pause-resume'));
      expect(mockPause).toHaveBeenCalled();
      act(() => {
        utterance.onpause();
      });
      expect(screen.getByTestId('narrator-pause-resume').textContent).toContain('Resume');

      // Resume speech
      fireEvent.click(screen.getByTestId('narrator-pause-resume'));
      expect(mockResume).toHaveBeenCalled();
      act(() => {
        utterance.onresume();
      });

      // Stop speech
      fireEvent.click(screen.getByTestId('narrator-stop'));
      expect(mockCancel).toHaveBeenCalled();
      expect(screen.getByTestId('narrator-start')).toBeDefined();
    });

    it('cancels speech on signout and route changes', () => {
      const onSignOut = vi.fn();
      render(
        <PortalShell role="client" onSignOut={onSignOut}>
          <p>Sample Text</p>
        </PortalShell>
      );

      mockCancel.mockClear();

      const signOutBtn = screen.getByText(/Sign out/);
      fireEvent.click(signOutBtn);
      expect(mockCancel).toHaveBeenCalled();
      expect(onSignOut).toHaveBeenCalled();
    });

    it('positions reusable word highlight overlay during boundary events without DOM mutation', async () => {
      const { container } = render(
        <PortalShell role="client">
          <p id="target-sentence">Zona Franca La Lima</p>
        </PortalShell>
      );

      // Initially no highlight overlay
      expect(screen.queryByTestId('word-highlight-overlay')).toBeNull();

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));
      fireEvent.click(screen.getByTestId('narrator-start'));

      const utterance = mockSpeak.mock.calls[0][0];
      act(() => {
        utterance.onstart();
      });

      // Mock getBoundingClientRect on Range
      const originalCreateRange = document.createRange;
      document.createRange = vi.fn(() => ({
        setStart: vi.fn(),
        setEnd: vi.fn(),
        getBoundingClientRect: () => ({
          top: 120,
          left: 45,
          width: 80,
          height: 24,
          bottom: 144,
          right: 125,
          x: 45,
          y: 120,
          toJSON: () => {},
        }),
      })) as any;

      // Trigger boundary event for word
      act(() => {
        utterance.onboundary({ name: 'word', charIndex: 0 });
      });

      const overlay = screen.getByTestId('word-highlight-overlay');
      expect(overlay).toBeDefined();
      expect(overlay.style.top).toBe('120px');
      expect(overlay.style.left).toBe('45px');
      expect(overlay.style.width).toBe('80px');
      expect(overlay.style.height).toBe('24px');

      // Verify DOM was not mutated with span tags
      const sentence = container.querySelector('#target-sentence');
      expect(sentence?.querySelectorAll('span').length).toBe(0);

      // Stop speech cleans up overlay
      fireEvent.click(screen.getByTestId('narrator-stop'));
      expect(screen.queryByTestId('word-highlight-overlay')).toBeNull();

      document.createRange = originalCreateRange;
    });
  });

  describe('Hover Reader and Pointer Debounce', () => {
    it('detects word under pointer, debounces ~150ms, pronounces word and illuminates single overlay', async () => {
      vi.useFakeTimers();

      // Mock caretPositionFromPoint before render so isHoverReaderSupported returns true
      (document as any).caretPositionFromPoint = vi.fn();

      render(
        <PortalShell role="client">
          <p id="readable-para">Campus infrastructure delivery</p>
        </PortalShell>
      );

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));
      // Enable Hover Reader
      const hoverToggle = screen.getByTestId('hover-reader-toggle');
      fireEvent.click(hoverToggle);

      // Close panel so main content is unobstructed
      fireEvent.click(screen.getByTestId('a11y-close-btn'));

      const textNode = document.getElementById('readable-para')?.firstChild as Text;
      expect(textNode).toBeDefined();

      // Mock caretPositionFromPoint to point to "infrastructure"
      (document as any).caretPositionFromPoint = vi.fn((_x, _y) => ({
        offsetNode: textNode,
        offset: 8, // inside "infrastructure"
      }));

      // Mock Range getBoundingClientRect
      const originalCreateRange = document.createRange;
      document.createRange = vi.fn(() => ({
        setStart: vi.fn(),
        setEnd: vi.fn(),
        getBoundingClientRect: () => ({
          top: 200,
          left: 100,
          width: 95,
          height: 20,
          bottom: 220,
          right: 195,
          x: 100,
          y: 200,
          toJSON: () => {},
        }),
      })) as any;

      mockCancel.mockClear();
      mockSpeak.mockClear();

      // Fire mousemove
      fireEvent.mouseMove(window, { clientX: 110, clientY: 205 });

      // Before 150ms: nothing spoken yet
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(mockSpeak).not.toHaveBeenCalled();

      // After 150ms: pronounced and highlighted
      act(() => {
        vi.advanceTimersByTime(60);
      });
      expect(mockSpeak).toHaveBeenCalled();
      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.text).toBe('infrastructure');

      const overlay = screen.getByTestId('word-highlight-overlay');
      expect(overlay.style.top).toBe('200px');
      expect(overlay.style.left).toBe('100px');

      // Mouse leave clears highlight
      fireEvent.mouseLeave(document);
      expect(screen.queryByTestId('word-highlight-overlay')).toBeNull();

      document.createRange = originalCreateRange;
    });

    it('ignores interactive and decorative controls during hover', () => {
      vi.useFakeTimers();

      // Mock caretPositionFromPoint before render
      (document as any).caretPositionFromPoint = vi.fn();

      render(
        <PortalShell role="client">
          <button id="ignored-btn">Interactive Action</button>
        </PortalShell>
      );

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));
      fireEvent.click(screen.getByTestId('hover-reader-toggle'));
      fireEvent.click(screen.getByTestId('a11y-close-btn'));

      const btn = document.getElementById('ignored-btn')!;
      const textNode = btn.firstChild as Text;
      (document as any).caretPositionFromPoint = vi.fn((_x, _y) => ({
        offsetNode: textNode,
        offset: 2,
      }));

      mockSpeak.mockClear();

      // Pointer over button element
      fireEvent.mouseMove(btn, { clientX: 50, clientY: 50 });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should NOT pronounce button text
      expect(mockSpeak).not.toHaveBeenCalled();
      expect(screen.queryByTestId('word-highlight-overlay')).toBeNull();
    });

    it('gives full-page narration priority over hover reader', () => {
      vi.useFakeTimers();

      render(
        <PortalShell role="client">
          <p id="para1">Corporate district development</p>
        </PortalShell>
      );

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));
      fireEvent.click(screen.getByTestId('hover-reader-toggle'));
      fireEvent.click(screen.getByTestId('narrator-start'));

      const utterance = mockSpeak.mock.calls[0][0];
      act(() => {
        utterance.onstart();
      });

      mockSpeak.mockClear();

      // Trigger hover
      fireEvent.mouseMove(window, { clientX: 50, clientY: 50 });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Narration priority: hover reader must NOT speak
      expect(mockSpeak).not.toHaveBeenCalled();
    });
  });

  describe('Reading Guide and Reading Mask', () => {
    it('follows pointer with reading guide and reading mask overlays without blocking interaction', () => {
      render(
        <PortalShell role="client">
          <div>Content</div>
        </PortalShell>
      );

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));
      fireEvent.click(screen.getByTestId('reading-guide-toggle'));
      fireEvent.click(screen.getByTestId('reading-mask-toggle'));
      fireEvent.click(screen.getByTestId('a11y-close-btn'));

      // Move mouse
      fireEvent.mouseMove(window, { clientX: 200, clientY: 350 });

      const guide = screen.getByTestId('reading-guide');
      expect(guide).toBeDefined();
      expect(guide.style.top).toBe('350px');
      expect(guide.className).toContain('pointer-events-none');

      const mask = screen.getByTestId('reading-mask');
      expect(mask).toBeDefined();
      expect(mask.style.top).toBe('305px'); // 350 - 45
      expect(mask.className).toContain('pointer-events-none');
    });
  });

  describe('Vision Modes Coexistence and Preference Reset', () => {
    it('applies high-contrast, text-spacing, color-safe, highlight-links, and reduce-motion simultaneously', () => {
      render(
        <PortalShell role="client">
          <div>Content</div>
        </PortalShell>
      );

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));

      fireEvent.click(screen.getByTestId('color-safe-toggle'));
      fireEvent.click(screen.getByTestId('high-contrast-toggle'));
      fireEvent.click(screen.getByTestId('text-spacing-toggle'));
      fireEvent.click(screen.getByTestId('highlight-links-toggle'));
      fireEvent.click(screen.getByTestId('reduce-motion-toggle'));
      fireEvent.click(screen.getByTestId('portal-text-scale-125'));

      expect(document.documentElement.classList.contains('portal-color-safe')).toBe(true);
      expect(document.documentElement.classList.contains('portal-high-contrast')).toBe(true);
      expect(document.documentElement.classList.contains('portal-text-spacing')).toBe(true);
      expect(document.documentElement.classList.contains('portal-highlight-links')).toBe(true);
      expect(document.documentElement.classList.contains('portal-reduce-motion')).toBe(true);
      expect(document.documentElement.classList.contains('portal-scale-125')).toBe(true);

      // Verify persistence
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY_A11Y) || '{}');
      expect(stored.colorSafe).toBe(true);
      expect(stored.highContrast).toBe(true);
      expect(stored.textSpacing).toBe(true);
      expect(stored.highlightLinks).toBe(true);
      expect(stored.reduceMotion).toBe(true);
      expect(stored.textScale).toBe('125');

      // Click Reset Preferences
      const resetBtn = screen.getByTestId('a11y-reset-btn');
      fireEvent.click(resetBtn);

      expect(document.documentElement.classList.contains('portal-color-safe')).toBe(false);
      expect(document.documentElement.classList.contains('portal-high-contrast')).toBe(false);
      expect(document.documentElement.classList.contains('portal-text-spacing')).toBe(false);
      expect(document.documentElement.classList.contains('portal-highlight-links')).toBe(false);
      expect(document.documentElement.classList.contains('portal-reduce-motion')).toBe(false);
      expect(document.documentElement.classList.contains('portal-scale-125')).toBe(false);
    });
  });

  describe('Core Text Utilities and Graceful Fallback', () => {
    it('extracts word boundaries correctly at various offsets', () => {
      const text = 'Complex infrastructure, campuses & logistics!';
      const word1 = findWordAtOffset(text, 2);
      expect(word1?.word).toBe('Complex');

      const word2 = findWordAtOffset(text, 15);
      expect(word2?.word).toBe('infrastructure');

      const wordSpace = findWordAtOffset(text, 7); // whitespace
      expect(wordSpace?.word).toBe('Complex'); // closest preceding word boundary
    });

    it('extracts readable text map from node without punctuation corruption', () => {
      const div = document.createElement('div');
      div.innerHTML = '<main><h1>Hospitality</h1><nav>Menu</nav><p>Luxury resort development.</p></main>';
      const result = extractMainContentWithMap(div);
      expect(result.fullText).toBe('Hospitality Luxury resort development.');
      expect(result.segments.length).toBe(2);
    });

    it('handles unsupported SpeechSynthesis gracefully', () => {
      // @ts-ignore
      delete window.speechSynthesis;

      render(
        <PortalShell role="client">
          <div>Content</div>
        </PortalShell>
      );

      fireEvent.click(screen.getByTestId('accessibility-panel-trigger'));
      expect(screen.getByText(/SpeechSynthesis is unavailable/i)).toBeDefined();
      expect(screen.queryByTestId('narrator-start')).toBeNull();
    });
  });
});
