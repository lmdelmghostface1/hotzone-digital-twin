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
  tagInstanced
} from './util';
import type { BuiltLayers, LineEndRig, PartEvidence, PartMeta } from './util';

// Phase 2b increment 4: the line end - cooling / unloading (PF-009) and the
// unload / boxing station (EQ-008, PF-012).
//
// Evidence note: NO photograph shows this area of the line. PHOTO-01 shows the
// blank-wash conveyor (its mounted handheld scanner is the model for the boxing
// scanner), PHOTO-12 shows the oven discharge belt with parts on a tray, and
// PHOTO-22 / PHOTO-28 (work instruction, boxing steps, yellow bins) plus
// PHOTO-42 (boxing orientation with red BAD / green GOOD box houses) are paper
// documents. Every dimension here is therefore ESTIMATED from those documents or
// ASSUMED outright; nothing is MEASURED (NV-011) and the station has no
// reference photograph to photo-match against (NV-019).
const F_OV = '4.20.44 PM (3).jpeg'; // PHOTO-12 oven exit belt, parts on a tray
const F_BOX = '4.21.01 PM.jpeg'; // PHOTO-42 boxing orientation, GOOD / BAD boxes
const F_WI = '4.21.00 PM (2).jpeg'; // PHOTO-22 work instruction CVOR (boxing steps, yellow bins)
const F_WI2 = '4.21.00 PM (8).jpeg'; // PHOTO-28 same instruction, full page
const F_SCAN = '4.20.41 PM.jpeg'; // PHOTO-01 green handheld scanner at blank wash

// ---- estimated line layout (no dimensioned drawings exist; NV-011) ----
// The cooling / unload conveyor continues the oven discharge belt: the Phase 2b
// oven model ends with its exit roller at x 7.45 with the belt top at 1.025 m.
const LINE_Z = -0.15;
const BELT_Y = 1.025;
const CV_X0 = 7.45;
const CV_X1 = 9.85;
const CV_LEN = CV_X1 - CV_X0; // 2.4
const CV_CX = (CV_X0 + CV_X1) / 2;

// Boxing bench closes the line, operator side +Z (same side as the cabinets).
const BX_LEN = 1.8;
const BX_D = 0.9;
const BX_CX = 10.9;
const BX_TOP = 0.9;

const GOOD_BOX = { cx: 10.35, cz: 1.05, w: 0.6, d: 0.4, h: 0.45 };
const BAD_BOX = { cx: 11.5, cz: 1.15, w: 0.7, d: 0.55, h: 0.6 };

// Paint colours estimated from the documents (no colour charts exist): the boxing
// sheet shows a dark green good box and a red reject box house.
const BENCH_MAT = new THREE.MeshStandardMaterial({ color: 0xcfc9bd, roughness: 0.6, metalness: 0.15 });
const BOX_GOOD_MAT = new THREE.MeshStandardMaterial({ color: 0x2f6b34, roughness: 0.75, metalness: 0.05 });
const BOX_BAD_MAT = new THREE.MeshStandardMaterial({ color: 0x9c3129, roughness: 0.78, metalness: 0.05 });
const BIN_YELLOW_MAT = new THREE.MeshStandardMaterial({ color: 0xd7c020, roughness: 0.5, metalness: 0.05 });

export interface BuiltLineEnd extends BuiltLayers {
  rig: LineEndRig;
}

interface LCtx {
  p: Palette;
  l1: THREE.Group;
  l2: THREE.Group;
  l3: THREE.Group;
  l4: THREE.Group;
  l5: THREE.Group;
  conceptual: THREE.Group;
  rig: LineEndRig;
}

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

