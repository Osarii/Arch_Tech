export type TextScale = '100' | '1125' | '125';
export type SpeechSpeed = 0.75 | 1 | 1.25 | 1.5;

export interface AccessibilityPreferences {
  // Reading
  voiceURI: string | null;
  speed: SpeechSpeed;
  hoverReader: boolean;
  spokenWordHighlight: boolean;
  readingGuide: boolean;
  readingMask: boolean;

  // Vision
  textScale: TextScale;
  textSpacing: boolean;
  colorSafe: boolean;
  highContrast: boolean;
  highlightLinks: boolean;

  // Motion
  reduceMotion: boolean;
}

export const DEFAULT_A11Y_PREFERENCES: AccessibilityPreferences = {
  voiceURI: null,
  speed: 1,
  hoverReader: false,
  spokenWordHighlight: true,
  readingGuide: false,
  readingMask: false,

  textScale: '100',
  textSpacing: false,
  colorSafe: false,
  highContrast: false,
  highlightLinks: false,

  reduceMotion: false,
};

export const STORAGE_KEY_A11Y = 'arch-tech-a11y-preferences';
export const STORAGE_KEY_THEME = 'arch-tech-portal-theme';
export const STORAGE_KEY_LEGACY_SCALE = 'arch-tech-portal-text-scale';
export const STORAGE_KEY_LEGACY_COLOR_SAFE = 'arch-tech-portal-color-safe';
export const STORAGE_KEY_LEGACY_REDUCE_MOTION = 'arch-tech-portal-reduce-motion';

export function loadAccessibilityPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_A11Y_PREFERENCES };
  }

  let base = { ...DEFAULT_A11Y_PREFERENCES };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_A11Y);
    if (raw) {
      const parsed = JSON.parse(raw);
      base = { ...base, ...parsed };
    }
  } catch {
    // Keep defaults if parsing fails
  }

  // Backward compatibility with legacy storage keys
  try {
    const legacyScale = window.localStorage.getItem(STORAGE_KEY_LEGACY_SCALE);
    if (legacyScale === '1125' || legacyScale === '125' || legacyScale === '100') {
      base.textScale = legacyScale;
    }

    const legacyColorSafe = window.localStorage.getItem(STORAGE_KEY_LEGACY_COLOR_SAFE);
    if (legacyColorSafe !== null) {
      base.colorSafe = legacyColorSafe === 'true';
    }

    const legacyReduceMotion = window.localStorage.getItem(STORAGE_KEY_LEGACY_REDUCE_MOTION);
    if (legacyReduceMotion !== null) {
      base.reduceMotion = legacyReduceMotion === 'true';
    } else if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      base.reduceMotion = true;
    }
  } catch {
    // Continue with in-memory preferences
  }

  return base;
}

export function saveAccessibilityPreferences(prefs: AccessibilityPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY_A11Y, JSON.stringify(prefs));
    // Sync legacy keys for backward compatibility
    window.localStorage.setItem(STORAGE_KEY_LEGACY_SCALE, prefs.textScale);
    window.localStorage.setItem(STORAGE_KEY_LEGACY_COLOR_SAFE, prefs.colorSafe ? 'true' : 'false');
    window.localStorage.setItem(STORAGE_KEY_LEGACY_REDUCE_MOTION, prefs.reduceMotion ? 'true' : 'false');
  } catch {
    // LocalStorage quota or access denied; preferences remain active in memory
  }
}

export function applyAccessibilityClasses(prefs: AccessibilityPreferences): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Text scale
  root.classList.remove('portal-scale-1125', 'portal-scale-125');
  if (prefs.textScale === '1125') root.classList.add('portal-scale-1125');
  if (prefs.textScale === '125') root.classList.add('portal-scale-125');

  // Vision tokens & classes
  root.classList.toggle('portal-color-safe', prefs.colorSafe);
  root.classList.toggle('portal-high-contrast', prefs.highContrast);
  root.classList.toggle('portal-text-spacing', prefs.textSpacing);
  root.classList.toggle('portal-highlight-links', prefs.highlightLinks);

  // Motion
  root.classList.toggle('portal-reduce-motion', prefs.reduceMotion);
}

export function findWordAtOffset(text: string, offset: number): { word: string; start: number; end: number } | null {
  if (!text || offset < 0 || offset > text.length) return null;

  const isWordChar = (char: string) => /[\p{L}\p{N}_'-]/u.test(char);
  let pos = offset;

  if (pos >= text.length || !isWordChar(text[pos])) {
    if (pos > 0 && isWordChar(text[pos - 1])) {
      pos = pos - 1;
    } else {
      return null;
    }
  }

  let start = pos;
  while (start > 0 && isWordChar(text[start - 1])) {
    start--;
  }

  let end = pos;
  while (end < text.length && isWordChar(text[end])) {
    end++;
  }

  const rawWord = text.slice(start, end);
  const match = rawWord.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}].*?)([^\p{L}\p{N}]*)$/u);
  if (!match) return null;

  const word = match[2];
  const adjustedStart = start + match[1].length;
  const adjustedEnd = adjustedStart + word.length;

  return {
    word,
    start: adjustedStart,
    end: adjustedEnd,
  };
}

