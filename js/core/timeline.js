/**
 * Deterministic story timeline.
 *
 * The whole experience is a list of "beats" laid out along the scroll:
 *   hero   -> the opening composition dissolves into the film (clock wipe)
 *   scrub  -> the film is scrubbed from one moment to the next
 *   hold   -> the film pauses on a checkpoint and the parchment writes itself
 *   ending -> the Cheshire grin darkens and "To be continued" appears
 *
 * Every visual value is a pure function of scroll progress. Because nothing is
 * accumulated, scrolling backward restores every earlier state exactly:
 * chapters, video frame, parchment text and ink progress all reverse cleanly.
 */
import { CHAPTERS, VIDEO_END } from '../data/story.js';

const CONFIG = {
  heroVH: 150,
  scrubVHPerSecond: 2.2,
  scrubMinVH: 36,
  holdBaseVH: 70,
  holdPerWordVH: 1.1,
  holdMinVH: 85,
  holdMaxVH: 150,
  endingVH: 80,
  introBaseVH: 60,
  introMinVH: 85,
  introMaxVH: 130,
};

/**
 * Opening mode.
 *  false -> the story starts directly at the first frame of the film (default).
 *  true  -> the original hero composition plays first and dissolves into the film.
 */
export const HERO_INTRO = true;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, v) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

/** Build the ordered list of beats with their scroll lengths in vh units. */
export function buildBeats(chapters = CHAPTERS) {
  const beats = [];
  if (HERO_INTRO) beats.push({ type: 'hero', lenVH: CONFIG.heroVH, chapter: -1 });

  chapters.forEach((chapter, ci) => {
    // The story note comes first: the chapter's opening frame is held while it writes itself.
    const introWords = wordCount(chapter.intro ? chapter.intro.en : '');
    beats.push({
      type: 'intro',
      at: chapter.start,
      chapter: ci,
      checkpoint: -1,
      final: false,
      lenVH: clamp(CONFIG.introBaseVH + introWords * CONFIG.holdPerWordVH, CONFIG.introMinVH, CONFIG.introMaxVH),
    });

    let cursor = chapter.start;
    // The chapter card is retired: the story note carries the title now.
    let first = false;

    const pushScrub = (to) => {
      const duration = to - cursor;
      if (duration <= 0.01) return;
      beats.push({
        type: 'scrub',
        from: cursor,
        to,
        chapter: ci,
        first,
        lenVH: Math.max(CONFIG.scrubMinVH, duration * CONFIG.scrubVHPerSecond),
      });
      cursor = to;
      first = false;
    };

    chapter.checkpoints.forEach((cp, pi) => {
      pushScrub(cp.t);
      const words = wordCount(cp.en || '');
      const holdVH = cp.final
        ? CONFIG.endingVH
        : clamp(
            CONFIG.holdBaseVH + words * CONFIG.holdPerWordVH,
            CONFIG.holdMinVH,
            CONFIG.holdMaxVH,
          );
      beats.push({
        type: 'hold',
        at: cp.t,
        chapter: ci,
        checkpoint: pi,
        final: !!cp.final,
        lenVH: holdVH,
      });
      cursor = cp.t;
    });

    pushScrub(chapter.end);
  });

  beats.push({ type: 'ending', lenVH: CONFIG.endingVH, chapter: chapters.length - 1 });

  // Lay beats out along the scroll.
  let acc = 0;
  for (const beat of beats) {
    beat.startVH = acc;
    acc += beat.lenVH;
    beat.endVH = acc;
  }
  return { beats, totalVH: acc };
}

/**
 * Evaluate the complete visual state for a scroll progress value p in [0, 1].
 * Returns plain data; rendering modules decide how to apply it.
 */
