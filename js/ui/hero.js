/**
 * Hero: the supplied poster, living inside a field of floating Wonderland objects.
 *
 * Layers (back to front):
 *   1. .hero__back     blurred poster, fills the whole screen (portrait screens)
 *   2. .hero__canvas   sharp poster, sized to cover (or to width on portrait)
 *   3. .hero__layers   floating cards, keys, watches, roses, petals and sparks
 *   4. .hero__portal   a swirling crimson ring that opens around the teacup
 *   5. dust canvas     drifting particles that spiral into the cup on the dive
 *
 * GSAP drives every motion. Each floating object has three nested transforms
 * (sway, travel, spin) so the motions never fight each other. Scroll moves the
 * whole field outward through CSS variables, so reverse scrolling is exact.
 */

const CUP = { x: 0.47, y: 0.66 }; // teacup opening, as fractions of the poster
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);

/* ------------------------------------------------------------------ */
/* Original vector objects                                             */
/* ------------------------------------------------------------------ */
const GOLD = '#c9a25c';
const SUIT = {
  heart: 'M12 21 C5 15 2 11 2 7 C2 4 4.5 2 7 2 C9 2 11 3.2 12 5 C13 3.2 15 2 17 2 C19.5 2 22 4 22 7 C22 11 19 15 12 21Z',
  diamond: 'M12 2 L21 12 L12 22 L3 12Z',
  spade: 'M12 2 C8 7 3 10 3 14 C3 17 5.5 18.5 8 18.5 C9.5 18.5 11 17.8 11.5 16.7 L10 21.5 L14 21.5 L12.5 16.7 C13 17.8 14.5 18.5 16 18.5 C18.5 18.5 21 17 21 14 C21 10 16 7 12 2Z',
};

function suitGlyph(suit, color, x, y, size) {
  const s = size / 24;
  if (suit === 'club') {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}"><circle cx="12" cy="7" r="4.5"/><circle cx="6.5" cy="14.5" r="4.5"/><circle cx="17.5" cy="14.5" r="4.5"/><path d="M10.2 13 L13.8 13 L15.6 22 L8.4 22Z"/></g>`;
  }
  return `<path transform="translate(${x} ${y}) scale(${s})" d="${SUIT[suit]}" fill="${color}"/>`;
}

function cardSVG(suit, rank, red) {
  const c = red ? '#8e0f1d' : '#1d0e12';
  return `<svg viewBox="0 0 120 176" aria-hidden="true">
    <defs><linearGradient id="fc-${suit}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf1d8"/><stop offset="1" stop-color="#d9c49a"/></linearGradient></defs>
    <rect x="3" y="3" width="114" height="170" rx="10" fill="url(#fc-${suit})" stroke="${GOLD}" stroke-width="3"/>
    <rect x="12" y="12" width="96" height="152" rx="6" fill="none" stroke="${c}" stroke-width="1" opacity=".45"/>
    <text x="18" y="34" font-family="Cinzel, serif" font-size="18" font-weight="700" fill="${c}">${rank}</text>
    ${suitGlyph(suit, c, 14, 40, 14)}${suitGlyph(suit, c, 34, 62, 52)}
  </svg>`;
}

const KEY_SVG = `<svg viewBox="0 0 60 200" aria-hidden="true"><defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3dca0"/><stop offset=".5" stop-color="#b58a45"/><stop offset="1" stop-color="#5a3812"/></linearGradient></defs>
  <circle cx="30" cy="30" r="22" fill="none" stroke="url(#kg)" stroke-width="9"/><circle cx="30" cy="30" r="8" fill="#2a0c10"/>
  <rect x="25" y="48" width="10" height="142" rx="3" fill="url(#kg)"/><rect x="35" y="150" width="14" height="9" rx="2" fill="url(#kg)"/><rect x="35" y="170" width="10" height="9" rx="2" fill="url(#kg)"/></svg>`;

