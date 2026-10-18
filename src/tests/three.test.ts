// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makePalette } from '../three/materials';
import { buildInductionMachine } from '../three/induction';
import { buildLine } from '../three/line';
import refCameras from '../three/refCameras.json';
import checklist from '../data/model-checklist.json';
import washChecklist from '../data/model-checklist-wash.json';
import ovenChecklist from '../data/model-checklist-oven.json';
import workpieceChecklist from '../data/model-checklist-workpiece.json';
import lineEndChecklist from '../data/model-checklist-lineend.json';
import identificationChecklist from '../data/model-checklist-identification.json';
import gageChecklist from '../data/model-checklist-gage.json';

const palette = makePalette();
const station = buildInductionMachine(palette);

interface MeshLike {
  name: string;
  userData: Record<string, unknown>;
  geometry?: THREE.BufferGeometry;
  isInstancedMesh?: boolean;
  count?: number;
}

const meshes: MeshLike[] = [];
station.root.traverse((o) => {
  const any = o as unknown as MeshLike;
  if ((o as THREE.Mesh).isMesh) meshes.push(any);
});

function trianglesOf(m: MeshLike): number {
  const g = m.geometry;
  if (!g) return 0;
  const base = g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3;
  return base * (m.isInstancedMesh ? (m.count ?? 1) : 1);
}

