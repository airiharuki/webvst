/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeneratorParams, PatternType } from "../types";
import { KEYS, SCALES } from "../data/presets";
import { AudioEngine } from "./audioEngine";

// Helper for chord progression degrees (roman numerals)
const CHORD_PROGRESSIONS: Record<string, number[][]> = {
  "Major": [
    [1, 5, 6, 4], // I - V - vi - IV (Pop classic)
    [6, 4, 1, 5], // vi - IV - I - V (Emotional)
    [2, 5, 1, 4], // ii - V - I - IV (Jazzy)
    [1, 6, 4, 5], // I - vi - IV - V (50s standby)
  ],
  "Minor": [
    [1, 6, 3, 7], // i - VI - III - VII (Epic)
    [1, 4, 5, 1], // i - iv - v - i (Classic melancholic)
    [1, 6, 4, 5], // i - VI - iv - v (Moody dark)
    [6, 7, 1, 1], // VI - VII - i - i (Aeolian cadance)
  ]
};

export class MidiGenerator {
  private audioEngine: AudioEngine;
  private params: GeneratorParams;
  private timerId: number | NodeJS.Timeout | null = null;
  private isRunning = false;
  
  // Track notes that were triggered by the generator so we can turn them off
  private activeGeneratorNotes: Set<number> = new Set();
  
  // Sequencer State variables
  private stepIndex = 0;
  private chordIndex = 0;
  private lastMelodyMidi = 60; // Start at middle C

  constructor(audioEngine: AudioEngine, initialParams: GeneratorParams) {
    this.audioEngine = audioEngine;
    this.params = { ...initialParams };
  }

  public updateParams(newParams: GeneratorParams) {
    const bpmChanged = this.params.bpm !== newParams.bpm;
    this.params = { ...newParams };
    
    // If BPM changed and we are running, restart the timer to match the new speed
    if (this.isRunning && bpmChanged) {
      this.stop();
      this.start();
    }
  }

  // Calculate note numbers for a given Key & Scale
  public getScaleNotes(octaveStart = 4): number[] {
    const keyIndex = KEYS.indexOf(this.params.key);
    const scaleObj = SCALES.find(s => s.name === this.params.scale) || SCALES[0];
    
    const rootMidi = 12 * (octaveStart + 1) + keyIndex; // C4 is MIDI 60
    
    return scaleObj.intervals.map(interval => rootMidi + interval);
  }