const ROSE_SVG = `<svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="60" fill="#4e0712"/>
  <path d="M80 30 a50 50 0 0 1 50 50 a36 36 0 0 1 -36 36 a24 24 0 0 1 -24 -24 a14 14 0 0 1 14 -14" fill="none" stroke="#2a0307" stroke-width="3"/>
  <path d="M80 44 a36 36 0 0 1 36 36 a22 22 0 0 1 -22 22" fill="none" stroke="#7a1424" stroke-width="2.5"/>
  <path d="M80 60 a20 20 0 0 1 20 20 a12 12 0 0 1 -12 12" fill="none" stroke="#9c1c30" stroke-width="2"/></svg>`;

const WATCH_SVG = `<svg viewBox="0 0 120 150" aria-hidden="true"><defs><radialGradient id="wg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f3dca0"/><stop offset=".45" stop-color="#b98a45"/><stop offset="1" stop-color="#4b2c12"/></radialGradient></defs>
  <circle cx="60" cy="16" r="10" fill="none" stroke="${GOLD}" stroke-width="5"/><rect x="54" y="24" width="12" height="10" fill="${GOLD}"/>
  <circle cx="60" cy="90" r="54" fill="url(#wg)" stroke="#2d1608" stroke-width="2"/><circle cx="60" cy="90" r="45" fill="#f1e4c4"/>
  <line x1="60" y1="90" x2="60" y2="58" stroke="#2b1608" stroke-width="4" stroke-linecap="round"/>
  <line x1="60" y1="90" x2="82" y2="98" stroke="#7a0f1f" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="90" r="4" fill="${GOLD}"/></svg>`;

const PETAL_SVG = (c) => `<svg viewBox="0 0 40 24" aria-hidden="true"><ellipse cx="20" cy="12" rx="18" ry="9" fill="${c}"/><ellipse cx="18" cy="10" rx="8" ry="3" fill="rgba(255,255,255,.12)"/></svg>`;
const SPARK_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4Z" fill="#f6e3ad"/></svg>`;

/* ------------------------------------------------------------------ */
/* Floating plans per screen class. x and top are percentages; size in px.
   mode: 'rise' (enters below, leaves above), 'fall' (enters above, leaves below),
   'float' (stays in place and bobs). d = depth, 0 far .. 1 near.          */
