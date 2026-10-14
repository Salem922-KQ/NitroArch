import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryState, PidConfig, WorkloadPreset } from '../types/nitro';

const DEFAULT_PID: PidConfig = {
  kp: 1.6,
  ki: 0.04,
  kd: 2.2,
  targetTempC: 70,
  crossCoupling: true,
  hysteresisSeconds: 4,
};

export function useNitroSimulation() {
  const [pidConfig, setPidConfig] = useState<PidConfig>(DEFAULT_PID);
  const [workload, setWorkload] = useState<WorkloadPreset>('compile');
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(true);
  const [socketPacketsCount, setSocketPacketsCount] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[systemd] Starting NitroArch-Sense Hardware Daemon...',
    '[NitroDaemon][HW] Intel Core i7-13700H detected (14 Cores, 20 Threads).',
    '[NitroDaemon][NVML] libnvidia-ml.so.1 dynamically loaded. GPU: NVIDIA GeForce RTX 4060 Mobile.',
    '[NitroDaemon][Power] Intel RAPL sysfs detected at /sys/class/powercap/intel-rapl/intel-rapl:0',
    '[NitroDaemon][PID] Autonomous dual-loop PID fan controller active. Target: 70°C, Cross-coupling: ON.',
    '[NitroDaemon] Unix Domain Socket bound to /run/nitroarch.sock (permissions 0666).',
    '[NitroUI] Local connection established to /run/nitroarch.sock. Receiving 500ms telemetry broadcasts.',
  ]);

  // Rolling 60-second telemetry series
  const [cpuHistory, setCpuHistory] = useState<number[]>(() => Array(60).fill(48));
  const [gpuHistory, setGpuHistory] = useState<number[]>(() => Array(60).fill(44));
  const [rpmHistory, setRpmHistory] = useState<number[]>(() => Array(60).fill(2200));
  const [powerHistory, setPowerHistory] = useState<number[]>(() => Array(60).fill(32));

  // Current hardware state
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    cpuUsage: 35,
    cpuTemp: 52,
    cpuFreqMhz: 3800,
    cpuPowerWatts: 38,
    cpuPl1Watts: 45,
    cpuPl2Watts: 80,
    raplSupported: true,
    ramUsedGb: 8.4,
    ramTotalGb: 16.0,

    gpuActive: true,
    gpuUsage: 22,
    gpuTemp: 48,
    gpuPowerWatts: 45,
    gpuClockGraphics: 1950,
    gpuClockMemory: 7000,
    gpuVramUsedMb: 2450,
    gpuVramTotalMb: 8192,

    fanCpuRpm: 2450,
    fanGpuRpm: 2300,
    fanCpuPct: 35,
    fanGpuPct: 35,
    fanMode: 'auto',

    thermalProfile: 'balanced',
    batteryLimit80: true,
    kbBacklightTimeout: true,
    usbPowerOffCharging: false,
    isSimulatedMode: true,

    pidErrorCpu: -18,
    pidPTermCpu: -28.8,
    pidITermCpu: 0,
    pidDTermCpu: 0,
    rawDemandCpu: 35,
    hysteresisActive: false,
  });

  // Simulator internal physics references
  const stateRef = useRef(telemetry);
  stateRef.current = telemetry;

  const pidConfigRef = useRef(pidConfig);
  pidConfigRef.current = pidConfig;

  const workloadRef = useRef(workload);
  workloadRef.current = workload;

  const integralCpuRef = useRef(0);
  const prevErrorCpuRef = useRef(0);
  const lastHighTempTimeRef = useRef(Date.now());
  const smoothedFanSpeedRef = useRef(35);
  const burstTimerRef = useRef(0);

  // 500ms Hardware simulation cycle mirroring nitro-daemon
  useEffect(() => {
    const interval = setInterval(() => {
      const cur = stateRef.current;
      const pid = pidConfigRef.current;
      const wl = workloadRef.current;

      // 1. Determine workload base demand and thermal load
      let baseCpuWatts = 18;
      let targetCpuUsage = 15;
      let baseGpuWatts = 15;
      let targetGpuUsage = 5;

      switch (wl) {
        case 'idle':
          baseCpuWatts = 12;
          targetCpuUsage = 5 + Math.random() * 5;
          baseGpuWatts = 8;
          targetGpuUsage = 2;
          break;
        case 'compile':
          baseCpuWatts = 42 + Math.sin(Date.now() / 2000) * 12;
          targetCpuUsage = 55 + Math.random() * 15;
          baseGpuWatts = 20;
          targetGpuUsage = 15;
          break;
        case 'gaming':
          baseCpuWatts = 55 + Math.random() * 15;
          targetCpuUsage = 65 + Math.random() * 10;
          baseGpuWatts = 75 + Math.random() * 20;
          targetGpuUsage = 85 + Math.random() * 10;
          break;
        case 'stress':
          baseCpuWatts = 95;
          targetCpuUsage = 99;
          baseGpuWatts = 95;
          targetGpuUsage = 98;
          break;
      }

      // 2. Apply Intel RAPL PL1 & PL2 limits!
      // If load exceeds PL1, allow burst up to PL2 for 15 seconds, then clamp strictly to PL1
      burstTimerRef.current += 0.5;
      const maxAllowedWatts = burstTimerRef.current < 15 ? cur.cpuPl2Watts : cur.cpuPl1Watts;
      const actualCpuWatts = Math.min(baseCpuWatts, maxAllowedWatts);

      // CPU clock speed is proportional to power budget
      const cpuFreq = Math.round(2400 + (actualCpuWatts / Math.max(cur.cpuPl1Watts, 1)) * 2400);

      // 3. Physical Heat Dissipation & Temperature calculation
      const ambientTemp = 24.0;
      const currentFanSpeedPct = smoothedFanSpeedRef.current;

      // Cooling power proportional to fan speed
      const cpuDissipation = (currentFanSpeedPct / 100.0) * 85.0 + 10.0;
      const gpuDissipation = (currentFanSpeedPct / 100.0) * 90.0 + 10.0;

      // Heat generation
      const cpuNetHeat = actualCpuWatts - cpuDissipation;
      const gpuNetHeat = baseGpuWatts - gpuDissipation;

      // Cross-coupling: shared copper heatpipe conduction
      let crossConduction = 0;
      if (pid.crossCoupling && Math.abs(cur.cpuTemp - cur.gpuTemp) > 8) {
        crossConduction = (cur.gpuTemp - cur.cpuTemp) * 0.15;
      }

      const newCpuTemp = Math.round(
        Math.max(38, Math.min(98, cur.cpuTemp + cpuNetHeat * 0.05 + crossConduction * 0.05))
      );
      const newGpuTemp = Math.round(
        Math.max(35, Math.min(94, cur.gpuTemp + gpuNetHeat * 0.04 - crossConduction * 0.05))
      );

      // 4. AUTONOMOUS DUAL-LOOP PID CALCULATION
      let targetCpuFanPct = 35;
      let targetGpuFanPct = 35;
      let pTerm = 0;
      let iTerm = 0;
      let dTerm = 0;
      let rawDemand = 35;
      let isHysteresisEngaged = false;

      if (cur.fanMode === 'turbo') {
        targetCpuFanPct = 100;
        targetGpuFanPct = 100;
        smoothedFanSpeedRef.current = 100;
      } else if (cur.fanMode === 'custom') {
        targetCpuFanPct = cur.fanCpuPct;
        targetGpuFanPct = cur.fanGpuPct;
        smoothedFanSpeedRef.current = cur.fanCpuPct;
      } else {
        // --- PID MODE ---
        const effectiveTemp = Math.max(newCpuTemp, pid.crossCoupling ? newGpuTemp * 0.95 : 0);
        const error = effectiveTemp - pid.targetTempC;

        // Proportional
        pTerm = pid.kp * error;

        // Integral with Anti-Windup Clamping [-30, +30]
        integralCpuRef.current = Math.max(-30, Math.min(30, integralCpuRef.current + error * 0.5));
        iTerm = pid.ki * integralCpuRef.current;

        // Derivative
        dTerm = pid.kd * (error - prevErrorCpuRef.current);
        prevErrorCpuRef.current = error;

        // Raw output
        rawDemand = Math.round(35 + pTerm + iTerm + dTerm);
        rawDemand = Math.max(20, Math.min(100, rawDemand));

        // Acoustic Hysteresis Ramp Limiter
        const now = Date.now();
        if (rawDemand > smoothedFanSpeedRef.current) {
          lastHighTempTimeRef.current = now;
          // Ramp up fast (+12% per 500ms)
          smoothedFanSpeedRef.current = Math.min(smoothedFanSpeedRef.current + 12, rawDemand);
        } else {
          // Delay ramp down to prevent annoying fan hunting oscillation
          const elapsedSec = (now - lastHighTempTimeRef.current) / 1000;
          if (elapsedSec >= pid.hysteresisSeconds) {
            // Ramp down gently (-2% per 500ms)
            smoothedFanSpeedRef.current = Math.max(smoothedFanSpeedRef.current - 2, rawDemand);
          } else {
            isHysteresisEngaged = true;
          }
        }

        targetCpuFanPct = Math.round(smoothedFanSpeedRef.current);
        targetGpuFanPct = Math.round(smoothedFanSpeedRef.current);
      }

      // Convert percentage to RPM (Acer Nitro range: 1800 - 5800 RPM)
      const cpuRpm = Math.round(1800 + (targetCpuFanPct / 100.0) * 4000);
      const gpuRpm = Math.round(1750 + (targetGpuFanPct / 100.0) * 4100);

      // 5. Update State
      setTelemetry((prev) => ({
        ...prev,
        cpuUsage: Math.round(targetCpuUsage),
        cpuTemp: newCpuTemp,
        cpuFreqMhz: cpuFreq,
        cpuPowerWatts: Math.round(actualCpuWatts),
        gpuUsage: Math.round(targetGpuUsage),
        gpuTemp: newGpuTemp,
        gpuPowerWatts: Math.round(baseGpuWatts),
        fanCpuRpm: cpuRpm,
        fanGpuRpm: gpuRpm,
        fanCpuPct: targetCpuFanPct,
        fanGpuPct: targetGpuFanPct,
        pidErrorCpu: newCpuTemp - pid.targetTempC,
        pidPTermCpu: Math.round(pTerm * 10) / 10,
        pidITermCpu: Math.round(iTerm * 10) / 10,
        pidDTermCpu: Math.round(dTerm * 10) / 10,
        rawDemandCpu: rawDemand,
        hysteresisActive: isHysteresisEngaged,
      }));

      // Update history arrays
      setCpuHistory((hist) => [...hist.slice(1), newCpuTemp]);
      setGpuHistory((hist) => [...hist.slice(1), newGpuTemp]);
      setRpmHistory((hist) => [...hist.slice(1), cpuRpm]);
      setPowerHistory((hist) => [...hist.slice(1), Math.round(actualCpuWatts)]);

      setSocketPacketsCount((count) => count + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Control Actions (simulate QLocalSocket command dispatch)
  const setPowerLimits = useCallback((pl1: number, pl2: number) => {
    // Hardware safeguard validation
    const clampedPl1 = Math.max(15, Math.min(90, Math.round(pl1)));
    let clampedPl2 = Math.max(25, Math.min(135, Math.round(pl2)));
    if (clampedPl2 < clampedPl1) clampedPl2 = clampedPl1;

    setTelemetry((prev) => ({
      ...prev,
      cpuPl1Watts: clampedPl1,
      cpuPl2Watts: clampedPl2,
    }));

    setTerminalLogs((logs) => [
      ...logs.slice(-25),
      `[IPC -> Daemon] set_power_limits: PL1=${clampedPl1}W, PL2=${clampedPl2}W applied to RAPL sysfs & MSR 0x610`,
    ]);
  }, []);

  const setThermalProfile = useCallback((profile: 'quiet' | 'balanced' | 'turbo') => {
    let p1 = 45;
    let p2 = 80;
    let fMode: 'auto' | 'custom' | 'turbo' = 'auto';

    if (profile === 'quiet') {
      p1 = 25;
      p2 = 45;
    } else if (profile === 'turbo') {
      p1 = 75;
      p2 = 125;
      fMode = 'turbo';
    }

    setTelemetry((prev) => ({
      ...prev,
      thermalProfile: profile,
      cpuPl1Watts: p1,
      cpuPl2Watts: p2,
      fanMode: fMode,
    }));

    setTerminalLogs((logs) => [
      ...logs.slice(-25),
      `[IPC -> Daemon] set_profile: '${profile}' -> /sys/firmware/acpi/platform_profile updated.`,
    ]);
  }, []);

  const setFanMode = useCallback((mode: 'auto' | 'custom' | 'turbo') => {
    setTelemetry((prev) => ({ ...prev, fanMode: mode }));
    setTerminalLogs((logs) => [
      ...logs.slice(-25),
      `[IPC -> Daemon] set_fans: mode='${mode}'`,
    ]);
  }, []);

  const setManualFans = useCallback((cpuPct: number, gpuPct: number) => {
    setTelemetry((prev) => ({
      ...prev,
      fanMode: 'custom',
      fanCpuPct: cpuPct,
      fanGpuPct: gpuPct,
    }));
    setTerminalLogs((logs) => [
      ...logs.slice(-25),
      `[IPC -> Daemon] set_fans: manual CPU=${cpuPct}%, GPU=${gpuPct}%`,
    ]);
  }, []);

  const setPidTuning = useCallback((newConfig: Partial<PidConfig>) => {
    setPidConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      setTerminalLogs((logs) => [
        ...logs.slice(-25),
        `[IPC -> Daemon] set_pid: Kp=${updated.kp}, Ki=${updated.ki}, Kd=${updated.kd}, Target=${updated.targetTempC}°C, Coupling=${updated.crossCoupling}`,
      ]);
      return updated;
    });
  }, []);

  const toggleBatteryLimit = useCallback(() => {
    setTelemetry((prev) => {
      const nextVal = !prev.batteryLimit80;
      setTerminalLogs((logs) => [
        ...logs.slice(-25),
        `[IPC -> Daemon] set_battery_limit: ${nextVal ? 'ENABLED (80% Cap)' : 'DISABLED (100% Full)'}`,
      ]);
      return { ...prev, batteryLimit80: nextVal };
    });
  }, []);

  const toggleKeyboardTimeout = useCallback(() => {
    setTelemetry((prev) => {
      const nextVal = !prev.kbBacklightTimeout;
      setTerminalLogs((logs) => [
        ...logs.slice(-25),
        `[IPC -> Daemon] set_kb_timeout: ${nextVal ? '30s Timeout ON' : 'Always ON'}`,
      ]);
      return { ...prev, kbBacklightTimeout: nextVal };
    });
  }, []);

  const toggleUsbCharging = useCallback(() => {
    setTelemetry((prev) => {
      const nextVal = !prev.usbPowerOffCharging;
      setTerminalLogs((logs) => [
        ...logs.slice(-25),
        `[IPC -> Daemon] set_usb_charge: ${nextVal ? 'Power-off Charging ON' : 'OFF'}`,
      ]);
      return { ...prev, usbPowerOffCharging: nextVal };
    });
  }, []);

  const toggleSocketConnection = useCallback(() => {
    setIsSocketConnected((prev) => {
      const next = !prev;
      setTerminalLogs((logs) => [
        ...logs.slice(-25),
        next
          ? '[NitroUI] Reconnected to /run/nitroarch.sock'
          : '[NitroUI] Disconnected from daemon socket.',
      ]);
      return next;
    });
  }, []);

  return {
    telemetry,
    pidConfig,
    workload,
    setWorkload,
    isSocketConnected,
    socketPacketsCount,
    terminalLogs,
    cpuHistory,
    gpuHistory,
    rpmHistory,
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
  };
}
