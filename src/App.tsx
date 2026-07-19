/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  AudioLines, 
  HelpCircle, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Music, 
  Cpu, 
  Info,
  Layers,
  Sparkles,
  Power,
  ChevronRight,
  BookOpen
} from "lucide-react";

// Types
import { SynthParams, GeneratorParams, Preset } from "./types";

// Data
import { DEFAULT_PRESETS, INITIAL_PARAMS, KEYS, SCALES } from "./data/presets";

// Engine Singletons / Helpers
import { AudioEngine } from "./lib/audioEngine";
import { MidiGenerator } from "./lib/midiGenerator";

// UI Components
import WaveVisualizer from "./components/WaveVisualizer";
import OscillatorControls from "./components/OscillatorControls";
import FilterControls from "./components/FilterControls";
import MidiControls from "./components/MidiControls";

export default function App() {
  // State for user parameters (bound to UI knobs)
  const [synthParams, setSynthParams] = useState<SynthParams>(INITIAL_PARAMS);
  const [generatorParams, setGeneratorParams] = useState<GeneratorParams>({
    bpm: 110,
    key: "C",
    scale: "Natural Minor",
    density: 80,
    patternType: "Arpeggio Up"
  });

  const [activePresetId, setActivePresetId] = useState<string>("init_saw");
  const [audioState, setAudioState] = useState<string>("uninitialized");
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  const [showManual, setShowManual] = useState<boolean>(false);
  
  // Persistent refs to Audio Engine and MIDI Generator instances
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const midiGeneratorRef = useRef<MidiGenerator | null>(null);

  // Initialize Engines safely on first gesture or render
  const ensureEngineInit = async () => {
    if (!audioEngineRef.current) {
      const engine = new AudioEngine(synthParams);
      audioEngineRef.current = engine;
      await engine.init();
      
      const generator = new MidiGenerator(engine, generatorParams);
      midiGeneratorRef.current = generator;
      
      setAudioState(engine.getContextState());
    } else {
      await audioEngineRef.current.resumeContext();
      setAudioState(audioEngineRef.current.getContextState());
    }
  };

  // Synchronize audio context state periodically
  useEffect(() => {
    const checkState = () => {
      if (audioEngineRef.current) {
        setAudioState(audioEngineRef.current.getContextState());
      }
    };
    const timer = setInterval(checkState, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update DSP engine params whenever state changes
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.updateParams(synthParams);
    }
  }, [synthParams]);

  // Update generator parameters in real-time
  useEffect(() => {
    if (midiGeneratorRef.current) {
      midiGeneratorRef.current.updateParams(generatorParams);
    }
  }, [generatorParams]);

  // Handle individual or grouped Synth parameter updates
  const handleSynthParamChange = useCallback((updates: Partial<SynthParams>) => {
    setSynthParams((prev) => {
      const next = { ...prev, ...updates };
      // If we tweaked a knob, the preset is now modified
      if (activePresetId !== "custom" && Object.keys(updates).length > 0 && !updates.presetName) {
        setActivePresetId("custom");
        next.presetName = "Custom Preset*";
      }
      return next;
    });
  }, [activePresetId]);

  // Handle individual or grouped Generator parameter updates
  const handleGeneratorParamChange = useCallback((updates: Partial<GeneratorParams>) => {
    setGeneratorParams((prev) => ({ ...prev, ...updates }));
  }, []);

  // Trigger loading a standard Preset object
  const handlePresetSelect = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);
    const newParams = { ...INITIAL_PARAMS, ...preset.params, presetName: preset.name };
    setSynthParams(newParams);

    // Apply directly if engine is initialized
    if (audioEngineRef.current) {
      audioEngineRef.current.updateParams(newParams);
    }
  };

  // Play Note Trigger
  const handlePlayNote = useCallback(async (midiNote: number, velocity = 100) => {
    await ensureEngineInit();
    if (audioEngineRef.current) {
      audioEngineRef.current.playNote(midiNote, velocity);
    }
  }, [synthParams]);

  // Stop Note Trigger
  const handleStopNote = useCallback((midiNote: number) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stopNote(midiNote);
    }
  }, []);

  // Play/Pause Sequencer Toggle
  const handleToggleSequencer = async () => {
    await ensureEngineInit();
    if (!midiGeneratorRef.current || !audioEngineRef.current) return;

    const currentPlayingState = midiGeneratorRef.current.getIsPlaying();
    if (currentPlayingState) {
      midiGeneratorRef.current.stop();
      setIsPlayingSeq(false);
    } else {
      midiGeneratorRef.current.start();
      setIsPlayingSeq(true);
    }
  };

  // Master Panic reset
  const handlePanic = () => {
    console.log("Master Panic event launched...");
    if (midiGeneratorRef.current) {
      midiGeneratorRef.current.stop();
      setIsPlayingSeq(false);
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.panic();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-zinc-100 font-sans p-3 sm:p-6 flex flex-col justify-between select-none">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl w-full mx-auto mb-4 flex flex-col md:flex-row justify-between items-center bg-zinc-900/40 border border-zinc-900 rounded-xl px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-lg shadow-lg">
            <AudioLines className="w-5 h-5 text-neutral-950 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold uppercase tracking-wider text-white">
              Generative Web Synth
            </h1>
            <p className="text-[10px] font-mono text-zinc-400">
              VITAL/SERUM ARCHITECTURE • WEB AUDIO DSP ENGINE
            </p>
          </div>
        </div>

        {/* Global Controls Row (Presets, Panic, Manual) */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Preset Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-lg">
            <span className="text-[10px] font-mono text-zinc-500 uppercase px-1">Preset:</span>
            <select
              id="preset-selector"
              className="bg-zinc-900 border border-zinc-800 text-xs font-mono font-medium text-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 transition-colors"
              value={activePresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
            >
              {DEFAULT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="custom" disabled>Custom Preset*</option>
            </select>
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800/80 px-2 py-1 rounded-lg">
            {synthParams.masterVolume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <input
              id="slider-master-volume"
              type="range"
              min="0"
              max="100"
              className="w-16 h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              value={synthParams.masterVolume}
              onChange={(e) => handleSynthParamChange({ masterVolume: parseInt(e.target.value) })}
            />
            <span className="text-[9px] font-mono text-zinc-400 w-6 text-right">
              {synthParams.masterVolume}%
            </span>
          </div>

          {/* Panic Trigger */}
          <button
            id="panic-btn"
            onClick={handlePanic}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold rounded-lg transition-all uppercase tracking-wide"
            title="Silence all active nodes"
          >
            <RotateCcw className="w-3 h-3" />
            Panic
          </button>

          {/* User Manual Toggle */}
          <button
            id="manual-btn"
            onClick={() => setShowManual(!showManual)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[10px] font-mono transition-all ${
              showManual 
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]" 
                : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guide
          </button>
        </div>
      </header>

      {/* WEB AUDIO INITIALIZER OVERLAY (Bypasses Chrome/Safari gesture lock) */}
      {audioState === "uninitialized" && (
        <section className="max-w-7xl w-full mx-auto mb-4 bg-gradient-to-r from-cyan-950/30 to-violet-950/30 border border-cyan-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-cyan-400 animate-bounce" />
            <div>
              <h2 className="text-xs font-display font-bold uppercase tracking-wide text-zinc-200">
                Audio Engine Suspended
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">
                Browsers prevent background audio. Click the activator to launch the DSP voice cluster.
              </p>
            </div>
          </div>
          <button
            id="audio-initializer-btn"
            onClick={ensureEngineInit}
            className="px-5 py-2.5 bg-cyan-400 text-black text-xs font-display font-bold uppercase tracking-wider rounded-lg shadow-lg hover:bg-cyan-300 transition-all flex items-center gap-2"
          >
            <Power className="w-3.5 h-3.5 stroke-[2.5px]" />
            Activate DSP Engine
          </button>
        </section>
      )}

      {/* MAIN HARDWARE PANEL CONTAINER (BENTO GRID STYLE) */}
      <main className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-4">
        
        {/* Tier 1: Real-time Output Analysis (Wave visualizer) */}
        <section id="visualizer-tier">
          <WaveVisualizer audioEngine={audioEngineRef.current} />
        </section>

        {/* Tier 2: The Sound Generators (Oscillators, Unison, Noise, Sub) */}
        <section id="generators-tier">
          <OscillatorControls params={synthParams} onChange={handleSynthParamChange} />
        </section>

        {/* Tier 3: The Sound Modulators & Envelopes (Filter, Amp ADSR, Filt ADSR) */}
        <section id="modulators-tier">
          <FilterControls params={synthParams} onChange={handleSynthParamChange} />
        </section>

        {/* Tier 4: The Sequencer & Musical Playback (MIDI parameters & Keyboard) */}
        <section id="midi-tier">
          <MidiControls 
            params={generatorParams} 
            onChange={handleGeneratorParamChange}
            isPlaying={isPlayingSeq}
            onTogglePlay={handleToggleSequencer}
            onPlayNote={handlePlayNote}
            onStopNote={handleStopNote}
          />
        </section>

      </main>

      {/* USER MANUAL MODAL WINDOW */}
      {showManual && (
        <div className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md flex items-center justify-center z-50 p-4 select-text">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              id="close-manual-btn"
              onClick={() => setShowManual(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 font-mono text-sm border border-zinc-800/80 rounded px-2 py-0.5 hover:bg-zinc-900 transition-colors"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-900">
              <Info className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
                Synth Reference & Guide
              </h3>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-400 leading-relaxed">
              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  Synthesis Architecture
                </h4>
                <p>
                  This synthesizer features standard hybrid wavetable & additive DSP synthesis modeled after hardware classics. Each played key fires a voice cluster containing the Main Oscillator, Sub Oscillator, Noise generator, State Variable Filter, and high-precision envelopes.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  Additive Synthesis & Spectral Morphing
                </h4>
                <p>
                  Under <strong className="text-cyan-400">Wavetable</strong> or <strong className="text-cyan-400">Spectral</strong> modes, you can draw/paint 16 independent harmonic sliders to construct custom waveforms in real time. 
                  The <strong className="text-violet-400">Spectral Morph</strong> knob applies dynamic frequency-shifting comb filters and odd-harmonic clipping profiles, creating glassy, mutating digital tones.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  Unison Voice Multiplier
                </h4>
                <p>
                  Dial up to 16 detuned voices. Symmetrical micro-detuning (¢) and left/right stereo spread (%) generate wide chorus swells, mimicking massive supersaws.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Filter & Drive
                </h4>
                <p>
                  A State Variable Filter (SVF) with Lowpass, Highpass, Bandpass, and Notch routing. Modulate the cutoff frequency using the Filter Envelope slider, and add analog saturation warmth using the <strong className="text-emerald-400">Drive</strong> (hyperbolic wave-clipping) node.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  Algorithmic Sequencer
                </h4>
                <p>
                  Configure BPM, Root Key, Scale, and Pattern (Arpeggios, Chords, runs) then press <strong className="text-violet-400">Play Sequence</strong>. The generative engine automatically triggers rich chords, melodies, and ambient soundscapes.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-zinc-900 text-center">
              <button
                id="manual-ok-btn"
                onClick={() => setShowManual(false)}
                className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-white transition-colors"
              >
                Dismiss Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BRUTALIST SIGNATURE */}
      <footer className="max-w-7xl w-full mx-auto mt-6 flex justify-between items-center text-[10px] font-mono text-zinc-600 border-t border-zinc-900/60 pt-4">
        <span>VITAL-WEB-SYNTH-ENGINE • REV 4.2</span>
        <span className="flex items-center gap-1 text-zinc-500 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500/60" />
          POLYPHONIC ADDITIVE SYNTHESIZER
        </span>
        <span>CTRL-HZ COMPLIANT</span>
      </footer>

    </div>
  );
}
