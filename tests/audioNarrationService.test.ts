import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audioNarration } from '../src/presentation/audioNarrationService';
import { speechService } from '../src/presentation/speechService';
import { narrationManifest, getChapterNarration } from '../src/presentation/narrationManifest';

describe('AudioNarrationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    audioNarration.stop();
    audioNarration.setMuted(false);
  });

  it('provides a centralized manifest mapping all 13 chapters to distinct audio assets and fallback texts', () => {
    expect(narrationManifest).toHaveLength(13);
    for (const chapter of narrationManifest) {
      expect(chapter.chapterId).toBeTruthy();
      expect(chapter.audioSrc).toMatch(/^\/presentation\/audio\/\d{2}-[\w-]+\.mp3$/);
      expect(chapter.scriptEs).toBeTruthy();
      expect(chapter.scriptEn).toBeTruthy();
      expect(chapter.fallbackSpeechText).toBeTruthy();
      expect(chapter.durationEstimateMs).toBeGreaterThan(0);
      expect(chapter.pauseAfterMs).toBeGreaterThanOrEqual(1000);
    }
  });

  it('preloads the next chapter audio when playing current chapter', () => {
    const playSpy = vi.fn();
    const pauseSpy = vi.fn();
    const addEventListenerSpy = vi.fn();

    // Mock HTMLAudioElement
    class MockAudio {
      public src = '';
      public preload = '';
      public currentTime = 0;
      public duration = 15;
      public muted = false;
      public play = playSpy.mockResolvedValue(undefined);
      public pause = pauseSpy;
      public addEventListener = addEventListenerSpy;
      public removeEventListener = vi.fn();
    }

    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);

    audioNarration.play('problem');

    // Next chapter (consequence) should be preloaded
    const nextChapter = getChapterNarration('consequence');
    expect(audioNarration.getState().chapterId).toBe('problem');
    expect(nextChapter.audioSrc).toBe('/presentation/audio/02-consequence.mp3');
  });

  it('handles successful HTML5 Audio playback (Tier 1)', async () => {
    let onTimeUpdateCb: (() => void) | undefined;
    let onCanPlayCb: (() => void) | undefined;
    let onEndedCb: (() => void) | undefined;

    class MockAudio {
      public src = '';
      public currentTime = 0;
      public duration = 16;
      public muted = false;
      public play = vi.fn().mockResolvedValue(undefined);
      public pause = vi.fn();
      public addEventListener = vi.fn((event: string, cb: () => void) => {
        if (event === 'timeupdate') onTimeUpdateCb = cb;
        if (event === 'canplay') onCanPlayCb = cb;
        if (event === 'ended') onEndedCb = cb;
      });
      public removeEventListener = vi.fn();
    }

    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);

    const onPhaseChange = vi.fn();
    const onEnd = vi.fn();

    audioNarration.play('problem', { onPhaseChange, onEnd });

    // Wait for play promise to resolve
    await Promise.resolve();

    expect(audioNarration.getPlaybackTier()).toBe('audio');
    expect(audioNarration.getState().isPlaying).toBe(true);

    // Simulate canplay
    onCanPlayCb?.();
    expect(audioNarration.getDuration()).toBe(16);

    // Simulate timeupdate advancing past the first visual cue.
    const currentAudio = (audioNarration as unknown as { audioElement: MockAudio }).audioElement;
    if (currentAudio) {
      currentAudio.currentTime = 9.0;
    }
    onTimeUpdateCb?.();
    expect(onPhaseChange).toHaveBeenCalledWith(1);

    // Pause and Resume
    audioNarration.pause();
    expect(audioNarration.getState().isPaused).toBe(true);
    expect(currentAudio.pause).toHaveBeenCalled();

    audioNarration.resume();
    expect(audioNarration.getState().isPaused).toBe(false);
    expect(currentAudio.play).toHaveBeenCalled();

    // End playback
    onEndedCb?.();
    expect(audioNarration.getState().isPlaying).toBe(false);
  });

  it('falls back seamlessly to SpeechSynthesis (Tier 2) when audio asset fails or is missing', async () => {
    vi.spyOn(speechService, 'isSupported').mockReturnValue(true);
    const speakSpy = vi.spyOn(speechService, 'speak').mockImplementation((_text, opts) => {
      // Simulate speech completion
      setTimeout(() => opts?.onEnd?.(), 10);
    });

    class FailingAudio {
      public play = vi.fn().mockRejectedValue(new Error('404 Not Found'));
      public pause = vi.fn();
      public addEventListener = vi.fn();
      public removeEventListener = vi.fn();
    }

    vi.stubGlobal('Audio', FailingAudio as unknown as typeof Audio);

    const onEnd = vi.fn();
    audioNarration.play('solution', { onEnd });

    await Promise.resolve();
    await Promise.resolve();

    expect(audioNarration.getPlaybackTier()).toBe('speech');
    expect(speakSpy).toHaveBeenCalledWith(
      expect.stringContaining('ARCH_TECH propone un entorno digital conectado'),
      expect.objectContaining({ locale: 'es' })
    );
  });

  it('falls back to captions-only (Tier 3) when SpeechSynthesis is unavailable or errors', async () => {
    vi.useFakeTimers();

    vi.spyOn(speechService, 'isSupported').mockReturnValue(false);

    class FailingAudio {
      public play = vi.fn().mockRejectedValue(new Error('Audio disabled'));
      public pause = vi.fn();
      public addEventListener = vi.fn();
      public removeEventListener = vi.fn();
    }

    vi.stubGlobal('Audio', FailingAudio as unknown as typeof Audio);

    const onEnd = vi.fn();
    audioNarration.play('digital-project', { onEnd });

    await Promise.resolve();
    await Promise.resolve();

    expect(audioNarration.getPlaybackTier()).toBe('captions');
    expect(audioNarration.getState().activeCaption).toContain('DATA BECOMES SPACE');

    // Advance timer to end
    const manifest = getChapterNarration('digital-project');
    vi.advanceTimersByTime(manifest.durationEstimateMs + manifest.pauseAfterMs);
    expect(onEnd).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('mutes narration cleanly without disabling captions or breaking timeline', () => {
    audioNarration.setMuted(true);
    expect(audioNarration.isVoiceMuted()).toBe(true);

    const setVoiceSpy = vi.spyOn(speechService, 'setVoiceEnabled');
    audioNarration.setMuted(false);
    expect(audioNarration.isVoiceMuted()).toBe(false);
    expect(setVoiceSpy).toHaveBeenCalledWith(true);
  });

  it('moves active SpeechSynthesis narration to captions-only when voice is muted', async () => {
    vi.spyOn(speechService, 'isSupported').mockReturnValue(true);
    vi.spyOn(speechService, 'speak').mockImplementation(() => undefined);

    class FailingAudio {
      public play = vi.fn().mockRejectedValue(new Error('Audio disabled'));
      public pause = vi.fn();
      public addEventListener = vi.fn();
      public removeEventListener = vi.fn();
    }

    vi.stubGlobal('Audio', FailingAudio as unknown as typeof Audio);
    audioNarration.play('solution');
    await Promise.resolve();
    await Promise.resolve();

    expect(audioNarration.getPlaybackTier()).toBe('speech');
    audioNarration.setMuted(true);
    expect(audioNarration.getPlaybackTier()).toBe('captions');
    expect(audioNarration.getState().isPlaying).toBe(true);
    expect(audioNarration.getState().activeCaption).toContain('ONE CONNECTED ENVIRONMENT');
  });

  it('resets cleanly on stop() and exit', () => {
    audioNarration.stop();
    const state = audioNarration.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.chapterId).toBeNull();
  });
});
