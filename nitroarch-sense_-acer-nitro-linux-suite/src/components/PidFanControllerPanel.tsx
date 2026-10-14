import React, { useState } from 'react';
import { Sliders, Activity, Volume2, ShieldCheck, Flame, GitMerge, RotateCcw } from 'lucide-react';
import { PidConfig, TelemetryState } from '../types/nitro';

interface PidFanControllerPanelProps {
  pidConfig: PidConfig;
  telemetry: TelemetryState;
  onUpdatePid: (config: Partial<PidConfig>) => void;
  onSetFanMode: (mode: 'auto' | 'custom' | 'turbo') => void;
  onSetManualFans: (cpu: number, gpu: number) => void;
}

export const PidFanControllerPanel: React.FC<PidFanControllerPanelProps> = ({
  pidConfig,
  telemetry,
  onUpdatePid,
  onSetFanMode,
  onSetManualFans,
}) => {
  const [manualCpu, setManualCpu] = useState(telemetry.fanCpuPct);
  const [manualGpu, setManualGpu] = useState(telemetry.fanGpuPct);
  const [showAdvancedPid, setShowAdvancedPid] = useState(false);

  const handleTargetTempChange = (val: number) => {
    onUpdatePid({ targetTempC: val });
  };

  const handleKpChange = (val: number) => {
    onUpdatePid({ kp: Math.round(val * 10) / 10 });
  };

  const handleKiChange = (val: number) => {
    onUpdatePid({ ki: Math.round(val * 100) / 100 });
  };

  const handleKdChange = (val: number) => {
    onUpdatePid({ kd: Math.round(val * 10) / 10 });
  };

  const handleHysteresisChange = (val: number) => {
    onUpdatePid({ hysteresisSeconds: val });
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-4 text-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#1793d1]" />
          <div>
            <h3 className="font-mono text-sm font-bold text-white tracking-wide">
              AUTONOMOUS DUAL-LOOP PID & ACOUSTIC FAN ENGINE
            </h3>
            <p className="text-xs text-slate-400">
              Continuously runs in root daemon background independently of UI connection
            </p>
          </div>
        </div>

        {/* Fan Mode Selector */}
        <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => onSetFanMode('auto')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-all ${
              telemetry.fanMode === 'auto'
                ? 'bg-[#1793d1] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Autonomous PID
          </button>
          <button
            onClick={() => onSetFanMode('custom')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-all ${
              telemetry.fanMode === 'custom'
                ? 'bg-[#ff9900] text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Override
          </button>
          <button
            onClick={() => onSetFanMode('turbo')}
            className={`px-3 py-1 text-xs font-mono font-medium rounded transition-all ${
              telemetry.fanMode === 'turbo'
                ? 'bg-[#ff003c] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            100% CoolBoost
          </button>
        </div>
      </div>

      {telemetry.fanMode === 'auto' ? (
        <div className="space-y-4 pt-3">
          {/* Target Temperature Setpoint */}
          <div className="rounded-md border border-slate-800 bg-[#121622] p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-xs font-bold text-white">
                  TARGET TEMPERATURE SETPOINT: {pidConfig.targetTempC}°C
                </span>
                <p className="text-[11px] text-slate-400">
                  PID algorithm balances cooling performance against acoustic noise floor
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    telemetry.cpuTemp <= pidConfig.targetTempC
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                  }`}
                >
                  Delta: {telemetry.cpuTemp - pidConfig.targetTempC > 0 ? '+' : ''}
                  {telemetry.cpuTemp - pidConfig.targetTempC}°C
                </span>
              </div>
            </div>

            <input
              type="range"
              min={55}
              max={85}
              step={1}
              value={pidConfig.targetTempC}
              onChange={(e) => handleTargetTempChange(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-[#1793d1]"
            />

            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Quiet (60°C - Low noise)</span>
              <span>Balanced (70°C - Optimal)</span>
              <span>High TDP (80°C - Max Boost)</span>
            </div>
          </div>

          {/* Live PID Diagnostic Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded border border-slate-800/80 bg-slate-900/60 p-2 text-center">
              <span className="text-[10px] font-mono text-slate-400">Error e(t)</span>
              <div className="font-mono text-sm font-bold text-white">
                {telemetry.pidErrorCpu > 0 ? '+' : ''}
                {telemetry.pidErrorCpu}°C
              </div>
              <span className="text-[9px] text-slate-500">T - T_target</span>
            </div>

            <div className="rounded border border-slate-800/80 bg-slate-900/60 p-2 text-center">
              <span className="text-[10px] font-mono text-[#1793d1]">P-Term (Kp·e)</span>
              <div className="font-mono text-sm font-bold text-[#1793d1]">
                {telemetry.pidPTermCpu > 0 ? '+' : ''}
                {telemetry.pidPTermCpu}%
              </div>
              <span className="text-[9px] text-slate-500">Instant Reaction</span>
            </div>

            <div className="rounded border border-slate-800/80 bg-slate-900/60 p-2 text-center">
              <span className="text-[10px] font-mono text-[#ff9900]">I-Term (Ki·∫e)</span>
              <div className="font-mono text-sm font-bold text-[#ff9900]">
                {telemetry.pidITermCpu > 0 ? '+' : ''}
                {telemetry.pidITermCpu}%
              </div>
              <span className="text-[9px] text-slate-500">Steady State Bias</span>
            </div>

            <div className="rounded border border-slate-800/80 bg-slate-900/60 p-2 text-center">
              <span className="text-[10px] font-mono text-[#ff003c]">D-Term (Kd·de/dt)</span>
              <div className="font-mono text-sm font-bold text-[#ff003c]">
                {telemetry.pidDTermCpu > 0 ? '+' : ''}
                {telemetry.pidDTermCpu}%
              </div>
              <span className="text-[9px] text-slate-500">Spike Dampening</span>
            </div>
          </div>

          {/* Coupling and Hysteresis Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Cross Coupling */}
            <div className="flex items-center justify-between rounded border border-slate-800/90 bg-[#121622] p-3">
              <div className="flex items-start gap-2.5">
                <GitMerge className="h-4 w-4 text-[#ff9900] mt-0.5 shrink-0" />
                <div>
                  <span className="font-mono text-xs font-bold text-white">
                    Shared Heatpipe Cross-Coupling
                  </span>
                  <p className="text-[10px] text-slate-400">
                    CPU & GPU fans assist each other over shared copper vapor blocks
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pidConfig.crossCoupling}
                onChange={(e) => onUpdatePid({ crossCoupling: e.target.checked })}
                className="h-4 w-4 cursor-pointer accent-[#ff9900]"
              />
            </div>

            {/* Acoustic Hysteresis Ramp Limiter */}
            <div className="flex items-center justify-between rounded border border-slate-800/90 bg-[#121622] p-3">
              <div className="flex items-start gap-2.5">
                <Volume2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-mono text-xs font-bold text-white">
                    Acoustic Hysteresis: {pidConfig.hysteresisSeconds}s Delay
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Prevents annoying fan hunting and motor whine during oscillating loads
                  </p>
                </div>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                step={1}
                value={pidConfig.hysteresisSeconds}
                onChange={(e) => handleHysteresisChange(Number(e.target.value))}
                className="w-24 cursor-pointer appearance-none rounded bg-slate-700 accent-emerald-400"
              />
            </div>
          </div>

          {/* Hysteresis Active Status Notice */}
          {telemetry.hysteresisActive && (
            <div className="flex items-center gap-2 rounded bg-emerald-950/40 border border-emerald-700/50 px-3 py-1.5 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Acoustic Hold Engaged:</strong> Maintaining fan RPM to prevent sudden pitch change while CPU cools down.
              </span>
            </div>
          )}

          {/* Advanced PID Tuning Accordion */}
          <div className="border-t border-slate-800/80 pt-2">
            <button
              onClick={() => setShowAdvancedPid(!showAdvancedPid)}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{showAdvancedPid ? 'Hide PID Coefficients (Kp, Ki, Kd)' : 'Tune PID Coefficients (Kp, Ki, Kd)'}</span>
            </button>

            {showAdvancedPid && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded bg-slate-900/80 p-3 border border-slate-800">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>Kp (Proportional):</span>
                    <span className="font-bold text-[#1793d1]">{pidConfig.kp}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={4.0}
                    step={0.1}
                    value={pidConfig.kp}
                    onChange={(e) => handleKpChange(Number(e.target.value))}
                    className="w-full accent-[#1793d1]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>Ki (Integral):</span>
                    <span className="font-bold text-[#ff9900]">{pidConfig.ki}</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    value={pidConfig.ki}
                    onChange={(e) => handleKiChange(Number(e.target.value))}
                    className="w-full accent-[#ff9900]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                    <span>Kd (Derivative):</span>
                    <span className="font-bold text-[#ff003c]">{pidConfig.kd}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={5.0}
                    step={0.1}
                    value={pidConfig.kd}
                    onChange={(e) => handleKdChange(Number(e.target.value))}
                    className="w-full accent-[#ff003c]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : telemetry.fanMode === 'custom' ? (
        /* Manual Override Mode */
        <div className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-slate-800 bg-[#121622] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#1793d1]">
                  CPU FAN SPEED: {manualCpu}% (~{Math.round(1800 + (manualCpu / 100) * 4000)} RPM)
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={manualCpu}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setManualCpu(val);
                  onSetManualFans(val, manualGpu);
                }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-[#1793d1]"
              />
            </div>

            <div className="rounded-md border border-slate-800 bg-[#121622] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#ff003c]">
                  GPU FAN SPEED: {manualGpu}% (~{Math.round(1750 + (manualGpu / 100) * 4100)} RPM)
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                value={manualGpu}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setManualGpu(val);
                  onSetManualFans(manualCpu, val);
                }}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-[#ff003c]"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Turbo CoolBoost 100% Mode */
        <div className="pt-3">
          <div className="flex items-center justify-between rounded-md border border-rose-800/80 bg-rose-950/30 p-4">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-[#ff003c] animate-pulse" />
              <div>
                <h4 className="font-mono text-sm font-bold text-white">
                  ACER COOLBOOST ACTIVE (100% / ~5800 RPM)
                </h4>
                <p className="text-xs text-rose-300">
                  Maximum thermal exhaust enabled. Maximum fan RPM overriding all quiet limits.
                </p>
              </div>
            </div>
            <button
              onClick={() => onSetFanMode('auto')}
              className="rounded bg-rose-700 hover:bg-rose-600 px-3 py-1.5 text-xs font-mono font-bold text-white transition-colors"
            >
              Return to Autonomous PID
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