export interface TextSegment {
  node: Text;
  text: string;
  globalStart: number;
  globalEnd: number;
}

export interface ExtractedMainText {
  fullText: string;
  segments: TextSegment[];
}

export function extractMainContentWithMap(rootNode: Node): ExtractedMainText {
  const segments: TextSegment[] = [];
  let fullText = '';

  const isIgnored = (el: Element): boolean => {
    const tag = el.tagName.toLowerCase();
    if (
      el.hasAttribute('hidden') ||
      el.getAttribute('aria-hidden') === 'true' ||
      tag === 'nav' ||
      tag === 'button' ||
      tag === 'a' ||
      tag === 'input' ||
      tag === 'select' ||
      tag === 'textarea' ||
      tag === 'svg' ||
      el.getAttribute('role') === 'button' ||
      el.getAttribute('role') === 'link' ||
      el.getAttribute('role') === 'dialog' ||
      el.classList.contains('portal-a11y-ignore')
    ) {
      return true;
    }
    return false;
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent || '';
      const trimmed = content.trim();
      if (trimmed.length > 0) {
        if (fullText.length > 0 && !fullText.endsWith(' ')) {
          fullText += ' ';
        }
        const globalStart = fullText.length;
        fullText += content;
        const globalEnd = fullText.length;
        segments.push({
          node: node as Text,
          text: content,
          globalStart,
          globalEnd,
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (isIgnored(el)) return;
      for (const child of Array.from(node.childNodes)) {
        walk(child);
      }
    }
  };

  walk(rootNode);

  return { fullText, segments };
}

export function getRectForCharIndex(
  extracted: ExtractedMainText,
  charIndex: number,
  _charLength?: number
): DOMRect | null {
  if (!extracted.segments.length) return null;

  let segment: TextSegment | null = null;
  for (const s of extracted.segments) {
    if (charIndex >= s.globalStart && charIndex <= s.globalEnd) {
      segment = s;
      break;
    }
  }

  if (!segment) {
    for (let i = 0; i < extracted.segments.length; i++) {
      if (extracted.segments[i].globalStart > charIndex) {
        segment = extracted.segments[Math.max(0, i - 1)];
        break;
      }
    }
    if (!segment) segment = extracted.segments[extracted.segments.length - 1];
  }

  if (!segment) return null;

  const localOffset = Math.max(0, Math.min(charIndex - segment.globalStart, segment.text.length));
  const wordInfo = findWordAtOffset(segment.text, localOffset);
  if (!wordInfo) return null;

  try {
    const range = document.createRange();
    range.setStart(segment.node, wordInfo.start);
    range.setEnd(segment.node, wordInfo.end);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return rect;
    }
  } catch {
    return null;
  }
  return null;
}

export function isHoverReaderSupported(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.caretPositionFromPoint || (document as any).caretRangeFromPoint);
}

export function getHoveredWordAtPoint(x: number, y: number): { word: string; rect: DOMRect; node: Text } | null {
  if (typeof document === 'undefined') return null;

  if (typeof document.elementFromPoint === 'function') {
    const targetEl = document.elementFromPoint(x, y);
    if (targetEl) {
      const interactive = targetEl.closest(
        'button, a, input, select, textarea, nav, svg, [role="button"], [role="link"], [role="dialog"], [aria-hidden="true"], .portal-a11y-ignore'
      );
      if (interactive) return null;

      const mainEl = targetEl.closest('main');
      if (!mainEl) return null;
    }
  }

  let textNode: Text | null = null;
  let offset = 0;

  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode && pos.offsetNode.nodeType === Node.TEXT_NODE) {
      textNode = pos.offsetNode as Text;
      offset = pos.offset;
    }
  } else if ((document as any).caretRangeFromPoint) {
    const range = (document as any).caretRangeFromPoint(x, y);
    if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      textNode = range.startContainer as Text;
      offset = range.startOffset;
    }
  }

  if (!textNode || !textNode.textContent) return null;

  const parentEl = textNode.parentElement;
  if (parentEl) {
    const interactive = parentEl.closest(
      'button, a, input, select, textarea, nav, svg, [role="button"], [role="link"], [role="dialog"], [aria-hidden="true"], .portal-a11y-ignore'
    );
    if (interactive) return null;

    if (!parentEl.closest('main')) return null;
  }

  const wordInfo = findWordAtOffset(textNode.textContent, offset);
  if (!wordInfo) return null;

  try {
    const range = document.createRange();
    range.setStart(textNode, wordInfo.start);
    range.setEnd(textNode, wordInfo.end);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { word: wordInfo.word, rect, node: textNode };
    }
  } catch {
    return null;
  }

  return null;
}
