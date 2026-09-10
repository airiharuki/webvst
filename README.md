# 🎛️⚡ SPECTRA.OSC // THE BROWSER MELTER 9000 ⚡🎛️

```
   _____ _____  ______ _____ _______ _____            ____   _____ _____ 
  / ____|  __ \|  ____/ ____|__   __|  __ \   /\     / __ \ / ____/ ____|
 | (___ | |__) | |__ | |       | |  | |__) | /  \   | |  | | (___| |     
  \___ \|  ___/|  __| | |       | |  |  _  / / /\ \  | |  | |\___ \| |     
  ____) | |    | |____| |____   | |  | | \ \/ ____ \ | |__| |____) | |____ 
 |_____/|_|    |______\_____|  |_|  |_|  \_\_/    \_(_)____/|_____/ \_____|
                                                                         
      >>> ADVANCED ADDITIVE / WAVETABLE WEB AUDIO DSP ENGINE <<<
```

> **WARNING: EARDRUM INTEGRITY NOTICE**  
> This application contains ungodly amounts of sub-bass, screaming resonant sweeps, and 16-voice unison detune capable of shaking your desk loose from its screws. Start with your master volume at a sensible level before you crank the Drive knob to 11. You have been warned.

---

## 🤯 What On Earth Is This?

**SPECTRA.OSC** is an uncompromising, hardware-inspired, digital additive & wavetable synthesizer running entirely in your browser using pure Web Audio API DSP — zero external audio plugins, zero bloatware, zero latency apologies.

Inspired by modern wavetable behemoths like **Vital** and **Serum**, SPECTRA.OSC gives you raw direct access to Fourier series harmonics, real-time spectral wave-morphing, 16x unison voice multiplication, a hyperbolic tangent waveshaper distortion unit, and an algorithmic generative MIDI sequencer that writes ambient cyber-soundscapes while you sip coffee.

---

## 🔬 The DSP Audio Graph (How the Sausage is Made)

Ever wondered what happens under the hood when you hammer the `C` key? Here is the actual signal path flowing through the Web Audio audio context:

```
  [16-Harmonic Additive Table] ──┐
                                 ▼
                     [PeriodicWave Engine]
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     │                     16x UNISON VOICES                 │
     │  [Osc 1]       [Osc 2]       [Osc 3] ...     [Osc 16] │
     │  (detuned)    (detuned)     (detuned)       (detuned) │
     │      │            │             │               │     │
     │  [Panner 1]   [Panner 2]    [Panner 3] ...  [Panner N]│
     └───────────────────────────┬───────────────────────────┘
                                 │
  [Sub-Oscillator (-1/-2 oct)] ──┼──> [Voice Mixer Gain Node (ADSR #1)]
  [Noise Gen (Pink / White)]  ───┘               │
                                                 ▼
                                   [Multi-Mode SVF Filter] ◄── [Filter ADSR #2]
                                                 │
                                                 ▼
                                  [tanh(x) Waveshaper Drive]
                                                 │
                                                 ▼
                                  [Master Analyser / FFT Scope]
                                                 │
                                                 ▼
                                    [Master Volume & Speakers]
```

### 🧠 Pure Math & DSP Features

1. **🎨 16-Harmonic Interactive Additive Canvas**
   - Grab your mouse, click, and paint all 16 harmonic partials manually!
   - Synthesize everything from pure sinusoidal flutes to aggressive, buzzsaw odd-harmonic organ square waves.
2. **🌀 Spectral Wave-Morphing Engine**
   - Twisting the **Spectral Morph** knob doesn't just filter audio — it physically computes dynamic Fourier phase shifts, combs, and odd-harmonic clipping profiles inside `createPeriodicWave()`.
3. **🔥 Non-Linear Hyperbolic Tangent Waveshaper**
   - The **Drive** control doesn't use cheesy digital gain; it passes your waveform through an oversampled transfer curve calculated via:
     $$\Large f(x) = \frac{\tanh(x \cdot \text{drive})}{\tanh(\text{drive})}$$
   - Silky smooth analog saturation at low values; snarling industrial fur when maxed out.
4. **👥 16-Voice Unison Multiplier**
   - Stack up to 16 individual oscillator nodes *per note*, detuned across cents and panned across the stereo spectrum for that classic wider-than-the-observable-universe supersaw.
5. **🎛️ Dual Independent ADSR Modulators**
   - **Amp ADSR**: Shapes polyphonic volume trajectories with microsecond ramp safety.
   - **Filter ADSR**: Sweeps the cutoff frequency across up to 12,000 Hz with adjustable envelope depth.
