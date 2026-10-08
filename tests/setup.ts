import '../src/i18n';

// Polyfill WebGPU globals for Node/JSDOM test runner
if (typeof (globalThis as any).GPUShaderStage === 'undefined') {
  (globalThis as any).GPUShaderStage = {
    VERTEX: 1,
    FRAGMENT: 2,
    COMPUTE: 4,
  };
}

if (typeof (globalThis as any).GPUBufferUsage === 'undefined') {
  (globalThis as any).GPUBufferUsage = {
    MAP_READ: 1,
    MAP_WRITE: 2,
    COPY_SRC: 4,
    COPY_DST: 8,
    INDEX: 16,
    VERTEX: 32,
    UNIFORM: 64,
    STORAGE: 128,
    INDIRECT: 256,
  };
}

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock-object-url';
  URL.revokeObjectURL = () => {};
}

if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
  (globalThis as any).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof window !== 'undefined') {
  if (typeof (window as any).speechSynthesis === 'undefined') {
    (window as any).speechSynthesis = {
      speak: (utterance: any) => {
        setTimeout(() => utterance.onend?.({}), 10);
      },
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: () => [{ lang: 'es-419', name: 'Latam Voice' }],
    };
  }
  if (typeof (window as any).SpeechSynthesisUtterance === 'undefined') {
    (window as any).SpeechSynthesisUtterance = class {
      text: string;
      lang = 'es-419';
      voice = null;
      rate = 1;
      pitch = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text = '') {
        this.text = text;
      }
    };
  }

  if (typeof window.HTMLMediaElement !== 'undefined') {
    window.HTMLMediaElement.prototype.play = function () {
      return Promise.reject(new Error('Media playback not available in JSDOM test environment'));
    };
    window.HTMLMediaElement.prototype.pause = function () {
      // noop
    };
  }
}