/* ------------------------------------------------------------------ */
const PLANS = {
  desktop: [
    { k: 'card', s: 'heart', r: 'A', red: true, x: 5, size: 96, d: 0.95, m: 'rise', tilt: 14 },
    { k: 'card', s: 'spade', r: 'K', red: false, x: 16, size: 62, d: 0.35, m: 'fall', tilt: 10 },
    { k: 'card', s: 'club', r: 'Q', red: false, x: 86, size: 84, d: 0.85, m: 'fall', tilt: 14 },
    { k: 'card', s: 'diamond', r: '7', red: true, x: 93, size: 58, d: 0.3, m: 'rise', tilt: 12 },
    { k: 'card', s: 'heart', r: '9', red: true, x: 74, size: 50, d: 0.22, m: 'rise', tilt: 8 },
    { k: 'key', x: 91, top: 22, size: 74, d: 0.9, m: 'float', tilt: 10 },
    { k: 'key', x: 8, top: 58, size: 50, d: 0.35, m: 'float', tilt: 8 },
    { k: 'watch', x: 24, size: 58, d: 0.7, m: 'rise', tilt: 8 },
    { k: 'watch', x: 76, size: 44, d: 0.3, m: 'fall', tilt: 8 },
    { k: 'watch', x: 3, top: 32, size: 40, d: 0.5, m: 'float', tilt: 6 },
    { k: 'rose', x: 3, top: 68, size: 120, d: 0.95, m: 'float', tilt: 4 },
    { k: 'rose', x: 94, top: 60, size: 96, d: 0.8, m: 'float', tilt: 4 },
    { k: 'petal', x: 12, size: 18, d: 0.5, m: 'rise', c: '#7a1424' },
    { k: 'petal', x: 31, size: 14, d: 0.3, m: 'fall', c: '#8e1427' },
    { k: 'petal', x: 61, size: 16, d: 0.42, m: 'rise', c: '#6b0f1c' },
    { k: 'petal', x: 69, size: 20, d: 0.6, m: 'fall', c: '#9c1c30' },
    { k: 'petal', x: 83, size: 15, d: 0.35, m: 'rise', c: '#7a1424' },
    { k: 'petal', x: 97, size: 17, d: 0.55, m: 'fall', c: '#8e1427' },
    { k: 'spark', x: 38, top: 14, size: 14, d: 0.6, m: 'float' },
    { k: 'spark', x: 64, top: 26, size: 10, d: 0.4, m: 'float' },
    { k: 'spark', x: 19, top: 84, size: 12, d: 0.5, m: 'float' },
    { k: 'spark', x: 88, top: 86, size: 16, d: 0.7, m: 'float' },
  ],
  tablet: [
    { k: 'card', s: 'heart', r: 'A', red: true, x: 6, size: 78, d: 0.9, m: 'rise', tilt: 12 },
    { k: 'card', s: 'club', r: 'Q', red: false, x: 86, size: 70, d: 0.8, m: 'fall', tilt: 12 },
    { k: 'card', s: 'diamond', r: '7', red: true, x: 90, size: 46, d: 0.3, m: 'rise', tilt: 10 },
    { k: 'key', x: 88, top: 30, size: 56, d: 0.85, m: 'float', tilt: 8 },
    { k: 'watch', x: 14, size: 46, d: 0.6, m: 'fall', tilt: 8 },
    { k: 'rose', x: 3, top: 74, size: 96, d: 0.9, m: 'float', tilt: 4 },
    { k: 'petal', x: 26, size: 16, d: 0.4, m: 'rise', c: '#7a1424' },
    { k: 'petal', x: 52, size: 14, d: 0.3, m: 'fall', c: '#8e1427' },
    { k: 'petal', x: 72, size: 17, d: 0.5, m: 'rise', c: '#6b0f1c' },
    { k: 'spark', x: 40, top: 16, size: 12, d: 0.6, m: 'float' },
    { k: 'spark', x: 80, top: 82, size: 14, d: 0.5, m: 'float' },
  ],
  mobile: [
    { k: 'card', s: 'heart', r: 'A', red: true, x: 4, size: 64, d: 0.9, m: 'rise', tilt: 12 },
    { k: 'card', s: 'club', r: 'Q', red: false, x: 84, size: 60, d: 0.8, m: 'fall', tilt: 12 },
    { k: 'card', s: 'spade', r: 'K', red: false, x: 14, size: 40, d: 0.3, m: 'rise', tilt: 8 },
    { k: 'key', x: 84, top: 64, size: 46, d: 0.8, m: 'float', tilt: 8 },
    { k: 'watch', x: 88, size: 36, d: 0.5, m: 'fall', tilt: 6 },
    { k: 'rose', x: 2, top: 80, size: 84, d: 0.85, m: 'float', tilt: 4 },
    { k: 'petal', x: 22, size: 14, d: 0.4, m: 'rise', c: '#7a1424' },
    { k: 'petal', x: 60, size: 13, d: 0.3, m: 'fall', c: '#8e1427' },
    { k: 'petal', x: 76, size: 15, d: 0.5, m: 'rise', c: '#6b0f1c' },
    { k: 'spark', x: 46, top: 12, size: 12, d: 0.6, m: 'float' },
  ],
};

function objectMarkup(it) {
  switch (it.k) {
    case 'card': return cardSVG(it.s, it.r, it.red);
    case 'key': return KEY_SVG;
    case 'watch': return WATCH_SVG;
    case 'rose': return ROSE_SVG;
    case 'petal': return PETAL_SVG(it.c);
    default: return SPARK_SVG;
  }
}

