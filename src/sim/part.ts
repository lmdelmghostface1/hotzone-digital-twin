/**
 * Phase 3 simulation core - tracked CV OR parts.
 *
 * HONESTY: this is an EDUCATIONAL trend model. The heat index and the GO/NO-GO
 * dimensions are illustrative values used to demonstrate the flow and the
 * inspection principle. They are NOT plant setpoints, tolerances or thermal
 * results. The gage station itself is never photographed (NV-016) and the pin
 * diameters are only an example in the source, not a program table (NV-014).
 * See docs/NEEDS_VERIFICATION.md and docs/model-checklist/gage-station.md.
 */

export type StageId =
  | 'INFEED'
  | 'WASH'
  | 'WASH2'
  | 'MARKING'
  | 'READING'
  | 'HEATING'
  | 'QUENCHING'
  | 'TEMPERING'
  | 'COOLING'
  | 'GAGING'
  | 'BOXED'
  | 'REJECTED';

export type GageResult = 'GO' | 'NO-GO';

export interface PartMeasurement {
  /** illustrative measured size, mm - NOT a plant tolerance (NV-014) */
  measuredMm: number;
  goLimitMm: number;
  noGoLimitMm: number;
  result: GageResult;
}

export interface PartHistoryEntry {
  t: number;
  stage: StageId;
  note: string;
}

export interface TrackedPart {
  serial: string;
  lot: string;
  recipe: string;
  /** 2D DataMatrix content, or null when the laser did not mark it */
  code2d: string | null;
  damagedCode: boolean;
  /** illustrative 0..1 heat index (not a temperature) */
  heatIndex: number;
  stage: StageId;
  /** position along the line, metres (matches the 3D model x axis) */
  x: number;
  measurement: PartMeasurement | null;
  rejected: boolean;
  rejectReason: string | null;
  age: number;
  history: PartHistoryEntry[];
}

export const GAGE_LIMITS = {
  nominalMm: 2.0,
  goLimitMm: 1.998,
  noGoLimitMm: 2.002,
  note: 'illustrative only - source lists 2.00-2.002 mm as an example, not a program table (NV-014)'
} as const;

let serialCounter = 0;

export function nextSerial(): string {
  serialCounter += 1;
  return `CVOR-${String(serialCounter).padStart(5, '0')}`;
}

export function resetSerials(): void {
  serialCounter = 0;
}

export interface NewPartOptions {
  laserEnabled?: boolean;
  damagedCode?: boolean;
  gageOffsetMm?: number;
}

export function createPart(t: number, lot: string, recipe: string, opts: NewPartOptions = {}): TrackedPart {
  const serial = nextSerial();
  const laserEnabled = opts.laserEnabled ?? true;
  const damaged = opts.damagedCode ?? false;
  const part: TrackedPart = {
    serial,
    lot,
    recipe,
    code2d: laserEnabled && !damaged ? `DM|${lot}|${serial}|${recipe}` : null,
    damagedCode: damaged,
    heatIndex: 0,
    stage: 'INFEED',
    x: -9.2,
    measurement: null,
    rejected: false,
    rejectReason: null,
    age: 0,
    history: []
  };
  logHistory(part, t, 'INFEED', `part created (${serial}), laser ${laserEnabled ? 'enabled' : 'disabled'}${damaged ? ', damaged code' : ''}`);
  return part;
}

export function logHistory(part: TrackedPart, t: number, stage: StageId, note: string): void {
  part.stage = stage;
  part.history.push({ t: Number(t.toFixed(2)), stage, note });
  if (part.history.length > 40) part.history.shift();
}
