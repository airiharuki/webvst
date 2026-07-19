/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Music, Play, Square, Sliders, Layers } from "lucide-react";
import { GeneratorParams, PatternType } from "../types";
import { KEYS, SCALES } from "../data/presets";
import Knob from "./Knob";

interface MidiControlsProps {
  params: GeneratorParams;
  onChange: (updates: Partial<GeneratorParams>) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPlayNote: (midiNote: number, velocity?: number) => void;
  onStopNote: (midiNote: number) => void;
}

// 2-Octave Piano Key Map (C3 to C5, MIDI 48 to 72)
interface PianoKey {
  note: number;
  label: string;
  isBlack: boolean;
  keyBind: string; // QWERTY key map
}

const PIANO_KEYS: PianoKey[] = [
  { note: 48, label: "C3", isBlack: false, keyBind: "a" },
  { note: 49, label: "C#3", isBlack: true, keyBind: "w" },
  { note: 50, label: "D3", isBlack: false, keyBind: "s" },
  { note: 51, label: "D#3", isBlack: true, keyBind: "e" },
  { note: 52, label: "E3", isBlack: false, keyBind: "d" },
  { note: 53, label: "F3", isBlack: false, keyBind: "f" },
  { note: 54, label: "F#3", isBlack: true, keyBind: "t" },
  { note: 55, label: "G3", isBlack: false, keyBind: "g" },
  { note: 56, label: "G#3", isBlack: true, keyBind: "y" },
  { note: 57, label: "A3", isBlack: false, keyBind: "h" },
  { note: 58, label: "A#3", isBlack: true, keyBind: "u" },
  { note: 59, label: "B3", isBlack: false, keyBind: "j" },
  { note: 60, label: "C4", isBlack: false, keyBind: "k" },
  { note: 61, label: "C#4", isBlack: true, keyBind: "o" },
  { note: 62, label: "D4", isBlack: false, keyBind: "l" },
  { note: 63, label: "D#4", isBlack: true, keyBind: "p" },
  { note: 64, label: "E4", isBlack: false, keyBind: ";" },
  { note: 65, label: "F4", isBlack: false, keyBind: "'" },
  { note: 66, label: "F#4", isBlack: true, keyBind: "]" },
  { note: 67, label: "G4", isBlack: false, keyBind: "z" },
  { note: 68, label: "G#4", isBlack: true, keyBind: "x" },
  { note: 69, label: "A4", isBlack: false, keyBind: "c" },
  { note: 70, label: "A#4", isBlack: true, keyBind: "v" },
  { note: 71, label: "B4", isBlack: false, keyBind: "b" },
  { note: 72, label: "C5", isBlack: false, keyBind: "n" },
];

