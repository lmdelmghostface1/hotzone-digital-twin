import * as THREE from 'three';
import type { Palette } from './materials';
import {
  EVIDENCE_CATS,
  at,
  box,
  cyl,
  labelTexture,
  part,
  place,
  tagInstanced,
  warningTexture
} from './util';
import type { BuiltLayers, OvenRig, PartEvidence, PartMeta } from './util';

const F_OV = '4.20.44 PM (3).jpeg'; // PHOTO-12 (draw oven exit, contact-sheet review)
const F_CAB = '4.20.44 PM (2).jpeg'; // PHOTO-11 (oven control cabinets, contact-sheet review)

// ---- estimated line layout (no dimensioned drawings exist; NV-011) ----
// The line continues east of the Phase 2a induction machine; the model has no
// induction exit opening, so the oven loading conveyor starts at the machine face.
const LINE_Z = -0.15;
const BELT_Y = 1.025;
const OV_X0 = 2.2;
const OV_X1 = 5.8;
const OV_LEN = OV_X1 - OV_X0; // 3.6
const OV_CX = (OV_X0 + OV_X1) / 2;
const OV_Z0 = -1.0;
const OV_Z1 = 0.7;
const OV_D = OV_Z1 - OV_Z0; // 1.7
const OV_CZ = (OV_Z0 + OV_Z1) / 2; // -0.15 == LINE_Z
const OV_Y0 = 0.55;
const OV_Y1 = 2.6;
const OPEN_Y0 = 0.9;
const OPEN_Y1 = 1.75;
const OPEN_Z0 = -0.65;
const OPEN_Z1 = 0.35;

export interface BuiltOven extends BuiltLayers {
  rig: OvenRig;
}

interface OCtx {
  p: Palette;
  l1: THREE.Group;
  l2: THREE.Group;
  l3: THREE.Group;
  l4: THREE.Group;
  l5: THREE.Group;
  conceptual: THREE.Group;
  rig: OvenRig;
}

// Paint colours estimated from the reference photos (no colour charts exist):
// PHOTO-12 shows a beige/cream oven (~RGB 205,193,181), PHOTO-11 shows light-grey
// /cream cabinets (~RGB 210,204,191). Local materials, not palette defaults.
const SHELL_MAT = new THREE.MeshStandardMaterial({ color: 0xcfc5b6, roughness: 0.62, metalness: 0.22 });
const CAB_MAT = new THREE.MeshStandardMaterial({ color: 0xd2ccc0, roughness: 0.55, metalness: 0.2 });
const CAB_DOOR_MAT = new THREE.MeshStandardMaterial({ color: 0xc4beb1, roughness: 0.55, metalness: 0.25 });

function metaFor(station: string) {
  return (
    id: string,
    name: string,
    fn: string,
    evidence: PartEvidence,
    dimension: PartMeta['dimension'],
    layer: PartMeta['layer']
  ): PartMeta => ({ id, name, station, function: fn, evidence, dimension, layer });
}

function plate(
  text: string,
  w: number,
  h: number,
  m: PartMeta,
  bg = '#f2f2f2',
  fg = '#1a1a1a'
): THREE.Mesh {
  return part(
    new THREE.BoxGeometry(w, h, 0.02),
    new THREE.MeshStandardMaterial({ map: labelTexture(text, bg, fg), roughness: 0.7 }),
    m
  );
}

function warningPlate(w: number, h: number, m: PartMeta): THREE.Mesh {
  return part(
    new THREE.BoxGeometry(w, h, 0.012),
    new THREE.MeshStandardMaterial({ map: warningTexture(), roughness: 0.7 }),
    m
  );
}

/** caption-only claims that image review did not confirm (NV-007) */
const evCaption = (claim: string): PartEvidence => ({
  sourceId: `PDF caption "${claim}" for PHOTO:${F_CAB} - not confirmed in image review (NV-007)`,
  category: 'needs-verification',
  confidence: 'low',
  status: 'unverified',
  reviewed: '2026-10-15'
});

