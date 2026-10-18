/**
 * The single typed signal bus - the source of truth for the whole simulation.
 *
 * Rule (hotzone-rules section 4): the simulation core, the 3D scene and the HMIs
 * read and write ONLY through this bus; nothing animates from a hidden variable.
 * A forced signal is flagged and every change is written to an audit log so a
 * forced (simulated) value can never be mistaken for a real one.
 *
 * HONESTY: these are SIMULATED signals. They are not connected to any real PLC,
 * OPC UA, Modbus or factory network, and forcing one changes the simulation only.
 */

export type SignalKey =
  | 'line.run'
  | 'line.rate'
  | 'laser.enabled'
  | 'gage.offsetMm'
  | 'conv.stop'
  | 'fault.damagedCode'
  | 'fault.heat'
  | 'fault.quench'
  | 'amb.heating'
  | 'amb.quenching'
  | 'amb.washing'
  | 'amb.tempering';

export type SignalUnit = 'bool' | 'ratio' | 'mm';

export interface SignalDef {
  key: SignalKey;
  label: string;
  unit: SignalUnit;
  default: boolean | number;
  note: string;
}

export const SIGNALS: SignalDef[] = [
  { key: 'line.run', label: 'Line run', unit: 'bool', default: true, note: 'run enable (educational)' },
  { key: 'line.rate', label: 'Line rate', unit: 'ratio', default: 1, note: 'speed multiplier 0.25x-8x' },
  { key: 'laser.enabled', label: 'Laser enabled', unit: 'bool', default: true, note: 'marking laser on (educational)' },
  { key: 'gage.offsetMm', label: 'Gage offset', unit: 'mm', default: 0, note: 'illustrative size offset (NV-014)' },
  { key: 'conv.stop', label: 'Conveyor stop', unit: 'bool', default: false, note: 'conveyor stopped (educational)' },
  { key: 'fault.damagedCode', label: 'Damaged-code fault', unit: 'bool', default: false, note: 'inject damaged 2D codes (EP-004)' },
  { key: 'fault.heat', label: 'Heat fault', unit: 'bool', default: false, note: 'heat alarm (alarm-only demo)' },
  { key: 'fault.quench', label: 'Quench fault', unit: 'bool', default: false, note: 'quench alarm (alarm-only demo)' },
  { key: 'amb.heating', label: 'Ambient: heating glow', unit: 'bool', default: false, note: 'illustrative scene glow only, not a process setpoint' },
  { key: 'amb.quenching', label: 'Ambient: quench spray', unit: 'bool', default: false, note: 'illustrative scene spray only, not a process setpoint' },
  { key: 'amb.washing', label: 'Ambient: wash spray', unit: 'bool', default: true, note: 'illustrative scene spray only, not a process setpoint' },
  { key: 'amb.tempering', label: 'Ambient: oven glow', unit: 'bool', default: true, note: 'illustrative scene glow only, not a process setpoint' }
];

export interface SignalRecord {
  t: number;
  key: SignalKey;
  value: unknown;
  source: string;
  forced: boolean;
}

export class SignalBus {
  private values = new Map<SignalKey, boolean | number>();
  private forcedKeys = new Set<SignalKey>();
  private log: SignalRecord[] = [];
  private t = 0;
  private maxLog = 300;

  constructor() {
    for (const d of SIGNALS) this.values.set(d.key, d.default);
  }

  advance(dt: number): void {
    this.t += dt;
  }

  get<K extends SignalKey>(key: K): boolean | number {
    return this.values.get(key) ?? (SIGNALS.find((s) => s.key === key)?.default ?? 0);
  }

  asBool(key: SignalKey): boolean {
    return Boolean(this.values.get(key));
  }

  asNumber(key: SignalKey): number {
    const v = this.values.get(key);
    return typeof v === 'number' ? v : v ? 1 : 0;
  }

  /** normal (unforced) write */
  set(key: SignalKey, value: boolean | number, source = 'operator'): void {
    if (this.forcedKeys.has(key)) return; // a forced signal can't be written normally
    const changed = this.values.get(key) !== value;
    this.values.set(key, value);
    if (changed) this.push({ t: this.t, key, value, source, forced: false });
  }

  /** forced write - shown on the HMI and audit-logged */
  force(key: SignalKey, value: boolean | number, source = 'force'): void {
    const newlyForced = !this.forcedKeys.has(key);
    this.forcedKeys.add(key);
    const changed = this.values.get(key) !== value;
    this.values.set(key, value);
    if (changed || newlyForced) this.push({ t: this.t, key, value, source, forced: true });
  }

  unforce(key: SignalKey): void {
    if (this.forcedKeys.delete(key)) {
      const def = SIGNALS.find((s) => s.key === key)?.default ?? 0;
      this.values.set(key, def);
      this.push({ t: this.t, key, value: def, source: 'unforce', forced: false });
    }
  }

  isForced(key: SignalKey): boolean {
    return this.forcedKeys.has(key);
  }

  forcedKeysList(): SignalKey[] {
    return [...this.forcedKeys];
  }

  history(): SignalRecord[] {
    return [...this.log];
  }

  reset(): void {
    this.values.clear();
    for (const d of SIGNALS) this.values.set(d.key, d.default);
    this.forcedKeys.clear();
    this.log = [];
    this.t = 0;
  }

  private push(rec: SignalRecord): void {
    this.log.push(rec);
    if (this.log.length > this.maxLog) this.log.shift();
  }
}