  // Get notes for a specific chord degree in the current key/scale
  // degree: 1-indexed (e.g. 1 is I, 2 is ii, etc.)
  public getChordNotes(degree: number, octave = 3): number[] {
    const scaleNotes = this.getScaleNotes(octave);
    const index = (degree - 1) % scaleNotes.length;
    
    // Standard diatonic triads/7ths in scale
    const root = scaleNotes[index];
    const third = scaleNotes[(index + 2) % scaleNotes.length] + (index + 2 >= scaleNotes.length ? 12 : 0);
    const fifth = scaleNotes[(index + 4) % scaleNotes.length] + (index + 4 >= scaleNotes.length ? 12 : 0);
    const seventh = scaleNotes[(index + 6) % scaleNotes.length] + (index + 6 >= scaleNotes.length ? 12 : 0);
    
    // Add sub-bass octaves for fullness
    const bass = root - 12;
    
    return [bass, root, third, fifth, seventh];
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.stepIndex = 0;
    this.chordIndex = 0;
    
    // Determine note subdivision interval (e.g. 16th notes or 8th notes)
    // 60 / BPM gives duration of a quarter note. 
    // We will sequence on 8th notes (half a beat) or 16th notes (quarter beat)
    const subdivision = this.params.patternType === "Chord Sequence" ? 1 : 2; // Beats per step
    const intervalMs = (60 / this.params.bpm) * 1000 * subdivision;
    
    this.runSequencerStep();
    
    this.timerId = setInterval(() => {
      this.runSequencerStep();
    }, intervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.clearAllGeneratorNotes();
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  private clearAllGeneratorNotes() {
    this.activeGeneratorNotes.forEach(note => {
      this.audioEngine.stopNote(note);
    });
    this.activeGeneratorNotes.clear();
  }

  // Primary sequencer tick
  private runSequencerStep() {
    if (!this.isRunning) return;

    // Density check: check if we should play a note on this step
    const densityThreshold = this.params.density / 100;
    const skipStep = Math.random() > densityThreshold;

    // Clear previous notes unless we are playing an ambient pad
    if (this.params.patternType !== "Random Ambient" || Math.random() < 0.4) {
      this.clearAllGeneratorNotes();
    }

    const scaleNotes = this.getScaleNotes(4); // Melody register (octave 4)
    const bassScaleNotes = this.getScaleNotes(3); // Bass register (octave 3)

    // Select progression based on scale type
    const isMinor = this.params.scale.toLowerCase().includes("minor") || 
                    ["phrygian", "aeolian", "locrian"].includes(this.params.scale.toLowerCase());
    const progressions = isMinor ? CHORD_PROGRESSIONS["Minor"] : CHORD_PROGRESSIONS["Major"];
    const progression = progressions[this.chordIndex % progressions.length];
    const currentChordDegree = progression[this.stepIndex % progression.length];

    switch (this.params.patternType) {
      case "Chord Sequence": {
        // Play a full, lush chord on beat
        if (skipStep) break;
        
        const notesToPlay = this.getChordNotes(currentChordDegree, 3);
        const velocity = Math.floor(75 + Math.random() * 25); // humanized velocity
        
        notesToPlay.forEach((note, idx) => {
          // Stagger notes slightly for humanized "strumming" feel
          setTimeout(() => {
            if (this.isRunning) {
              this.audioEngine.playNote(note, velocity - idx * 2);
              this.activeGeneratorNotes.add(note);
            }
          }, idx * 12);
        });
        
        break;
      }

      case "Arpeggio Up": {
        // Arpeggiate the current active chord degrees
        const chordNotes = this.getChordNotes(currentChordDegree, 4);
        const arpNoteIndex = this.stepIndex % chordNotes.length;
        const note = chordNotes[arpNoteIndex];
        const velocity = Math.floor(80 + Math.random() * 25);

        // Add root bass note on downbeats
        if (this.stepIndex % 4 === 0) {
          const bassNote = chordNotes[0] - 12;
          this.audioEngine.playNote(bassNote, 90);
          this.activeGeneratorNotes.add(bassNote);
        }

        if (!skipStep) {
          this.audioEngine.playNote(note, velocity);
          this.activeGeneratorNotes.add(note);
        }
        break;
      }

      case "Arpeggio Down": {
        const chordNotes = this.getChordNotes(currentChordDegree, 4);
        // Reverse arpeggio index
        const arpNoteIndex = (chordNotes.length - 1) - (this.stepIndex % chordNotes.length);
        const note = chordNotes[arpNoteIndex];
        const velocity = Math.floor(80 + Math.random() * 25);

        if (this.stepIndex % 4 === 0) {
          const bassNote = chordNotes[0] - 12;
          this.audioEngine.playNote(bassNote, 90);
          this.activeGeneratorNotes.add(bassNote);
        }

        if (!skipStep) {
          this.audioEngine.playNote(note, velocity);
          this.activeGeneratorNotes.add(note);
        }
        break;
      }

      case "Melodic Run": {
        // Create an organic random walk along the scale notes
        if (skipStep) break;

        const currentIndex = scaleNotes.indexOf(this.lastMelodyMidi);
        let nextIndex = currentIndex === -1 ? 3 : currentIndex;

        // Walk up/down by 1 or 2 scale steps
        const stepSize = Math.random() > 0.6 ? 2 : 1;
        const direction = Math.random() > 0.5 ? 1 : -1;
        nextIndex = nextIndex + direction * stepSize;

        // Wrap or clamp index safely
        if (nextIndex < 0) nextIndex = scaleNotes.length - 1 + nextIndex;
        if (nextIndex >= scaleNotes.length) nextIndex = nextIndex % scaleNotes.length;

        const note = scaleNotes[nextIndex];
        this.lastMelodyMidi = note;
        const velocity = Math.floor(85 + Math.random() * 30);

        this.audioEngine.playNote(note, velocity);
        this.activeGeneratorNotes.add(note);

        // Randomly play a sub-bass foundation
        if (this.stepIndex % 4 === 0) {
          const bassNote = bassScaleNotes[0] - 12;
          this.audioEngine.playNote(bassNote, 95);
          this.activeGeneratorNotes.add(bassNote);
        }
        break;
      }

      case "Random Ambient": {
        // Spacey, slow melodic tones
        if (Math.random() > 0.5) break; // More sparse spacing

        const randNoteIdx = Math.floor(Math.random() * scaleNotes.length);
        const note = scaleNotes[randNoteIdx] + (Math.random() > 0.7 ? 12 : 0); // High bell accents
        const velocity = Math.floor(60 + Math.random() * 40);

        this.audioEngine.playNote(note, velocity);
        this.activeGeneratorNotes.add(note);

        // Ambient sub bass drone
        if (Math.random() > 0.7) {
          const bassNote = bassScaleNotes[Math.floor(Math.random() * bassScaleNotes.length)] - 24;
          this.audioEngine.playNote(bassNote, 70);
          this.activeGeneratorNotes.add(bassNote);
        }
        break;
      }
    }

    // Increment step trackers
    this.stepIndex++;
    
    // Change chord chord index every 4-8 beats for chord progression movement
    if (this.stepIndex % 4 === 0) {
      this.chordIndex++;
    }
  }
}