export default function MidiControls({
  params,
  onChange,
  isPlaying,
  onTogglePlay,
  onPlayNote,
  onStopNote
}: MidiControlsProps) {
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<number>>(new Set());

  // Listen to computer QWERTY keyboard keypresses
  useEffect(() => {
    const activeKeysMap = new Set<number>();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore repeat fires
      
      // Ignore keypresses if user is typing inside an input field
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const keyChar = e.key.toLowerCase();
      const matchedPianoKey = PIANO_KEYS.find(k => k.keyBind === keyChar);

      if (matchedPianoKey) {
        onPlayNote(matchedPianoKey.note, 100);
        setActiveMidiKeys(prev => {
          const next = new Set(prev);
          next.add(matchedPianoKey.note);
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyChar = e.key.toLowerCase();
      const matchedPianoKey = PIANO_KEYS.find(k => k.keyBind === keyChar);

      if (matchedPianoKey) {
        onStopNote(matchedPianoKey.note);
        setActiveMidiKeys(prev => {
          const next = new Set(prev);
          next.delete(matchedPianoKey.note);
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onPlayNote, onStopNote]);

  const handlePianoKeyTrigger = (midiNote: number) => {
    onPlayNote(midiNote, 105);
    setActiveMidiKeys(prev => {
      const next = new Set(prev);
      next.add(midiNote);
      return next;
    });
  };

  const handlePianoKeyRelease = (midiNote: number) => {
    onStopNote(midiNote);
    setActiveMidiKeys(prev => {
      const next = new Set(prev);
      next.delete(midiNote);
      return next;
    });
  };

  const patternTypes: PatternType[] = [
    "Arpeggio Up",
    "Arpeggio Down",
    "Chord Sequence",
    "Melodic Run",
    "Random Ambient"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* 1. SEQUENCER CONFIGURATION PANEL (7 Cols) */}
      <div className="lg:col-span-7 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="sequencer-params-panel">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase font-display font-bold text-violet-400 tracking-wider flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              Algorithmic Sequence Generator
            </span>
            <span className="text-[10px] font-mono text-zinc-500">MIDI BRAIN</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Key and Scale */}
            <div>
              <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1 tracking-wider">Root Key</label>
              <select
                id="select-root-key"
                className="w-full bg-zinc-950 text-xs font-mono border border-zinc-800 rounded p-1.5 text-zinc-300 focus:outline-none focus:border-violet-500"
                value={params.key}
                onChange={(e) => onChange({ key: e.target.value })}
              >
                {KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1 tracking-wider">Musical Scale</label>
              <select
                id="select-musical-scale"
                className="w-full bg-zinc-950 text-xs font-mono border border-zinc-800 rounded p-1.5 text-zinc-300 focus:outline-none focus:border-violet-500"
                value={params.scale}
                onChange={(e) => onChange({ scale: e.target.value })}
              >
                {SCALES.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} ({s.desc.split(",")[0]})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pattern selection tabs */}
          <div className="mb-4">
            <label className="block text-[9px] font-mono uppercase text-zinc-400 mb-1 tracking-wider">Generation Pattern</label>
            <div className="grid grid-cols-3 md:grid-cols-5 bg-zinc-950 p-1 rounded-lg border border-zinc-800/60 gap-1 text-[9px] font-mono font-medium text-zinc-400">
              {patternTypes.map((pat) => (
                <button
                  key={pat}
                  id={`pattern-btn-${pat.replace(/\s+/g, "-").toLowerCase()}`}
                  className={`py-1.5 px-0.5 rounded transition-all text-center ${
                    params.patternType === pat
                      ? "bg-violet-500/10 text-violet-400 font-bold border border-violet-500/25"
                      : "hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                  onClick={() => onChange({ patternType: pat })}
                >
                  {pat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BPM & Density Knobs Row with Large Trigger */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
          <div className="flex gap-4">
            <Knob
              id="knob-gen-bpm"
              label="Tempo BPM"
              value={params.bpm}
              min={40}
              max={220}
              step={1}
              color="violet"
              unit="bpm"
              onChange={(val) => onChange({ bpm: val })}
            />
            <Knob
              id="knob-gen-density"
              label="Density/Prob"
              value={params.density}
              min={10}
              max={100}
              step={1}
              color="violet"
              unit="%"
              onChange={(val) => onChange({ density: val })}
            />
          </div>

          {/* Large play/pause launcher */}
          <button
            id="sequencer-play-btn"
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-display font-bold uppercase tracking-wider text-xs border transition-all duration-300 ${
              isPlaying
                ? "bg-red-500/15 text-red-400 border-red-500/35 hover:bg-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-violet-500/15 text-violet-300 border-violet-500/35 hover:bg-violet-500/25 hover:text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.2)] animate-pulse"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                Stop Sequence
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Play Sequence
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. PC KEYBOARD & TACTILE PIANO KEYBOARD (5 Cols) */}
      <div className="lg:col-span-5 bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/80 flex flex-col justify-between" id="tactile-piano-panel">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs uppercase font-display font-bold text-zinc-300 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Interactive Piano Roll
            </span>
            <span className="text-[10px] font-mono text-zinc-500">C3 - C5 KEYBOARD</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mb-3 leading-normal">
            Click keys below or use QWERTY bindings <strong className="text-cyan-400/80">A W S E D F T G Y H U J K</strong> on your PC keyboard to play.
          </p>
        </div>

        {/* Tactile Keyboard representation */}
        <div className="relative flex justify-center w-full bg-zinc-950 p-3 rounded-xl border border-zinc-900/80 select-none overflow-x-auto min-h-[110px]" id="visual-keys-container">
          {/* We lay out White keys first, then overlay black keys on top */}
          <div className="flex relative w-full h-24 max-w-sm">
            {/* 1. White keys rendering */}
            {PIANO_KEYS.filter(k => !k.isBlack).map((key, index) => {
              const isActive = activeMidiKeys.has(key.note);
              return (
                <button
                  key={key.note}
                  id={`white-key-${key.note}`}
                  onMouseDown={() => handlePianoKeyTrigger(key.note)}
                  onMouseUp={() => handlePianoKeyRelease(key.note)}
                  onMouseLeave={() => activeMidiKeys.has(key.note) && handlePianoKeyRelease(key.note)}
                  onTouchStart={() => handlePianoKeyTrigger(key.note)}
                  onTouchEnd={() => handlePianoKeyRelease(key.note)}
                  className={`flex-1 h-full border-r border-b border-zinc-950/80 rounded-b-md flex flex-col justify-end items-center pb-1 text-[8px] font-mono font-bold transition-all ${
                    isActive
                      ? "bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)] scale-y-95"
                      : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                  }`}
                  style={{
                    borderLeftWidth: index === 0 ? "1px" : "0px",
                    zIndex: 10
                  }}
                >
                  <span className="opacity-40">{key.keyBind.toUpperCase()}</span>
                  <span>{key.label}</span>
                </button>
              );
            })}

            {/* 2. Black keys rendering (absolute offsets overlapping white keys) */}
            {/* Total white keys is 15. The black keys are placed carefully between white keys */}
            {PIANO_KEYS.filter(k => k.isBlack).map((key) => {
              // We need to calculate correct absolute offset percentage
              // White keys index lookup to compute offset
              const whiteKeyBefore = PIANO_KEYS.slice(0, PIANO_KEYS.indexOf(key)).filter(k => !k.isBlack).length;
              const widthPercentage = 100 / 15; // 15 white keys total
              const leftOffset = whiteKeyBefore * widthPercentage - (widthPercentage * 0.35);
              const isActive = activeMidiKeys.has(key.note);
              
              return (
                <button
                  key={key.note}
                  id={`black-key-${key.note}`}
                  onMouseDown={() => handlePianoKeyTrigger(key.note)}
                  onMouseUp={() => handlePianoKeyRelease(key.note)}
                  onMouseLeave={() => activeMidiKeys.has(key.note) && handlePianoKeyRelease(key.note)}
                  onTouchStart={() => handlePianoKeyTrigger(key.note)}
                  onTouchEnd={() => handlePianoKeyRelease(key.note)}
                  className={`absolute top-0 h-14 w-[5.5%] rounded-b border border-zinc-950 flex flex-col justify-end items-center pb-1 text-[6px] font-mono font-bold transition-all ${
                    isActive
                      ? "bg-violet-400 text-black shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                      : "bg-zinc-900 text-zinc-500 hover:bg-zinc-850"
                  }`}
                  style={{
                    left: `${leftOffset}%`,
                    zIndex: 20
                  }}
                >
                  <span className="opacity-60 text-zinc-400">{key.keyBind.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
