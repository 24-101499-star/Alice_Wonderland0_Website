/**
 * Interface chrome: chapter rail, progress line, chapter card, ending card,
 * loader and sound/language controls. Every value is written from state, so
 * each element stays correct in both directions and in both languages.
 */
import { CHAPTERS, ENDING } from '../data/story.js';
import { formatNumber, STRINGS } from '../data/strings.js';

export class Chrome {
  constructor(root, { onNavigate, onSound, onLanguage, onBegin, onReplay }) {
    this.root = root;
    this.lang = 'en';
    this.callbacks = { onNavigate, onSound, onLanguage, onBegin, onReplay };

    this.rail = root.querySelector('[data-role="rail"]');
    this.progressBar = root.querySelector('[data-role="progress"]');
    this.card = root.querySelector('[data-role="chapter-card"]');
    this.cardKicker = this.card.querySelector('[data-role="kicker"]');
    this.cardTitle = this.card.querySelector('[data-role="title"]');
    this.ending = root.querySelector('[data-role="ending"]');
    this.endingText = root.querySelector('[data-role="ending-text"]');
    this.replayBtn = root.querySelector('[data-role="replay"]');
    this.loader = root.querySelector('[data-role="loader"]');
    this.loaderBar = root.querySelector('[data-role="loader-bar"]');
    this.loaderError = root.querySelector('[data-role="loader-error"]');
    this.soundBtn = root.querySelector('[data-role="sound"]');
    this.soundLabel = root.querySelector('[data-role="sound-label"]');
    this.darkener = root.querySelector('[data-role="darken"]');
    this.cue = root.querySelector('[data-role="cue"]');
    this.beginBtn = root.querySelector('[data-role="begin"]');

    this.soundOn = false;
    this.soundStarted = false;
    this.lastRail = -2;
    this.lastProgress = -1;
    this.lastCard = null;
    this.lastEnding = -1;
    this.lastDarken = -1;

    this.buildRail();
    this.bind();
  }

  buildRail() {
    this.rail.innerHTML = '';
    CHAPTERS.forEach((chapter, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.chapter = String(i);
      btn.className = 'rail__item';
      btn.innerHTML = `<span class="rail__num"></span><span class="rail__label"></span>`;
      btn.addEventListener('click', () => this.callbacks.onNavigate && this.callbacks.onNavigate(i));
      li.appendChild(btn);
      this.rail.appendChild(li);
    });
    this.setLanguage(this.lang);
  }

  bind() {
    this.soundBtn.addEventListener('click', () => this.callbacks.onSound && this.callbacks.onSound());
    this.beginBtn.addEventListener('click', () => this.callbacks.onBegin && this.callbacks.onBegin());
    this.replayBtn.addEventListener('click', () => this.callbacks.onReplay && this.callbacks.onReplay());
    this.root.querySelectorAll('[data-lang-option]').forEach((btn) => {
      btn.addEventListener('click', () => this.callbacks.onLanguage && this.callbacks.onLanguage(btn.dataset.langOption));
    });
  }

  /** Update only text content and labels. Never touches playback. */
  setLanguage(lang) {
    this.lang = lang;
    const s = STRINGS[lang];
    this.rail.querySelectorAll('.rail__item').forEach((btn, i) => {
      btn.querySelector('.rail__num').textContent = formatNumber(i + 1, lang);
      btn.querySelector('.rail__label').textContent = CHAPTERS[i].short[lang];
      btn.setAttribute('aria-label', `${s.navTo} ${formatNumber(i + 1, lang)}: ${CHAPTERS[i].title[lang]}`);
    });
    this.endingText.textContent = ENDING[lang];
    this.lastCard = null;
    this.lastRail = -2;
    // Re-apply the sound state in the new language (it is state, not a fixed label).
    this.setSound(this.soundOn, this.soundStarted);
  }

  /** Chapter card: shows the chapter title when a chapter opens. */
  updateCard(card) {
    const key = `${card.chapter}:${this.lang}`;
    if (key !== this.lastCard && card.chapter >= 0) {
      this.lastCard = key;
      const chapter = CHAPTERS[card.chapter];
      this.cardKicker.textContent = `${STRINGS[this.lang].chapterWord} ${formatNumber(card.chapter + 1, this.lang)}`;
      this.cardTitle.textContent = chapter.title[this.lang];
      this.card.dir = STRINGS[this.lang].dir;
    }
    const opacity = card.chapter >= 0 ? card.opacity : 0;
    if (Math.abs(opacity - (this.lastCardOpacity ?? -1)) > 0.002) {
      this.lastCardOpacity = opacity;
      this.card.style.opacity = opacity.toFixed(3);
      this.card.style.visibility = opacity > 0.002 ? 'visible' : 'hidden';
    }
  }

  /** Each frame from the state. */
  update(state) {
    // Progress line.
    const p = state.progress;
    if (Math.abs(p - this.lastProgress) > 0.0005) {
      this.lastProgress = p;
      this.progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
    }

    // Chapter rail highlight.
    if (state.activeChapter !== this.lastRail) {
      this.lastRail = state.activeChapter;
      this.rail.querySelectorAll('.rail__item').forEach((btn, i) => {
        const active = i === state.activeChapter;
        btn.classList.toggle('is-active', active);
        btn.classList.toggle('is-past', state.activeChapter >= 0 && i < state.activeChapter);
        if (active) btn.setAttribute('aria-current', 'step');
        else btn.removeAttribute('aria-current');
      });
    }
    // The rail steps aside on the final grin and the ending, so it never sits on the image.
    const quiet = state.beat.type === 'ending' || (state.beat.type === 'hold' && state.beat.final);
    this.rail.parentElement.classList.toggle('is-visible', state.heroT > 0.97 && !quiet);

    // Chapter card.
    this.updateCard(state.chapterCard);

    // Darkening during the ending.
    if (Math.abs(state.darken - this.lastDarken) > 0.002) {
      this.lastDarken = state.darken;
      this.darkener.style.opacity = state.darken.toFixed(3);
    }

    // Ending card.
    if (Math.abs(state.endingText - this.lastEnding) > 0.002) {
      this.lastEnding = state.endingText;
      this.ending.style.opacity = state.endingText.toFixed(3);
      this.ending.style.pointerEvents = state.endingText > 0.9 ? 'auto' : 'none';
      this.ending.style.visibility = state.endingText > 0.001 ? 'visible' : 'hidden';
    }

    // Scroll cue fades once the reader moves.
    this.cue.style.opacity = p > 0.01 ? '0' : '';
  }

  setSound(on, started) {
    this.soundOn = on;
    this.soundStarted = started;
    const s = STRINGS[this.lang];
    this.soundBtn.setAttribute('aria-pressed', String(on));
    this.soundLabel.textContent = on ? s.soundOn : s.soundOff;
    this.soundBtn.classList.toggle('is-on', on);
    this.soundBtn.classList.toggle('is-started', started);
  }

  setLoading(fraction, { error = false, ready = false } = {}) {
    if (ready) {
      this.loader.classList.add('is-done');
      return;
    }
    this.loaderBar.style.transform = `scaleX(${Math.max(0.02, fraction).toFixed(3)})`;
    if (error) {
      this.loader.classList.add('has-error');
      this.loaderError.hidden = false;
    }
  }

  setBegin(enabled) {
    this.beginBtn.disabled = !enabled;
  }

  setLanguageOptions(lang) {
    this.root.querySelectorAll('[data-lang-option]').forEach((btn) => {
      const active = btn.dataset.langOption === lang;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('is-active', active);
    });
  }
}