export function evaluate(timeline, p) {
  const { beats, totalVH } = timeline;
  const s = clamp(p) * totalVH;

  let index = beats.findIndex((b) => s >= b.startVH && s < b.endVH);
  if (index === -1) index = beats.length - 1;
  const beat = beats[index];
  const t = clamp((s - beat.startVH) / beat.lenVH);

  // Without the hero intro, the film is fully revealed from the first frame.
  const heroBeat = beats[0];
  const hasHero = heroBeat.type === 'hero';
  const heroT = !hasHero
    ? 1
    : s < heroBeat.startVH
      ? 0
      : s >= heroBeat.endVH
        ? 1
        : clamp((s - heroBeat.startVH) / heroBeat.lenVH);

  let videoTime = 0;
  switch (beat.type) {
    case 'hero':
      videoTime = 0;
      break;
    case 'scrub':
      videoTime = beat.from + (beat.to - beat.from) * t;
      break;
    case 'intro':
    case 'hold':
      videoTime = beat.at;
      break;
    case 'ending':
      videoTime = VIDEO_END;
      break;
  }

  // Parchment: opens quickly at the start of a hold, closes before the film moves on.
  const parchment = {
    visible: false,
    open: 0,
    textProgress: 0,
    fade: 0,
    chapter: -1,
    checkpoint: -1,
  };
  if ((beat.type === 'hold' && !beat.final) || beat.type === 'intro') {
    const open = smoothstep(0, 0.05, t) * (1 - smoothstep(0.94, 1, t));
    parchment.open = open;
    parchment.visible = open > 0.001;
    // Text is fully written by 55% of the hold, then there is reading time.
    parchment.textProgress = clamp(t / 0.55);
    // Narrow screens: the story sheet fades out after reading, revealing the scene.
    parchment.fade = smoothstep(0.66, 0.78, t);
    parchment.chapter = beat.chapter;
    parchment.checkpoint = beat.checkpoint;
  }

  // Chapter card: a title that rises at the start of each chapter's first scrub.
  let chapterCard = { chapter: -1, opacity: 0 };
  if (beat.type === 'scrub' && beat.first) {
    chapterCard = {
      chapter: beat.chapter,
      opacity: smoothstep(0, 0.1, t) * (1 - smoothstep(0.16, 0.34, t)),
    };
  }

  // Ending: darkness settles, then the closing words appear.
  const ending = { active: beat.type === 'ending', t: beat.type === 'ending' ? t : 0 };
  // The film is dark while the story note is written, and brightens as the note closes.
  const introDarken = beat.type === 'intro' ? 0.88 * (1 - smoothstep(0.82, 1, t)) : 0;
  const endingDarken = beat.type === 'ending' ? smoothstep(0, 0.55, t) : 0;
  const darken = Math.max(introDarken, endingDarken);
  const endingText = beat.type === 'ending' ? smoothstep(0.3, 0.7, t) : 0;
  const musicFade = beat.type === 'ending' ? 1 - smoothstep(0.35, 1, t) : 1;

  // Film wipe: the clock-shaped mask opens over the hero exit.
  const wipe = smoothstep(0.12, 0.9, heroT);

  return {
    p,
    index,
    beat,
    t,
    heroT,
    videoTime,
    wipe,
    parchment,
    chapterCard,
    ending,
    darken,
    endingText,
    musicFade,
    activeChapter: beat.chapter,
    progress: clamp(p),
  };
}

/** Scroll fraction (0..1) where a chapter first begins. */
export function chapterFraction(timeline, chapterIndex) {
  const beat = timeline.beats.find((b) => b.chapter === chapterIndex && b.type === 'intro');
  return beat ? beat.startVH / timeline.totalVH : 0;
}

/** Scroll fraction (0..1) where the story film begins (after the hero). */
export function filmStartFraction(timeline) {
  const firstScrub = timeline.beats.find((b) => b.type === 'intro' || b.type === 'scrub');
  return firstScrub.startVH / timeline.totalVH;
}

export { CONFIG as TIMELINE_CONFIG };
