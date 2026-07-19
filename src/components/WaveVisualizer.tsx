/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { Activity, Radio, BarChart3 } from "lucide-react";
import { AudioEngine } from "../lib/audioEngine";

interface WaveVisualizerProps {
  audioEngine: AudioEngine | null;
}

export default function WaveVisualizer({ audioEngine }: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [visualMode, setVisualMode] = useState<"oscilloscope" | "spectrum" | "dual">("dual");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Render Loop
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with dark, slightly translucent slate color for beautiful trail motion-blur
      ctx.fillStyle = "rgba(11, 11, 16, 0.25)";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines like a professional hardware oscilloscope
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      
      // Vertical grid
      const gridSpacingX = width / 12;
      for (let x = 0; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal grid
      const gridSpacingY = height / 6;
      for (let y = 0; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center-line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (audioEngine && audioEngine.analyserNode) {
        const bufferLength = audioEngine.analyserNode.frequencyBinCount;
        const timeDataArray = new Uint8Array(bufferLength);
        const freqDataArray = new Uint8Array(bufferLength);

        audioEngine.analyserNode.getByteTimeDomainData(timeDataArray);
        audioEngine.analyserNode.getByteFrequencyData(freqDataArray);

        // --- DRAW SPECTURM ANALYZER ---
        if (visualMode === "spectrum" || visualMode === "dual") {
          const barWidth = (width / bufferLength) * 2.2;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const percent = freqDataArray[i] / 255;
            const barHeight = percent * height * 0.75;

            // Generate gradient for frequencies (cyan to violet)
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, "rgba(6, 182, 212, 0.02)");
            gradient.addColorStop(0.5, "rgba(139, 92, 246, 0.3)");
            gradient.addColorStop(1, "rgba(139, 92, 246, 0.75)");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

            // Subtle glowing caps on frequency peaks
            if (barHeight > 4) {
              ctx.fillStyle = "rgba(167, 139, 250, 0.85)";
              ctx.fillRect(x, height - barHeight, barWidth - 1, 1.5);
            }

            x += barWidth;
          }
        }

        // --- DRAW OSCILLOSCOPE WAVE ---
        if (visualMode === "oscilloscope" || visualMode === "dual") {
          ctx.beginPath();
          ctx.lineWidth = 2.5;

          // Glowing stroke color (cyan)
          ctx.strokeStyle = "rgb(34, 211, 238)";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(6, 182, 212, 0.5)";

          const sliceWidth = width / bufferLength;
          let x = 0;

          // Find zero-crossing to stabilize wave visualization (trigger feature)
          let triggerOffset = 0;
          for (let i = 0; i < bufferLength / 2; i++) {
            if (timeDataArray[i] < 128 && timeDataArray[i + 1] >= 128) {
              triggerOffset = i;
              break;
            }
          }

          for (let i = 0; i < bufferLength - triggerOffset; i++) {
            const v = timeDataArray[i + triggerOffset] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.stroke();
          
          // Reset shadow styles
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
        }
      } else {
        // Draw static standby waves when synth is idle / uninitialized
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const nowMs = Date.now() * 0.005;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + nowMs) * 12 * Math.cos(x * 0.002);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SYNTH IDLE • PRESS ANY KEY TO START AUDIO", width / 2, height - 12);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioEngine, visualMode]);

  return (
    <div className="relative w-full h-44 bg-zinc-950/90 rounded-lg overflow-hidden border border-zinc-800/80 shadow-inner flex flex-col justify-between p-2">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center z-10 px-2 pointer-events-auto">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1.5 font-bold">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Real-time Master DSP Waveforms
        </span>

        {/* Display Mode Selection */}
        <div className="flex bg-zinc-900/90 border border-zinc-800/80 p-0.5 rounded-md text-[10px] font-mono font-medium text-zinc-400">
          <button
            id="vis-mode-oscilloscope"
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              visualMode === "oscilloscope"
                ? "bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/25"
                : "hover:text-zinc-200 border border-transparent"
            }`}
            onClick={() => setVisualMode("oscilloscope")}
          >
            <Radio className="w-3 h-3" />
            Wave
          </button>
          <button
            id="vis-mode-spectrum"
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              visualMode === "spectrum"
                ? "bg-violet-500/10 text-violet-400 font-bold border border-violet-500/25"
                : "hover:text-zinc-200 border border-transparent"
            }`}
            onClick={() => setVisualMode("spectrum")}
          >
            <BarChart3 className="w-3 h-3" />
            FFT Spectrum
          </button>
          <button
            id="vis-mode-dual"
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              visualMode === "dual"
                ? "bg-white/10 text-white font-bold border border-white/10"
                : "hover:text-zinc-200 border border-transparent"
            }`}
            onClick={() => setVisualMode("dual")}
          >
            Dual
          </button>
        </div>
      </div>

      {/* Primary Canvas Drawing Board */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-lg" />

      {/* Frame Details / Aesthetic Corner Markings */}
      <div className="flex justify-between items-end z-10 px-1 pointer-events-none">
        <span className="text-[9px] font-mono text-zinc-600 tracking-tight">
          SAMP-RATE: 44.1k / FFT-SIZE: 512
        </span>
        <span className="text-[9px] font-mono text-zinc-600 tracking-tight">
          VITAL-LINKED DSP • STEREO
        </span>
      </div>
    </div>
  );
}
