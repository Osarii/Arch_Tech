/**
 * ARCH_TECH Audio Narration Service
 * Manages 3-tier narration playback:
 * 1. Pre-recorded AI voice audio (HTML5 Audio)
 * 2. SpeechSynthesis fallback
 * 3. Captions-only fallback
 */

import {
  getChapterNarration,
  getNextChapterNarration,
  type ChapterNarrationManifest,
} from './narrationManifest';
import { speechService } from './speechService';

export type PlaybackTier = 'audio' | 'speech' | 'captions';

export interface AudioNarrationState {
  tier: PlaybackTier;
  isPlaying: boolean;
  isPaused: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  chapterId: string | null;
  activeCaption: string;
}

export interface PlayNarrationOptions {
  locale?: 'es' | 'en';
  onEnd?: () => void;
  onPhaseChange?: (phase: number) => void;
}

type StateListener = (state: AudioNarrationState) => void;

class AudioNarrationService {
  private audioElement: HTMLAudioElement | null = null;
  private preloadedAudio: HTMLAudioElement | null = null;
  private preloadedSrc: string | null = null;

  private currentChapterId: string | null = null;
  private currentManifest: ChapterNarrationManifest | null = null;
  private currentOptions: PlayNarrationOptions | null = null;

  private playbackTier: PlaybackTier = 'audio';
  private isPlaying = false;
  private isPaused = false;
  private isMuted = false;

  private currentTime = 0;
  private duration = 0;
  private activeCaption = '';
  private playbackId = 0;

