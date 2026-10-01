// Web Audio API Synthesizer for Authentic South Indian Tawa Sizzle and Chimes
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.sizzleNode = null;
    this.sizzleGain = null;
    this.isSizzling = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play delicate Indian temple bell / brass chime on item addition
  playAddChime() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // Ramp up high

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn("Audio play prevented:", e);
    }
  }

  // Play satisfying wooden thud / click
  playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Synthesize realistic butter & batter sizzle on cast-iron tawa
  startTawaSizzle(duration = 3.5) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      // Stop existing sizzle if running
      this.stopTawaSizzle();

      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink/Brown noise for sizzling oil & batter
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // occasional oil pop crackle
        const pop = Math.random() > 0.998 ? (Math.random() * 1.5 - 0.75) : 0;
        data[i] = (lastOut + (0.02 * white)) / 1.02 + pop * 0.4;
        lastOut = data[i];
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Bandpass filter to match tawa sizzle frequency
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      this.sizzleNode = noiseNode;
      this.sizzleGain = gain;
      this.isSizzling = true;

      setTimeout(() => {
        this.isSizzling = false;
      }, duration * 1000);
    } catch (e) {
      console.warn("Sizzle audio error:", e);
    }
  }

  stopTawaSizzle() {
    if (this.sizzleNode) {
      try {
        this.sizzleNode.stop();
        this.sizzleNode.disconnect();
      } catch (e) {}
      this.sizzleNode = null;
      this.isSizzling = false;
    }
  }

  // Celebratory auspicious South Indian Temple Bell chord for order completion
  playOrderSuccess() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + (idx * 0.12);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch (e) {}
  }
}

const sfx = new SoundEffects();
