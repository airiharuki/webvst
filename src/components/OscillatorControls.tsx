/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { Zap, Volume2, Sparkles, Orbit } from "lucide-react";
import { SynthParams, MainOscType, SubOscType } from "../types";
import Knob from "./Knob";

interface OscillatorControlsProps {
  params: SynthParams;
  onChange: (updates: Partial<SynthParams>) => void;
}

export default function OscillatorControls({ params, onChange }: OscillatorControlsProps) {
  const harmonicsContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle drawing on the harmonic bars (additive synthesis)
  const handleHarmonicInteraction = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (!harmonicsContainerRef.current) return;
    
    // Check if dragging/pressing (mouse click or touch)
    const isMouseDown = e.type === "mousedown" || (e as React.MouseEvent).buttons === 1;
    const isTouch = e.type === "touchmove" || e.type === "touchstart";
    
    if (!isMouseDown && !isTouch) return;

    // Calculate vertical fill ratio (0.0 to 1.0)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const clickY = clientY - rect.top;
    
    let value = 1.0 - clickY / rect.height;
    value = Math.max(0, Math.min(1.0, value));
    
    // Update the harmonics array
    const updatedHarmonics = [...params.harmonics];
    updatedHarmonics[index] = parseFloat(value.toFixed(2));
    
    onChange({ harmonics: updatedHarmonics });
  };

  // Helper to quickly preset standard wave harmonics
  const setHarmonicsProfile = (profile: "sine" | "saw" | "square" | "triangle") => {
    let newHarmonics = Array(16).fill(0);
    switch (profile) {
      case "sine":
        newHarmonics[0] = 1.0;
        break;
      case "saw":
        newHarmonics = Array(16).fill(0).map((_, i) => 1.0 / (i + 1));
        break;
      case "square":
        newHarmonics = Array(16).fill(0).map((_, i) => ((i + 1) % 2 === 1 ? 1.0 / (i + 1) : 0));
        break;
      case "triangle":
        newHarmonics = Array(16).fill(0).map((_, i) => {
          const n = i + 1;
          if (n % 2 === 0) return 0;
          const sign = ((n - 1) / 2) % 2 === 0 ? 1 : -1;
          return sign / (n * n);
        });
        break;
    }
    onChange({ harmonics: newHarmonics });
  };

  const oscTypes: MainOscType[] = ["Sine", "Triangle", "Sawtooth", "Square", "Wavetable", "Spectral"];
  const subTypes: SubOscType[] = ["Off", "Sine", "Triangle", "Square"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* 1. MAIN OSCILLATOR COCKPIT (6 Cols) */}
      <div className="lg:col-span-7 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="main-osc-section">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase font-display font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Main Oscillator
            </span>
            <span className="text-[10px] font-mono text-zinc-500">VOICE ENGINE</span>
          </div>

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-6 bg-zinc-950 p-1 rounded-lg border border-zinc-800/60 mb-4 text-[10px] font-mono font-medium text-zinc-400">
            {oscTypes.map((type) => (
              <button
                key={type}
                id={`osc-type-${type.toLowerCase()}`}
                className={`py-1.5 px-1 rounded transition-all text-center ${
                  params.mainOscType === type
                    ? "bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/25"
                    : "hover:text-zinc-200 hover:bg-zinc-900"
                }`}
                onClick={() => onChange({ mainOscType: type })}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Interactive Harmonics Draw / Custom Periodic wave */}
          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase">
                {params.mainOscType === "Wavetable" || params.mainOscType === "Spectral"
                  ? "Additive Partial Table (Harmonics 1 - 16)"
                  : "Harmonic Content Preview (Read Only)"}
              </span>

              {/* Draw presets shortcuts */}
              <div className="flex gap-1 text-[8px] font-mono text-zinc-400">
                <button
                  id="harm-shortcut-sine"
                  onClick={() => setHarmonicsProfile("sine")}
                  className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
                >
                  Sine
                </button>
                <button
                  id="harm-shortcut-saw"
                  onClick={() => setHarmonicsProfile("saw")}
                  className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
                >
                  Saw
                </button>
                <button
                  id="harm-shortcut-sq"
                  onClick={() => setHarmonicsProfile("square")}
                  className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
                >
                  Square
                </button>
                <button
                  id="harm-shortcut-tri"
                  onClick={() => setHarmonicsProfile("triangle")}
                  className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
                >
                  Tri
                </button>
              </div>
            </div>

            {/* Interactive Draw Bars Container */}
            <div
              ref={harmonicsContainerRef}
              className="flex justify-between items-end h-16 gap-1 pt-1.5 select-none"
            >
              {params.harmonics.map((value, idx) => {
                const isActiveDraw = params.mainOscType === "Wavetable" || params.mainOscType === "Spectral";
                return (
                  <div
                    key={idx}
                    onMouseDown={(e) => handleHarmonicInteraction(e, idx)}
                    onMouseMove={(e) => handleHarmonicInteraction(e, idx)}
                    onTouchStart={(e) => handleHarmonicInteraction(e, idx)}
                    onTouchMove={(e) => handleHarmonicInteraction(e, idx)}
                    className="relative flex-1 h-full bg-zinc-900 border border-zinc-800/40 rounded flex flex-col justify-end cursor-pointer group"
                  >
                    {/* Filling Column */}
                    <div
                      className={`w-full rounded-t transition-all ${
                        isActiveDraw
                          ? "bg-cyan-500 group-hover:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                          : "bg-zinc-700/60"
                      }`}
                      style={{ height: `${value * 100}%` }}
                    />
                    {/* Hover text indicator */}
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(value * 100)}
                    </span>
                    {/* Index number */}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[6px] font-mono text-zinc-600">
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Morph & Glide Controls */}
        <div className="flex justify-around items-center pt-2 border-t border-zinc-800/50">
          <Knob
            id="knob-spectral-morph"
            label="Spectral Morph"
            value={params.spectralMorph}
            min={0}
            max={100}
            step={1}
            color="cyan"
            unit="%"
            onChange={(val) => onChange({ spectralMorph: val })}
          />
          <Knob
            id="knob-glide-time"
            label="Portamento Glide"
            value={params.glideTime}
            min={0}
            max={1000}
            step={5}
            color="cyan"
            unit="ms"
            onChange={(val) => onChange({ glideTime: val })}
          />
        </div>
      </div>

      {/* 2. UNISON CHORUS ENGINE (3 Cols) */}
      <div className="lg:col-span-3 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="unison-section">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase font-display font-bold text-violet-400 tracking-wider flex items-center gap-1.5">
              <Orbit className="w-4 h-4 animate-spin-slow" />
              Unison Engine
            </span>
            <span className="text-[10px] font-mono text-zinc-500">CHORUS</span>
          </div>

          <p className="text-[10px] text-zinc-500 font-mono mb-4 leading-normal">
            Clones multiple frequency-offset voice oscillators per note to create wide spatialized fatness.
          </p>
        </div>

        {/* Unison parameters */}
        <div className="flex flex-col gap-3 justify-center items-center">
          <div className="grid grid-cols-3 gap-2 w-full justify-items-center">
            <Knob
              id="knob-unison-voices"
              label="Voices"
              value={params.unisonVoices}
              min={1}
              max={16}
              step={1}
              color="violet"
              onChange={(val) => onChange({ unisonVoices: val })}
            />
            <Knob
              id="knob-unison-detune"
              label="Detune"
              value={params.unisonDetune}
              min={0}
              max={100}
              step={1}
              color="violet"
              unit="¢"
              onChange={(val) => onChange({ unisonDetune: val })}
            />
            <Knob
              id="knob-unison-spread"
              label="Stereo Spread"
              value={params.unisonSpread}
              min={0}
              max={100}
              step={1}
              color="violet"
              unit="%"
              onChange={(val) => onChange({ unisonSpread: val })}
            />
          </div>
          <div className="w-full text-center text-[9px] font-mono text-violet-400/80 mt-1">
            {params.unisonVoices === 1
              ? "Monophonic Voice"
              : `${params.unisonVoices} Active Unison Voices`}
          </div>
        </div>
      </div>

      {/* 3. AUX OSCILLATORS - SUB & NOISE (2 Cols) */}
      <div className="lg:col-span-2 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="aux-section">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase font-display font-bold text-orange-400 tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              Aux Mix
            </span>
            <span className="text-[10px] font-mono text-zinc-500">SUB/NOISE</span>
          </div>

          {/* Sub Oscillator config */}
          <div className="mb-4">
            <span className="text-[9px] font-mono text-zinc-400 block mb-1 uppercase tracking-wider">Sub Oscillator</span>
            <div className="grid grid-cols-4 bg-zinc-950 p-0.5 rounded border border-zinc-800/80 mb-2 text-[8px] font-mono text-zinc-400">
              {subTypes.map((type) => (
                <button
                  key={type}
                  id={`sub-type-${type.toLowerCase()}`}
                  className={`py-1 rounded text-center ${
                    params.subOscType === type
                      ? "bg-orange-500/10 text-orange-400 font-bold"
                      : "hover:text-zinc-200"
                  }`}
                  onClick={() => onChange({ subOscType: type })}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Octave selection */}
            {params.subOscType !== "Off" && (
              <div className="flex gap-1 justify-between items-center bg-zinc-950/80 p-1.5 rounded border border-zinc-900 text-[8px] font-mono text-zinc-400">
                <span>Octave</span>
                <div className="flex bg-zinc-900 border border-zinc-800 rounded p-0.5">
                  <button
                    id="sub-octave-minus1"
                    className={`px-1.5 py-0.5 rounded ${
                      params.subOctave === -1 ? "bg-orange-400 text-black font-bold" : ""
                    }`}
                    onClick={() => onChange({ subOctave: -1 })}
                  >
                    -1
                  </button>
                  <button
                    id="sub-octave-minus2"
                    className={`px-1.5 py-0.5 rounded ${
                      params.subOctave === -2 ? "bg-orange-400 text-black font-bold" : ""
                    }`}
                    onClick={() => onChange({ subOctave: -2 })}
                  >
                    -2
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Noise config */}
          <div className="mb-2">
            <span className="text-[9px] font-mono text-zinc-400 block mb-1 uppercase tracking-wider">Noise Color</span>
            <div className="flex bg-zinc-950 p-0.5 rounded border border-zinc-800/80 text-[8px] font-mono text-zinc-400">
              <button
                id="noise-color-white"
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  params.noiseColor === "white" ? "bg-zinc-800 text-white font-bold" : "hover:text-zinc-200"
                }`}
                onClick={() => onChange({ noiseColor: "white" })}
              >
                White
              </button>
              <button
                id="noise-color-pink"
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  params.noiseColor === "pink" ? "bg-pink-500/10 text-pink-400 font-bold" : "hover:text-zinc-200"
                }`}
                onClick={() => onChange({ noiseColor: "pink" })}
              >
                Pink
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Volumes */}
        <div className="flex justify-around items-center pt-2 border-t border-zinc-800/50">
          <Knob
            id="knob-sub-volume"
            label="Sub Vol"
            value={params.subOscType === "Off" ? 0 : params.subVolume}
            min={0}
            max={100}
            step={1}
            color="orange"
            unit="%"
            onChange={(val) => onChange({ subVolume: val })}
          />
          <Knob
            id="knob-noise-volume"
            label="Noise Vol"
            value={params.noiseVolume}
            min={0}
            max={100}
            step={1}
            color="orange"
            unit="%"
            onChange={(val) => onChange({ noiseVolume: val })}
          />
        </div>
      </div>

    </div>
  );
}
