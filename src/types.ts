export type MainOscType = "Sine" | "Triangle" | "Sawtooth" | "Square" | "Wavetable" | "Spectral";
export type SubOscType = "Sine" | "Triangle" | "Square" | "Off";
export type FilterType = "lowpass" | "highpass" | "bandpass" | "notch";
export type PatternType = "Arpeggio Up" | "Arpeggio Down" | "Chord Sequence" | "Melodic Run" | "Random Ambient";

export interface SynthParams {
  presetName: string;
  
  // Main Oscillator
  mainOscType: MainOscType;
  harmonics: number[]; // Array of 16 harmonic partial levels (for Wavetable/Spectral modes)
  spectralMorph: number; // Morphs the spectral frequencies (0 to 100)
  
  // Unison Engine
  unisonVoices: number; // 1 to 16
  unisonDetune: number; // 0 to 100 (cents/amount)
  unisonSpread: number; // 0 to 100 (stereo width)
  
  // Secondary Oscillators
  subOscType: SubOscType;
  subOctave: -1 | -2;
  subVolume: number; // 0 to 100
  noiseVolume: number; // 0 to 100
  noiseColor: "white" | "pink";
  
  // Filter (State Variable Filter style)
  filterType: FilterType;
  filterCutoff: number; // 20Hz to 20000Hz
  filterResonance: number; // 0.1 to 20 (Q)
  filterDrive: number; // 1.0 to 5.0 (saturation)
  filterEnvAmt: number; // -100 to 100% (envelope modulation to cutoff)
  
  // Amplitude Envelope (ADSR)
  ampAttack: number; // seconds (0.001 to 8.0)
  ampDecay: number; // seconds (0.01 to 8.0)
  ampSustain: number; // percent (0 to 100)
  ampRelease: number; // seconds (0.01 to 8.0)
  
  // Filter Envelope (ADSR)
  filterAttack: number; // seconds (0.001 to 8.0)
  filterDecay: number; // seconds (0.01 to 8.0)
  filterSustain: number; // percent (0 to 100)
  filterRelease: number; // seconds (0.01 to 8.0)
  
  // Master
  masterVolume: number; // 0 to 100
  glideTime: number; // portamento (0 to 1000ms)
}

export interface GeneratorParams {
  bpm: number;
  key: string; // C, C#, D, etc.
  scale: string; // Major, Minor, Dorian, Lydian, etc.
  density: number; // 0 to 100% note probability / velocity
  patternType: PatternType;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  params: Partial<SynthParams>;
}
