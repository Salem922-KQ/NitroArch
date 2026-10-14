export interface PidConfig {
  kp: number;
  ki: number;
  kd: number;
  targetTempC: number;
  crossCoupling: boolean;
  hysteresisSeconds: number;
}

export interface CurvePoint {
  tempC: number;
  speedPct: number;
}

export interface TelemetryState {
  // CPU
  cpuUsage: number;
  cpuTemp: number;
  cpuFreqMhz: number;
  cpuPowerWatts: number;
  cpuPl1Watts: number;
  cpuPl2Watts: number;
  raplSupported: boolean;
  ramUsedGb: number;
  ramTotalGb: number;

  // GPU
  gpuActive: boolean;
  gpuUsage: number;
  gpuTemp: number;
  gpuPowerWatts: number;
  gpuClockGraphics: number;
  gpuClockMemory: number;
  gpuVramUsedMb: number;
  gpuVramTotalMb: number;

  // Fans
  fanCpuRpm: number;
  fanGpuRpm: number;
  fanCpuPct: number;
  fanGpuPct: number;
  fanMode: 'auto' | 'custom' | 'turbo';

  // System & Controls
  thermalProfile: 'quiet' | 'balanced' | 'turbo';
  batteryLimit80: boolean;
  kbBacklightTimeout: boolean;
  usbPowerOffCharging: boolean;
  isSimulatedMode: boolean;

  // PID Internal Live Diagnostics
  pidErrorCpu: number;
  pidPTermCpu: number;
  pidITermCpu: number;
  pidDTermCpu: number;
  rawDemandCpu: number;
  hysteresisActive: boolean;
}

export type WorkloadPreset = 'idle' | 'compile' | 'gaming' | 'stress';