function buildOvenBody(c: OCtx): void {
  const { p, l1, l2, l3, l4, rig } = c;
  const M = metaFor('OVEN');
  const ev = EVIDENCE_CATS.photoMedium(F_OV);
  const evDoc = (page: string): ReturnType<typeof EVIDENCE_CATS.document> =>
    EVIDENCE_CATS.document('Project_Document.pdf', page);
  const evA = EVIDENCE_CATS.assumption('oven size and placement ASSUMED - no dimensioned drawings (NV-011)');
  const evIn = EVIDENCE_CATS.inference(
    `${F_OV} (line continuity - the Phase 2a induction model has no exit opening)`
  );

  // L1 silhouette: shell panels, end frames around the belt openings, body legs
  l1.add(place(box(OV_LEN, 0.06, OV_D, SHELL_MAT, M('OV-SHELL-ROOF', 'Draw oven roof panel', 'furnace shell', ev, 'ESTIMATED', 1)), OV_CX, OV_Y1 - 0.03, OV_CZ));
  l1.add(place(box(OV_LEN, 0.06, OV_D, SHELL_MAT, M('OV-SHELL-PAN', 'Draw oven base pan', 'furnace shell', ev, 'ESTIMATED', 1)), OV_CX, OV_Y0 + 0.03, OV_CZ));
  l1.add(place(box(OV_LEN, OV_Y1 - OV_Y0, 0.06, SHELL_MAT, M('OV-SHELL-SIDE-F', 'Draw oven front side wall', 'furnace shell', ev, 'ESTIMATED', 1)), OV_CX, (OV_Y0 + OV_Y1) / 2, OV_Z1 - 0.03));
  l1.add(place(box(OV_LEN, OV_Y1 - OV_Y0, 0.06, SHELL_MAT, M('OV-SHELL-SIDE-B', 'Draw oven rear side wall', 'furnace shell', ev, 'ESTIMATED', 1)), OV_CX, (OV_Y0 + OV_Y1) / 2, OV_Z0 + 0.03));
  for (const [end, x] of [['exit', OV_X1], ['entrance', OV_X0]] as [string, number][]) {
    l1.add(place(box(0.06, OV_Y1 - OPEN_Y1, OV_D, SHELL_MAT, M(`OV-END-HEADER-${end}`, `${end} end header`, 'furnace end wall', ev, 'ESTIMATED', 1)), x, (OPEN_Y1 + OV_Y1) / 2, OV_CZ));
    l1.add(place(box(0.06, OPEN_Y0 - OV_Y0, OV_D, SHELL_MAT, M(`OV-END-APRON-${end}`, `${end} end apron`, 'furnace end wall', ev, 'ESTIMATED', 1)), x, (OV_Y0 + OPEN_Y0) / 2, OV_CZ));
    l1.add(place(box(0.06, OPEN_Y1 - OPEN_Y0, Math.abs(OPEN_Z0 - OV_Z0), SHELL_MAT, M(`OV-END-PIER-${end}-A`, `${end} end pier A`, 'furnace end wall', ev, 'ESTIMATED', 1)), x, (OPEN_Y0 + OPEN_Y1) / 2, (OV_Z0 + OPEN_Z0) / 2));
    l1.add(place(box(0.06, OPEN_Y1 - OPEN_Y0, Math.abs(OV_Z1 - OPEN_Z1), SHELL_MAT, M(`OV-END-PIER-${end}-B`, `${end} end pier B`, 'furnace end wall', ev, 'ESTIMATED', 1)), x, (OPEN_Y0 + OPEN_Y1) / 2, (OPEN_Z1 + OV_Z1) / 2));
  }

  // L2 mechanical: body legs, conveyors, blower
  for (const [i, x] of [OV_X0 + 0.25, OV_CX, OV_X1 - 0.25].entries()) {
    for (const [j, z] of [OV_Z0 + 0.15, OV_Z1 - 0.15].entries()) {
      l2.add(place(box(0.09, OV_Y0, 0.09, p.steel, M(`OV-LEG-${i}${j}`, `Oven body leg ${i}${j}`, 'support frame', ev, 'ESTIMATED', 2)), x, OV_Y0 / 2, z));
      l2.add(place(cyl(0.05, 0.05, 0.04, 12, p.bolt, M(`OV-FOOT-${i}${j}`, `Levelling foot ${i}${j}`, 'leveling foot', ev, 'ESTIMATED', 2)), x, 0.02, z));
    }
  }
  for (const [i, z] of [OV_Z0 + 0.15, OV_Z1 - 0.15].entries()) {
    l2.add(place(box(OV_LEN - 0.5, 0.08, 0.08, p.steel, M(`OV-CROSSRAIL-${i}`, `Body cross rail ${i}`, 'support frame', ev, 'ESTIMATED', 2)), OV_CX, 0.16, z));
  }

  const beltMat = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.55, metalness: 0.5 });

  // exit conveyor (PHOTO-12: metal belt leaving the oven with a tray of parts)
  l2.add(place(box(1.8, 0.1, 0.44, p.panelGrey, M('OV-CV-OUT-BED', 'Exit conveyor bed', 'oven discharge conveyor', ev, 'ESTIMATED', 2)), 6.55, 0.95, LINE_Z));
  l2.add(place(box(1.8, 0.03, 0.36, beltMat, M('OV-CV-OUT-BELT', 'Exit metal belt', 'oven discharge conveyor belt', ev, 'ESTIMATED', 2)), 6.55, BELT_Y - 0.015, LINE_Z));
  for (const [i, z] of [LINE_Z - 0.21, LINE_Z + 0.21].entries()) {
    l2.add(place(box(1.8, 0.1, 0.05, p.panelGrey, M(`OV-CV-OUT-RAIL-${i}`, `Exit conveyor side rail ${i}`, 'conveyor guard rail', ev, 'ESTIMATED', 2)), 6.55, 0.99, z));
  }
  for (const [i, x] of [7.1, 7.4].entries()) {
    for (const [j, z] of [LINE_Z - 0.15, LINE_Z + 0.15].entries()) {
      l2.add(place(box(0.07, 0.9, 0.07, p.steel, M(`OV-CV-OUT-LEG-${i}${j}`, `Exit conveyor leg ${i}${j}`, 'conveyor support', ev, 'ESTIMATED', 2)), x, 0.45, z));
    }
  }
  l2.add(at(cyl(0.05, 0.05, 0.4, 14, p.steel, M('OV-CV-OUT-ROLLER', 'Exit conveyor end roller', 'conveyor roller', ev, 'ESTIMATED', 2)), 7.45, BELT_Y - 0.015, LINE_Z, Math.PI / 2, 0, 0));

  // loading conveyor between the induction machine face and the oven entrance
  l2.add(place(box(1.3, 0.1, 0.44, p.panelGrey, M('OV-CV-IN-BED', 'Oven loading conveyor bed', 'oven loading conveyor', evDoc('4'), 'ESTIMATED', 2)), 1.6, 0.95, LINE_Z));
  l2.add(place(box(1.3, 0.03, 0.36, beltMat, M('OV-CV-IN-BELT', 'Oven loading conveyor belt', 'oven loading conveyor belt', evDoc('4'), 'ESTIMATED', 2)), 1.6, BELT_Y - 0.015, LINE_Z));
  for (const [i, z] of [LINE_Z - 0.21, LINE_Z + 0.21].entries()) {
    l2.add(place(box(1.3, 0.1, 0.05, p.panelGrey, M(`OV-CV-IN-RAIL-${i}`, `Loading conveyor side rail ${i}`, 'conveyor guard rail', evIn, 'ESTIMATED', 2)), 1.6, 0.99, z));
  }
  for (const [i, x] of [1.05, 2.15].entries()) {
    for (const [j, z] of [LINE_Z - 0.15, LINE_Z + 0.15].entries()) {
      l2.add(place(box(0.07, 0.9, 0.07, p.steel, M(`OV-CV-IN-LEG-${i}${j}`, `Loading conveyor leg ${i}${j}`, 'conveyor support', evIn, 'ESTIMATED', 2)), x, 0.45, z));
    }
  }

  // axial blower on the roof (existence from the set-up parameters, shape assumed)
  l2.add(at(cyl(0.2, 0.2, 0.7, 16, p.panelDark, M('OV-BLOWER-H', 'Axial blower housing', 'recirculation blower', evDoc('4'), 'ASSUMED', 2)), OV_CX - 0.4, 2.85, -0.55, 0, 0, Math.PI / 2));
  l2.add(at(cyl(0.12, 0.12, 0.34, 14, p.servoBlack, M('OV-BLOWER-M', 'Blower motor', 'blower drive', evDoc('4'), 'ASSUMED', 2)), OV_CX + 0.15, 2.85, -0.55, 0, 0, Math.PI / 2));
  l2.add(place(box(0.28, 0.3, 0.28, p.panelDark, M('OV-BLOWER-DUCT', 'Blower duct connection', 'air duct', evDoc('4'), 'ASSUMED', 2)), OV_CX - 0.85, 2.75, -0.55));

  // L3 functional: tray with ball-stud parts, furnace interior
  l3.add(place(box(0.62, 0.03, 0.5, p.steel, M('OV-TRAY', 'Parts tray on the exit belt', 'part carrier tray', ev, 'ESTIMATED', 3)), 6.3, BELT_Y + 0.015, LINE_Z));

  const studX = [6.1, 6.3, 6.5];
  const studZ = [LINE_Z - 0.11, LINE_Z + 0.11];
  const balls = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.04, 14, 10),
    p.partSteel,
    studX.length * studZ.length
  );
  const stems = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.07, 10),
    p.partSteel,
    studX.length * studZ.length
  );
  const m4 = new THREE.Matrix4();
  let si = 0;
  for (const bx of studX) {
    for (const bz of studZ) {
      m4.makeTranslation(bx, BELT_Y + 0.13, bz);
      balls.setMatrixAt(si, m4);
      m4.makeTranslation(bx, BELT_Y + 0.075, bz);
      stems.setMatrixAt(si, m4);
      si += 1;
    }
  }
  balls.instanceMatrix.needsUpdate = true;
  stems.instanceMatrix.needsUpdate = true;
  tagInstanced(balls, M('OV-STUD-BALL', 'Ball-stud heads on tray (instanced)', 'workpiece ball studs', ev, 'ESTIMATED', 3));
  tagInstanced(stems, M('OV-STUD-STEM', 'Ball-stud stems on tray (instanced)', 'workpiece ball studs', ev, 'ESTIMATED', 3));
  l3.add(balls);
  l3.add(stems);

  l3.add(place(box(OV_LEN - 0.2, 1.7, 0.04, rig.chamberMaterial, M('OV-CHAMBER', 'Furnace chamber liner (heat visualisation)', 'tempering chamber', evDoc('3'), 'ASSUMED', 3)), OV_CX, 1.6, OV_Z0 + 0.12));
  l3.add(place(box(OV_LEN - 0.2, 0.03, 0.36, beltMat, M('OV-CV-IN-FURNACE', 'Furnace belt inside the chamber', 'furnace conveyor belt', evDoc('4'), 'ESTIMATED', 3)), OV_CX, BELT_Y - 0.015, LINE_Z));

  // L4 detail: placards, nameplates, posted sheet, warning label, bolts
  l4.add(at(plate('OP_100402', 0.44, 0.16, M('OV-L-PLACARD-1', 'Station placard OP_100402', 'station identification placard', evDoc('2'), 'ASSUMED', 4)), OV_X1 + 0.035, 2.3, OV_CZ, 0, Math.PI / 2, 0));
  l4.add(at(plate('SV-000091', 0.44, 0.16, M('OV-L-PLACARD-2', 'Asset placard SV-000091', 'asset identification placard', evDoc('2'), 'ASSUMED', 4)), OV_X1 + 0.035, 2.1, OV_CZ, 0, Math.PI / 2, 0));
  l4.add(place(plate('DRAW OVEN', 0.5, 0.16, M('OV-L-NAME', 'Draw oven nameplate', 'station nameplate', ev, 'ASSUMED', 4)), OV_CX, 2.2, OV_Z1 + 0.035));
  l4.add(place(plate('CVOR #4', 0.5, 0.16, M('OV-L-LINE', 'Line placard CVOR #4', 'line identification placard', ev, 'ASSUMED', 4)), OV_CX, 2.0, OV_Z1 + 0.035));
  l4.add(place(plate('163C X3', 0.3, 0.13, M('OV-L-ZONES', 'Zone setpoint label (163 C x 3 zones)', 'parameter label', evDoc('4'), 'ASSUMED', 4)), OV_CX - 1.0, 1.7, OV_Z1 + 0.035));
  l4.add(at(plate('SET UP', 0.26, 0.36, M('OV-L-SHEET', 'Posted work instruction sheet', 'posted work instruction', EVIDENCE_CATS.inference(`${F_OV} (sheet visible; identity inferred from DC-010 set-up sheet)`), 'ASSUMED', 4)), OV_X1 + 0.035, 1.35, 0.525, 0, Math.PI / 2, 0));
  l4.add(at(warningPlate(0.16, 0.16, M('OV-L-WARN', 'Warning sticker', 'safety label', ev, 'ESTIMATED', 4)), OV_X1 + 0.03, 0.725, OV_CZ, 0, Math.PI / 2, 0));

  // CONCEPTUAL layer: rear service details, never photographed
  c.conceptual.add(place(box(0.7, 0.9, 0.05, SHELL_MAT, M('OV-REAR-DOOR', 'Rear service access door (never photographed)', 'service access', evA, 'ASSUMED', 'conceptual')), 3.2, 1.35, OV_Z0 - 0.025));
  c.conceptual.add(place(box(0.03, 0.14, 0.05, p.steel, M('OV-REAR-DOOR-HANDLE', 'Rear door handle (never photographed)', 'door handle', evA, 'ASSUMED', 'conceptual')), 3.5, 1.35, OV_Z0 - 0.05));

  const boltGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.02, 8);  const bolts = new THREE.InstancedMesh(boltGeo, p.bolt, 8);
  let bo = 0;
  for (let i = 0; i < 8; i++) {
    const bz = OV_Z0 + 0.25 + (i * (OV_D - 0.5)) / 7;
    m4.makeRotationZ(Math.PI / 2);
    m4.setPosition(OV_X1 + 0.03, (OPEN_Y1 + OV_Y1) / 2, bz);
    bolts.setMatrixAt(bo++, m4);
  }
  bolts.instanceMatrix.needsUpdate = true;
  tagInstanced(bolts, M('OV-BOLTS', 'End-panel bolts (instanced)', 'fasteners', ev, 'ESTIMATED', 4));
  l4.add(bolts);
}

