/**
 * Video controller.
 *
 * The film is never allowed to play on its own. It is always paused and is
 * moved to the time requested by the timeline. A light easing toward the
 * target time keeps fast scrolling smooth while holds on checkpoints settle
 * exactly on the verified frame.
 */
export class VideoController {
  constructor(videoEl, { hd, sd, poster } = {}) {
    this.el = videoEl;
    this.ready = false;
    this.failed = false;
    this.buffering = false;
    this.target = 0;
    this.displayed = 0;
    this.listeners = new Set();

    this.el.muted = true;
    this.el.playsInline = true;
    this.el.setAttribute('playsinline', '');
    this.el.setAttribute('webkit-playsinline', '');
    this.el.disablePictureInPicture = true;
    this.el.preload = 'auto';
    if (poster) this.el.poster = poster;

    // Smaller encode for small or constrained screens, Full HD otherwise.
    const constrained =
      window.innerWidth < 900 || (navigator.deviceMemory && navigator.deviceMemory < 4);
    this.el.src = constrained ? sd : hd;

    this.el.pause();
    this.bind();
  }

  bind() {
    const onReady = () => {
      if (!this.ready && this.el.readyState >= 2) {
        this.ready = true;
        this.emit('ready');
      }
    };
    this.el.addEventListener('loadeddata', onReady);
    this.el.addEventListener('canplay', onReady);
    this.el.addEventListener('loadedmetadata', () => {
      this.duration = this.el.duration;
      this.emit('metadata');
    });
    this.el.addEventListener('waiting', () => this.setBuffering(true));
    this.el.addEventListener('playing', () => this.setBuffering(false));
    this.el.addEventListener('seeked', () => this.setBuffering(false));
    this.el.addEventListener('progress', () => this.emit('progress'));
    this.el.addEventListener('error', () => {
      this.failed = true;
      this.emit('error');
    });
    // Never let the film run in the background.
    this.el.addEventListener('play', () => this.el.pause());
  }

  setBuffering(value) {
    if (this.buffering === value) return;
    this.buffering = value;
    this.emit('buffering', value);
  }

  /** Fraction of the film that is buffered from the start, 0..1. */
  bufferedFraction() {
    const d = this.el.duration;
    if (!d || !Number.isFinite(d)) return 0;
    const b = this.el.buffered;
    if (!b.length) return 0;
    let end = 0;
    for (let i = 0; i < b.length; i++) {
      if (b.start(i) <= 0.1 && b.end(i) > end) end = b.end(i);
    }
    return Math.min(1, end / d);
  }

  setTarget(time) {
    this.target = time;
  }

  /** Called once per animation frame. */
  tick() {
    if (!this.ready || this.failed) return;

    // Time-based easing: the same settling speed at 30 fps or 120 fps.
    const now = performance.now();
    const dt = this.lastTick ? Math.min(0.1, (now - this.lastTick) / 1000) : 1 / 60;
    this.lastTick = now;

    const diff = this.target - this.displayed;
    if (Math.abs(diff) < 0.02) {
      this.displayed = this.target;
    } else {
      // Large jumps (chapter navigation) settle in about a quarter of a second.
      const rate = Math.abs(diff) > 4 ? 14 : 9;
      this.displayed += diff * (1 - Math.exp(-rate * dt));
    }

    if (this.el.seeking) return;
    const current = this.el.currentTime;
    if (Math.abs(current - this.displayed) > 0.016) {
      try {
        this.el.currentTime = this.displayed;
      } catch (_) {
        /* Some browsers throw while metadata is not yet available. */
      }
    }
  }

  on(event, fn) {
    this.listeners.add({ event, fn });
  }

  emit(event, payload) {
    for (const l of this.listeners) if (l.event === event) l.fn(payload);
  }
}