  private listeners = new Set<StateListener>();
  private captionsTimer: ReturnType<typeof setTimeout> | null = null;
  private captionsTimerRemainingMs = 0;
  private captionsTimerStartedAt = 0;
  private fallbackElapsedMs = 0;
  private fallbackStartedAt = 0;
  private pauseBufferTimer: ReturnType<typeof setTimeout> | null = null;
  private cueTimers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    // Initial state
  }

  public getState(): AudioNarrationState {
    return {
      tier: this.playbackTier,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isMuted: this.isMuted,
      currentTime: this.currentTime,
      duration: this.duration,
      chapterId: this.currentChapterId,
      activeCaption: this.activeCaption,
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    queueMicrotask(() => {
      for (const listener of this.listeners) {
        listener(state);
      }
    });
  }

  public isAudioSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.Audio !== 'undefined';
  }

  public preloadNext(chapterId: string): void {
    if (!this.isAudioSupported()) return;
    const nextChapter = getNextChapterNarration(chapterId);
    if (!nextChapter || !nextChapter.audioSrc) {
      this.preloadedAudio = null;
      this.preloadedSrc = null;
      return;
    }

    if (this.preloadedSrc === nextChapter.audioSrc && this.preloadedAudio) {
      return; // Already preloaded
    }

    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = nextChapter.audioSrc;
      this.preloadedAudio = audio;
      this.preloadedSrc = nextChapter.audioSrc;
    } catch {
      this.preloadedAudio = null;
      this.preloadedSrc = null;
    }
  }

  public play(chapterId: string, options: PlayNarrationOptions = {}): void {
    this.stopInternal(false);
    const playbackId = ++this.playbackId;

    this.currentChapterId = chapterId;
    this.currentOptions = options;
    const manifest = getChapterNarration(chapterId);
    this.currentManifest = manifest;

    const script = options.locale === 'en' ? manifest.scriptEn : manifest.scriptEs;
    this.activeCaption = manifest.cinematicCues?.[0]?.caption ?? script;
    this.currentTime = 0;
    this.duration = manifest.durationEstimateMs / 1000;
    this.isPaused = false;
    this.isPlaying = true;

    // Preload next chapter lazy
    this.preloadNext(chapterId);

    // Attempt Tier 1: HTML5 Audio
    if (this.isAudioSupported() && manifest.audioSrc) {
      this.attemptAudioPlayback(manifest, options, playbackId);
    } else {
      // Direct to Tier 2
      this.fallbackToSpeech(manifest, options, playbackId);
    }
  }

  private isCurrentPlayback(playbackId: number): boolean {
    return playbackId === this.playbackId;
  }

  private attemptAudioPlayback(
    manifest: ChapterNarrationManifest,
    options: PlayNarrationOptions,
    playbackId: number,
  ): void {
    let audio: HTMLAudioElement;

    // Check if we already preloaded this audio element
    if (this.preloadedSrc === manifest.audioSrc && this.preloadedAudio) {
      audio = this.preloadedAudio;
      this.preloadedAudio = null;
      this.preloadedSrc = null;
    } else {
      try {
        audio = new Audio(manifest.audioSrc);
      } catch {
        this.fallbackToSpeech(manifest, options, playbackId);
        return;
      }
    }

    this.audioElement = audio;
    audio.muted = this.isMuted;
    audio.currentTime = 0;

    let hasStarted = false;

    const onCanPlay = () => {
      if (!this.isCurrentPlayback(playbackId)) return;
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        this.duration = audio.duration;
        this.notify();
      }
    };

    const onTimeUpdate = () => {
      if (!this.isCurrentPlayback(playbackId)) return;
      this.currentTime = audio.currentTime;
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        this.duration = audio.duration;
      }

      // Check cinematic cues if present
      if (manifest.cinematicCues && manifest.cinematicCues.length > 0) {
        let currentCue = manifest.cinematicCues[0];
        for (const cue of manifest.cinematicCues) {
          if (audio.currentTime >= cue.timeSec) {
            currentCue = cue;
          }
        }
        if (currentCue) {
          this.activeCaption = currentCue.caption;
          options.onPhaseChange?.(currentCue.phase);
        }
      }

      this.notify();
    };

    const onEnded = () => {
      if (!this.isCurrentPlayback(playbackId)) return;
      this.isPlaying = false;
      this.currentTime = this.duration;
      this.notify();

      // Brief cinematic pause after narration
      this.pauseBufferTimer = setTimeout(() => {
        if (this.isCurrentPlayback(playbackId)) options.onEnd?.();
      }, manifest.pauseAfterMs);
    };

    const onError = () => {
      if (!this.isCurrentPlayback(playbackId)) return;
      if (!hasStarted) {
        // Fallback to SpeechSynthesis
        this.fallbackToSpeech(manifest, options, playbackId);
      } else {
        // Fallback to captions if mid-playback error
        this.fallbackToCaptions(manifest, options, 0, playbackId);
      }
    };

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined && typeof playPromise?.then === 'function') {
        playPromise
          .then(() => {
            if (!this.isCurrentPlayback(playbackId)) return;
            hasStarted = true;
            this.playbackTier = 'audio';
            this.isPlaying = true;
            this.notify();
          })
          .catch(() => {
            if (!this.isCurrentPlayback(playbackId)) return;
            // Play rejected (e.g. 404, autoplay policy, unsupported codec)
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            this.fallbackToSpeech(manifest, options, playbackId);
          });
      } else {
        // audio.play() returned undefined or is not supported in current environment (e.g. jsdom)
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        this.fallbackToSpeech(manifest, options, playbackId);
      }
    } catch {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      this.fallbackToSpeech(manifest, options, playbackId);
    }
  }

  private scheduleFallbackCues(
    manifest: ChapterNarrationManifest,
    options: PlayNarrationOptions,
    elapsedMs = 0,
    playbackId = this.playbackId,
  ): void {
    this.clearFallbackCues();
    if (!manifest.cinematicCues || manifest.cinematicCues.length === 0) return;

    for (const cue of manifest.cinematicCues) {
      const delayMs = cue.timeSec * 1000 - elapsedMs;
      if (delayMs <= 0) {
        this.activeCaption = cue.caption;
        options.onPhaseChange?.(cue.phase);
        continue;
      }
      const timer = setTimeout(() => {
        if (!this.isCurrentPlayback(playbackId)) return;
        this.activeCaption = cue.caption;
        options.onPhaseChange?.(cue.phase);
        this.notify();
      }, delayMs);
      this.cueTimers.push(timer);
    }
  }

  private clearFallbackCues(): void {
    for (const timer of this.cueTimers) {
      clearTimeout(timer);
    }
    this.cueTimers = [];
  }

  private fallbackToSpeech(
    manifest: ChapterNarrationManifest,
    options: PlayNarrationOptions,
    playbackId = this.playbackId,
  ): void {
    if (!this.isCurrentPlayback(playbackId)) return;
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {
        // Ignore
      }
      this.audioElement = null;
    }

    this.playbackTier = 'speech';
    this.activeCaption = manifest.cinematicCues?.[0]?.caption ?? manifest.fallbackSpeechText;
    this.fallbackElapsedMs = 0;
    this.fallbackStartedAt = Date.now();
    this.scheduleFallbackCues(manifest, options, 0, playbackId);
    this.notify();

    if (!speechService.isSupported() || !speechService.getVoiceEnabled() || this.isMuted) {
      this.fallbackToCaptions(manifest, options, 0, playbackId);
      return;
    }

    try {
      speechService.speak(manifest.fallbackSpeechText, {
        locale: options.locale ?? 'es',
        onEnd: () => {
          if (!this.isCurrentPlayback(playbackId)) return;
          this.isPlaying = false;
          this.notify();
          this.pauseBufferTimer = setTimeout(() => {
            if (this.isCurrentPlayback(playbackId)) options.onEnd?.();
          }, manifest.pauseAfterMs);
        },
        onError: () => {
          this.fallbackToCaptions(manifest, options, this.fallbackElapsedMs, playbackId);
        },
      });
      this.isPlaying = true;
      this.notify();
    } catch {
      this.fallbackToCaptions(manifest, options, this.fallbackElapsedMs, playbackId);
    }
  }

  private fallbackToCaptions(
    manifest: ChapterNarrationManifest,
    options: PlayNarrationOptions,
    elapsedMs = 0,
    playbackId = this.playbackId,
  ): void {
    if (!this.isCurrentPlayback(playbackId)) return;
    this.playbackTier = 'captions';
    this.isPlaying = true;
    const script = options.locale === 'en' ? manifest.scriptEn : manifest.scriptEs;
    this.activeCaption = manifest.cinematicCues?.[0]?.caption ?? script;
    this.fallbackElapsedMs = elapsedMs;
    this.fallbackStartedAt = Date.now();
    this.scheduleFallbackCues(manifest, options, elapsedMs, playbackId);
    this.notify();

    const totalMs = Math.max(0, manifest.durationEstimateMs + manifest.pauseAfterMs - elapsedMs);
    this.captionsTimerRemainingMs = totalMs;
    this.captionsTimerStartedAt = Date.now();

    this.captionsTimer = setTimeout(() => {
      if (!this.isCurrentPlayback(playbackId)) return;
      this.isPlaying = false;
      this.notify();
      options.onEnd?.();
    }, totalMs);
  }

  public pause(): void {
    this.isPaused = true;

    if (this.playbackTier === 'audio' && this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {
        // Ignore
      }
    } else if (this.playbackTier === 'speech') {
      speechService.pause();
    } else if (this.playbackTier === 'captions' && this.captionsTimer) {
      clearTimeout(this.captionsTimer);
      this.captionsTimer = null;
      const elapsed = Date.now() - this.captionsTimerStartedAt;
      this.captionsTimerRemainingMs = Math.max(0, this.captionsTimerRemainingMs - elapsed);
    }

    if (this.playbackTier === 'speech' || this.playbackTier === 'captions') {
      this.fallbackElapsedMs += Math.max(0, Date.now() - this.fallbackStartedAt);
    }

    this.clearFallbackCues();

    if (this.pauseBufferTimer) {
      clearTimeout(this.pauseBufferTimer);
      this.pauseBufferTimer = null;
    }

    this.notify();
  }

  public resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;

    if (this.playbackTier === 'audio' && this.audioElement) {
      try {
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined && typeof playPromise?.catch === 'function') {
          playPromise.catch(() => {
            if (this.currentManifest && this.currentOptions) {
              this.fallbackToSpeech(this.currentManifest, this.currentOptions);
            }
          });
        }
      } catch {
        if (this.currentManifest && this.currentOptions) {
          this.fallbackToSpeech(this.currentManifest, this.currentOptions);
        }
      }
    } else if (this.playbackTier === 'speech') {
      speechService.resume();
      if (this.currentManifest && this.currentOptions) {
        this.fallbackStartedAt = Date.now();
        this.scheduleFallbackCues(this.currentManifest, this.currentOptions, this.fallbackElapsedMs);
      }
    } else if (this.playbackTier === 'captions') {
      this.captionsTimerStartedAt = Date.now();
      if (this.currentManifest && this.currentOptions) {
        this.fallbackStartedAt = Date.now();
        this.scheduleFallbackCues(this.currentManifest, this.currentOptions, this.fallbackElapsedMs);
      }
      this.captionsTimer = setTimeout(() => {
        this.isPlaying = false;
        this.notify();
        this.currentOptions?.onEnd?.();
      }, this.captionsTimerRemainingMs);
    }

    this.notify();
  }

  public stop(): void {
    this.playbackId += 1;
    this.stopInternal(true);
  }

  private stopInternal(resetChapter = true): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {
        // Ignore
      }
      this.audioElement = null;
    }

    speechService.stop();
    this.clearFallbackCues();

    if (this.captionsTimer) {
      clearTimeout(this.captionsTimer);
      this.captionsTimer = null;
    }

    if (this.pauseBufferTimer) {
      clearTimeout(this.pauseBufferTimer);
      this.pauseBufferTimer = null;
    }

    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.fallbackElapsedMs = 0;
    this.fallbackStartedAt = 0;

    if (resetChapter) {
      this.currentChapterId = null;
      this.currentManifest = null;
      this.currentOptions = null;
      this.activeCaption = '';
    }

    this.notify();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audioElement) {
      this.audioElement.muted = muted;
    }
    speechService.setVoiceEnabled(!muted);
    if (muted && this.playbackTier === 'speech' && this.currentManifest && this.currentOptions) {
      const elapsedMs = this.fallbackElapsedMs + Math.max(0, Date.now() - this.fallbackStartedAt);
      this.fallbackToCaptions(this.currentManifest, this.currentOptions, elapsedMs);
    }
    this.notify();
  }

  public isVoiceMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getPlaybackTier(): PlaybackTier {
    return this.playbackTier;
  }
}

export const audioNarration = new AudioNarrationService();
