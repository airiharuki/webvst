/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SynthParams, MainOscType, SubOscType, FilterType } from "../types";

// Polyphonic Note Instance
interface ActiveNote {
  midiNote: number;
  frequency: number;
  startTime: number;
  // Nodes to clean up on release
  unisonOscs: OscillatorNode[];
  unisonPanners: StereoPannerNode[];
  subOsc: OscillatorNode | null;
  noiseSource: AudioBufferSourceNode | null;
  voiceGainNode: GainNode;
  filterNode: BiquadFilterNode;
  shaperNode: WaveShaperNode;
  // State
  released: boolean;
  timeoutId?: number | NodeJS.Timeout;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private params: SynthParams;
  private activeNotes: Map<number, ActiveNote> = new Map();
  
  // Master nodes
  private masterVolumeNode: GainNode | null = null;
  public analyserNode: AnalyserNode | null = null;
  
  // Pre-generated noise buffers for performance
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;
  
  // Portamento helper
  private lastPlayedMidi: number | null = null;

  constructor(initialParams: SynthParams) {
    this.params = { ...initialParams };
  }

  // Safe AudioContext Initialization
  public async init() {
    if (this.ctx) return;
    
    // Create AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master Gain
    this.masterVolumeNode = this.ctx.createGain();
    this.masterVolumeNode.gain.setValueAtTime(this.params.masterVolume / 100, this.ctx.currentTime);
    
    // Master Analyser
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 512;
    this.analyserNode.smoothingTimeConstant = 0.8;
    
    // Connection: Master Volume -> Analyser -> Output
    this.masterVolumeNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);
    
    // Generate Noise Buffers
    this.generateNoiseBuffers();
    
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  public getContextState(): string {
    return this.ctx ? this.ctx.state : "uninitialized";
  }

