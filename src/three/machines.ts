/**
 * Machine registry for the interactive site (3D-first rebuild step 2).
 *
 * Each entries maps a scene-wide userData.station value to an operable
 * "machine" the user can click. Selection helpers collect the meshes of one
 * machine (STATION_Assembly_Part components, never merged), compute the
 * selection box / panel anchor and summarise the machine's evidence so an
 * anchored panel can quote real numbers instead of invented ones.
 */
import * as THREE from 'three';

export interface Machine {
  /** userData.station value shared by this machine's components */
  station: string;
  /** machine id as documented in the sources (or explicitly conceptual) */
  id: string;
  label: string;
  /** honesty note shown in the anchored panel (NV refs where relevant) */
  note: string;
}

export const MACHINES: Machine[] = [
  {
    station: 'INDUCTION',
    id: 'EQ-001 / EQ-002',
    label: 'Induction heating machine',
    note: 'Gated against reference photos; rear side never photographed, nothing MEASURED (NV-011).'
  },
  {
    station: 'WASH-BLANK',
    id: 'PF-002 area',
    label: 'Blank wash station',
    note: 'Concentration conflict preserved, not merged: 2.8 % (setup sheet) vs 3.5-9.5 % (control plan) - NV-001.'
  },
  {
    station: 'WASH-TPCV',
    id: 'PF-002 area',
    label: 'TP/CV wash tunnel',
    note: 'Concentration conflict preserved, not merged: 2.8 % vs 3.5-9.5 % - NV-001.'
  },
  {
    station: 'OVEN',
    id: 'EQ-004',
    label: 'Draw oven',
    note: 'Illustrative heat trend only - no temperature or case-depth claim (NV-014).'
  },
  {
    station: 'MARKING',
    id: 'EQ-005',
    label: 'Laser marking station',
    note: 'Not photographed - conceptual layout, no marking timing claimed (NV-021).'
  },
  {
    station: 'READER',
    id: 'EQ-006',
    label: '2D code reader',
    note: 'Not photographed - conceptual layout (NV-021). The observed "SR-20AH" label is the KEYENCE lens attachment, not the reader unit (NV-023).'
  },
  {
    station: 'UNLOAD',
    id: 'PF-009 area',
    label: 'Cooling / unload conveyor',
    note: 'No photograph of this station exists - no photo match is claimed (NV-019).'
  },
  {
    station: 'BOXING',
    id: 'PF-012 area',
    label: 'Boxing bench',
    note: 'No photograph of this station - reject-box location unconfirmed (NV-020).'
  },
  {
    station: 'WORKPIECE',
    id: 'CV OR',
    label: 'CV OR workpiece',
    note: 'Representative part; no photo isolates it, so it cannot be photo-matched (NV-018).'
  },
  {
    station: 'GAGE',
    id: 'EQ-007 (conceptual)',
    label: 'Gage station + operator',
    note: 'Educational conceptual station, not photographed (NV-016); GO/NO-GO limits illustrative, not plant values (NV-014).'
  }
];

export function machineForObj(obj: THREE.Object3D | null): Machine | null {
  if (!obj) return null;
  const d = obj.userData as { id?: string; station?: string };
  // travelling sim markers ("SIM-…") are demo actors, not a machine
  if (String(d.id ?? '').startsWith('SIM-')) return null;
  return MACHINES.find((m) => m.station === d.station) ?? null;
}

export function collectMachineMeshes(root: THREE.Object3D, machine: Machine): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const d = o.userData as { id?: string; station?: string };
    if (d.station !== machine.station) return;
    if (String(d.id ?? '').startsWith('SIM-')) return;
    out.push(o as THREE.Mesh);
  });
  return out;
}

/** world-space bounding box of one machine's components (or null if none) */
export function machineBoxOf(root: THREE.Object3D, machine: Machine): THREE.Box3 | null {
  const meshes = collectMachineMeshes(root, machine);
  if (meshes.length === 0) return null;
  const box = new THREE.Box3();
  for (const m of meshes) box.expandByObject(m);
  return box.isEmpty() ? null : box;
}

/** evidence summary over one machine's components (real counts, no invention) */
export function machineEvidenceSummary(meshes: THREE.Mesh[]): {
  parts: number;
  categories: string[];
} {
  const cats = new Map<string, number>();
  for (const m of meshes) {
    const e = m.userData.evidence as { category?: string } | undefined;
    const c = String(e?.category ?? 'unlabeled');
    cats.set(c, (cats.get(c) ?? 0) + 1);
  }
  const categories = [...cats.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c} ${n}`);
  return { parts: meshes.length, categories };
}
