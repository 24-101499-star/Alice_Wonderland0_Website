/**
 * Breathing on held frames (desktop only).
 *
 * While the film is held on a checkpoint so the story can be written, the frozen
 * picture breathes: it swells and settles in a calm rhythm, and a soft crimson
 * light rises and falls with each breath. The breath is tied to the parchment
 * itself. It strengthens while the writing appears, and it fades as the writing
 * is removed. Then the picture is back at rest and the story moves on.
 *
 * The amount (amp) comes from the timeline every frame (the parchment's openness),
 * so the effect is exact, reversible, and never runs while the film is scrubbing.
 */
const BREATH_PERIOD = 7.2; // seconds for one full breath: a calm rhythm
const SWELL = 0.014;       // the picture grows by up to 1.4% on each inhale
const LIFT = 3;            // and rises by up to 3px
const LIGHT = 0.22;        // peak strength of the crimson light

const rand = (a, b) => a + Math.random() * (b - a);

export class Ambient {
  constructor(film, video, { reduced = false, enabled = () => true } = {}) {
    this.film = film;
    this.video = video;
    this.reduced = reduced;
    this.enabled = enabled;
    this.active = false;
    this.start = 0;
    this.last = performance.now();
    this.size = { w: 0, h: 0, dpr: 1 };
    this.particles = [];

    // The soft crimson light that breathes with the picture.
    this.light = document.createElement('div');
    this.light.className = 'film__breath';
    this.light.setAttribute('aria-hidden', 'true');
    this.video.after(this.light);

    // Fine dust and petals, drawn above the light.
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'film__ambient';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.light.after(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.seed();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.film.clientWidth;
    const h = this.film.clientHeight;
    this.size = { w, h, dpr };
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
  }

  seed() {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const petal = Math.random() < 0.25;
      this.particles.push({
        petal,
        color: petal ? (Math.random() < 0.5 ? '#7a1424' : '#9c1c30') : '#f2d9a8',
        r: petal ? rand(3, 4.5) : rand(0.8, 1.8),
        a: rand(0.35, 0.65),
        x: Math.random(),
        y: Math.random(),
        vx: rand(-0.005, 0.005),
        vy: petal ? rand(0.008, 0.02) : rand(-0.02, -0.01),
        phase: Math.random() * Math.PI * 2,
        speed: rand(0.5, 1.1),
        amp: rand(0.002, 0.005),
        rot: Math.random() * Math.PI,
        spin: rand(-0.5, 0.5),
      });
    }
  }

  /**
   * Called every frame by the timeline. amp is 0..1: how strongly the picture is
   * breathing right now. 0 means the picture is at rest.
   */
  update(amp, now) {
    const on = !this.reduced && this.enabled();
    const a = on ? Math.min(1, Math.max(0, amp)) : 0;
    if (a <= 0.001) {
      if (this.active) this.rest();
      return;
    }

    if (!this.active) {
      // A hold begins: the breath starts with the first inhale, at once.
      this.active = true;
      this.start = now;
      this.last = now;
    }
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    // Real time, so the breath keeps its rhythm on any frame rate.
    const phase = ((now - this.start) / 1000) * ((2 * Math.PI) / BREATH_PERIOD);
    // 0 at rest, 1 at the fullest breath, and back to 0: one inhale and one exhale.
    const breath = (1 - Math.cos(phase)) / 2;
    const scale = 1 + SWELL * a * breath;
    const lift = -LIFT * a * breath;
    this.video.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    this.light.style.opacity = (LIGHT * a * breath).toFixed(3);

    this.drawDust(dt, a);
  }

  /** Back to rest, exactly: the picture returns to its normal state and the story moves on. */
  rest() {
    this.active = false;
    this.video.style.transform = '';
    this.light.style.opacity = '0';
    this.ctx.clearRect(0, 0, this.size.w, this.size.h);
  }

  drawDust(dt, a) {
    const { w, h, dpr } = this.size;
    if (!w) return;
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const p of this.particles) {
      // Each particle follows its own gentle loop: a sine wobble on a slow drift.
      p.phase += dt * p.speed;
      p.x += (p.vx + Math.sin(p.phase) * p.amp) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05) p.x = -0.05;

      const x = p.x * w;
      const y = p.y * h;
      ctx.globalAlpha = p.a * a * 0.8;
      ctx.fillStyle = p.color;
      if (p.petal) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 2.2, p.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
