/**
 * Sound manager.
 *
 * One soundtrack, started only after a user gesture (browser autoplay rules).
 * It never restarts: chapter changes, scrolling, seeking and language switches
 * do not touch the playhead. Only the volume envelope and the mute flag change.
 */
export class SoundManager {
  constructor(src, { maxVolume = 0.7 } = {}) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.preload = 'auto';
    this.audio.volume = 0;
    this.maxVolume = maxVolume;
    this.started = false;
    this.muted = false;
    this.intro = 0; // 0..1 fade-in envelope
    this.fade = 1; // 0..1 set by the timeline (ending fades out)
    this.listeners = new Set();
  }

  /** Start playback from a user gesture. Safe to call more than once. */
  async start() {
    if (this.started) return;
    this.started = true;
    try {
      await this.audio.play();
      if (window.gsap) {
        window.gsap.to(this, { intro: 1, duration: 3.2, ease: 'power1.out', onUpdate: () => this.apply() });
      } else {
        this.intro = 1;
        this.apply();
      }
    } catch (err) {
      this.started = false;
      this.emit('error', err);
    }
    this.emit('change');
  }

  /** Mute or unmute without interrupting playback. */
  toggle() {
    if (!this.started) {
      this.muted = false;
      this.start();
      return;
    }
    this.muted = !this.muted;
    this.audio.muted = this.muted;
    this.emit('change');
  }

  setFade(value) {
    this.fade = value;
    this.apply();
  }

  apply() {
    const v = this.maxVolume * this.intro * this.fade;
    this.audio.volume = Math.min(1, Math.max(0, v));
  }

  on(fn) {
    this.listeners.add(fn);
  }

  emit(kind, payload) {
    for (const fn of this.listeners) fn(kind, payload);
  }
}