6. **🤖 Generative MIDI Matrix**
   - Don't know how to play piano? We got you.
   - Built-in algorithmic generator featuring **Major, Minor, Pentatonic, Dorian, Phrygian, Lydian, Mixolydian, and Blues** scales.
   - Modes: **Up/Down Arpeggios, Chords, Bass + Lead, and Generative Ambient Drift**.
7. **🚨 The PANIC Button**
   - Did you turn resonance to maximum while holding down an 8-note chord with 16-voice unison?
   - Hit **PANIC**. It unconditionally severs all audio connections, purges active node references, and restores auditory peace to the cosmos.

---

## 🎹 Computer Keyboard Mapping

No MIDI keyboard plugged in? No problem. Smash your QWERTY keyboard like a true bedroom producer:

```
  ┌───┬───┐   ┌───┬───┐   ┌───┬───┐       ┌───┬───┐   ┌───┬───┐   ┌───┬───┐
  │ W │ E │   │ T │ Y │   │ U │   │       │ 2 │ 3 │   │ 5 │ 6 │   │ 7 │   │
  │C#4│D#4│   │F#4│G#4│   │A#4│   │  (or) │C#5│D#5│   │F#5│G#5│   │A#5│   │
┌─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┐
│ A │ S │ D │ F │ G │ H │ J │ K │ L │ ; │ Q │ Z │ X │ C │ V │ B │ N │ M │
│C4 │D4 │E4 │F4 │G4 │A4 │B4 │C5 │D5 │E5 │Oct-│Oct+│...                        │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
```

---

## ⚡ Factory Preset Vault

Load these straight from the header dropdown when you need instant inspiration:

| Preset Name | Flavor Profile | Synthesis Architecture |
| :--- | :--- | :--- |
| 🤖 **Cyberpunk 2099** | Face-melting neuro-bass | Saw + Sub + Heavy tanh Drive + Lowpass sweep |
| 🪚 **Supersaw Titan** | 90s Eurodance / Festival anthem | 7-Voice Unison + Wide stereo spread + Detune |
| 🌌 **Ethereal Shimmer** | Interstellar meditation | High spectral morph + Sine harmonics + Slow attack |
| 🧊 **Chiptune Hero** | Nostalgic 8-bit handheld | Pure Square wave + Fast decay + Arpeggiated sequence |
| 🛸 **Alien Resonator**| UFO transmission | Bandpass Filter + Peak Q resonance + White noise |
| 🎷 **Analog Brass** | Vangelis Blade Runner horns | Dual saw + Exponential filter envelope sweep |

---

## 🛠️ Quickstart / Dev Installation

Want to run it locally, inspect the code, or add your own modular synthesis blocks?

```bash
# 1. Clone the repo
git clone https://github.com/airiharuki/webvst.git
cd webvst

# 2. Install dependencies
npm install

# 3. Fire up the high-octane Vite dev server
npm run dev

# 4. Open your browser
open http://localhost:3000
```

---

## 🏛️ Project Directory Blueprint

```
├── src/
│   ├── components/
│   │   ├── FilterControls.tsx     # SVF Biquad filter + ADSR envelope knobs
│   │   ├── Knob.tsx               # Ultra-precise rotary dial control with drag physics
│   │   ├── MidiControls.tsx       # Scale / Key / Pattern algorithmic generator
│   │   ├── OscillatorControls.tsx # 16-Harmonic additive canvas & unison stack
│   │   └── WaveVisualizer.tsx     # Phosphor oscilloscope & FFT spectrum analyzer
│   ├── data/
│   │   └── presets.ts             # Factory sound design library
│   ├── lib/
│   │   ├── audioEngine.ts         # The Web Audio DSP voice allocator & audio graph
│   │   └── midiGenerator.ts       # Music theory scale math & pattern engine
│   ├── types.ts                   # Polyphonic synthesizer type contracts
│   ├── App.tsx                    # Main workstation chassis & keyboard router
│   └── main.tsx                   # React 18 DOM bootstrap
├── CONTRIBUTING.md                # How to contribute without blowing up our git tree
├── LICENSE                        # Apache License 2.0
└── README.md                      # You are here!
```

---

## 📜 License

Licensed under the **Apache License, Version 2.0**.  
See the full [LICENSE](./LICENSE) file for terms and conditions.

---

<p align="center">
  Crafted with excessive amounts of caffeine, mathematical Fourier series, and love for electronic music. 🔊🔥
</p>
