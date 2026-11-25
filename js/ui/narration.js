/**
 * Parchment and narration.
 *
 * The text reveal is a pure function of the scroll state (textProgress), so it
 * always matches the reader's position and reverses cleanly when scrolling back.
 *
 * Words are revealed as whole units. Arabic letters are never split, which keeps
 * joining and diacritics intact. Each word fades in with a short ink blur that
 * settles to crisp text, so the paragraph is fully readable once revealed.
 */
import { CHAPTERS } from '../data/story.js';
import { formatNumber, STRINGS } from '../data/strings.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export class Narration {
  constructor(root, { reduced = false } = {}) {
    this.root = root;
    this.reduced = reduced;
    this.kicker = root.querySelector('[data-role="kicker"]');
    this.title = root.querySelector('[data-role="title"]');
    this.body = root.querySelector('[data-role="body"]');
    this.lang = 'en';
    this.key = null;
    this.words = [];
    this.lastOpen = -1;
    this.lastProgress = -1;
    this.lastChapter = -1;
    this.lastFade = -1;
  }

  setLanguage(lang) {
    this.lang = lang;
    this.key = null; // force a re-render with the new language
  }

  /** Render the content for a chapter and checkpoint. */
  renderContent(chapterIndex, checkpointIndex) {
    const chapter = CHAPTERS[chapterIndex];
    if (!chapter) return;
    const isIntro = checkpointIndex === -1;
    const cp = isIntro ? null : chapter.checkpoints[checkpointIndex];
    const lang = this.lang;
    const key = `${lang}:${chapterIndex}:${checkpointIndex}`;
    if (key === this.key) return;
    this.key = key;

    this.kicker.textContent = `${STRINGS[lang].chapterWord} ${formatNumber(chapterIndex + 1, lang)}`;
    this.title.textContent = chapter.title[lang];

    const text = isIntro ? chapter.intro[lang] : cp ? cp[lang] : '';
    this.body.textContent = '';
    this.words = [];
    // Keep whitespace as plain text nodes; wrap each word so it can reveal on its own.
    const tokens = text.split(/(\s+)/);
    for (const token of tokens) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        this.body.appendChild(document.createTextNode(token));
      } else {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = token;
        this.body.appendChild(span);
        this.words.push(span);
      }
    }
    this.lastProgress = -1; // re-apply the reveal to the new words

    this.root.dataset.mood = chapter.mood;
    this.root.classList.toggle('is-bottom', chapter.notePlacement === 'bottom');
    this.root.dir = STRINGS[lang].dir;
    this.root.lang = lang;
  }

  /**
   * Apply the parchment state from the timeline.
   * state: { open, textProgress, chapter, checkpoint }
   */
  apply(parchment) {
    const open = clamp(parchment.open);
    if (Math.abs(open - this.lastOpen) > 0.002) {
      this.lastOpen = open;
      // The scrim lives beside the parchment, so the variable is set on the stage.
      const stage = this.root.closest('.stage') || this.root;
      stage.style.setProperty('--open', open.toFixed(3));
      this.root.style.visibility = open > 0.001 ? 'visible' : 'hidden';
      this.root.setAttribute('aria-hidden', open > 0.001 ? 'false' : 'true');
    }

    // Narrow screens: the sheet fades after the text is read, so the scene shows.
    const fade = clamp(parchment.fade || 0);
    if (Math.abs(fade - this.lastFade) > 0.002) {
      this.lastFade = fade;
      this.root.style.setProperty('--fade', fade.toFixed(3));
    }

    if (parchment.chapter >= 0 && parchment.checkpoint >= -1) {
      this.renderContent(parchment.chapter, parchment.checkpoint);
      this.revealWords(parchment.textProgress);
    }
  }

  revealWords(p) {
    if (Math.abs(p - this.lastProgress) < 0.002) return;
    this.lastProgress = p;
    const n = this.words.length;
    if (!n) return;
    const reduced = this.reduced;
    this.words.forEach((el, i) => {
      let alpha;
      if (reduced) {
        alpha = clamp(p * 4);
      } else {
        // Overlapping windows so the paragraph flows in one continuous motion.
        alpha = clamp((p * (n + 1.5) - i) / 1.5);
      }
      const blur = reduced ? 0 : (1 - alpha) * 6;
      const lift = reduced ? 0 : (1 - alpha) * 0.28;
      el.style.opacity = alpha.toFixed(3);
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
      el.style.transform = lift > 0.002 ? `translateY(${lift.toFixed(3)}em)` : 'none';
    });
  }

  /** Immediately show all words (used when reduced motion is requested). */
  showAll() {
    this.lastProgress = -1;
    this.revealWords(1);
  }
}