/** Open-top box house built from five thin panels plus a loose lid. */
function openBox(
  g: THREE.Group,
  o: { cx: number; cz: number; w: number; d: number; h: number },
  mat: THREE.MeshStandardMaterial,
  idPrefix: string,
  name: string,
  ev: PartEvidence
): void {
  const M = metaFor('BOXING');
  const t = 0.03;
  g.add(place(box(o.w, t, o.d, mat, M(`${idPrefix}-BASE`, `${name} base`, 'boxing box house', ev, 'ASSUMED', 2)), o.cx, t / 2, o.cz));
  g.add(place(box(o.w, o.h, t, mat, M(`${idPrefix}-WALL-N`, `${name} rear wall`, 'boxing box house', ev, 'ASSUMED', 1)), o.cx, o.h / 2, o.cz - o.d / 2));
  g.add(place(box(o.w, o.h, t, mat, M(`${idPrefix}-WALL-S`, `${name} front wall`, 'boxing box house', ev, 'ASSUMED', 1)), o.cx, o.h / 2, o.cz + o.d / 2));
  g.add(place(box(t, o.h, o.d, mat, M(`${idPrefix}-WALL-W`, `${name} side wall W`, 'boxing box house', ev, 'ASSUMED', 1)), o.cx - o.w / 2, o.h / 2, o.cz));
  g.add(place(box(t, o.h, o.d, mat, M(`${idPrefix}-WALL-E`, `${name} side wall E`, 'boxing box house', ev, 'ASSUMED', 1)), o.cx + o.w / 2, o.h / 2, o.cz));
  const lid = box(o.w + 0.02, 0.03, o.d + 0.02, mat, M(`${idPrefix}-LID`, `${name} lid`, 'boxing box house', ev, 'ASSUMED', 1));
  lid.rotation.y = 0.08;
  g.add(place(lid, o.cx, o.h + 0.015, o.cz));
}

function buildCoolingUnload(c: LCtx): void {
  const { p, l1, l2, l3, l4, l5, rig } = c;
  const M = metaFor('UNLOAD');
  const evDoc = EVIDENCE_CATS.document('PF-009 Cooling / Unloading (process step register)', 'PDF extract');
  const evIn = EVIDENCE_CATS.inference(
    `PHOTO:${F_OV} (oven discharge belt continues; a separate cooling conveyor is inferred, not photographed)`
  );
  const evA = EVIDENCE_CATS.assumption('line-end size and placement ASSUMED - no dimensioned drawings (NV-011)');

  // L1 silhouette: conveyor bed, belt, rails, legs, end roller, end stop
  l1.add(place(box(CV_LEN, 0.1, 0.44, p.panelGrey, M('LE-CV-BED', 'Cooling conveyor bed', 'unload conveyor', evIn, 'ESTIMATED', 1)), CV_CX, 0.95, LINE_Z));
  l1.add(place(box(CV_LEN, 0.03, 0.36, p.conveyorBelt, M('LE-CV-BELT', 'Cooling conveyor belt', 'unload conveyor belt', evIn, 'ESTIMATED', 1)), CV_CX, BELT_Y - 0.015, LINE_Z));
  for (const [i, z] of [[1, LINE_Z - 0.22], [2, LINE_Z + 0.22]] as [number, number][]) {
    l1.add(place(box(CV_LEN, 0.1, 0.05, p.panelGrey, M(`LE-CV-RAIL-${i}`, `Cooling conveyor side rail ${i}`, 'conveyor guard rail', evIn, 'ESTIMATED', 2)), CV_CX, 0.99, z));
  }
  for (const [i, x] of [[1, 7.75], [2, 9.55]] as [number, number][]) {
    for (const [j, z] of [[1, LINE_Z - 0.18], [2, LINE_Z + 0.18]] as [number, number][]) {
      l2.add(place(box(0.07, 0.9, 0.07, p.steel, M(`LE-CV-LEG-${i}${j}`, `Cooling conveyor leg ${i}${j}`, 'conveyor support', evA, 'ESTIMATED', 2)), x, 0.45, z));
      l2.add(place(box(0.12, 0.02, 0.12, p.panelDark, M(`LE-CV-FOOT-${i}${j}`, `Cooling conveyor foot ${i}${j}`, 'conveyor levelling foot', evA, 'ASSUMED', 2)), x, 0.01, z));
    }
  }
  l2.add(at(cyl(0.05, 0.05, 0.4, 14, p.steel, M('LE-CV-ROLLER-END', 'Cooling conveyor end roller', 'conveyor roller', evIn, 'ESTIMATED', 2)), CV_X1, BELT_Y - 0.015, LINE_Z, Math.PI / 2, 0, 0));
  l2.add(place(box(0.04, 0.12, 0.36, p.panelGrey, M('LE-CV-STOP', 'Cooling conveyor end stop', 'conveyor end stop', evA, 'ASSUMED', 2)), CV_X1 + 0.07, 1.08, LINE_Z));
  l2.add(place(box(0.14, 0.02, 0.14, p.panelDark, M('LE-LAMP-BASE', 'Unload stack-light base plate', 'lamp post base', evA, 'ASSUMED', 2)), 9.95, 0.02, 0.55));
  l2.add(place(cyl(0.03, 0.03, 1.6, 12, p.steel, M('LE-LAMP-POST', 'Unload stack-light post', 'lamp post', evA, 'ASSUMED', 2)), 9.95, 1.0, 0.55));

  // L3 functional: cooled parts on the belt, driven by the L5 demo state
  const beltParts = new THREE.Group();
  beltParts.name = 'STATION_LineEnd_BeltParts';
  const xs = [8.05, 8.55, 9.05];
  xs.forEach((x, i) => {
    beltParts.add(
      place(cyl(0.055, 0.055, 0.06, 16, p.partSteel, M(`LE-PART-COOLED-${i + 1}`, `Cooled part on belt ${i + 1}`, 'workpiece leaving the oven', evIn, 'ESTIMATED', 3)), x, BELT_Y + 0.03, LINE_Z)
    );
  });
  l3.add(beltParts);
  rig.beltParts = beltParts;

  // L4/L5 detail: placard and the stack light (red / amber / green)
  l4.add(place(plate('UNLOAD', 0.3, 0.16, M('LE-PLACARD', 'Unload station placard', 'station placard', evA, 'ASSUMED', 4)), 9.6, 1.22, LINE_Z + 0.29));
  const lampTop = 1.82;
  const lamps: [string, number, THREE.MeshStandardMaterial][] = [
    ['GREEN', 0, rig.lamps.green],
    ['AMBER', 1, rig.lamps.amber],
    ['RED', 2, rig.lamps.red]
  ];
  for (const [name, i, mat] of lamps) {
    l5.add(place(cyl(0.035, 0.035, 0.07, 12, mat, M(`LE-LAMP-${name}`, `Unload stack light ${name.toLowerCase()}`, 'station status light', EVIDENCE_CATS.assumption(`stack light ASSUMED - not visible in any photograph; driven by the Phase 3 placeholder (PF-009 ${evDoc.sourceId})`), 'ASSUMED', 5)), 9.95, lampTop + i * 0.08, 0.55));
  }
}