function buildCabinets(c: OCtx): void {
  const { p, l1, l2, l3, l4 } = c;
  const M = metaFor('OVEN');
  const ev = EVIDENCE_CATS.photoMedium(F_CAB);
  const evA = EVIDENCE_CATS.assumption('cabinet row placement ASSUMED - the photo does not show where the cabinets stand relative to the oven');
  const xs = [2.7, 3.42, 4.14, 4.86];
  const CZ = 1.75;
  const doorMat = CAB_DOOR_MAT;

  // L1 silhouette: cabinet bodies + common plinth
  l1.add(place(box(3.0, 0.1, 0.56, p.panelDark, M('OV-CAB-PLINTH', 'Cabinet plinth', 'cabinet base', evA, 'ASSUMED', 1)), 3.78, 0.05, CZ));
  for (const [i, x] of xs.entries()) {
    l1.add(place(box(0.65, 1.9, 0.5, CAB_MAT, M(`OV-CAB-${i}`, `Control cabinet ${i + 1} body`, 'electrical cabinet', ev, 'ESTIMATED', 1)), x, 1.0, CZ));
  }

  // L2 mechanical: doors, handles, hinges
  for (const [i, x] of xs.entries()) {
    l2.add(place(box(0.56, 1.72, 0.015, doorMat, M(`OV-CAB-DOOR-${i}`, `Cabinet ${i + 1} door`, 'cabinet door', ev, 'ESTIMATED', 2)), x, 1.0, CZ + 0.255));
    l2.add(place(box(0.03, 0.16, 0.04, p.steel, M(`OV-CAB-HANDLE-${i}`, `Cabinet ${i + 1} handle`, 'door handle', ev, 'ESTIMATED', 2)), x + 0.2, 1.0, CZ + 0.27));
    for (const [j, y] of [0.45, 1.55].entries()) {
      l2.add(place(cyl(0.012, 0.012, 0.08, 8, p.steel, M(`OV-CAB-HINGE-${i}${j}`, `Cabinet ${i + 1} hinge ${j}`, 'door hinge', ev, 'ESTIMATED', 2)), x - 0.26, y, CZ + 0.262));
    }
  }

  // L3 functional: indicator lights and push buttons
  l3.add(at(cyl(0.018, 0.018, 0.02, 12, p.ledGreen, M('OV-CAB-L1', 'Cabinet green indicator lamp', 'indicator lamp', ev, 'ESTIMATED', 3)), xs[0], 1.78, CZ + 0.27, Math.PI / 2, 0, 0));
  l3.add(at(cyl(0.018, 0.018, 0.02, 12, p.ledRed, M('OV-CAB-L2', 'Cabinet red indicator lamp', 'indicator lamp', ev, 'ESTIMATED', 3)), xs[1], 1.78, CZ + 0.27, Math.PI / 2, 0, 0));
  for (const [i, y] of [1.7, 1.55, 1.4].entries()) {
    l3.add(at(cyl(0.024, 0.024, 0.03, 12, i === 1 ? p.panelDark : p.redCover, M(`OV-CAB-BTN-${i}`, `Cabinet push button ${i + 1}`, 'operator control', ev, 'ESTIMATED', 3)), xs[2], y, CZ + 0.27, Math.PI / 2, 0, 0));
  }

  // L4 detail: controllers, meter, OK sign, maker plate, warning labels
  for (const [i, y] of [1.62, 1.44, 1.26].entries()) {
    l4.add(place(plate(`Z${i + 1}`, 0.16, 0.11, M(`OV-CAB-ZC-${i}`, `Zone ${i + 1} controller display`, 'zone temperature controller', evCaption('3 zone controllers'), 'ASSUMED', 4), '#0d1116', '#79e6a4'), xs[0], y, CZ + 0.262));
  }
  l4.add(place(plate('354368', 0.3, 0.13, M('OV-CAB-METER', 'Energy meter display', 'energy meter', evCaption('energy meter 354368'), 'ASSUMED', 4)), xs[1], 1.5, CZ + 0.262));
  l4.add(place(plate('OK', 0.18, 0.14, M('OV-CAB-OK', "Cabinet 'OK' status sign", 'status sign', ev, 'ESTIMATED', 4), '#1f8f3a', '#ffffff'), xs[3], 1.7, CZ + 0.262));
  l4.add(place(plate('THERELEK', 0.36, 0.12, M('OV-CAB-MAKER', 'Therelek maker plate', 'manufacturer nameplate', evDocMaker(), 'ASSUMED', 4)), xs[2], 0.3, CZ + 0.262));
  l4.add(place(warningPlate(0.16, 0.14, M('OV-CAB-W1', 'Cabinet warning label', 'safety label', ev, 'ESTIMATED', 4)), xs[1], 0.9, CZ + 0.262));
  l4.add(place(warningPlate(0.16, 0.14, M('OV-CAB-W2', 'Cabinet warning label 2', 'safety label', ev, 'ESTIMATED', 4)), xs[3], 1.0, CZ + 0.262));
}

function evDocMaker(): ReturnType<typeof EVIDENCE_CATS.document> {
  return EVIDENCE_CATS.document('Project_Document.pdf', '2');
}

export function buildOven(palette: Palette): BuiltOven {
  const root = new THREE.Group();
  root.name = 'STATION_Oven';

  const layerGroups: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_Oven_Layer${n}`;
    layerGroups[n] = g;
    root.add(g);
  }
  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_Oven_Conceptual';
  root.add(conceptual);

  const chamberMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2420,
    roughness: 0.9,
    metalness: 0.1,
    emissive: 0x000000,
    emissiveIntensity: 1.0
  });

  const rig: OvenRig = { chamberMaterial };
  const ctx: OCtx = {
    p: palette,
    l1: layerGroups['1'],
    l2: layerGroups['2'],
    l3: layerGroups['3'],
    l4: layerGroups['4'],
    l5: layerGroups['5'],
    conceptual,
    rig
  };

  buildOvenBody(ctx);
  buildCabinets(ctx);

  return { layerGroups, conceptual, rig };
}