/* ------------------------------------------------------------------ */

export class Hero {
  constructor(root, { reduced = false, onIntroDone } = {}) {
    this.root = root;
    this.reduced = reduced;
    this.onIntroDone = onIntroDone;
    this.back = root.querySelector('.hero__back');
    this.canvas = root.querySelector('[data-hero-canvas]');
    this.floatEl = root.querySelector('[data-hero-float]');
    this.layers = root.querySelector('[data-hero-layers]');
    this.portal = root.querySelector('[data-hero-portal]');
    this.shade = root.querySelector('[data-hero-shade]');
    this.caption = root.querySelector('[data-reveal="copy"]');
    this.actions = root.querySelector('[data-reveal="actions"]');
    this.floatTween = null;
    this.layerTweens = [];
    this.dustState = null;
    this.dustRaf = null;
    this.intro = null;
    this.exit = null;
    this.cx = 0;
    this.cy = 0;
    this.maxR = 1;
  }

  /** Where the teacup opening sits on screen. Layout-based, so it ignores transforms. */
  measure() {
    const W = this.root.clientWidth;
    const H = this.root.clientHeight;
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    const left = (W - w) / 2;
    const top = (H - h) / 2;
    this.cx = left + CUP.x * w;
    this.cy = top + CUP.y * h;
    this.maxR = Math.hypot(Math.max(this.cx, W - this.cx), Math.max(this.cy, H - this.cy));
    window.gsap.set(this.canvas, { transformOrigin: `${CUP.x * w}px ${CUP.y * h}px` });
  }

  /** Radius of the opening through which the film appears. */
  irisRadius(t) {
    return this.maxR * smooth(clamp((t - 0.45) / 0.55));
  }

  /** Keeps the swirling ring on the edge of the opening. */
  setIris(r) {
    if (!this.portal) return;
    const d = Math.max(0, r * 2.25);
    const s = this.portal.style;
    s.width = `${d}px`;
    s.height = `${d}px`;
    s.left = `${this.cx - d / 2}px`;
    s.top = `${this.cy - d / 2}px`;
  }

