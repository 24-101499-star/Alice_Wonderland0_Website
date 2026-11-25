
import { CHAPTERS } from './data/story.js';
import { buildBeats, evaluate, chapterFraction, filmStartFraction, HERO_INTRO } from './core/timeline.js';
import { VideoController } from './core/video.js';
import { SoundManager } from './core/audio.js';
import { I18n } from './i18n.js';
import { Hero } from './ui/hero.js';
import { Narration } from './ui/narration.js';
import { Chrome } from './ui/chrome.js';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = reducedQuery.matches;

const $ = (sel) => document.querySelector(sel);

function boot() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  document.body.classList.toggle('is-reduced', reduced);

  /* ---------- Language ---------- */
  const i18n = new I18n();
  i18n.apply();

  /* ---------- Timeline ---------- */
  const timeline = buildBeats(CHAPTERS);
  const spacer = $('#spacer');
  const stage = $('#stage');
  const film = $('#film');
  const heroEl = $('#hero');
  const parchmentEl = $('#parchment');

  let vh = window.innerHeight;
  const sizeSpacer = () => {
    vh = window.innerHeight;
    spacer.style.height = `${(timeline.totalVH / 100) * vh + vh}px`;
  };
  const scrollRange = () => (timeline.totalVH / 100) * vh;
  const scrollToFraction = (f) => window.scrollTo({ top: f * scrollRange(), behavior: reduced ? 'auto' : 'smooth' });
  sizeSpacer();

  /* ---------- Modules ---------- */
  const video = new VideoController($('#video'), {
    hd: 'assets/video/alice-1080.mp4',
    sd: 'assets/video/alice-720.mp4',
    poster: 'assets/video/poster.jpg',
  });

  const sound = new SoundManager('assets/audio/soundtrack.mp3', { maxVolume: 0.7 });

  const hero = new Hero(heroEl, {
    reduced,
    onIntroDone: () => {
      chrome.setBegin(true);
      document.body.classList.remove('is-loading');
    },
  });
  if (HERO_INTRO) {
    hero.build();
  } else {
    // Story opens at the first frame of the film; the hero is not shown.
    heroEl.hidden = true;
  }

  const narration = new Narration(parchmentEl, { reduced });
  narration.setLanguage(i18n.lang);

  const chrome = new Chrome(document.body, {
    onNavigate: (ci) => scrollToFraction(chapterFraction(timeline, ci)),
    onSound: () => sound.toggle(),
    onLanguage: (lang) => i18n.set(lang),
    onBegin: () => {
      sound.start();
      scrollToFraction(filmStartFraction(timeline));
    },
    onReplay: () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }),
  });
  chrome.setLanguage(i18n.lang);
  chrome.setLanguageOptions(i18n.lang);
  chrome.setBegin(false);

  i18n.onChange((lang) => {
    chrome.setLanguage(lang);
    chrome.setLanguageOptions(lang);
    narration.setLanguage(lang);
  });

  sound.on((kind) => {
    if (kind === 'change' || kind === 'error') {
      chrome.setSound(sound.started && !sound.muted, sound.started);
    }
  });
  chrome.setSound(false, false);

  /* ---------- Video readiness ---------- */
  video.on('progress', () => chrome.setLoading(video.bufferedFraction()));
  video.on('ready', () => chrome.setLoading(1, { ready: true }));
  video.on('error', () => {
    chrome.setLoading(1, { error: true });
    film.classList.add('is-failed');
  });

  /* ---------- Scroll progress ---------- */
  let progress = 0;
  ScrollTrigger.create({
    trigger: spacer,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      progress = self.progress;
    },
  });

  // Keep the spacer correct when the viewport changes meaningfully.
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const widthChanged = Math.abs(window.innerWidth - lastWidth) > 0;
    const heightChanged = Math.abs(window.innerHeight - vh) > 140;
    if (widthChanged || heightChanged) {
      lastWidth = window.innerWidth;
      sizeSpacer();
      hero.measure();
      placeVideo();
      ScrollTrigger.refresh();
    }
  });

  /* ---------- Render loop (single source for every visual) ---------- */
  let lastIris = -2;
  let lastChapter = -2;

  // Video placement: cover-fits the film, then centres the active chapter's point of interest.
  const videoEl = $('#video');
  let focusX = 50;
  const placeVideo = () => {
    const vw = film.clientWidth;
    const vh = film.clientHeight;
    const scale = Math.max(vw / 1920, vh / 1080);
    const wv = 1920 * scale;
    let off = vw / 2 - (focusX / 100) * wv;
    off = Math.min(0, Math.max(vw - wv, off));
    videoEl.style.objectPosition = `${off.toFixed(1)}px 50%`;
  };
  placeVideo();  let lastFade = -1;
  let lastHeroT = -1;

  const render = () => {
    const state = evaluate(timeline, progress);

    // Hero exit.
    if (Math.abs(state.heroT - lastHeroT) > 0.0005) {
      lastHeroT = state.heroT;
      hero.setExit(state.heroT);
      heroEl.style.visibility = state.heroT >= 0.999 ? 'hidden' : 'visible';
    }

    // The film is revealed through the teacup opening during the hero dive.
    if (HERO_INTRO) {
      const r = hero.irisRadius(state.heroT);
      if (Math.abs(r - lastIris) > 0.5) {
        lastIris = r;
        film.style.clipPath = `circle(${r.toFixed(1)}px at ${hero.cx.toFixed(1)}px ${hero.cy.toFixed(1)}px)`;
        hero.setIris(r);
      }
    } else if (lastIris !== -3) {
      lastIris = -3;
      film.style.clipPath = 'none';
    }

    // Portrait crop: keep the active chapter's character inside the frame.
    if (state.activeChapter !== lastChapter && state.activeChapter >= 0) {
      lastChapter = state.activeChapter;
      focusX = CHAPTERS[state.activeChapter].focusX;
      placeVideo();
    }

    // Video: scrubbed to the timeline. Reduced motion steps between moments.
    let target = state.videoTime;
    if (reduced && state.beat.type === 'scrub') {
      target = state.t < 0.5 ? state.beat.from : state.beat.to;
    }
    video.setTarget(target);
    video.tick();

    // Parchment, chapter card, rail, ending, progress.
    narration.apply(state.parchment);
    chrome.update(state);

    // Soundtrack fades out at the very end only.
    if (Math.abs(state.musicFade - lastFade) > 0.002) {
      lastFade = state.musicFade;
      sound.setFade(state.musicFade);
    }

    // Hero and film share the stage; nothing else needs per-frame work.
    stage.dataset.beat = state.beat.type;
  };
  gsap.ticker.add(render);

  /* ---------- Start ---------- */
  const start = () => {
    document.body.classList.add('is-ready');
    hero.play();
    if (reduced) chrome.setBegin(true);
  };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    start();
  }

  // Keyboard: Space/arrow keys already scroll natively; "M" toggles sound.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') sound.toggle();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
