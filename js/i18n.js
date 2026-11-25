/**
 * Language manager.
 *
 * Switching language is strictly a presentation change. It updates:
 *   - <html lang> and <html dir>,
 *   - text and aria labels marked with data-i18n attributes,
 *   - the narration and rail labels (via their own render hooks).
 *
 * It never reloads the page, restarts the video, seeks, restarts the soundtrack,
 * or resets the scroll position. The story state is driven by scroll progress,
 * so the reader stays on the same moment in the film.
 */
import { STRINGS } from './data/strings.js';

const STORAGE_KEY = 'alice-lang';

export class I18n {
  constructor() {
    this.lang = this.initialLanguage();
    this.listeners = new Set();
  }

  initialLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch (_) {
      /* Storage may be unavailable (private mode). */
    }
    return (navigator.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }

  apply(lang = this.lang) {
    const s = STRINGS[lang];
    const html = document.documentElement;
    html.lang = lang;
    html.dir = s.dir;
    document.body.dataset.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = s[el.dataset.i18n];
      if (value !== undefined) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const value = s[el.dataset.i18nAria];
      if (value !== undefined) el.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-lang-option]').forEach((btn) => {
      const active = btn.dataset.langOption === lang;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('is-active', active);
    });
  }

  set(lang) {
    if (lang !== 'en' && lang !== 'ar') return;
    if (lang === this.lang) return;
    this.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      /* ignore */
    }
    this.apply(lang);
    this.listeners.forEach((fn) => fn(lang));
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  t(key) {
    return STRINGS[this.lang][key];
  }
}
