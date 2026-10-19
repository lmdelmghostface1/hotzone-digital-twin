export interface EvidenceLike {
  sourceId: string;
  page?: string;
  url?: string;
  category: string;
  confidence: string;
  status: string;
  reviewed: string;
}

export interface ExtractionItem {
  id: string;
  kind: string;
  name: string;
  value: unknown;
  notes?: string;
  evidence: EvidenceLike;
}

export interface SourceDoc {
  sourceId: string;
  path: string;
  pages: number;
  textPages: string;
  photoPages: string;
  nature: string;
  disclaimer: string;
}

export interface ExtractionFile {
  meta: {
    schemaVersion: number;
    generated: string;
    project: string;
    sourceDoc: SourceDoc;
    statusRule: string;
    observedValueRule: string;
  };
  items: ExtractionItem[];
}

export interface NvEntry {
  id: string;
  title: string;
  status: string;
  description: string;
  relatedItemIds?: string[];
  evidence: EvidenceLike;
}

export interface NeedsFile {
  meta: {
    schemaVersion: number;
    generated: string;
    policy: string;
  };
  entries: NvEntry[];
}

export interface ReferencePhoto {
  id: string;
  file: string;
  caption: string;
  observed: string;
  match: string;
  review: string;
  camera?: string;
  hidden?: string;
  station?: string;
  evidence: EvidenceLike;
}

export interface ReferenceFile {
  meta: {
    schemaVersion: number;
    generated: string;
    reviewMethod: string;
    matchLegend: Record<string, string>;
    excludedFiles: string;
  };
  photos: ReferencePhoto[];
}

export interface HmiEntry {
  id: string;
  code: string;
  text: string;
  candidates: string[];
  pairing: string;
  fixStatus: string;
  seenInPhotos: number;
  sources: string[];
  notes: string;
  evidence: EvidenceLike;
}

export interface HmiFile {
  meta: {
    schemaVersion: number;
    generated: string;
    station: string;
    source: string;
    screens: number;
    method: string;
    pairingRule: string;
    fixes: string;
    note: string;
  };
  entries: HmiEntry[];
}

export interface ProcedureStepDef {
  id: string;
  sourceItem: string;
  instruction: string;
  manual: boolean;
  evidence: EvidenceLike;
}

export interface ProcedureDef {
  id: string;
  title: string;
  documentRef: string;
  note: string;
  safetyNote: string;
  manualActionNote: string;
  steps: ProcedureStepDef[];
  sourceItems: string[];
  evidence: EvidenceLike;
}

export interface ProceduresFile {
  meta: {
    project: string;
    policy: string;
    safetyDisclaimer: string;
    scoring: string;
  };
  procedures: ProcedureDef[];
}

export interface FaultReactionStep {
  id: string;
  name: string;
  instruction: string;
  manual: boolean;
}

export interface FaultDef {
  id: string;
  label: string;
  category: string;
  station: string;
  machine: string;
  trigger: { via: string; signal: string | null; forced: string };
  alarm: { id: string; code: string; text: string } | null;
  symptoms: string[];
  reaction:
    | {
        kind: 'training-scenario';
        note: string;
        steps: FaultReactionStep[];
        stepsEvidence: EvidenceLike;
      }
    | {
        kind: 'documented';
        note: string;
        procedureId: string;
        stepsEvidence: EvidenceLike;
      };
  alarmEvidence: EvidenceLike | null;
  evidence: EvidenceLike;
}

export interface FaultsFile {
  meta: {
    project: string;
    policy: string;
    safetyDisclaimer: string;
  };
  faults: FaultDef[];
}