describe('induction machine model', () => {
  it('builds a multi-mesh station (never one merged mesh)', () => {
    expect(meshes.length).toBeGreaterThan(60);
    const groups = Object.keys(station.layerGroups);
    expect(groups).toEqual(['1', '2', '3', '4', '5']);
    expect(station.conceptual).toBeDefined();
  });

  it('every mesh carries full userData metadata with evidence', () => {
    const bad: string[] = [];
    for (const m of meshes) {
      const u = m.userData;
      const e = u.evidence as Record<string, unknown> | undefined;
      if (!u.id || !u.name || !u.station || !u.function || !u.dimension || !u.layer) {
        bad.push(`${m.name}: missing metadata`);
        continue;
      }
      if (!e?.sourceId || !e.category || !e.confidence || !e.status || !e.reviewed) {
        bad.push(`${String(u.id)}: incomplete evidence`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every dimension is tagged; none claimed MEASURED', () => {
    const tags = new Set(meshes.map((m) => String(m.userData.dimension)));
    expect([...tags].sort()).toEqual(['ASSUMED', 'ESTIMATED']);
  });

  it('mesh ids are unique', () => {
    const ids = meshes.map((m) => String(m.userData.id));
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('respects the triangle budget for one station view (<= 350k)', () => {
    const total = meshes.reduce((s, m) => s + trianglesOf(m), 0);
    expect(total).toBeLessThanOrEqual(350000);
    expect(total).toBeGreaterThan(10000);
  });

  it('names components STATION-style', () => {
    const prefixed = meshes.filter(
      (m) => /^(IND-|Environment_)/.test(String(m.userData.id)) || m.name === 'Environment_Floor'
    );
    expect(prefixed.length).toBe(meshes.length);
  });

  it('has photo-supported, inferred and assumed parts', () => {
    const cats = new Set(
      meshes.map((m) => String((m.userData.evidence as Record<string, unknown>).category))
    );
    expect(cats.has('photographic')).toBe(true);
    expect(cats.has('inference')).toBe(true);
    expect(cats.has('assumption')).toBe(true);
  });
});

describe('refCameras', () => {
  it('declares a primary reference pose with 3-element vectors', () => {
    const cams = refCameras.cameras;
    expect(cams.length).toBeGreaterThanOrEqual(3);
    for (const c of cams) {
      expect(c.position.length).toBe(3);
      expect(c.target.length).toBe(3);
      expect(c.fov).toBeGreaterThan(10);
      expect(c.fov).toBeLessThan(90);
      expect(['MEASURED', 'ESTIMATED', 'ASSUMED']).toContain(c.poseTag);
    }
    const ids = cams.map((c) => c.id);
    expect(ids).toContain('ref-primary');
    expect(refCameras.primaryReference).toBe('PHOTO-10');
  });

  it('primary pose points at a photo that exists in the reference sheet', () => {
    const primary = refCameras.cameras.find((c) => c.id === 'ref-primary');
    expect(primary?.file).toBe('WhatsApp Image 2026-10-15 at 4.20.44 PM (1).jpeg');
  });
});

describe('model checklist register', () => {
  it('covers the gate items with statuses and required fields', () => {
    const items = checklist.items as {
      id: string;
      title: string;
      status: string;
      note: string;
      evidence: unknown;
    }[];
    expect(items.length).toBe(14);
    expect(items.some((i) => i.id === 'MC-14')).toBe(true);
    for (const i of items) {
      expect(['done', 'partial', 'missing']).toContain(i.status);
      expect(i.id).toBeTruthy();
      expect(i.title).toBeTruthy();
      expect(i.note).toBeTruthy();
      expect(i.evidence).toBeTruthy();
    }
  });

  it('also covers the Phase 2b wash checklist with unique ids', () => {
    const items = washChecklist.items as { id: string; title: string; status: string }[];
    expect(items.length).toBe(14);
    expect(items.some((i) => i.id === 'WC-14')).toBe(true);
    const mcIds = (checklist.items as { id: string }[]).map((i) => i.id);
    const dupes = items.map((i) => i.id).filter((id) => mcIds.includes(id));
    expect(dupes).toEqual([]);
    for (const i of items) {
      expect(['done', 'partial', 'missing']).toContain(i.status);
      expect(i.title).toBeTruthy();
    }
  });

  it('covers the Phase 2b increment-2 draw oven checklist with unique ids', () => {
    const items = ovenChecklist.items as { id: string; title: string; status: string }[];
    expect(items.length).toBe(14);
    expect(items.some((i) => i.id === 'OC-14')).toBe(true);
    const known = [
      ...(checklist.items as { id: string }[]),
      ...(washChecklist.items as { id: string }[])
    ].map((i) => i.id);
    const dupes = items.map((i) => i.id).filter((id) => known.includes(id));
    expect(dupes).toEqual([]);
    for (const i of items) {
      expect(['done', 'partial', 'missing']).toContain(i.status);
      expect(i.title).toBeTruthy();
    }
  });

  it('covers the Phase 2b increment-3 CV OR workpiece checklist with unique ids', () => {
    const items = workpieceChecklist.items as { id: string; title: string; status: string }[];
    expect(workpieceChecklist.meta.station).toBe('WORKPIECE');
    expect(items.length).toBe(14);
    expect(items.some((i) => i.id === 'WP-14')).toBe(true);
    const known = [
      ...(checklist.items as { id: string }[]),
      ...(washChecklist.items as { id: string }[]),
      ...(ovenChecklist.items as { id: string }[])
    ].map((i) => i.id);
    const dupes = items.map((i) => i.id).filter((id) => known.includes(id));
    expect(dupes).toEqual([]);
    for (const i of items) {
      expect(['done', 'partial', 'missing']).toContain(i.status);
      expect(i.title).toBeTruthy();
    }
    // the workpiece cannot be gated: no photograph isolates it (NV-018)
    expect(items.find((i) => i.id === 'WP-14')?.status).toBe('missing');
  });

  it('covers the Phase 2b increment-4 line-end checklist with unique ids', () => {
    const items = lineEndChecklist.items as { id: string; title: string; status: string }[];
    expect(lineEndChecklist.meta.station).toBe('LINE-END');
    expect(items.length).toBe(16);
    const known = [
      ...(checklist.items as { id: string }[]),
      ...(washChecklist.items as { id: string }[]),
      ...(ovenChecklist.items as { id: string }[]),
      ...(workpieceChecklist.items as { id: string }[])
    ].map((i) => i.id);
    const dupes = items.map((i) => i.id).filter((id) => known.includes(id));
    expect(dupes).toEqual([]);
    for (const i of items) {
      expect(['done', 'partial', 'missing']).toContain(i.status);
      expect(i.title).toBeTruthy();
      expect((i as unknown as { note: string }).note).toBeTruthy();
    }
    // no photograph of this station exists, so it cannot be gated (NV-019)
    expect(items.find((i) => i.id === 'LC-16')?.status).toBe('missing');
    expect(items.find((i) => i.id === 'LC-11')?.status).toBe('missing');
  });

  it('covers the Phase 2b increment-5 identification checklist with unique ids', () => {
    const items = identificationChecklist.items as {
      id: string;
      title: string;
      status: string;
      note: string;
    }[];
    expect(identificationChecklist.meta.station).toBe('IDENT');
    expect(items.length).toBe(16);
    const known = [
      ...(checklist.items as { id: string }[]),
      ...(washChecklist.items as { id: string }[]),
      ...(ovenChecklist.items as { id: string }[]),
      ...(workpieceChecklist.items as { id: string }[]),
      ...(lineEndChecklist.items as { id: string }[])
    ].map((i) => i.id);
    const dupes = items.map((i) => i.id).filter((id) => known.includes(id));
    expect(dupes).toEqual([]);
    for (const i of items) {
      expect(['done', 'partial', 'missing']).toContain(i.status);
      expect(i.title).toBeTruthy();
      expect(i.note).toBeTruthy();
    }
    // neither station is photographed, so it cannot be gated (NV-021)
    expect(items.find((i) => i.id === 'IC-16')?.status).toBe('missing');
    expect(items.find((i) => i.id === 'IC-12')?.status).toBe('missing');
  });
});

describe('wash stations + line composite (Phase 2b)', () => {
  const line = buildLine(makePalette());
  const lineMeshes: MeshLike[] = [];
  const lineObjs = new Map<string, THREE.Object3D>();
  line.root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      lineMeshes.push(o as unknown as MeshLike);
      const id = (o.userData as { id?: string }).id;
      if (id) lineObjs.set(id, o);
    }
  });

  it('re-parents all three stations under one line-level layer tree', () => {
    expect(Object.keys(line.layerGroups)).toEqual(['1', '2', '3', '4', '5']);
    for (const n of ['1', '2', '3', '4', '5']) {
      const kids = line.layerGroups[n].children.map((g) => g.name);
      expect(kids).toContain('STATION_Induction_Layer' + n);
      expect(kids).toContain('STATION_Wash_Layer' + n);
      expect(kids).toContain('STATION_Oven_Layer' + n);
      expect(kids).toContain('STATION_LineEnd_Layer' + n);
      expect(kids).toContain('STATION_Ident_Layer' + n);
      expect(kids).toContain('STATION_Gage_Layer' + n);
      expect(kids).toContain('STATION_Workpiece_Layer' + n);
    }
    expect(line.conceptual.children.map((g) => g.name)).toEqual([
      'STATION_Induction_Conceptual',
      'STATION_Wash_Conceptual',
      'STATION_Oven_Conceptual',
      'STATION_LineEnd_Conceptual',
      'STATION_Ident_Conceptual',
      'STATION_Gage_Conceptual',
      'STATION_Workpiece_Conceptual'
    ]);
  });

  it('names wash meshes WB-/WT- with full metadata and evidence', () => {
    const washParts = lineMeshes.filter((m) => /^(WB-|WT-)/.test(String(m.userData.id)));
    expect(washParts.length).toBeGreaterThan(30);
    const bad: string[] = [];
    for (const m of washParts) {
      const u = m.userData;
      const e = u.evidence as Record<string, unknown> | undefined;
      if (!u.id || !u.name || !u.station || !u.function || !u.dimension || !u.layer) {
        bad.push(`${String(u.id)}: missing metadata`);
      } else if (!e?.sourceId || !e.category || !e.confidence || !e.status || !e.reviewed) {
        bad.push(`${String(u.id)}: incomplete evidence`);
      }
      if (!['WASH-BLANK', 'WASH-TPCV'].includes(String(u.station))) {
        bad.push(`${String(u.id)}: wrong station ${String(u.station)}`);
      }
      if (!['ASSUMED', 'ESTIMATED'].includes(String(u.dimension))) {
        bad.push(`${String(u.id)}: dimension ${String(u.dimension)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('names oven meshes OV- with full metadata and evidence', () => {
    const ovenParts = lineMeshes.filter((m) => /^OV-/.test(String(m.userData.id)));
    expect(ovenParts.length).toBeGreaterThan(40);
    const bad: string[] = [];
    for (const m of ovenParts) {
      const u = m.userData;
      const e = u.evidence as Record<string, unknown> | undefined;
      if (!u.id || !u.name || !u.station || !u.function || !u.dimension || !u.layer) {
        bad.push(`${String(u.id)}: missing metadata`);
      } else if (!e?.sourceId || !e.category || !e.confidence || !e.status || !e.reviewed) {
        bad.push(`${String(u.id)}: incomplete evidence`);
      }
      if (String(u.station) !== 'OVEN') {
        bad.push(`${String(u.id)}: wrong station ${String(u.station)}`);
      }
      if (!['ASSUMED', 'ESTIMATED'].includes(String(u.dimension))) {
        bad.push(`${String(u.id)}: dimension ${String(u.dimension)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('names the CV OR workpiece meshes WP- with full metadata and evidence', () => {
    const wpParts = lineMeshes.filter((m) => /^WP-/.test(String(m.userData.id)));
    expect(wpParts.length).toBeGreaterThanOrEqual(20);
    const bad: string[] = [];
    for (const m of wpParts) {
      const u = m.userData;
      const e = u.evidence as Record<string, unknown> | undefined;
      if (!u.id || !u.name || !u.station || !u.function || !u.dimension || !u.layer) {
        bad.push(`${String(u.id)}: missing metadata`);
      } else if (!e?.sourceId || !e.category || !e.confidence || !e.status || !e.reviewed) {
        bad.push(`${String(u.id)}: incomplete evidence`);
      }
      if (String(u.station) !== 'WORKPIECE') {
        bad.push(`${String(u.id)}: wrong station ${String(u.station)}`);
      }
      if (!['ASSUMED', 'ESTIMATED'].includes(String(u.dimension))) {
        bad.push(`${String(u.id)}: dimension ${String(u.dimension)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('models the CV OR workpiece as a bell with a stem, not a tripot', () => {
    const ids = new Set(lineMeshes.map((m) => String(m.userData.id)));
    expect(ids.has('WP-RACE-WALL-1')).toBe(true);
    expect(ids.has('WP-RACE-WALL-3')).toBe(true);
    expect(ids.has('WP-STEM')).toBe(true);
    expect(ids.has('WP-MOUTH-LIP')).toBe(true);
    expect(ids.has('WP-SPLINE')).toBe(true);
    expect(ids.has('WP-MARK-DM')).toBe(true);
    // the Phase 2a proxy is replaced, not layered over
    expect(ids.has('IND-PART-SHAFT')).toBe(false);
    expect(ids.has('IND-PART-HEAD')).toBe(false);
    expect(ids.has('IND-PART-STUB')).toBe(false);
  });

  it('exposes the workpiece rig (L5 heat material, emissive off)', () => {
    const wp = line.workpieceRig;
    expect(wp).toBeDefined();
    expect(wp?.heat.emissive).toBeDefined();
    expect(wp?.heat.emissiveIntensity).toBe(0);
  });

  it('mixes photo, document, inference and caption-only evidence on the oven', () => {
    const cats = new Set(
      lineMeshes
        .filter((m) => /^OV-/.test(String(m.userData.id)))
        .map((m) => String((m.userData.evidence as Record<string, unknown>).category))
    );
    expect(cats.has('photographic')).toBe(true);
    expect(cats.has('document')).toBe(true);
    expect(cats.has('inference')).toBe(true);
    expect(cats.has('assumption')).toBe(true);
    expect(cats.has('needs-verification')).toBe(true);
    expect(cats.has('measured')).toBe(false);
  });

  it('every mesh in the composite is uniquely identified', () => {
    const ids = lineMeshes.map((m) => String(m.userData.id));
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('exposes the wash rig (spray, part carriers, light-curtain beams)', () => {
    const wr = line.washRig;
    expect(wr).toBeDefined();
    expect(wr?.sprays.length).toBeGreaterThanOrEqual(1);
    expect(wr?.partCarriers.length).toBeGreaterThanOrEqual(2);
    expect(wr?.beams.length).toBeGreaterThanOrEqual(1);
    expect(wr?.sprays[0]?.droplets.length).toBeGreaterThan(10);
  });

  it('washer windows join the shared glass x-ray list', () => {
    expect(line.rig.glazing.length).toBe(6);
  });

  it('exposes the oven rig (chamber heat material)', () => {
    const ov = line.ovenRig;
    expect(ov).toBeDefined();
    expect(ov?.chamberMaterial.emissive).toBeDefined();
    expect(ov?.chamberMaterial.emissiveIntensity).toBeGreaterThan(0);
  });

  it('names identification meshes LM- and RD- with full metadata and evidence', () => {
    const idParts = lineMeshes.filter((m) => /^(LM-|RD-)/.test(String(m.userData.id)));
    expect(idParts.length).toBeGreaterThan(30);
    const bad: string[] = [];
    for (const m of idParts) {
      const u = m.userData;
      const e = u.evidence as Record<string, unknown> | undefined;
      if (!u.id || !u.name || !u.station || !u.function || !u.dimension || !u.layer) {
        bad.push(`${String(u.id)}: missing metadata`);
      } else if (!e?.sourceId || !e.category || !e.confidence || !e.status || !e.reviewed) {
        bad.push(`${String(u.id)}: incomplete evidence`);
      }
      if (!['MARKING', 'READER'].includes(String(u.station))) {
        bad.push(`${String(u.id)}: wrong station ${String(u.station)}`);
      }
      if (!['ASSUMED', 'ESTIMATED'].includes(String(u.dimension))) {
        bad.push(`${String(u.id)}: dimension ${String(u.dimension)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('names line-end meshes LE- with full metadata and evidence', () => {
    const leParts = lineMeshes.filter((m) => /^LE-/.test(String(m.userData.id)));
    expect(leParts.length).toBeGreaterThan(40);
    const bad: string[] = [];
    for (const m of leParts) {
      const u = m.userData;
      const e = u.evidence as Record<string, unknown> | undefined;
      if (!u.id || !u.name || !u.station || !u.function || !u.dimension || !u.layer) {
        bad.push(`${String(u.id)}: missing metadata`);
      } else if (!e?.sourceId || !e.category || !e.confidence || !e.status || !e.reviewed) {
        bad.push(`${String(u.id)}: incomplete evidence`);
      }
      if (!['UNLOAD', 'BOXING'].includes(String(u.station))) {
        bad.push(`${String(u.id)}: wrong station ${String(u.station)}`);
      }
      if (!['ASSUMED', 'ESTIMATED'].includes(String(u.dimension))) {
        bad.push(`${String(u.id)}: dimension ${String(u.dimension)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('completes the line at the oven discharge roller and keeps one belt height', () => {
    const belt = lineObjs.get('LE-CV-BELT') as THREE.Mesh | undefined;
    const roller = lineObjs.get('LE-CV-ROLLER-END') as THREE.Mesh | undefined;
    expect(belt).toBeDefined();
    expect(roller).toBeDefined();
    const w = (belt?.geometry as THREE.BoxGeometry).parameters.width;
    // the cooling conveyor starts exactly where the accepted oven model ends
    // (x 7.45 = the oven discharge end roller) and its far end carries the roller
    expect((belt?.position.x ?? 0) - w / 2).toBeCloseTo(7.45, 5);
    expect(roller?.position.x).toBeCloseTo((belt?.position.x ?? 0) + w / 2, 5);
  });

  it('has the good and reject box houses, WIP trolley and a stacked lamp post', () => {
    const has = (id: string): boolean => lineObjs.has(id);
    for (const id of [
      'LE-BOX-GOOD-LID',
      'LE-BOX-BAD-LID',
      'LE-LABEL-GOOD',
      'LE-LABEL-BAD',
      'LE-TROLLEY-DECK',
      'LE-TROLLEY-CASTOR-11',
      'LE-WIP-PARTS',
      'LE-TRAY-PARTS',
      'LE-SCANNER-HEAD',
      'LE-LAMP-RED',
      'LE-LAMP-AMBER',
      'LE-LAMP-GREEN'
    ]) {
      expect(has(id)).toBe(true);
    }
  });

  it('exposes the line-end rig (stack lamps off, drifting belt parts)', () => {
    const le = line.lineEndRig;
    expect(le).toBeDefined();
    expect(le?.lamps.red.emissive).toBeDefined();
    expect(le?.lamps.red.emissiveIntensity).toBeLessThan(0.2);
    expect(le?.lamps.green.emissiveIntensity).toBeLessThan(0.2);
    expect(le?.beltParts.children.length).toBe(3);
  });

  it('is honest that the line end has no photograph to match (all LE- evidence is documents or assumptions)', () => {
    const leParts = lineMeshes.filter((m) => /^LE-/.test(String(m.userData.id)));
    const cats = new Set(
      leParts.map((m) => String((m.userData.evidence as Record<string, unknown>).category))
    );
    expect(cats.has('photographic')).toBe(true);
    expect(cats.has('document')).toBe(true);
    expect(cats.has('inference')).toBe(true);
    expect(cats.has('assumption')).toBe(true);
    expect(cats.has('measured')).toBe(false);
  });

  it('stays inside the 350k triangle budget for a whole-line view', () => {
    const total = lineMeshes.reduce((s, m) => s + trianglesOf(m), 0);
    expect(total).toBeLessThanOrEqual(350000);
    expect(total).toBeGreaterThan(20000);
  });

  it('runs one continuous conveyor at one height into the induction feed', () => {
    const y = (id: string): number => {
      const o = lineObjs.get(id) as THREE.Mesh | undefined;
      return o ? o.position.y : Number.NaN;
    };
    expect(y('WB-CV-BELT')).toBeCloseTo(1.01, 5);
    expect(y('WT-CV-BELT')).toBeCloseTo(1.01, 5);
    expect(y('IND-C-BELT')).toBeCloseTo(1.01, 5);
    expect(y('OV-CV-IN-BELT')).toBeCloseTo(1.01, 5);
    expect(y('OV-CV-IN-FURNACE')).toBeCloseTo(1.01, 5);
    expect(y('OV-CV-OUT-BELT')).toBeCloseTo(1.01, 5);
    expect(y('LE-CV-BELT')).toBeCloseTo(1.01, 5);
  });
});

describe('gage station + operator + line simulation (Phase 3)', () => {
  const line = buildLine(makePalette());
  const lineMeshes: MeshLike[] = [];
  line.root.traverse((o) => {
    const any = o as unknown as MeshLike;
    if ((o as THREE.Mesh).isMesh) lineMeshes.push(any);
  });

  it('covers the Phase 3 gage / operator / sim checklist with unique ids', () => {
    const items = gageChecklist.items as { id: string; title: string; status: string; note: string }[];
    expect(gageChecklist.meta.station).toBe('GAGE');
    expect(items.length).toBe(19);
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of items) {
      expect(i.title.length, `${i.id} title`).toBeGreaterThan(3);
      expect(i.note.length, `${i.id} note`).toBeGreaterThan(10);
      expect(['done', 'partial', 'missing']).toContain(i.status);
    }
    expect(items.find((i) => i.id === 'GS-16')?.status).toBe('missing');
    expect(items.find((i) => i.id === 'GS-15')?.status).toBe('missing');
    expect(items.find((i) => i.id === 'GS-12')?.status).toBe('missing');
  });

  it('names the gage station meshes GAGE- with full metadata and evidence', () => {
    const gageParts = lineMeshes.filter((m) => /^GAGE-/.test(String(m.userData.id)));
    expect(gageParts.length).toBeGreaterThan(10);
    for (const m of gageParts) {
      expect(String(m.userData.name ?? '').length, `${m.userData.id} name`).toBeGreaterThan(2);
      expect(m.userData.evidence).toBeTruthy();
      expect(String(m.userData.station)).toBe('GAGE');
    }
  });

  it('names the operator actor meshes OP- with full metadata and evidence', () => {
    const opParts = lineMeshes.filter((m) => /^OP-/.test(String(m.userData.id)));
    expect(opParts.length).toBeGreaterThan(8);
    for (const m of opParts) {
      expect(m.userData.evidence).toBeTruthy();
      expect(String(m.userData.function)).toContain('operator');
    }
  });

  it('exposes the gage rig (plunger) and the operator rig (right arm pivot)', () => {
    expect(line.gageRig.plunger).toBeDefined();
    expect(line.gageRig.plunger.name).toBe('GAGE-PLUNGER');
    expect(line.gageRig.goMaterial).toBeDefined();
    expect(line.gageRig.noGoMaterial).toBeDefined();
    expect(line.operator.rightArm).toBeDefined();
    expect(line.operator.root.name).toBe('STATION_Operator');
  });

  it('goes through the GO and NO-GO masters and a conceptual placard, nothing MEASURED', () => {
    const ids = new Set(lineMeshes.map((m) => String(m.userData.id)));
    expect(ids.has('GAGE-GO')).toBe(true);
    expect(ids.has('GAGE-NOGO')).toBe(true);
    expect(ids.has('GAGE-PLACARD')).toBe(true);
    expect(ids.has('GAGE-NV')).toBe(true);
    for (const m of lineMeshes.filter((m) => /^(GAGE-|OP-)/.test(String(m.userData.id)))) {
      expect(String(m.userData.dimension)).not.toBe('MEASURED');
    }
  });
});
