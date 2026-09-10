/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";

interface KnobProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  color?: "cyan" | "violet" | "orange" | "emerald";
  unit?: string;
  onChange: (value: number) => void;
  displayFormatter?: (value: number) => string;
}

export default function Knob({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  color = "cyan",
  unit = "",
  onChange,
  displayFormatter
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ y: number; val: number }>({ y: 0, val: 0 });

  // Map values to 0.0 - 1.0 fraction
  const fraction = (value - min) / (max - min);

  // SVG parameters for circular indicator
  const radius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  
  // Angle constraints (matching physical knobs: 270 degrees sweep, starting bottom-left to bottom-right)
  const minAngle = -135;
  const maxAngle = 135;
  const currentAngle = minAngle + fraction * (maxAngle - minAngle);

  // Dashoffset calculation (radial track fill)
  // We want to fill from minAngle to currentAngle
  // 270 degrees of sweep out of 360 = 75% track
  const maxStrokeFill = circumference * 0.75;
  const strokeDashoffset = circumference - fraction * maxStrokeFill;

  // Handle Drag / Slide
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { y: e.clientY, val: value };
    document.body.style.cursor = "ns-resize";
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartRef.current = { y: e.touches[0].clientY, val: value };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartRef.current.y - e.clientY; // Drag UP increases
      // Sensitivity factor: 150px drag covers the full range
      const sensitivity = 150;
      const range = max - min;
      const deltaVal = (deltaY / sensitivity) * range;
      
      let newVal = dragStartRef.current.val + deltaVal;
      newVal = Math.max(min, Math.min(max, newVal));
      
      // Round to nearest step
      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      
      onChange(newVal);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const deltaY = dragStartRef.current.y - e.touches[0].clientY;
      const sensitivity = 150;
      const range = max - min;
      const deltaVal = (deltaY / sensitivity) * range;
      
      let newVal = dragStartRef.current.val + deltaVal;
      newVal = Math.max(min, Math.min(max, newVal));
      
      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      
      onChange(newVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  // Color Mapping
  const colorMap = {
    cyan: {
      track: "stroke-zinc-800",
      active: "stroke-[#00F2FF]",
      text: "text-[#00F2FF]",
      glow: "drop-shadow-[0_0_4px_#00F2FF]",
      indicator: "bg-[#00F2FF] shadow-[0_0_4px_#00F2FF]"
    },
    violet: {
      track: "stroke-zinc-800",
      active: "stroke-[#00F2FF]", // mapped to cyan for SPECTRA.OSC layout
      text: "text-[#00F2FF]",
      glow: "drop-shadow-[0_0_4px_#00F2FF]",
      indicator: "bg-[#00F2FF] shadow-[0_0_4px_#00F2FF]"
    },
    orange: {
      track: "stroke-zinc-800",
      active: "stroke-[#FF3E00]", // neon red
      text: "text-[#FF3E00]",
      glow: "drop-shadow-[0_0_4px_#FF3E00]",
      indicator: "bg-[#FF3E00] shadow-[0_0_4px_#FF3E00]"
    },
    emerald: {
      track: "stroke-zinc-800",
      active: "stroke-[#FF3E00]", // neon red for state variable filter
      text: "text-[#FF3E00]",
      glow: "drop-shadow-[0_0_4px_#FF3E00]",
      indicator: "bg-[#FF3E00] shadow-[0_0_4px_#FF3E00]"
    }
  };

  const colors = colorMap[color];

  // Formatter fallback
  const formatValue = (v: number) => {
    if (displayFormatter) return displayFormatter(v);
    
    // Auto decimal display
    if (step < 0.01) return v.toFixed(3);
    if (step < 0.1) return v.toFixed(2);
    if (step < 1) return v.toFixed(1);
    return Math.round(v).toString();
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 select-none" id={id}>
      {/* Knob Container */}
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative cursor-ns-resize group w-14 h-14 flex items-center justify-center"
      >
        {/* Arc Background Ring & Active Fill */}
        <svg className="w-full h-full rotate-135" viewBox="0 0 54 54">
          {/* Base Background Track Ring (270 degrees sweep) */}
          <circle
            cx="27"
            cy="27"
            r={radius}
            className={`${colors.track} fill-transparent`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25} // covers 270 degrees
            strokeLinecap="round"
          />
          {/* Dynamic Value Arc Fill */}
          <circle
            cx="27"
            cy="27"
            r={radius}
            className={`${colors.active} fill-transparent transition-all duration-75 ${colors.glow}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner Solid Metallic Dial Cap - SPECTRA.OSC look */}
        <div 
          className="absolute w-9 h-9 rounded-full bg-[#0A0A0B] border-2 border-zinc-700 flex items-center justify-center shadow-lg group-hover:border-zinc-500 transition-colors"
          style={{ transform: `rotate(${currentAngle}deg)` }}
        >
          {/* Indicator Dot/Line matching active channel color */}
          <div className={`absolute top-1.5 w-1 h-3 rounded-full origin-bottom ${colors.indicator}`} />
        </div>
      </div>

      {/* Label Text */}
      <span className="text-[9px] font-bold text-zinc-500 mt-1.5 uppercase tracking-[0.1em] font-sans">
        {label}
      </span>

      {/* Numeric Value Readout */}
      <span className={`text-[10px] font-mono mt-0.5 font-bold ${colors.text}`}>
        {formatValue(value)}
        <span className="text-[8px] text-zinc-500 font-normal ml-0.5">{unit}</span>
      </span>
    </div>
  );
}