  public async resumeContext() {
    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  // Update master settings dynamically
  public updateParams(newParams: SynthParams) {
    this.params = { ...newParams };
    
    // Update Master Volume
    if (this.ctx && this.masterVolumeNode) {
      this.masterVolumeNode.gain.setTargetAtTime(
        this.params.masterVolume / 100, 
        this.ctx.currentTime, 
        0.02
      );
    }
  }

  // Generate White and Pink Noise Buffers
  private generateNoiseBuffers() {
    if (!this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    
    // White Noise
    this.whiteNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const whiteData = this.whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    
    // Pink Noise (Paul Kellet's refined method)
    this.pinkNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const pinkData = this.pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pinkValue = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      pinkData[i] = pinkValue * 0.11; // Gain correction
    }
  }

  // Create Custom Periodic Wave based on harmonics list & spectral morph parameter
  private createCustomWave(baseHarmonics: number[], morph: number): PeriodicWave | null {
    if (!this.ctx) return null;
    
    const size = 17; // 16 harmonics + DC offset
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    
    // DC Offset is 0
    real[0] = 0;
    imag[0] = 0;
    
    const morphScale = morph / 100; // 0 to 1
    
    for (let i = 1; i < size; i++) {
      const originalAmt = baseHarmonics[i - 1] !== undefined ? baseHarmonics[i - 1] : 0;
      
      // Spectral morphing changes the harmonic profile dynamically:
      // High morph values boost odd harmonics, or cause a phase/frequency shifting comb-like pattern.
      // This mimics "spectral morphing" inside a standard periodic table.
      let morphedAmt = originalAmt;
      if (this.params.mainOscType === "Spectral") {
        // Shift spectrum: higher morph moves fundamental energy to higher partials
        const oddFactor = i % 2 === 1 ? 1.0 : (1.0 - morphScale);
        const shiftFactor = Math.sin(i * Math.PI * 0.25 * (1.0 + morphScale * 1.5));
        morphedAmt = originalAmt * oddFactor * Math.max(0.05, Math.abs(shiftFactor));
      } else if (this.params.mainOscType === "Wavetable") {
        // Wavetable morphing: morph from current harmonic setting to a simple pulse/saw blend
        const targetHarmonic = (i === 1) ? 1.0 : 1.0 / i; // sawtooth profile
        morphedAmt = originalAmt * (1 - morphScale) + targetHarmonic * morphScale;
      }
      
      // Imaginary is Sine, Real is Cosine. We use Sine (imaginary) coefficients for a traditional phase.
      imag[i] = morphedAmt;
      real[i] = 0;
    }
    
    return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  // Create Saturation Shaper Table (Tanh clipping)
  private createShaperTable(driveValue: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    // Standard tanh waveshaper formula
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      // Boost the gain before saturating to create overdrive
      curve[i] = Math.tanh(x * driveValue) / Math.tanh(driveValue);
    }
    return curve;
  }

  // Play a Note (MIDI note number, velocity 0-127)
  public async playNote(midiNote: number, velocity = 100) {
    await this.init();
    if (!this.ctx || !this.masterVolumeNode) return;
    
    // Release existing same note to avoid stacking identical notes
    if (this.activeNotes.has(midiNote)) {
      this.stopNote(midiNote);
    }
    
    const now = this.ctx.currentTime;
    const freq = this.midiNoteToFrequency(midiNote);
    
    // Apply Glide / Portamento
    let targetFreq = freq;
    let initialFreq = freq;
    let glideActive = false;
    
    if (this.params.glideTime > 0 && this.lastPlayedMidi !== null && this.activeNotes.size > 0) {
      initialFreq = this.midiNoteToFrequency(this.lastPlayedMidi);
      glideActive = true;
    }
    this.lastPlayedMidi = midiNote;

    // --- NODE CREATION ---
    
    // 1. Voice Gain Node (handles voice ADSR + overall velocity scale)
    const voiceGainNode = this.ctx.createGain();
    const velocityScale = velocity / 127;
    voiceGainNode.gain.setValueAtTime(0, now);
    
    // 2. Filter Node (BiquadFilter)
    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = this.params.filterType;
    filterNode.Q.setValueAtTime(this.params.filterResonance, now);
    
    // 3. Drive WaveShaper Node
    const shaperNode = this.ctx.createWaveShaper();
    shaperNode.curve = this.createShaperTable(this.params.filterDrive);
    shaperNode.oversample = "4x";

    // Connection chain: Voice Mixer -> Filter -> Drive Shaper -> Master Volume
    filterNode.connect(shaperNode);
    shaperNode.connect(this.masterVolumeNode);

    // --- OSCILLATORS SETUP ---
    const unisonOscs: OscillatorNode[] = [];
    const unisonPanners: StereoPannerNode[] = [];
    
    const numVoices = Math.max(1, Math.min(16, this.params.unisonVoices));
    const detuneAmt = this.params.unisonDetune; // 0 to 100 cents
    const stereoSpread = this.params.unisonSpread / 100; // 0 to 1

    // Build Custom Periodic Wave if using Wavetable or Spectral
    let customWave: PeriodicWave | null = null;
    if (this.params.mainOscType === "Wavetable" || this.params.mainOscType === "Spectral") {
      customWave = this.createCustomWave(this.params.harmonics, this.params.spectralMorph);
    }

    // Spawn Unison Voices
    for (let v = 0; v < numVoices; v++) {
      const osc = this.ctx.createOscillator();
      
      // Symmetrical Detune Calculation
      // If 1 voice: detune = 0
      // If multiple voices: spread detuning values evenly
      let detuneCents = 0;
      if (numVoices > 1) {
        const fraction = v / (numVoices - 1); // 0.0 to 1.0
        detuneCents = (fraction * 2 - 1) * detuneAmt;
      }
      
      // Symmetrical Stereo Spread
      let panValue = 0;
      if (numVoices > 1) {
        const fraction = v / (numVoices - 1);
        panValue = (fraction * 2 - 1) * stereoSpread;
      }
      
      // Configure Oscillator Type
      if (customWave && (this.params.mainOscType === "Wavetable" || this.params.mainOscType === "Spectral")) {
        osc.setPeriodicWave(customWave);
      } else {
        // Native Type
        const nativeType = this.params.mainOscType.toLowerCase() as OscillatorType;
        osc.type = nativeType;
      }

      // Configure Frequency and Detune
      osc.frequency.setValueAtTime(initialFreq, now);
      osc.detune.setValueAtTime(detuneCents, now);
      
      if (glideActive) {
        const glideSeconds = this.params.glideTime / 1000;
        osc.frequency.exponentialRampToValueAtTime(targetFreq, now + glideSeconds);
      }

      // Create Stereo Panner for width
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(panValue, now);
      
      // Connections: Osc -> Panner -> Voice Gain Node
      osc.connect(panner);
      panner.connect(voiceGainNode);
      
      osc.start(now);
      
      unisonOscs.push(osc);
      unisonPanners.push(panner);
    }

    // --- SUB OSCILLATOR SETUP ---
    let subOsc: OscillatorNode | null = null;
    if (this.params.subOscType !== "Off") {
      subOsc = this.ctx.createOscillator();
      subOsc.type = this.params.subOscType.toLowerCase() as OscillatorType;
      
      const subOctaveFactor = this.params.subOctave === -1 ? 0.5 : 0.25;
      subOsc.frequency.setValueAtTime(initialFreq * subOctaveFactor, now);
      
      if (glideActive) {
        const glideSeconds = this.params.glideTime / 1000;
        subOsc.frequency.exponentialRampToValueAtTime(targetFreq * subOctaveFactor, now + glideSeconds);
      }
      
      const subGainNode = this.ctx.createGain();
      subGainNode.gain.setValueAtTime((this.params.subVolume / 100) * 0.45, now); // Scale sub oscillator safely
      
      subOsc.connect(subGainNode);
      subGainNode.connect(voiceGainNode);
      subOsc.start(now);
    }

    // --- NOISE GENERATOR SETUP ---
    let noiseSource: AudioBufferSourceNode | null = null;
    if (this.params.noiseVolume > 0) {
      noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.params.noiseColor === "white" ? this.whiteNoiseBuffer : this.pinkNoiseBuffer;
      noiseSource.loop = true;
      
      const noiseGainNode = this.ctx.createGain();
      noiseGainNode.gain.setValueAtTime((this.params.noiseVolume / 100) * 0.12, now); // Sane noise volume
      
      noiseSource.connect(noiseGainNode);
      noiseGainNode.connect(voiceGainNode);
      noiseSource.start(now);
    }

    // Connect voice mixer to our SVF filter
    voiceGainNode.connect(filterNode);

    // --- ENVELOPE MODULATION TRIGGERS ---

    // 1. AMPLITUDE ADSR ENVELOPE
    const ampA = Math.max(0.001, this.params.ampAttack);
    const ampD = Math.max(0.01, this.params.ampDecay);
    const ampS = this.params.ampSustain / 100; // 0.0 to 1.0
    const maxGain = 0.25 * velocityScale; // Sane polyphony ceiling to prevent digital distortion

    // Attack Stage
    voiceGainNode.gain.setValueAtTime(0, now);
    voiceGainNode.gain.linearRampToValueAtTime(maxGain, now + ampA);
    // Decay -> Sustain Stage
    voiceGainNode.gain.setTargetAtTime(maxGain * ampS, now + ampA, ampD / 3);

    // 2. FILTER CUTOFF ADSR ENVELOPE
    const filtA = Math.max(0.001, this.params.filterAttack);
    const filtD = Math.max(0.01, this.params.filterDecay);
    const filtS = this.params.filterSustain / 100; // 0.0 to 1.0
    
    const baseCutoff = Math.max(20, Math.min(20000, this.params.filterCutoff));
    // Envelope modulation depth mapping
    // Can go up to 20,000 Hz or down to 20 Hz
    const envAmtHz = (this.params.filterEnvAmt / 100) * 12000; 
    const peakCutoff = Math.max(20, Math.min(20000, baseCutoff + envAmtHz));
    const sustainCutoff = Math.max(20, Math.min(20000, baseCutoff + envAmtHz * filtS));

    // Attack Stage
    filterNode.frequency.setValueAtTime(baseCutoff, now);
    filterNode.frequency.exponentialRampToValueAtTime(peakCutoff, now + filtA);
    // Decay -> Sustain Stage
    filterNode.frequency.setTargetAtTime(sustainCutoff, now + filtA, filtD / 3);

    // Record Active Note structure
    const noteInstance: ActiveNote = {
      midiNote,
      frequency: freq,
      startTime: now,
      unisonOscs,
      unisonPanners,
      subOsc,
      noiseSource,
      voiceGainNode,
      filterNode,
      shaperNode,
      released: false
    };

    this.activeNotes.set(midiNote, noteInstance);
  }

  // Release a Note (Trigger Release phase of ADSR)
  public stopNote(midiNote: number) {
    if (!this.ctx) return;
    const note = this.activeNotes.get(midiNote);
    if (!note || note.released) return;

    note.released = true;
    const now = this.ctx.currentTime;

    // Cancel scheduled envelope events to prevent clicks
    note.voiceGainNode.gain.cancelScheduledValues(now);
    note.filterNode.frequency.cancelScheduledValues(now);

    // 1. AMPLITUDE RELEASE
    const ampR = Math.max(0.01, this.params.ampRelease);
    note.voiceGainNode.gain.setValueAtTime(note.voiceGainNode.gain.value, now);
    note.voiceGainNode.gain.exponentialRampToValueAtTime(0.0001, now + ampR); // ramp to near-zero exponential

    // 2. FILTER RELEASE
    const filtR = Math.max(0.01, this.params.filterRelease);
    const baseCutoff = Math.max(20, Math.min(20000, this.params.filterCutoff));
    note.filterNode.frequency.setValueAtTime(note.filterNode.frequency.value, now);
    note.filterNode.frequency.exponentialRampToValueAtTime(Math.max(20, baseCutoff), now + filtR);

    // Cleanup nodes completely after the release phase is fully completed
    const maxRelease = Math.max(ampR, filtR);
    note.timeoutId = setTimeout(() => {
      this.cleanupNote(midiNote);
    }, maxRelease * 1000 + 100);
  }

  // Final garbage collection of notes to prevent memory leaks
  private cleanupNote(midiNote: number) {
    const note = this.activeNotes.get(midiNote);
    if (!note) return;
    
    // Clear timeout if any
    if (note.timeoutId) {
      clearTimeout(note.timeoutId);
    }

    try {
      // Stop oscillators and noise sources
      note.unisonOscs.forEach(osc => {
        try { osc.stop(); } catch(e){}
        osc.disconnect();
      });
      note.unisonPanners.forEach(panner => panner.disconnect());
      
      if (note.subOsc) {
        try { note.subOsc.stop(); } catch(e){}
        note.subOsc.disconnect();
      }
      
      if (note.noiseSource) {
        try { note.noiseSource.stop(); } catch(e){}
        note.noiseSource.disconnect();
      }
      
      note.voiceGainNode.disconnect();
      note.filterNode.disconnect();
      note.shaperNode.disconnect();
    } catch (err) {
      console.warn("Error cleaning up Web Audio nodes for note " + midiNote, err);
    }

    this.activeNotes.delete(midiNote);
  }

  // Master Panic Button: Kills all sounds instantly and resets
  public panic() {
    console.log("Panic button pressed! Terminating all synthesized voices...");
    
    this.activeNotes.forEach((note, midiNote) => {
      try {
        note.unisonOscs.forEach(osc => {
          try { osc.stop(); } catch(e){}
          osc.disconnect();
        });
        if (note.subOsc) {
          try { note.subOsc.stop(); } catch(e){}
          note.subOsc.disconnect();
        }
        if (note.noiseSource) {
          try { note.noiseSource.stop(); } catch(e){}
          note.noiseSource.disconnect();
        }
        note.voiceGainNode.disconnect();
        note.filterNode.disconnect();
        note.shaperNode.disconnect();
      } catch (err) {}
    });

    this.activeNotes.clear();
    this.lastPlayedMidi = null;
  }

  // Helper: converts MIDI pitch to Frequency (Hz)
  private midiNoteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }
}
