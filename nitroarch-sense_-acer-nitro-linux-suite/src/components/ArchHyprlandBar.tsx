import React from 'react';
import { Cpu, Activity, Terminal, Code2, Shield, Languages } from 'lucide-react';
import { WorkloadPreset } from '../types/nitro';

interface ArchHyprlandBarProps {
  activeTab: 'dashboard' | 'power_pid' | 'code' | 'terminal';
  setActiveTab: (tab: 'dashboard' | 'power_pid' | 'code' | 'terminal') => void;
  workload: WorkloadPreset;
  setWorkload: (wl: WorkloadPreset) => void;
  isSocketConnected: boolean;
  toggleSocket: () => void;
  isArabic: boolean;
  setIsArabic: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const ArchHyprlandBar: React.FC<ArchHyprlandBarProps> = ({
  activeTab,
  setActiveTab,
  workload,
  setWorkload,
  isSocketConnected,
  toggleSocket,
  isArabic,
  setIsArabic,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#090b10] px-4 py-2.5 text-xs font-mono">
      {/* Brand & Arch Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Stylized Arch Linux Triangle */}
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1793d1]/20 border border-[#1793d1]/40 text-[#1793d1] font-black">
            ▲
          </div>
          <span className="font-bold text-sm tracking-wide text-white">
            NITRO<span className="text-[#1793d1]">ARCH</span>-SENSE
          </span>
        </div>
        <span className="hidden sm:inline-block text-slate-500">|</span>
        <span className="hidden sm:inline-block text-[11px] text-slate-400">
          Acer Nitro 5 / 16 (Hybrid Intel + RTX 40-Series)
        </span>
      </div>

      {/* Hyprland Workspaces / Tabs */}
      <div className="flex items-center gap-1 rounded-md bg-slate-900/90 p-1 border border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#1793d1] text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>1: Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('power_pid')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
            activeTab === 'power_pid'
              ? 'bg-[#ff9900] text-black font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>2: PL1/PL2 & PID Fan</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
            activeTab === 'code'
              ? 'bg-[#10b981] text-black font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>3: Full Codebase (ZIP)</span>
        </button>

        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${
            activeTab === 'terminal'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>4: Terminal IPC</span>
        </button>
      </div>

      {/* Right Controls: Workload Simulator & Socket status */}
      <div className="flex items-center gap-2">
        {/* Workload Generator Selector */}
        <div className="hidden md:flex items-center gap-1 rounded bg-[#10141e] px-2 py-1 border border-slate-800">
          <span className="text-[10px] text-slate-400">Load:</span>
          <select
            value={workload}
            onChange={(e) => setWorkload(e.target.value as WorkloadPreset)}
            className="bg-transparent text-xs text-[#1793d1] font-bold focus:outline-none cursor-pointer"
          >
            <option value="idle" className="bg-slate-900 text-slate-200">Idle (12W)</option>
            <option value="compile" className="bg-slate-900 text-slate-200">Compile Job (45W)</option>
            <option value="gaming" className="bg-slate-900 text-slate-200">Gaming Load (85W)</option>
            <option value="stress" className="bg-slate-900 text-slate-200">Stress Test (115W)</option>
          </select>
        </div>

        {/* Socket status badge */}
        <button
          onClick={toggleSocket}
          title="Click to simulate disconnecting/reconnecting daemon socket"
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs border border-slate-800 transition-colors"
          style={{
            backgroundColor: isSocketConnected ? '#052e16' : '#450a0a',
            borderColor: isSocketConnected ? '#166534' : '#991b1b',
            color: isSocketConnected ? '#4ade80' : '#f87171',
          }}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-bold">
            {isSocketConnected ? 'DAEMON ACTIVE' : 'DISCONNECTED'}
          </span>
        </button>

        {/* Language switch */}
        <button
          onClick={() => setIsArabic((prev) => !prev)}
          className="flex items-center gap-1 rounded bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-200 transition-colors"
        >
          <Languages className="h-3.5 w-3.5" />
          <span>{isArabic ? 'English' : 'عربي'}</span>
        </button>
      </div>
    </header>
  );
};
