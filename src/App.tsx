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
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans p-3 sm:p-6 flex flex-col justify-between select-none">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl w-full mx-auto mb-4 flex flex-col md:flex-row justify-between items-center bg-[#141517] border border-zinc-800 rounded p-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00F2FF]/10 rounded border border-[#00F2FF]/30 shadow-[0_0_8px_#00F2FF33]">
            <AudioLines className="w-5 h-5 text-[#00F2FF] animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-[0.25em] text-[#00F2FF] drop-shadow-[0_0_8px_#00F2FF44]">
              SPECTRA.OSC
            </h1>
            <p className="text-[9px] font-mono text-zinc-500 tracking-wide">
              WAVETABLE & SPECTRAL SYNTHESIS • WEB AUDIO DSP
            </p>
          </div>
        </div>

        {/* Global Controls Row (Presets, Panic, Manual) */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Preset Dropdown */}
          <div className="flex items-center gap-2 bg-black border border-zinc-800 p-1.5 rounded">
            <span className="text-[10px] font-mono text-zinc-500 uppercase px-1">Preset:</span>
            <select
              id="preset-selector"
              className="bg-[#141517] border border-zinc-800 text-[10.5px] font-mono text-zinc-300 rounded px-2 py-1 focus:outline-none focus:border-[#00F2FF] transition-colors cursor-pointer"
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
          <div className="flex items-center gap-2 bg-black border border-zinc-800 px-3 py-1.5 rounded">
            {synthParams.masterVolume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#00F2FF]" />
            )}
            <input
              id="slider-master-volume"
              type="range"
              min="0"
              max="100"
              className="w-16 h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-[#00F2FF]"
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
            className="flex items-center gap-1 px-3 py-1.5 bg-[#FF3E00]/10 hover:bg-[#FF3E00]/20 border border-[#FF3E00]/30 text-[#FF3E00] text-[10px] font-mono font-bold rounded transition-all uppercase tracking-wide cursor-pointer"
            title="Silence all active nodes"
          >
            <RotateCcw className="w-3 h-3" />
            Panic
          </button>

          {/* User Manual Toggle */}
          <button
            id="manual-btn"
            onClick={() => setShowManual(!showManual)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[10px] font-mono transition-all cursor-pointer ${
              showManual 
                ? "bg-[#00F2FF]/15 text-[#00F2FF] border-[#00F2FF]/40 shadow-[0_0_8px_#00F2FF33]" 
                : "bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guide
          </button>
        </div>
      </header>

      {/* WEB AUDIO INITIALIZER OVERLAY (Bypasses Chrome/Safari gesture lock) */}
      {audioState === "uninitialized" && (
        <section className="max-w-7xl w-full mx-auto mb-4 bg-[#141517] border border-[#00F2FF]/30 shadow-[0_0_15px_#00F2FF11] rounded p-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-[#00F2FF] animate-bounce" />
            <div>
              <h2 className="text-xs font-display font-bold uppercase tracking-wide text-zinc-200">
                Audio Engine Suspended
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">
                Web browsers require user gestures to enable synthesized audio. Click activate to boot the real-time DSP core.
              </p>
            </div>
          </div>
          <button
            id="audio-initializer-btn"
            onClick={ensureEngineInit}
            className="px-5 py-2.5 bg-[#00F2FF] text-black text-xs font-display font-bold uppercase tracking-wider rounded shadow-lg hover:bg-cyan-300 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_#00F2FF]"
          >
            <Power className="w-3.5 h-3.5 stroke-[2.5px]" />
            Activate DSP Core
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
          <div className="bg-[#141517] border border-zinc-800 rounded p-6 max-w-xl w-full shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              id="close-manual-btn"
              onClick={() => setShowManual(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 font-mono text-sm border border-zinc-800/80 rounded px-2 py-0.5 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-900">
              <Info className="w-5 h-5 text-[#00F2FF]" />
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
                Synth Reference & Guide
              </h3>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-400 leading-relaxed">
              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00F2FF] rounded-full" />
                  Synthesis Architecture
                </h4>
                <p>
                  This synthesizer features standard hybrid wavetable & additive DSP synthesis modeled after hardware classics. Each played key fires a voice cluster containing the Main Oscillator, Sub Oscillator, Noise generator, State Variable Filter, and high-precision envelopes.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00F2FF] rounded-full" />
                  Additive Synthesis & Spectral Morphing
                </h4>
                <p>
                  Under <strong className="text-[#00F2FF]">Wavetable</strong> or <strong className="text-[#00F2FF]">Spectral</strong> modes, you can draw/paint 16 independent harmonic sliders to construct custom waveforms in real time. 
                  The <strong className="text-[#00F2FF]">Spectral Morph</strong> knob applies dynamic frequency-shifting comb filters and odd-harmonic clipping profiles, creating glassy, mutating digital tones.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#FF3E00] rounded-full" />
                  Unison Voice Multiplier
                </h4>
                <p>
                  Dial up to 16 detuned voices. Symmetrical micro-detuning (¢) and left/right stereo spread (%) generate wide chorus swells, mimicking massive supersaws.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#FF3E00] rounded-full" />
                  Filter & Drive
                </h4>
                <p>
                  A State Variable Filter (SVF) with Lowpass, Highpass, Bandpass, and Notch routing. Modulate the cutoff frequency using the Filter Envelope slider, and add analog saturation warmth using the <strong className="text-[#FF3E00]">Drive</strong> (hyperbolic wave-clipping) node.
                </p>
              </div>

              <div>
                <h4 className="text-zinc-200 font-bold mb-1 uppercase tracking-wide text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00F2FF] rounded-full" />
                  Algorithmic Sequencer
                </h4>
                <p>
                  Configure BPM, Root Key, Scale, and Pattern (Arpeggios, Chords, runs) then press <strong className="text-[#00F2FF]">Play Sequence</strong>. The generative engine automatically triggers rich chords, melodies, and ambient soundscapes.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-zinc-900 text-center">
              <button
                id="manual-ok-btn"
                onClick={() => setShowManual(false)}
                className="px-6 py-2 bg-black hover:bg-zinc-900 border border-zinc-800 rounded text-xs font-mono font-bold text-white transition-colors cursor-pointer"
              >
                Dismiss Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BRUTALIST SIGNATURE */}
      <footer className="max-w-7xl w-full mx-auto mt-6 flex justify-between items-center text-[10px] font-mono text-zinc-600 border-t border-zinc-900/60 pt-4">
        <span>SPECTRA.OSC SYSTEM ENGINE • REV 4.2</span>
        <span className="flex items-center gap-1 text-zinc-500 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#00F2FF]" />
          POLYPHONIC ADDITIVE SYNTHESIZER
        </span>
        <span>CTRL-HZ COMPLIANT</span>
      </footer>

    </div>
  );
}
