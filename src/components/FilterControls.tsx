/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sliders, Eye } from "lucide-react";
import { SynthParams, FilterType } from "../types";
import Knob from "./Knob";

interface FilterControlsProps {
  params: SynthParams;
  onChange: (updates: Partial<SynthParams>) => void;
}

export default function FilterControls({ params, onChange }: FilterControlsProps) {
  
  const filterTypes: FilterType[] = ["lowpass", "highpass", "bandpass", "notch"];

  // Generates SVG path coordinates to visualize an ADSR Envelope
  const getEnvelopePath = (a: number, d: number, s: number, r: number) => {
    // Canvas total width = 160, total height = 45
    // Map ADSR values (typically 0.0 - 8.0s) into x/y dimensions
    const maxVal = 6.0; // scale boundary for visualization
    
    // Horizontal segments mapping (summing up to width 160)
    const attackW = Math.max(5, Math.min(45, (a / maxVal) * 45));
    const decayW = Math.max(5, Math.min(45, (d / maxVal) * 45));
    const sustainH = 40 - (s / 100) * 35; // height maps from top (0) to bottom (40)
    const releaseW = Math.max(5, Math.min(45, (r / maxVal) * 45));
    
    const startX = 5;
    const startY = 40;
    
    const peakX = startX + attackW;
    const peakY = 5; // peak amplitude
    
    const sustainX = peakX + decayW;
    const sustainY = sustainH;
    
    const releaseStartX = 155 - releaseW;
    const releaseStartY = sustainH;
    
    const endX = 155;
    const endY = 40;

    return `M ${startX} ${startY} L ${peakX} ${peakY} L ${sustainX} ${sustainY} L ${releaseStartX} ${releaseStartY} L ${endX} ${endY}`;
  };

  const ampPath = getEnvelopePath(params.ampAttack, params.ampDecay, params.ampSustain, params.ampRelease);
  const filterPath = getEnvelopePath(params.filterAttack, params.filterDecay, params.filterSustain, params.filterRelease);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* 1. FILTER CONTROLLER SECTION (4 Cols) */}
      <div className="lg:col-span-4 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="filter-section">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase font-display font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              State Variable Filter
            </span>
            <span className="text-[10px] font-mono text-zinc-500">SVF / CUTOFF</span>
          </div>

          {/* Filter Type Buttons */}
          <div className="grid grid-cols-4 bg-zinc-950 p-1 rounded-lg border border-zinc-800/60 mb-4 text-[10px] font-mono font-medium text-zinc-400">
            {filterTypes.map((type) => (
              <button
                key={type}
                id={`filter-type-${type}`}
                className={`py-1 rounded text-center transition-all ${
                  params.filterType === type
                    ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25"
                    : "hover:text-zinc-200 hover:bg-zinc-900"
                }`}
                onClick={() => onChange({ filterType: type })}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Knobs */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 justify-items-center mb-2">
          <Knob
            id="knob-filter-cutoff"
            label="Cutoff"
            value={params.filterCutoff}
            min={20}
            max={18000}
            step={10}
            color="emerald"
            unit="Hz"
            onChange={(val) => onChange({ filterCutoff: val })}
            displayFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`}
          />
          <Knob
            id="knob-filter-resonance"
            label="Resonance"
            value={params.filterResonance}
            min={0.1}
            max={18}
            step={0.1}
            color="emerald"
            unit="Q"
            onChange={(val) => onChange({ filterResonance: val })}
          />
          <Knob
            id="knob-filter-drive"
            label="Drive Saturation"
            value={params.filterDrive}
            min={1.0}
            max={4.0}
            step={0.05}
            color="emerald"
            unit="x"
            onChange={(val) => onChange({ filterDrive: val })}
          />
          <Knob
            id="knob-filter-env-amt"
            label="Envelope Mod"
            value={params.filterEnvAmt}
            min={-100}
            max={100}
            step={1}
            color="emerald"
            unit="%"
            onChange={(val) => onChange({ filterEnvAmt: val })}
            displayFormatter={(v) => (v > 0 ? `+${Math.round(v)}` : `${Math.round(v)}`)}
          />
        </div>
      </div>

      {/* 2. AMPLITUDE ENVELOPE (ADSR) SECTION (4 Cols) */}
      <div className="lg:col-span-4 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="amp-env-section">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase font-display font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              Amplitude Envelope
            </span>
            <span className="text-[10px] font-mono text-zinc-500">AMP ADSR</span>
          </div>

          {/* SVG Shape Preview */}
          <div className="bg-zinc-950/80 rounded-lg p-2 border border-zinc-900 h-16 flex items-center justify-center mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 opacity-40 pointer-events-none" />
            <svg className="w-full h-full" viewBox="0 0 160 45">
              {/* Grid Lines */}
              <line x1="0" y1="22.5" x2="160" y2="22.5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              <line x1="40" y1="0" x2="40" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              <line x1="80" y1="0" x2="80" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              <line x1="120" y1="0" x2="120" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              
              {/* Path line representing envelope */}
              <path
                d={ampPath}
                fill="none"
                stroke="rgb(34, 211, 238)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_3px_rgba(6,182,212,0.6)]"
              />
            </svg>
          </div>
        </div>

        {/* Envelope Knobs row */}
        <div className="grid grid-cols-4 gap-1 justify-items-center">
          <Knob
            id="knob-amp-attack"
            label="Attack"
            value={params.ampAttack}
            min={0.001}
            max={5.0}
            step={0.01}
            color="cyan"
            unit="s"
            onChange={(val) => onChange({ ampAttack: val })}
          />
          <Knob
            id="knob-amp-decay"
            label="Decay"
            value={params.ampDecay}
            min={0.01}
            max={5.0}
            step={0.01}
            color="cyan"
            unit="s"
            onChange={(val) => onChange({ ampDecay: val })}
          />
          <Knob
            id="knob-amp-sustain"
            label="Sustain"
            value={params.ampSustain}
            min={0}
            max={100}
            step={1}
            color="cyan"
            unit="%"
            onChange={(val) => onChange({ ampSustain: val })}
          />
          <Knob
            id="knob-amp-release"
            label="Release"
            value={params.ampRelease}
            min={0.01}
            max={5.0}
            step={0.01}
            color="cyan"
            unit="s"
            onChange={(val) => onChange({ ampRelease: val })}
          />
        </div>
      </div>

      {/* 3. FILTER ENVELOPE (ADSR) SECTION (4 Cols) */}
      <div className="lg:col-span-4 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="filter-env-section">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase font-display font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              Filter Envelope
            </span>
            <span className="text-[10px] font-mono text-zinc-500">FILT ADSR</span>
          </div>

          {/* SVG Shape Preview */}
          <div className="bg-zinc-950/80 rounded-lg p-2 border border-zinc-900 h-16 flex items-center justify-center mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-40 pointer-events-none" />
            <svg className="w-full h-full" viewBox="0 0 160 45">
              {/* Grid Lines */}
              <line x1="0" y1="22.5" x2="160" y2="22.5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              <line x1="40" y1="0" x2="40" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              <line x1="80" y1="0" x2="80" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              <line x1="120" y1="0" x2="120" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2" />
              
              {/* Path line representing envelope */}
              <path
                d={filterPath}
                fill="none"
                stroke="rgb(52, 211, 153)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_3px_rgba(52,211,153,0.6)]"
              />
            </svg>
          </div>
        </div>

        {/* Envelope Knobs row */}
        <div className="grid grid-cols-4 gap-1 justify-items-center">
          <Knob
            id="knob-filt-attack"
            label="Attack"
            value={params.filterAttack}
            min={0.001}
            max={5.0}
            step={0.01}
            color="emerald"
            unit="s"
            onChange={(val) => onChange({ filterAttack: val })}
          />
          <Knob
            id="knob-filt-decay"
            label="Decay"
            value={params.filterDecay}
            min={0.01}
            max={5.0}
            step={0.01}
            color="emerald"
            unit="s"
            onChange={(val) => onChange({ filterDecay: val })}
          />
          <Knob
            id="knob-filt-sustain"
            label="Sustain"
            value={params.filterSustain}
            min={0}
            max={100}
            step={1}
            color="emerald"
            unit="%"
            onChange={(val) => onChange({ filterSustain: val })}
          />
          <Knob
            id="knob-filt-release"
            label="Release"
            value={params.filterRelease}
            min={0.01}
            max={5.0}
            step={0.01}
            color="emerald"
            unit="s"
            onChange={(val) => onChange({ filterRelease: val })}
          />
        </div>
      </div>

    </div>
  );
}
