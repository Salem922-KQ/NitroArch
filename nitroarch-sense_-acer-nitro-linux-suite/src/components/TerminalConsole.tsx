import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, Play } from 'lucide-react';
import { TelemetryState } from '../types/nitro';

interface TerminalConsoleProps {
  logs: string[];
  telemetry: TelemetryState;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({ logs, telemetry }) => {
  const [command, setCommand] = useState('');
  const [outputHistory, setOutputHistory] = useState<string[]>([
    'Arch Linux 6.8.9-arch1-1 (x86_64) - Hyprland Wayland Compositor',
    'NitroArch-Sense Socket Terminal Interface initialized.',
    "Type 'help' to view available diagnostic commands or 'socket' to stream IPC packets.",
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputHistory, logs]);

  const handleRunCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = command.trim();
    if (!cmd) return;

    const newOutputs = [`user@archlinux:~$ ${cmd}`];

    switch (cmd.toLowerCase()) {
      case 'help':
        newOutputs.push(
          'Available Commands:',
          '  systemctl status nitro-daemon  - Check systemd root daemon status',
          '  cat /run/nitroarch.sock        - Stream real-time raw JSON telemetry packet',
          '  powercap-info                  - Display Intel RAPL PL1/PL2 constraints',
          '  sensors                        - Display hwmon coretemp and fan RPM telemetry',
          '  nvidia-smi                     - Display RTX GPU temp, power draw, and VRAM',
          '  rdmsr 0x610                    - Read MSR_PKG_POWER_LIMIT hex value',
          '  clear                          - Clear terminal screen'
        );
        break;

      case 'systemctl status nitro-daemon':
        newOutputs.push(
          '● nitro-daemon.service - NitroArch-Sense Hardware Daemon for Acer Nitro',
          '     Loaded: loaded (/etc/systemd/system/nitro-daemon.service; enabled; preset: default)',
          '     Active: active (running) since Wed 2026-10-14 14:02:11 PDT; 34min ago',
          '   Main PID: 8421 (nitro-daemon)',
          '      Tasks: 4 (limit: 18872)',
          '     Memory: 6.8M',
          '        CPU: 1.2% (autonomous 500ms loop)',
          '     CGroup: /system.slice/nitro-daemon.service',
          '             └─8421 /usr/local/bin/nitro-daemon',
          '',
          `[LOG] [PID Engine] Target: 70°C | Current CPU: ${telemetry.cpuTemp}°C | Fan Speed: ${telemetry.fanCpuPct}% (${telemetry.fanCpuRpm} RPM)`,
          `[LOG] [Power] RAPL Package limits enforced: PL1=${telemetry.cpuPl1Watts}W, PL2=${telemetry.cpuPl2Watts}W`
        );
        break;

      case 'cat /run/nitroarch.sock':
      case 'socket':
        newOutputs.push(
          `{"cpuTemp":${telemetry.cpuTemp},"cpuUsage":${telemetry.cpuUsage},"cpuPowerWatts":${telemetry.cpuPowerWatts},"cpuPl1Watts":${telemetry.cpuPl1Watts},"cpuPl2Watts":${telemetry.cpuPl2Watts},"gpuTemp":${telemetry.gpuTemp},"gpuPowerWatts":${telemetry.gpuPowerWatts},"fanCpuRpm":${telemetry.fanCpuRpm},"fanGpuRpm":${telemetry.fanGpuRpm},"fanMode":"${telemetry.fanMode}","thermalProfile":"${telemetry.thermalProfile}","batteryLimit80":${telemetry.batteryLimit80}}`
        );
        break;

      case 'powercap-info':
        newOutputs.push(
          'intel-rapl',
          '  Path: /sys/class/powercap/intel-rapl/intel-rapl:0',
          '  Zone: package-0 (Intel Core i7-13700H)',
          `  Constraint 0 (PL1 - Sustained): ${telemetry.cpuPl1Watts * 1000000} uW (${telemetry.cpuPl1Watts} Watts) [Time Window: 28000000 us]`,
          `  Constraint 1 (PL2 - Burst):     ${telemetry.cpuPl2Watts * 1000000} uW (${telemetry.cpuPl2Watts} Watts) [Time Window: 2440 us]`,
          `  Current Energy Counter:         8742910432 uJ (${telemetry.cpuPowerWatts} W dynamic draw)`
        );
        break;

      case 'sensors':
        newOutputs.push(
          'coretemp-isa-0000',
          'Adapter: ISA adapter',
          `Package id 0:  +${telemetry.cpuTemp}.0°C  (high = +100.0°C, crit = +105.0°C)`,
          `Core 0:        +${telemetry.cpuTemp - 2}.0°C  (high = +100.0°C, crit = +105.0°C)`,
          `Core 1:        +${telemetry.cpuTemp + 1}.0°C  (high = +100.0°C, crit = +105.0°C)`,
          '',
          'acer-wmi-virtual-0',
          'Adapter: Virtual device',
          `fan1 (CPU):    ${telemetry.fanCpuRpm} RPM`,
          `fan2 (GPU):    ${telemetry.fanGpuRpm} RPM`
        );
        break;

      case 'nvidia-smi':
        newOutputs.push(
          '+-----------------------------------------------------------------------------------------+',
          '| NVIDIA-SMI 550.78                 Driver Version: 550.78         CUDA Version: 12.4     |',
          '|-----------------------------------------+------------------------+----------------------+',
          '| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |',
          '| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |',
          '|=========================================+========================+======================|',
          `|   0  NVIDIA GeForce RTX 4060...     Off |   00000000:01:00.0 Off |                  N/A |`,
          `| N/A   ${telemetry.gpuTemp}C    P0             ${telemetry.gpuPowerWatts}W /  115W |    ${telemetry.gpuVramUsedMb}MiB /  ${telemetry.gpuVramTotalMb}MiB |    ${telemetry.gpuUsage}%      Default |`,
          '+-----------------------------------------+------------------------+----------------------+'
        );
        break;

      case 'rdmsr 0x610':
        newOutputs.push('0x00017fff00017fff (Clamped MSR_PKG_POWER_LIMIT package lock bit active)');
        break;

      case 'clear':
        setOutputHistory([]);
        setCommand('');
        return;

      default:
        newOutputs.push(`bash: ${cmd}: command not found. Type 'help' for valid diagnostic commands.`);
        break;
    }

    setOutputHistory((prev) => [...prev, ...newOutputs]);
    setCommand('');
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#07090e] font-mono text-xs text-slate-300">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0e121a] px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#1793d1]" />
          <span className="font-bold text-white text-xs">
            root@archlinux: /run/nitroarch.sock [Daemon Shell]
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOutputHistory([])}
            className="flex items-center gap-1 rounded bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-400 hover:text-white"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="max-h-80 overflow-y-auto p-4 space-y-1 bg-[#06080d]">
        {/* System logs */}
        <div className="text-slate-500 text-[11px] mb-2 border-b border-slate-900 pb-2">
          {logs.slice(-4).map((log, idx) => (
            <div key={idx} className="text-slate-400">
              {log}
            </div>
          ))}
        </div>

        {outputHistory.map((line, idx) => (
          <div
            key={idx}
            className={`${
              line.startsWith('user@archlinux')
                ? 'text-sky-300 font-bold'
                : line.includes('active (running)') || line.includes('Active')
                ? 'text-emerald-400'
                : line.includes('ERROR') || line.includes('fail')
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Interactive Command Input Form */}
      <form onSubmit={handleRunCommand} className="flex items-center border-t border-slate-800/80 bg-[#0d1017] p-2">
        <span className="px-2 text-sky-400 font-bold">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Type command: 'powercap-info', 'sensors', 'systemctl status nitro-daemon', 'socket'..."
          className="flex-1 bg-transparent px-2 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded bg-[#1793d1] px-3 py-1 text-xs font-bold text-white hover:bg-sky-500 transition-colors"
        >
          <Play className="h-3 w-3" />
          <span>Run</span>
        </button>
      </form>
    </div>
  );
};
