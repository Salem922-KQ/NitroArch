import React, { useEffect, useRef } from 'react';

interface RadialGaugeProps {
  title: string;
  value: number;
  maxValue?: number;
  unit: string;
  subValue: number;
  subUnit: string;
  accentColor: string;
  secondaryColor?: string;
  size?: number;
}

export const RadialGaugeCanvas: React.FC<RadialGaugeProps> = ({
  title,
  value,
  maxValue = 100,
  unit,
  subValue,
  subUnit,
  accentColor,
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animatedValueRef = useRef(value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Smooth interpolation towards current value
      animatedValueRef.current += (value - animatedValueRef.current) * 0.15;
      const currentVal = animatedValueRef.current;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 18;
      const startAngle = 0.75 * Math.PI;
      const totalAngle = 1.5 * Math.PI;

      // 1. Background Track
      ctx.beginPath();
      ctx.strokeStyle = '#181d28';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.arc(cx, cy, radius, startAngle, startAngle + totalAngle);
      ctx.stroke();

      // 2. Active Arc
      const pct = Math.min(Math.max(currentVal / maxValue, 0.0), 1.0);
      const endAngle = startAngle + totalAngle * pct;

      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = accentColor;
      ctx.beginPath();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.stroke();
      ctx.restore();

      // 3. Precision tick marks
      const numTicks = 28;
      for (let i = 0; i <= numTicks; i++) {
        const tickAngle = startAngle + totalAngle * (i / numTicks);
        const isMajor = i % 7 === 0;
        const tickLength = isMajor ? 8 : 4;
        const r1 = radius + 9;
        const r2 = r1 + tickLength;

        const x1 = cx + r1 * Math.cos(tickAngle);
        const y1 = cy + r1 * Math.sin(tickAngle);
        const x2 = cx + r2 * Math.cos(tickAngle);
        const y2 = cy + r2 * Math.sin(tickAngle);

        ctx.beginPath();
        ctx.strokeStyle = isMajor ? '#475569' : '#232936';
        ctx.lineWidth = isMajor ? 1.5 : 1;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Check if we need to continue smoothing
      if (Math.abs(value - currentVal) > 0.1) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, maxValue, accentColor, size]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="pointer-events-none absolute inset-0"
      />
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div className="flex items-baseline gap-0.5 my-0.5">
          <span className="font-mono text-3xl font-extrabold tracking-tight text-white tabular-nums">
            {Math.round(value)}
          </span>
          <span className="text-xs font-semibold text-slate-400">{unit}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="font-mono text-xs font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            {Math.round(subValue)}
          </span>
          <span className="text-[10px] font-medium text-slate-400">{subUnit}</span>
        </div>
      </div>
    </div>
  );
};
