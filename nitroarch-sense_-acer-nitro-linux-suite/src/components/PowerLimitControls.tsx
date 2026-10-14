import React, { useState } from 'react';
import { Zap, ShieldAlert, Cpu, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface PowerLimitControlsProps {
  pl1Watts: number;
  pl2Watts: number;
  currentPowerWatts: number;
  onSetLimits: (pl1: number, pl2: number) => void;
}

export const PowerLimitControls: React.FC<PowerLimitControlsProps> = ({
  pl1Watts,
  pl2Watts,
  currentPowerWatts,
  onSetLimits,
}) => {
  const [localPl1, setLocalPl1] = useState(pl1Watts);
  const [localPl2, setLocalPl2] = useState(pl2Watts);
  const [showInspector, setShowInspector] = useState(false);

  // Sync when prop changes externally (e.g. from profile presets)
  React.useEffect(() => {
    setLocalPl1(pl1Watts);
  }, [pl1Watts]);

  React.useEffect(() => {
    setLocalPl2(pl2Watts);
  }, [pl2Watts]);

  const handlePl1Change = (val: number) => {
    const clampedPl1 = Math.max(15, Math.min(90, val));
    let nextPl2 = localPl2;
    if (nextPl2 < clampedPl1) {
      nextPl2 = clampedPl1;
      setLocalPl2(nextPl2);
    }
    setLocalPl1(clampedPl1);
    onSetLimits(clampedPl1, nextPl2);
  };

  const handlePl2Change = (val: number) => {
    const clampedPl2 = Math.max(25, Math.min(135, val));
    let nextPl1 = localPl1;
    if (clampedPl2 < nextPl1) {
      nextPl1 = clampedPl2;
      setLocalPl1(nextPl1);
    }
    setLocalPl2(clampedPl2);
    onSetLimits(nextPl1, clampedPl2);
  };

  const applyPreset = (p1: number, p2: number) => {
    setLocalPl1(p1);
    setLocalPl2(p2);
    onSetLimits(p1, p2);
  };

  // Calculate simulated MSR 0x610 hex value
  const powerUnit = 0.125; // Standard Intel RAPL power unit (1/8 W)
  const rawPl1 = Math.round(localPl1 / powerUnit);
  const rawPl2 = Math.round(localPl2 / powerUnit);
  const msrHigh = ((rawPl2 & 0x7fff) | (1 << 15) | (1 << 16)).toString(16).padStart(8, '0');
  const msrLow = ((rawPl1 & 0x7fff) | (1 << 15) | (1 << 16)).toString(16).padStart(8, '0');
  const msrFullHex = `0x${msrHigh.toUpperCase()}${msrLow.toUpperCase()}`;

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-4 text-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#ff9900]" />
          <div>
            <h3 className="font-mono text-sm font-bold text-white tracking-wide">
              CPU PACKAGE POWER LIMIT CONTROL (PL1 & PL2)
            </h3>
            <p className="text-xs text-slate-400">
              Direct Intel RAPL sysfs constraints & MSR 0x610 package registers
            </p>
          </div>
        </div>

        {/* Current status indicators */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded bg-slate-900 px-2.5 py-1 border border-slate-800">
            <span className="text-slate-400">Draw:</span>
            <span className="font-mono font-bold text-white tabular-nums">
              {currentPowerWatts} W
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded bg-emerald-950/60 px-2.5 py-1 border border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px]">Hardware Safeguards Active</span>
          </div>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="my-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400 font-medium">Power Presets:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => applyPreset(25, 45)}
            className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
              localPl1 === 25 && localPl2 === 45
                ? 'bg-[#1793d1] text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Quiet Eco (25W/45W)
          </button>
          <button
            onClick={() => applyPreset(45, 80)}
            className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
              localPl1 === 45 && localPl2 === 80
                ? 'bg-[#ff9900] text-black font-bold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Balanced Stock (45W/80W)
          </button>
          <button
            onClick={() => applyPreset(65, 105)}
            className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
              localPl1 === 65 && localPl2 === 105
                ? 'bg-[#ff003c] text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Performance (65W/105W)
          </button>
          <button
            onClick={() => applyPreset(85, 135)}
            className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
              localPl1 === 85 && localPl2 === 135
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Extreme TDP (85W/135W)
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        {/* PL1 Control */}
        <div className="rounded-md border border-slate-800/90 bg-[#121622] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="font-mono text-xs font-bold text-[#1793d1]">PL1 (SUSTAINED TDP)</span>
              <p className="text-[11px] text-slate-400">Long-duration continuous thermal envelope</p>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <input
                type="number"
                min={15}
                max={90}
                value={localPl1}
                onChange={(e) => handlePl1Change(Number(e.target.value))}
                className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-right font-mono text-sm font-bold text-white focus:border-[#1793d1] focus:outline-none"
              />
              <span className="text-xs font-semibold text-slate-400">W</span>
            </div>
          </div>

          <input
            type="range"
            min={15}
            max={90}
            step={1}
            value={localPl1}
            onChange={(e) => handlePl1Change(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-[#1793d1]"
          />

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Safety Min: 15W</span>
            <span className="text-slate-500">Default: 45W</span>
            <span>Safety Max: 90W</span>
          </div>
        </div>

        {/* PL2 Control */}
        <div className="rounded-md border border-slate-800/90 bg-[#121622] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="font-mono text-xs font-bold text-[#ff003c]">PL2 (BURST TURBO TDP)</span>
              <p className="text-[11px] text-slate-400">Short-duration turbo boost (Tau ~15-28s)</p>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <input
                type="number"
                min={25}
                max={135}
                value={localPl2}
                onChange={(e) => handlePl2Change(Number(e.target.value))}
                className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-right font-mono text-sm font-bold text-white focus:border-[#ff003c] focus:outline-none"
              />
              <span className="text-xs font-semibold text-slate-400">W</span>
            </div>
          </div>

          <input
            type="range"
            min={25}
            max={135}
            step={1}
            value={localPl2}
            onChange={(e) => handlePl2Change(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-[#ff003c]"
          />

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Safety Min: 25W</span>
            <span className="text-slate-500">Default: 80W</span>
            <span>Safety Max: 135W</span>
          </div>
        </div>
      </div>

      {/* Safety Invariant Notice */}
      <div className="flex items-center justify-between rounded bg-slate-900/90 px-3 py-2 text-xs border border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldAlert className="h-4 w-4 text-[#ff9900] shrink-0" />
          <span>
            Thermal Invariant Enforced: <strong className="text-white font-mono">PL2 ({localPl2}W) ≥ PL1 ({localPl1}W)</strong>. Daemon automatically clamps values to prevent brownouts.
          </span>
        </div>
        <button
          onClick={() => setShowInspector(!showInspector)}
          className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <span>{showInspector ? 'Hide Registers' : 'Inspect Registers'}</span>
          {showInspector ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expandable Linux sysfs & MSR Inspector */}
      {showInspector && (
        <div className="mt-3 rounded border border-slate-800 bg-[#0a0c12] p-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Cpu className="h-3.5 w-3.5 text-[#1793d1]" />
            <span className="font-bold text-slate-300">LINUX KERNEL INTERFACES & REGISTERS</span>
          </div>
          <div className="space-y-1.5 text-slate-400">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Sysfs PL1 node:</span>
              <span className="text-emerald-400">/sys/class/powercap/intel-rapl/intel-rapl:0/constraint_0_power_limit_uw</span>
              <span className="text-white">{localPl1 * 1000000} µW</span>
            </div>
            <div className="flex flex-wrap items-center justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Sysfs PL2 node:</span>
              <span className="text-emerald-400">/sys/class/powercap/intel-rapl/intel-rapl:0/constraint_1_power_limit_uw</span>
              <span className="text-white">{localPl2 * 1000000} µW</span>
            </div>
            <div className="flex flex-wrap items-center justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">MSR Register 0x610 (MSR_PKG_POWER_LIMIT):</span>
              <span className="text-[#ff9900]">{msrFullHex}</span>
              <span className="text-slate-400">Clamped & Locked</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