function buildBoxing(c: LCtx): void {
  const { p, l1, l2, l3, l4 } = c;
  const M = metaFor('BOXING');
  const evDoc = EVIDENCE_CATS.document('PF-012 Boxing and WIP transfer (process step register)', 'PDF extract');
  const evEq = EVIDENCE_CATS.document('EQ-008 Unload / Boxing Station (equipment register)', 'PDF extract');
  const evBox = EVIDENCE_CATS.photoMedium(F_BOX);
  const evWi = EVIDENCE_CATS.photoLow(F_WI);
  const evWi2 = EVIDENCE_CATS.photoLow(F_WI2);
  const evA = EVIDENCE_CATS.assumption('bench, boxes and trolley placement ASSUMED - this station is not photographed (NV-019)');

  // L1/L2: bench top, legs, shelf, back rail
  l1.add(place(box(BX_LEN, 0.05, BX_D, BENCH_MAT, M('LE-BENCH-TOP', 'Boxing bench top', 'unload / boxing bench', evEq, 'ESTIMATED', 1)), BX_CX, BX_TOP - 0.025, LINE_Z));
  for (const [i, x] of [[1, BX_CX - (BX_LEN - 0.12) / 2], [2, BX_CX + (BX_LEN - 0.12) / 2]] as [number, number][]) {
    for (const [j, z] of [[1, LINE_Z - 0.37], [2, LINE_Z + 0.37]] as [number, number][]) {
      l2.add(place(box(0.06, 0.85, 0.06, p.steel, M(`LE-BENCH-LEG-${i}${j}`, `Boxing bench leg ${i}${j}`, 'bench frame', evA, 'ASSUMED', 2)), x, 0.425, z));
    }
  }
  l2.add(place(box(BX_LEN - 0.12, 0.03, BX_D - 0.12, BENCH_MAT, M('LE-BENCH-SHELF', 'Boxing bench lower shelf', 'bench storage shelf', evA, 'ASSUMED', 2)), BX_CX, 0.22, LINE_Z));
  l2.add(place(box(BX_LEN, 0.1, 0.04, p.steel, M('LE-BENCH-RAIL-B', 'Boxing bench back rail', 'bench frame', evA, 'ASSUMED', 2)), BX_CX, 0.95, LINE_Z - 0.43));

  // L2: yellow plastic bins on the shelf (PHOTO-22 shows yellow bins)
  for (const [i, x] of [[1, 10.4], [2, 10.85]] as [number, number][]) {
    l2.add(place(box(0.36, 0.26, 0.3, BIN_YELLOW_MAT, M(`LE-BIN-YELLOW-${i}`, `Yellow plastic bin ${i}`, 'small-parts bin', evWi, 'ESTIMATED', 2)), x, 0.37, LINE_Z));
  }

  // L2: good and reject box houses on the floor (PHOTO-42: red BAD, green GOOD)
  openBox(l2, GOOD_BOX, BOX_GOOD_MAT, 'LE-BOX-GOOD', 'Good-part box house', evBox);
  openBox(l2, BAD_BOX, BOX_BAD_MAT, 'LE-BOX-BAD', 'Reject box house', EVIDENCE_CATS.document('QN-007 (OK/NOK unloading orientation: big Hot Zone reject box)', 'PDF extract'));

  // L2/L3: WIP trolley with parts (PF-012: boxing -> WIP trolley)
  const TX = 12.6;
  l2.add(place(box(0.7, 0.05, 0.5, p.steel, M('LE-TROLLEY-DECK', 'WIP trolley deck', 'WIP transfer trolley', evDoc, 'ASSUMED', 2)), TX, 0.55, LINE_Z));
  for (const [i, dx] of [[1, -0.31], [2, 0.31]] as [number, number][]) {
    for (const [j, dz] of [[1, -0.21], [2, 0.21]] as [number, number][]) {
      l2.add(place(box(0.04, 0.5, 0.04, p.steel, M(`LE-TROLLEY-POST-${i}${j}`, `WIP trolley post ${i}${j}`, 'WIP transfer trolley', evA, 'ASSUMED', 2)), TX + dx, 0.8, LINE_Z + dz));
      l2.add(at(cyl(0.05, 0.05, 0.03, 14, p.rubberBlack, M(`LE-TROLLEY-CASTOR-${i}${j}`, `WIP trolley castor ${i}${j}`, 'WIP transfer trolley', evA, 'ASSUMED', 2)), TX + dx * 0.9, 0.05, LINE_Z + dz * 0.85, 0, 0, Math.PI / 2));
    }
  }
  l2.add(place(box(0.7, 0.04, 0.04, p.steel, M('LE-TROLLEY-RAIL-B', 'WIP trolley back rail', 'WIP transfer trolley', evA, 'ASSUMED', 2)), TX, 1.02, LINE_Z - 0.21));
  l2.add(place(box(0.7, 0.04, 0.04, p.steel, M('LE-TROLLEY-RAIL-F', 'WIP trolley front rail', 'WIP transfer trolley', evA, 'ASSUMED', 2)), TX, 1.02, LINE_Z + 0.21));

  const wip = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 16), p.partSteel, 4);
  const m4 = new THREE.Matrix4();
  [[-0.2, -0.12], [0.05, -0.12], [-0.12, 0.13], [0.18, 0.11]].forEach(([dx, dz], i) => {
    m4.makeTranslation(TX + dx, 0.605, LINE_Z + dz);
    wip.setMatrixAt(i, m4);
  });
  tagInstanced(wip, M('LE-WIP-PARTS', 'Parts in the WIP trolley (instanced)', 'boxed/inspected parts', evDoc, 'ASSUMED', 3));
  l3.add(wip);

  // L3: parts tray on the bench, handheld scanner (CP-002 box PN scan) and the
  // posted work-instruction holder (PHOTO-22/28 show the sleeve; a bench-mounted
  // holder is ASSUMED)
  l3.add(place(box(0.5, 0.03, 0.4, p.steel, M('LE-TRAY', 'Bench parts tray', 'part carrier tray', evIn2(F_OV), 'ESTIMATED', 3)), 10.35, BX_TOP + 0.015, LINE_Z - 0.15));
  const tray = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), p.partSteel, 4);
  [[-0.13, -0.08], [0.09, -0.08], [-0.13, 0.09], [0.09, 0.09]].forEach(([dx, dz], i) => {
    m4.makeTranslation(10.35 + dx, BX_TOP + 0.06, LINE_Z - 0.15 + dz);
    tray.setMatrixAt(i, m4);
  });
  tagInstanced(tray, M('LE-TRAY-PARTS', 'Inspected parts on the bench tray (instanced)', 'parts awaiting boxing', evDoc, 'ASSUMED', 3));
  l3.add(tray);

  l3.add(place(box(0.12, 0.03, 0.1, p.servoBlack, M('LE-SCANNER-BASE', 'Boxing scanner base', 'handheld 2D-code scanner', evScan, 'ASSUMED', 3)), 11.45, BX_TOP + 0.015, LINE_Z - 0.2));
  l3.add(place(box(0.07, 0.14, 0.07, p.servoBlack, M('LE-SCANNER-BODY', 'Boxing scanner body', 'handheld 2D-code scanner', evScan, 'ASSUMED', 3)), 11.45, BX_TOP + 0.1, LINE_Z - 0.2));
  l3.add(at(box(0.06, 0.05, 0.09, p.servoBlack, M('LE-SCANNER-HEAD', 'Boxing scanner head', 'handheld 2D-code scanner', evScan, 'ASSUMED', 3)), 11.45, BX_TOP + 0.18, LINE_Z - 0.17, -0.25, 0, 0));
  l3.add(at(plate('CVOR', 0.3, 0.22, M('LE-DOC-HOLDER', 'Work instruction holder', 'posted work instruction', evWi2, 'ASSUMED', 4)), 10.3, BX_TOP + 0.14, LINE_Z + 0.2, -0.35, 0, 0));

  // L4: bench bolts and the GOOD / BAD labels (PHOTO-42)
  for (const [i, dx] of [[1, -0.82], [2, 0.82]] as [number, number][]) {
    for (const [j, dz] of [[1, -0.4], [2, 0.4]] as [number, number][]) {
      l4.add(place(cyl(0.012, 0.012, 0.012, 8, p.bolt, M(`LE-BENCH-BOLT-${i}${j}`, `Boxing bench bolt ${i}${j}`, 'fastener', evA, 'ASSUMED', 4)), BX_CX + dx, BX_TOP + 0.005, LINE_Z + dz));
    }
  }
  l4.add(place(plate('GOOD', 0.2, 0.1, M('LE-LABEL-GOOD', 'Good box label', 'boxing label', evBox, 'ESTIMATED', 4)), GOOD_BOX.cx, 0.3, GOOD_BOX.cz + GOOD_BOX.d / 2 + 0.02));
  l4.add(place(plate('BAD', 0.18, 0.1, M('LE-LABEL-BAD', 'Reject box label', 'boxing label', evBox, 'ESTIMATED', 4)), BAD_BOX.cx, 0.38, BAD_BOX.cz + BAD_BOX.d / 2 + 0.02));
}

