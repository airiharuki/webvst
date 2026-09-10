# Contributing to SPECTRA.OSC 🎛️✨

First off: **welcome!** We are so thrilled and grateful that you're here. 

Whether you're an audio DSP wizard, a React nerd, a bedroom synth hobbyist who just made a killer bass patch, or someone hunting down their very first open-source typo fix — **your contributions are deeply appreciated and celebrated here.**

No contribution is too small!

---

## 💖 Community Values

We want this project to be a welcoming, kind, and inspiring playground for everyone. We believe in:
- **Kindness & Respect:** Treat everyone with empathy, patience, and warmth. We were all beginners once.
- **Curiosity:** Ask questions freely! Wondering why a hyperbolic tangent curve was used for the drive filter? Ask away!
- **Constructive Collaboration:** Critique ideas and code with encouragement, never condescension.

---

## 🚀 Ways You Can Contribute

You don't need to write complex Web Audio algorithms to help out! Here are plenty of fantastic ways to get involved:

### 1. 🎹 Craft & Share Synth Presets
Crafted a lush ambient pad or an aggressive industrial bass? You can contribute your presets right into `src/data/presets.ts`!
- Give it a memorable name and category (`Lead`, `Bass`, `Pad`, `Pluck`, `FX`, `Experimental`).
- Provide balanced volume, envelope, and filter settings so it sounds glorious right out of the box.

### 2. 🧮 Audio Engine & DSP Improvements
- Add new filter modes (e.g., Comb filters, Ladder lowpass, Bitcrusher).
- Optimize oscillator allocations and voice cleanup.
- Enhance the Fourier transform / additive synthesis table calculations.
- Introduce new scale types or generative algorithmic sequence patterns into `src/lib/midiGenerator.ts`.

### 3. 🎨 UI / UX & Visualizer Enhancements
- Tweak the hardware oscilloscope & spectrum canvas renderers.
- Improve rotary knob touch/mouse tracking ergonomics.
- Boost accessibility (ARIA labels, keyboard navigation, contrast ratios).

### 4. 📝 Documentation & Guides
- Improve this guide or the in-app manual.
- Clarify synthesis theory for beginners.
- Fix grammar, typos, or unclear explanations.

---

## 🛠️ Local Development Setup

Getting the project running locally takes less than two minutes:

1. **Fork & Clone** the repository:
   ```bash
   git clone https://github.com/airiharuki/webvst.git
   cd webvst
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Fire up the Development Server**:
   ```bash
   npm run dev
   ```

4. Open your browser at [http://localhost:3000](http://localhost:3000). 
   *Note: Click anywhere or tap a key (like `A`, `S`, `D`) to initialize the browser's Web Audio context.*

5. **Run Linting & Type Checking**:
   ```bash
   npm run lint
   ```

6. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🌿 Making a Pull Request (PR)

1. **Create a topic branch**:
   ```bash
   git checkout -b feature/cyberpunk-ladder-filter
   ```
2. **Commit your changes with clear, friendly messages**:
   ```bash
   git commit -m "feat(dsp): add Moog-style 4-pole ladder filter algorithm"
   ```
3. **Check your build**:
   Make sure `npm run lint` and `npm run build` pass without any warnings or errors.
4. **Push to your fork and open a Pull Request**:
   Tell us what you built, why you made it, and what it sounds or looks like! Feel free to include audio clips or screenshots if applicable.

---

## ☕ Need Help or Stuck?

Never hesitate to open an issue or start a discussion. If you're encountering an audio glitch, a TypeScript compiler head-scratcher, or just need advice on how to implement an idea, reach out! We're here to learn and build together.

Thank you for bringing your sound, creativity, and energy to **SPECTRA.OSC**! 🎶
