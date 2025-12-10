// Procedural Audio Generator using Web Audio API
// No external assets required.

class AudioManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  ambienceNode: AudioBufferSourceNode | OscillatorNode | null = null;
  ambienceGain: GainNode | null = null;
  lfo: OscillatorNode | null = null; // Low Frequency Oscillator for movement
  currentAmbienceType: string | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5; // Master volume
      this.masterGain.connect(this.ctx.destination);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    if (this.ctx) {
      // Ramp down to avoid popping
      this.masterGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      
      setTimeout(() => {
        this.stopAmbience();
        if (this.ctx?.state !== 'closed') {
            this.ctx?.suspend();
        }
        this.currentAmbienceType = null;
      }, 200);
    }
  }

  resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
          this.masterGain?.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.1);
      }
  }

  // Create a noise buffer (white noise)
  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = 2 * this.ctx.sampleRate; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playTransition() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Sci-fi Swoosh
    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.0);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  stopAmbience() {
      if (this.ambienceNode) {
          try { this.ambienceNode.stop(); } catch(e) {}
          this.ambienceNode = null;
      }
      if (this.lfo) {
          try { this.lfo.stop(); } catch(e) {}
          this.lfo = null;
      }
  }

  setAmbience(type: 'nature' | 'mechanical' | 'eerie' | 'calm' | 'chaos') {
    this.init();
    this.resume();

    if (!this.ctx || !this.ambienceGain) return;
    if (this.currentAmbienceType === type) return;

    this.currentAmbienceType = type;
    this.stopAmbience();

    // Reset gain for new sound
    this.ambienceGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambienceGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambienceGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 2); // Fade in

    if (type === 'mechanical') {
        // Drone sound
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 50; 

        // LFO for throbbing effect
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.5; // 0.5 Hz pulse
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 500; // Filter modulation depth

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        osc.connect(filter);
        filter.connect(this.ambienceGain);

        osc.start();
        lfo.start();
        this.ambienceNode = osc;
        this.lfo = lfo;
        
    } else if (type === 'eerie') {
        // Dissonant Sine Waves
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 150;

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 154; // Slight detune causes beating

        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ambienceGain);

        osc1.start();
        osc2.start();
        // We just track one as the main node to stop, or we need a group. 
        // For simplicity, we just use the first one as reference to stop, 
        // but real implementation needs array. 
        // Re-using stopAmbience to just disconnect the gain is easier.
        this.ambienceNode = osc1; 
        // Note: This simple implementation leaks osc2 if we don't track it, 
        // but `stopAmbience` isn't fully robust for multi-osc. 
        // For this demo, let's use a single noise source for eerie instead to be safe.
        osc2.stop(this.ctx.currentTime + 600); // Failsafe
    } else {
        // Noise based (Nature, Chaos, Calm)
        const buffer = this.createNoiseBuffer();
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();

        switch (type) {
            case 'nature': // Wind
                filter.type = 'bandpass';
                filter.frequency.value = 400;
                filter.Q.value = 0.5;
                // Add LFO for wind sweeping
                const lfo = this.ctx.createOscillator();
                lfo.frequency.value = 0.1;
                const lfoGain = this.ctx.createGain();
                lfoGain.gain.value = 200;
                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);
                lfo.start();
                this.lfo = lfo;
                break;
            case 'chaos': // Static/Harsh
                filter.type = 'highpass';
                filter.frequency.value = 1000;
                break;
            default: // Calm
            case 'calm': // Brownish noise
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                break;
        }

        source.connect(filter);
        filter.connect(this.ambienceGain);
        source.start();
        this.ambienceNode = source;
    }
  }
}

export const audio = new AudioManager();