  build() {
    const gsap = window.gsap;
    this.measure();

    // Intro: the poster surfaces from darkness, the objects drift in.
    this.intro = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    if (this.reduced) {
      gsap.set(this.canvas, { opacity: 1, scale: 1 });
      gsap.set([this.caption, this.actions], { opacity: 1, y: 0, filter: 'none' });
      gsap.set(this.layers, { '--in': 1 });
      if (this.back) gsap.set(this.back, { opacity: 1 });
      if (this.onIntroDone) this.onIntroDone();
    } else {
      this.intro
        .fromTo(this.canvas, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 3.2, ease: 'power1.out' }, 0)
        .fromTo(this.back, { opacity: 0 }, { opacity: 1, duration: 2.4 }, 0)
        .fromTo(this.layers, { '--in': 0 }, { '--in': 1, duration: 2.8, ease: 'power1.out' }, 1.2)
        .fromTo(this.caption, { opacity: 0, y: 14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.6 }, 2.0)
        .fromTo(this.actions, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2 }, 2.6)
        .add(() => this.onIntroDone && this.onIntroDone(), 3.0);
    }

    // Gentle hover of the poster itself.
    if (!this.reduced && this.floatEl) {
      this.floatTween = gsap.fromTo(
        this.floatEl,
        { y: 0, rotation: 0 },
        { y: -12, rotation: 0.3, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3.2 },
      );
    }

    // The swirl ring turns slowly around the opening.
    if (this.portal && !this.reduced) {
      gsap.to(this.portal, { rotation: 360, duration: 9, repeat: -1, ease: 'none' });
    }

    // Floating objects: built per screen class and rebuilt on breakpoint change.
    this.mm = gsap.matchMedia();
    this.mm.add(
      {
        isDesktop: '(min-width: 1025px)',
        isTablet: '(min-width: 641px) and (max-width: 1024px)',
        isMobile: '(max-width: 640px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const c = ctx.conditions;
        const plan = c.isDesktop ? PLANS.desktop : c.isTablet ? PLANS.tablet : PLANS.mobile;
        this.buildLayers(plan, c.reduce);
        return () => this.clearLayers();
      },
    );

    // Scroll-scrubbed dive into the cup.
    this.exit = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    this.exit
      .to([this.caption, this.actions], { opacity: 0, duration: 0.25 }, 0)
      .to(this.canvas, { scale: 9, duration: 0.85, ease: 'power2.in' }, 0)
      .to(this.canvas, { opacity: 0, duration: 0.35 }, 0.6)
      .to(this.back, { opacity: 0, duration: 0.7 }, 0.1)
      .to(this.shade, { opacity: 1, duration: 0.6 }, 0.3)
      .to(this.portal, { opacity: 1, duration: 0.14 }, 0.44)
      .to(this.portal, { opacity: 0, duration: 0.3 }, 0.8)
      .to(this.canvas, { filter: 'blur(5px)', duration: 0.2 }, 0.26)
      .to(this.canvas, { filter: 'blur(0px)', duration: 0.2 }, 0.5);

    this.buildDust();
  }

  /** Creates every floating object for one plan, each with its own three transforms. */
  buildLayers(plan, reduced) {
    const gsap = window.gsap;
    this.layers.innerHTML = '';
    plan.forEach((it) => {
      const el = document.createElement('div');
      el.className = 'hero__fx';
      el.style.left = `${it.x}%`;
      el.style.top = `${it.m === 'float' ? it.top : 0}%`;
      const dx = ((it.x - 50) / 50) * (140 + 300 * it.d);
      const dy = -(40 + 140 * it.d) * (it.m === 'float' ? 0.4 : 1);
      el.style.setProperty('--dx', dx.toFixed(1));
      el.style.setProperty('--dy', dy.toFixed(1));
      el.style.zIndex = String(Math.round(it.d * 10));
      const blur = Math.max(0, 0.5 - it.d) * 5;
      const opacity = 0.3 + 0.7 * it.d;
      el.innerHTML = `
        <div class="hero__fx-sway"><div class="hero__fx-travel">
          <div class="hero__fx-spin" style="width:${it.size}px;height:${Math.round(it.size * (it.k === 'card' ? 1.47 : it.k === 'key' ? 3.3 : it.k === 'watch' ? 1.25 : 1))}px;opacity:${opacity.toFixed(2)};filter:blur(${blur.toFixed(2)}px)">${objectMarkup(it)}</div>
        </div></div>`;
      this.layers.appendChild(el);
      if (reduced) return;

      const sway = el.querySelector('.hero__fx-sway');
      const travel = el.querySelector('.hero__fx-travel');
      const spin = el.querySelector('.hero__fx-spin');
      const depthSpeed = 34 - 20 * it.d; // near objects move faster

      // Horizontal sway: a soft, organic back-and-forth.
      const amp = 10 + 26 * it.d;
      const sw = gsap.fromTo(sway, { x: -amp }, { x: amp, duration: rand(4.5, 7.5), ease: 'sine.inOut', yoyo: true, repeat: -1 });
      sw.progress(Math.random());

      // Vertical travel: rise from below and leave above, fall from above and leave below, or bob in place.
      let tr;
      if (it.m === 'rise') {
        tr = gsap.fromTo(travel, { y: '110vh' }, { y: '-160%', duration: depthSpeed + rand(-2, 2), ease: 'none', repeat: -1 });
      } else if (it.m === 'fall') {
        tr = gsap.fromTo(travel, { y: '-160%' }, { y: '110vh', duration: depthSpeed + rand(-2, 2), ease: 'none', repeat: -1 });
      } else {
        tr = gsap.fromTo(travel, { y: -12 - 10 * it.d }, { y: 12 + 10 * it.d, duration: rand(4, 6.5), ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }
      tr.progress(Math.random());

      // Rotation: cards and keys tilt, petals turn slowly.
      if (it.k === 'petal') {
        const sp = gsap.to(spin, { rotation: 360, duration: rand(9, 15), ease: 'none', repeat: -1 });
        sp.progress(Math.random());
      } else if (it.tilt) {
        const sp = gsap.fromTo(spin, { rotation: -it.tilt }, { rotation: it.tilt, duration: rand(5, 9), ease: 'sine.inOut', yoyo: true, repeat: -1 });
        sp.progress(Math.random());
      }
      this.layerTweens.push(sw, tr);
    });
  }

  clearLayers() {
    this.layerTweens.forEach((t) => t.kill());
    this.layerTweens = [];
    if (this.layers) this.layers.innerHTML = '';
  }

  buildDust() {
    if (this.reduced) return;
    const canvas = this.root.querySelector('.hero__dust');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const count = window.innerWidth < 800 ? 30 : 60;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.25 + Math.random() * 0.75,
      r: 0.6 + Math.random() * 1.6,
      a: 0.2 + Math.random() * 0.5,
      petal: Math.random() < 0.2,
      rot: Math.random() * Math.PI,
    }));
    const state = { w: 0, h: 0, exitT: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = canvas.clientWidth;
      state.h = canvas.clientHeight;
      canvas.width = Math.floor(state.w * dpr);
      canvas.height = Math.floor(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();
    const CX = 0.5;
    const CY = 0.44;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state.exitT < 0.999) {
        ctx.clearRect(0, 0, state.w, state.h);
        const t = state.exitT;
        for (const p of particles) {
          if (t > 0.12) {
            // On the dive, particles spiral into the teacup.
            const dx = p.x - CX;
            const dy = (p.y - CY) * (state.h / state.w);
            const ang = Math.atan2(dy, dx) + dt * (0.5 + t * 4) * p.z;
            const r = Math.hypot(dx, dy) * (1 - dt * t * 0.35);
            p.x = CX + Math.cos(ang) * r;
            p.y = CY + (Math.sin(ang) * r) * (state.w / state.h);
          } else {
            p.y -= dt * 0.012 * p.z;
            p.x += Math.sin(now / 1800 + p.y * 9) * dt * 0.01 * p.z;
          }
          if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
          const x = p.x * state.w;
          const y = p.y * state.h;
          const fade = t > 0.12 ? clamp(1 - (t - 0.12) * 1.4) : 1;
          ctx.globalAlpha = p.a * p.z * fade;
          if (p.petal) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(p.rot + (now / 2600) * p.z);
            ctx.fillStyle = '#b33e34';
            ctx.beginPath();
            ctx.ellipse(0, 0, 5 * p.z + 2, 2.6 * p.z + 1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            ctx.fillStyle = '#f2d9a8';
            ctx.beginPath();
            ctx.arc(x, y, p.r * p.z, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
      this.dustRaf = requestAnimationFrame(frame);
    };
    this.dustState = state;
    this.dustRaf = requestAnimationFrame(frame);
  }

  play() {
    if (this.intro && !this.reduced) this.intro.play(0);
  }

  /** Scrubs the entire dive. Layers read --t in CSS, so every object reverses with the scroll. */
  setExit(t) {
    if (this.floatTween) this.floatTween.paused(t > 0.001);
    if (this.exit) this.exit.progress(t);
    if (this.dustState) this.dustState.exitT = t;
    this.root.style.setProperty('--t', t.toFixed(4));
  }

  destroy() {
    if (this.dustRaf) cancelAnimationFrame(this.dustRaf);
    if (this.mm) this.mm.revert();
    this.clearLayers();
    if (this.intro) this.intro.kill();
    if (this.exit) this.exit.kill();
  }
}
