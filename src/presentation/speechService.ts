/**
 * Speech service for ARCH_TECH Presentation Mode.
 * Utilizes the browser's SpeechSynthesis API with graceful fallbacks.
 * Preferences:
 * 1. es-419 (Latin American Spanish)
 * 2. es-ES / Spanish
 * 3. System default voice
 */

export interface SpeechOptions {
  locale?: 'es' | 'en';
  onEnd?: () => void;
  onError?: (error?: unknown) => void;
  rate?: number;
  pitch?: number;
}

class PresentationSpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isVoiceEnabled = true;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public getVoiceEnabled(): boolean {
    return this.isVoiceEnabled;
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.isVoiceEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public getPreferredVoice(locale: 'es' | 'en' = 'es'): SpeechSynthesisVoice | null {
    if (!this.isSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (locale === 'es') {
      // 1. es-419 / Latin America
      const latamVoice = voices.find(
        (v) => v.lang.toLowerCase() === 'es-419' || v.lang.toLowerCase() === 'es_419' || v.lang.toLowerCase().includes('419')
      );
      if (latamVoice) return latamVoice;

      // 2. Any Spanish voice (es-MX, es-CR, es-ES, etc.)
      const esVoice = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
      if (esVoice) return esVoice;
    } else {
      const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (enVoice) return enVoice;
    }

    return voices[0] ?? null;
  }

  public speak(text: string, options: SpeechOptions = {}): void {
    this.stop();

    if (!this.isVoiceEnabled || !this.isSupported() || !text.trim()) {
      options.onEnd?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getPreferredVoice(options.locale ?? 'es');
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = options.locale === 'en' ? 'en-US' : 'es-419';
      }

      utterance.rate = options.rate ?? 0.95; // slightly deliberate architectural pacing
      utterance.pitch = options.pitch ?? 1.0;

      utterance.onend = () => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
          options.onEnd?.();
        }
      };

      utterance.onerror = (e) => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
          options.onError?.(e);
        }
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.currentUtterance = null;
      options.onError?.(err);
    }
  }

  public stop(): void {
    if (!this.isSupported()) return;
    try {
      this.currentUtterance = null;
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cleanup error
    }
  }

  public pause(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.pause();
    } catch {
      // Ignore
    }
  }

  public resume(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.resume();
    } catch {
      // Ignore
    }
  }
}

export const speechService = new PresentationSpeechService();
