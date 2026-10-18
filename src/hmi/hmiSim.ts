import hmiErrorsJson from '../data/hmi-errors.json';
import { SignalBus, type SignalKey } from '../sim/bus';

/**
 * Interactive HMI / diagnostics model (Phase 4, educational).
 *
 * HONESTY: this is a teaching mimic, not the plant HMI and not plant I/O. The
 * alarm text, code and the "what to check / how to fix" hints come verbatim from
 * the extracted HMI error register (70 entries read from the SINUMERIK /
 * Inducontrol alarm screenshots) - see docs/HMI_ERRORS.md. Each fault below is
 * wired to the REAL register code that matches that failure; no code is
 * invented. What is invented is only the *link* between a button here and that
 * code (the plant's actual triggers/PLC logic are not provided), so treat the
 * cause/fix text as reference material to read, not a validated procedure.
 */

export type AlarmState = 'inactive' | 'active-unacked' | 'active-acked' | 'cleared';

export interface HmiAlarm {
  id: string;
  code: string;
  text: string;
  candidates: string[];
  pairing: string;
  fixStatus: string;
  sources: string[];
  state: AlarmState;
  activeSince?: number;
  clearedAt?: number;
  ackedAt?: number;
}

export interface Faults {
  laserDisabled: boolean;
  damagedCode: boolean;
  gageForceNok: boolean;
  conveyorStop: boolean;
  heatFault: boolean;
  quenchFault: boolean;
}

/** fault -> the real HMI register code that matches it */
export const FAULT_ALARMS: Record<keyof Faults, string> = {
  laserDisabled: 'HMI-019', // 700207 LASER UNIT NOT READY
  damagedCode: 'HMI-032', // 700403 2D SCANNER READING ERROR, JOB REJECTED
  gageForceNok: 'HMI-022', // 700219 JOB HEIGHT NOT WITHIN RANGE, JOB REJECTED
  conveyorStop: 'HMI-026', // 700327 UNLOADING CONVEYOR MOTOR MPU TRIP
  heatFault: 'HMI-069', // 700920 DM HIGH LEVEL TEMPERATURE REACH ALARM
  quenchFault: 'HMI-063' // 700807 QUENCH TEMPERATURE LOW LIMIT REACHED
};

/** fault -> the bus signal it forces (heat/quench are alarm-only demos) */
const FAULT_SIGNALS: Partial<Record<keyof Faults, { key: SignalKey; value: boolean | number }>> = {
  laserDisabled: { key: 'laser.enabled', value: false },
  damagedCode: { key: 'fault.damagedCode', value: true },
  gageForceNok: { key: 'gage.offsetMm', value: 0.03 },
  conveyorStop: { key: 'conv.stop', value: true },
  heatFault: { key: 'fault.heat', value: true },
  quenchFault: { key: 'fault.quench', value: true }
};

export interface HmiSignals {
  bannerText: string;
  severity: 'NORMAL' | 'ACTIVE' | 'ALARM' | 'CRITICAL';
  hasUnacked: boolean;
  activeCount: number;
  faults: Faults;
}

interface RegisterEntry {
  id: string;
  code: string;
  text: string;
  candidates: string[];
  pairing: string;
  fixStatus: string;
  seenInPhotos: number;
  sources: string[];
  notes: string;
  evidence: { sourceId: string; category: string; confidence: string; status: string; reviewed: string };
}

const REGISTER = hmiErrorsJson.entries as unknown as RegisterEntry[];

function makeAlarms(): HmiAlarm[] {
  return REGISTER.map((e) => ({
    id: e.id,
    code: e.code,
    text: e.text,
    candidates: e.candidates,
    pairing: e.pairing,
    fixStatus: e.fixStatus,
    sources: e.sources,
    state: 'inactive'
  }));
}

export class HmiSim {
  alarms: HmiAlarm[] = makeAlarms();
  faults: Faults = {
    laserDisabled: false,
    damagedCode: false,
    gageForceNok: false,
    conveyorStop: false,
    heatFault: false,
    quenchFault: false
  };
  t = 0;
  bus: SignalBus;

  constructor(bus: SignalBus = new SignalBus()) {
    this.bus = bus;
  }

  reset(): void {
    this.alarms = makeAlarms();
    this.resetFaults();
    this.t = 0;
  }

  resetFaults(): void {
    for (const f of Object.keys(this.faults) as (keyof Faults)[]) {
      this.faults[f] = false;
      const sig = FAULT_SIGNALS[f];
      if (sig) this.bus.unforce(sig.key);
    }
  }

  moveFaultsToBus(): void {
    for (const [fault, sig] of Object.entries(FAULT_SIGNALS) as [keyof Faults, { key: SignalKey; value: boolean | number }][]) {
      if (this.faults[fault]) this.bus.force(sig.key, sig.value, `HMI fault ${fault}`);
      else this.bus.unforce(sig.key);
    }
  }

  tick(dt: number): void {
    this.t += dt;
    this.moveFaultsToBus();
    for (const [fault, alarmId] of Object.entries(FAULT_ALARMS) as [keyof Faults, string][]) {
      const active = this.faults[fault];
      const a = this.alarms.find((x) => x.id === alarmId);
      if (!a) continue;
      if (active && (a.state === 'inactive' || a.state === 'cleared')) {
        a.state = 'active-unacked';
        a.activeSince = this.t;
      } else if (!active && (a.state === 'active-unacked' || a.state === 'active-acked')) {
        a.state = 'cleared';
        a.clearedAt = this.t;
      }
    }
  }

  ack(id: string): void {
    const a = this.alarms.find((x) => x.id === id);
    if (a && a.state === 'active-unacked') {
      a.state = 'active-acked';
      a.ackedAt = this.t;
    }
  }

  ackAll(): void {
    for (const a of this.alarms) if (a.state === 'active-unacked') this.ack(a.id);
  }

  clear(id: string): void {
    const a = this.alarms.find((x) => x.id === id);
    if (a && (a.state === 'active-acked' || a.state === 'active-unacked')) {
      a.state = 'cleared';
      a.clearedAt = this.t;
    }
    for (const [fault, alarmId] of Object.entries(FAULT_ALARMS) as [keyof Faults, string][]) {
      if (alarmId === id) {
        this.faults[fault] = false;
        const sig = FAULT_SIGNALS[fault];
        if (sig) this.bus.unforce(sig.key);
      }
    }
  }

  clearAll(): void {
    for (const a of [...this.alarms]) this.clear(a.id);
    this.resetFaults();
  }

  toggle(fault: keyof Faults): void {
    this.faults[fault] = !this.faults[fault];
    this.moveFaultsToBus();
  }

  activeAlarms(): HmiAlarm[] {
    return this.alarms.filter((a) => a.state === 'active-unacked' || a.state === 'active-acked');
  }

  signals(): HmiSignals {
    const active = this.activeAlarms();
    const unacked = active.filter((a) => a.state === 'active-unacked');
    const severity: HmiSignals['severity'] =
      unacked.length > 0 ? 'ALARM' : active.length > 0 ? 'ACTIVE' : 'NORMAL';
    const banner = severity === 'NORMAL'
      ? 'HMI: System OK - line running (educational mimic)'
      : `${severity}: ${unacked.length} unacknowledged / ${active.length} active (educational mimic)`;
    return {
      bannerText: banner,
      severity,
      hasUnacked: unacked.length > 0,
      activeCount: active.length,
      faults: this.faults
    };
  }
}
