import React, { useState } from 'react';
import {
  Flame,
  Volume2,
  Cpu,
  Zap,
  BatteryCharging,
  Keyboard,
  Usb,
  Shield,
  Gauge,
  Activity,
  Code2,
  Terminal,
  Download,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useNitroSimulation } from './hooks/useNitroSimulation';
import { RadialGaugeCanvas } from './components/RadialGaugeCanvas';
import { TelemetryGraphCanvas } from './components/TelemetryGraphCanvas';
import { PowerLimitControls } from './components/PowerLimitControls';
import { PidFanControllerPanel } from './components/PidFanControllerPanel';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import { TerminalConsole } from './components/TerminalConsole';
import { ArchHyprlandBar } from './components/ArchHyprlandBar';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'power_pid' | 'code' | 'terminal'>('dashboard');
  const [isArabic, setIsArabic] = useState<boolean>(true);

  const {
    telemetry,
    pidConfig,
    workload,
    setWorkload,
    isSocketConnected,
    terminalLogs,
    cpuHistory,
    gpuHistory,
    powerHistory,
    setPowerLimits,
    setThermalProfile,
    setFanMode,
    setManualFans,
    setPidTuning,
    toggleBatteryLimit,
    toggleKeyboardTimeout,
    toggleUsbCharging,
    toggleSocketConnection,
  } = useNitroSimulation();

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col font-sans selection:bg-[#1793d1]/30 selection:text-white">
      {/* Wayland / Hyprland Bar */}
      <ArchHyprlandBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workload={workload}
        setWorkload={setWorkload}
        isSocketConnected={isSocketConnected}
        toggleSocket={toggleSocketConnection}
        isArabic={isArabic}
        setIsArabic={setIsArabic}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Arabic Welcome & Architecture Overview Banner */}
        {isArabic && (
          <div className="rounded-lg border border-slate-800 bg-[#0e121a] p-4 text-xs leading-relaxed text-slate-300">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1793d1]/10 border border-[#1793d1]/30 text-[#1793d1] shrink-0 mt-0.5">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h2 className="font-bold text-sm text-white">
                  مشروع NitroArch-Sense: بنية التحكم في عتاد Acer Nitro على نظام Arch Linux (Wayland / Hyprland)
                </h2>
                <p>
                  تم تسليم المشروع بالكامل عبر بنية مزدوجة الصلاحيات: <strong>nitro-daemon</strong> (محرك C++20 يعمل كخدمة جذر في الخلفية عبر مقبس <code>/run/nitroarch.sock</code>) و <strong>nitro-ui</strong> (تطبيق Qt6/QML للمستخدم العادي).
                  تم تزويد المحرك بميزة <strong>التحكم بحدود طاقة المعالج PL1 و PL2</strong> عبر Intel RAPL و MSR 0x610، مع <strong>محرك PID ذاتي متطور</strong> يوازن التبريد والراحة الصوتية ويعمل بشكل متواصل ومستقل حتى عند إغلاق الواجهة!
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                  <span className="text-[#1793d1]">● C++20 & POSIX Sockets</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-[#ff9900]">● Intel RAPL (PL1/PL2 Safeties)</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-[#ff003c]">● Autonomous Dual-Loop PID Fans</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-emerald-400">● 21 ملفاً كاملاً جاهزة للتجميع</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MAIN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Top Gauges and Key Metrics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Dual Gauges Card */}
              <div className="lg:col-span-7 rounded-lg border border-slate-800 bg-[#0f121a] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    REAL-TIME THERMAL TELEMETRY & FAN RPM
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    500ms Non-blocking Poll
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-around gap-4 py-2">
                  <RadialGaugeCanvas
                    title="Intel Core CPU"
                    value={telemetry.cpuTemp}
                    maxValue={105}
                    unit="°C"
                    subValue={telemetry.fanCpuRpm}
                    subUnit="RPM"
                    accentColor="#1793d1"
                    size={190}
                  />

                  <RadialGaugeCanvas
                    title="NVIDIA RTX GPU"
                    value={telemetry.gpuTemp}
                    maxValue={100}
                    unit="°C"
                    subValue={telemetry.fanGpuRpm}
                    subUnit="RPM"
                    accentColor="#ff003c"
                    size={190}
                  />
                </div>

                {/* Sub gauges info */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#1793d1]" />
                    <span>Fan 1 (CPU): {telemetry.fanCpuPct}% ({telemetry.fanCpuRpm} RPM)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#ff003c]" />
                    <span>Fan 2 (GPU): {telemetry.fanGpuPct}% ({telemetry.fanGpuRpm} RPM)</span>
                  </div>
                </div>
              </div>

              {/* System Metrics 4-Pack Grid */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {/* Metric 1: CPU Package Power & PL1 */}
                <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono text-[11px]">CPU POWER</span>
                    <Zap className="h-3.5 w-3.5 text-[#1793d1]" />
                  </div>
                  <div className="my-1">
                    <div className="font-mono text-2xl font-bold text-white tabular-nums">
                      {telemetry.cpuPowerWatts} <span className="text-xs font-normal text-slate-400">W</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Cap: PL1 {telemetry.cpuPl1Watts}W · PL2 {telemetry.cpuPl2Watts}W
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#1793d1] transition-all duration-500"
                      style={{ width: `${Math.min(100, (telemetry.cpuPowerWatts / telemetry.cpuPl1Watts) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 2: GPU Power & VRAM */}
                <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono text-[11px]">GPU POWER</span>
                    <Flame className="h-3.5 w-3.5 text-[#ff003c]" />
                  </div>
                  <div className="my-1">
                    <div className="font-mono text-2xl font-bold text-white tabular-nums">
                      {telemetry.gpuPowerWatts} <span className="text-xs font-normal text-slate-400">W</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Clocks: {telemetry.gpuClockGraphics} MHz GFX
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#ff003c] transition-all duration-500"
                      style={{ width: `${Math.min(100, (telemetry.gpuPowerWatts / 115) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metric 3: CPU Usage & Frequency */}
                <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono text-[11px]">CPU LOAD</span>
                    <Cpu className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                  <div className="my-1">
                    <div className="font-mono text-2xl font-bold text-white tabular-nums">
                      {telemetry.cpuUsage} <span className="text-xs font-normal text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Freq: {(telemetry.cpuFreqMhz / 1000).toFixed(2)} GHz
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-500"
                      style={{ width: `${telemetry.cpuUsage}%` }}
                    />
                  </div>
                </div>

                {/* Metric 4: RAM Usage */}
                <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono text-[11px]">RAM MEMORY</span>
                    <Activity className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <div className="my-1">
                    <div className="font-mono text-2xl font-bold text-white tabular-nums">
                      {telemetry.ramUsedGb.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ {telemetry.ramTotalGb} GB</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      VRAM: {telemetry.gpuVramUsedMb} / {telemetry.gpuVramTotalMb} MB
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${(telemetry.ramUsedGb / telemetry.ramTotalGb) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Thermal Profile Switcher Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'quiet',
                  title: 'Quiet / Eco',
                  desc: 'Silent acoustic dampening, PL1 capped at 25W',
                  color: '#1793d1',
                  watts: '25W PL1',
                },
                {
                  id: 'balanced',
                  title: 'Balanced',
                  desc: 'Autonomous PID dynamic curve, PL1 at 45W',
                  color: '#ff9900',
                  watts: '45W PL1',
                },
                {
                  id: 'turbo',
                  title: 'Turbo CoolBoost',
                  desc: '100% full fan RPM (~5800 RPM), PL1 unlocked to 75W',
                  color: '#ff003c',
                  watts: '75W PL1',
                },
              ].map((p) => {
                const isActive = telemetry.thermalProfile === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setThermalProfile(p.id as any)}
                    className={`rounded-lg p-4 text-left border transition-all ${
                      isActive
                        ? 'bg-[#141b29] border-2 shadow-lg'
                        : 'bg-[#0f121a] border-slate-800 hover:border-slate-700'
                    }`}
                    style={{ borderColor: isActive ? p.color : undefined }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-bold text-white">
                        {p.title}
                      </span>
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-mono font-bold"
                        style={{ backgroundColor: `${p.color}25`, color: p.color }}
                      >
                        {p.watts}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Quick Fan & Hardware Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Battery Limit 80% */}
              <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BatteryCharging className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">
                      80% BATTERY CARE LIMIT
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Preserves battery cell health when plugged in
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleBatteryLimit}
                  className={`h-6 w-11 rounded-full transition-colors relative p-0.5 ${
                    telemetry.batteryLimit80 ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      telemetry.batteryLimit80 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Keyboard Backlight 30s Timeout */}
              <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="h-5 w-5 text-sky-400" />
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">
                      KEYBOARD 30s TIMEOUT
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Dims RGB backlight when keyboard is idle
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleKeyboardTimeout}
                  className={`h-6 w-11 rounded-full transition-colors relative p-0.5 ${
                    telemetry.kbBacklightTimeout ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      telemetry.kbBacklightTimeout ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Power-off USB Charging */}
              <div className="rounded-lg border border-slate-800 bg-[#0f121a] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Usb className="h-5 w-5 text-[#ff9900]" />
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">
                      POWER-OFF USB CHARGING
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Keep USB port powered when laptop is sleeping
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleUsbCharging}
                  className={`h-6 w-11 rounded-full transition-colors relative p-0.5 ${
                    telemetry.usbPowerOffCharging ? 'bg-[#ff9900]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      telemetry.usbPowerOffCharging ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 60-Second Real-Time Telemetry Graph */}
            <TelemetryGraphCanvas
              cpuHistory={cpuHistory}
              gpuHistory={gpuHistory}
              powerHistory={powerHistory}
              height={140}
            />
          </div>
        )}

        {/* TAB 2: POWER LIMITS & PID FAN CONTROLLER */}
        {activeTab === 'power_pid' && (
          <div className="space-y-5">
            {/* CPU Power Limits Control Panel */}
            <PowerLimitControls
              pl1Watts={telemetry.cpuPl1Watts}
              pl2Watts={telemetry.cpuPl2Watts}
              currentPowerWatts={telemetry.cpuPowerWatts}
              onSetLimits={setPowerLimits}
            />

            {/* Autonomous PID Fan Engine Panel */}
            <PidFanControllerPanel
              pidConfig={pidConfig}
              telemetry={telemetry}
              onUpdatePid={setPidTuning}
              onSetFanMode={setFanMode}
              onSetManualFans={setManualFans}
            />
          </div>
        )}

        {/* TAB 3: CODEBASE REPOSITORY EXPLORER & ZIP EXPORTER */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <CodeExplorerModal />
          </div>
        )}

        {/* TAB 4: LINUX TERMINAL & IPC SOCKET CONSOLE */}
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            <TerminalConsole logs={terminalLogs} telemetry={telemetry} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#090b10] px-4 py-3 text-xs text-slate-400">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">NitroArch-Sense</span>
            <span>·</span>
            <span>Arch Linux (Wayland / Hyprland) Hardware Suite</span>
            <span>·</span>
            <span>C++20 Root Daemon & Qt6 QML</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Status: <strong className="text-emerald-400">Production-Grade</strong></span>
            <span>IPC Socket: <strong className="text-slate-200">/run/nitroarch.sock</strong></span>
            <span>MSR: <strong className="text-slate-200">0x610 (PL1/PL2)</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