/** PHOTO-12 cited for a bench-side tray as well as the belt (helper for readability). */
function evIn2(file: string): PartEvidence {
  return EVIDENCE_CATS.inference(`PHOTO:${file} (parts handled on a tray at the line end; bench tray ASSUMED)`);
}

const evScan = EVIDENCE_CATS.inference(
  `PHOTO:${F_SCAN} (mounted handheld scanner at the blank wash; the boxing scanner is inferred from CP-002 box PN scan)`
);

export function buildLineEnd(palette: Palette): BuiltLineEnd {
  const root = new THREE.Group();
  root.name = 'STATION_LineEnd';

  const layerGroups: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_LineEnd_Layer${n}`;
    layerGroups[n] = g;
    root.add(g);
  }
  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_LineEnd_Conceptual';
  root.add(conceptual);

  const lamps = {
    red: palette.ledRed.clone(),
    amber: new THREE.MeshStandardMaterial({ color: 0xd9a400, emissive: 0xd9a400, emissiveIntensity: 0.05, roughness: 0.35 }),
    green: palette.ledGreen.clone()
  };
  lamps.red.emissiveIntensity = 0.05;
  lamps.green.emissiveIntensity = 0.05;

  const rig: LineEndRig = { lamps, beltParts: new THREE.Group() };

  const ctx: LCtx = {
    p: palette,
    l1: layerGroups['1'],
    l2: layerGroups['2'],
    l3: layerGroups['3'],
    l4: layerGroups['4'],
    l5: layerGroups['5'],
    conceptual,
    rig
  };

  buildCoolingUnload(ctx);
  buildBoxing(ctx);

  return { layerGroups, conceptual, rig };
}
