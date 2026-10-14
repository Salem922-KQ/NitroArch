import React, { useEffect, useRef } from 'react';

interface TelemetryGraphCanvasProps {
  cpuHistory: number[];
  gpuHistory: number[];
  powerHistory: number[];
  height?: number;
}

export const TelemetryGraphCanvas: React.FC<TelemetryGraphCanvasProps> = ({
  cpuHistory,
  gpuHistory,
  powerHistory,
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Grid lines (3 horizontal levels: 25%, 50%, 75%)
    ctx.strokeStyle = '#181d28';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = height * (i / 4.0);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#475569';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`${100 - i * 25}°C`, 6, y - 3);
    }

    const drawSeries = (series: number[], color: string, maxVal = 100, isDashed = false) => {
      if (series.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (isDashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);

      const step = width / (series.length - 1);
      for (let i = 0; i < series.length; i++) {
        const x = i * step;
        const normalized = Math.max(0, Math.min(100, (series[i] / maxVal) * 100));
        const y = height - (normalized / 100) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Add gentle gradient fill below the main line
      if (!isDashed) {
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `${color}25`);
        gradient.addColorStop(1, `${color}00`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    // Draw series
    drawSeries(cpuHistory, '#1793d1'); // Arch Cyan for CPU Temp
    drawSeries(gpuHistory, '#ff003c'); // Nitro Crimson for GPU Temp
    drawSeries(powerHistory, '#ff9900', 140, true); // Amber Dashed for CPU Watts
  }, [cpuHistory, gpuHistory, powerHistory, height]);

  return (
    <div className="relative w-full rounded-md border border-slate-800 bg-[#0d1017] p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold tracking-wide text-slate-300">
            REAL-TIME TELEMETRY (60 SECONDS)
          </span>
          <span className="text-[10px] text-slate-500">500ms Non-blocking POSIX IPC</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1793d1]" />
            <span className="font-medium text-slate-300">CPU Temp</span>
            <span className="font-mono text-slate-400">
              {cpuHistory[cpuHistory.length - 1]}°C
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ff003c]" />
            <span className="font-medium text-slate-300">GPU Temp</span>
            <span className="font-mono text-slate-400">
              {gpuHistory[gpuHistory.length - 1]}°C
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-dashed border-[#ff9900]" />
            <span className="font-medium text-slate-300">CPU Power</span>
            <span className="font-mono text-slate-400">
              {powerHistory[powerHistory.length - 1]}W
            </span>
          </div>
        </div>
      </div>
      <div className="relative w-full" style={{ height }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
};
