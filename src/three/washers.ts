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
import type { PartEvidence, PartMeta, WashRig, WashSpray } from './util';

const F_BLANK = '4.20.41 PM.jpeg'; // PHOTO-01 (WASH-BLANK, full-resolution review)
const F_TUNNEL = '4.20.42 PM.jpeg'; // PHOTO-06 (WASH-TPCV, contact-sheet review)

// ---- estimated line layout (no dimensioned drawings exist; NV-011) ----
// Straight conveyor along X at z = LINE_Z, belt top BELT_Y, matching the
// induction feed conveyor built in Phase 2a. Placement is ASSUMED.
const LINE_Z = -0.15;
const BELT_Y = 1.025; // matches IND-C-BELT top (1.01 + 0.015)
const BLANK_CX = -7.0;
const BLANK_LEN = 2.6;
const TUN_CX = -4.1;
const TUN_LEN = 3.2;
const TUN_DEPTH = 1.0;
const TUN_BOT = 0.55;
const TUN_TOP = 2.35;
const HALF_W = 0.35;

export interface BuiltWash {
  layerGroups: Record<string, THREE.Group>;
  conceptual: THREE.Group;
  rig: WashRig;
  windows: THREE.Mesh[];
}

interface WCtx {
  p: Palette;
  l1: THREE.Group;
  l2: THREE.Group;
  l3: THREE.Group;
  l4: THREE.Group;
  l5: THREE.Group;
  conceptual: THREE.Group;
  rig: WashRig;
  windows: THREE.Mesh[];
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
  bg = '#f2f2f2'
): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({ map: labelTexture(text, bg), roughness: 0.7 });
  const mesh = part(new THREE.BoxGeometry(w, h, 0.02), mat, m);
  return mesh;
}

function warningPlate(w: number, h: number, m: PartMeta): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({ map: warningTexture(), roughness: 0.7 });
  return part(new THREE.BoxGeometry(w, h, 0.012), mat, m);
}

// ---------------------------------------------------------------- WASH-BLANK
function buildBlank(c: WCtx): void {
  const { p, l1, l2, l3, l4, l5, rig } = c;
  const M = metaFor('WASH-BLANK');
  const ev = EVIDENCE_CATS.photo(F_BLANK);
  const evA = EVIDENCE_CATS.assumption('washer line placement ASSUMED - no dimensioned drawings (NV-011)');
  const x0 = BLANK_CX - BLANK_LEN / 2;
  const x1 = BLANK_CX + BLANK_LEN / 2;
  const zNear = LINE_Z + HALF_W; // 0.20
  const zFar = LINE_Z - HALF_W; // -0.50

  // L1 silhouette: conveyor beam, gantry posts, overhead pipe
  l1.add(
    place(
      box(BLANK_LEN, 0.1, 0.06, p.panelGrey, M('WB-CV-FRAME', 'Blank conveyor frame beam', 'conveyor frame', ev, 'ESTIMATED', 1)),
      BLANK_CX, 0.98, zNear
    )
  );
  l1.add(
    place(
      box(BLANK_LEN, 0.1, 0.06, p.panelGrey, M('WB-CV-FRAME-2', 'Blank conveyor far frame beam', 'conveyor frame', ev, 'ESTIMATED', 1)),
      BLANK_CX, 0.98, zFar
    )
  );
  for (const [i, x] of [x0 + 0.15, x1 - 0.15].entries()) {
    l1.add(
      place(
        box(0.06, 2.28, 0.06, p.panelGrey, M(`WB-GANTRY-${i}`, `Overhead pipe gantry post ${i}`, 'pipe support', evA, 'ASSUMED', 1)),
        x, 1.14, 0.3
      )
    );
  }

  // L2 mechanical
  l2.add(
    place(
      box(BLANK_LEN - 0.1, 0.03, 0.6, p.conveyorBelt, M('WB-CV-BELT', 'Blank conveyor belt', 'conveyor belt', ev, 'ESTIMATED', 2)),
      BLANK_CX, BELT_Y - 0.015, LINE_Z
    )
  );
  for (const [i, x] of [x0 + 0.1, x1 - 0.1].entries()) {
    for (const [j, z] of [zFar + 0.06, zNear - 0.06].entries()) {
      l2.add(
        place(
          box(0.06, 0.95, 0.06, p.steel, M(`WB-LEG-${i}${j}`, `Conveyor leg ${i}${j}`, 'conveyor support', ev, 'ESTIMATED', 2)),
          x, 0.475, z
        )
      );
      l2.add(
        place(
          cyl(0.05, 0.05, 0.04, 12, p.bolt, M(`WB-FOOT-${i}${j}`, `Levelling foot ${i}${j}`, 'leveling foot', ev, 'ESTIMATED', 2)),
          x, 0.02, z
        )
      );
    }
  }
  for (const [i, x] of [x0 + 0.05, x1 - 0.05].entries()) {
    l2.add(
      at(
        cyl(0.05, 0.05, 0.66, 14, p.steel, M(`WB-ROLLER-${i}`, `Conveyor end roller ${i}`, 'conveyor roller', ev, 'ESTIMATED', 2)),
        x, BELT_Y - 0.015, LINE_Z, Math.PI / 2, 0, 0
      )
    );
  }
  const pipe = cyl(0.045, 0.045, 2.4, 14, p.steel, M('WB-PIPE-OH', 'Overhead wash pipe', 'overhead piping', ev, 'ESTIMATED', 2));
  l2.add(at(pipe, BLANK_CX, 2.3, 0.3, 0, 0, Math.PI / 2));
  const drop = cyl(0.03, 0.03, 0.78, 12, p.steel, M('WB-PIPE-DROP', 'Pipe drop to station', 'service pipe', ev, 'ESTIMATED', 2));
  l2.add(place(drop, x1 - 0.5, 1.9, 0.3));
  l2.add(
    place(
      box(0.05, 0.55, 0.05, p.steel, M('WB-SCN-POST', 'Scanner mount post', 'scanner mount', ev, 'ESTIMATED', 2)),
      BLANK_CX + 0.5, 1.31, zNear + 0.08
    )
  );
  l2.add(
    place(
      box(0.05, 0.05, 0.26, p.steel, M('WB-SCN-ARM', 'Scanner mount arm', 'scanner mount', ev, 'ESTIMATED', 2)),
      BLANK_CX + 0.5, 1.55, zNear - 0.06
    )
  );
  for (const [i, z] of [zFar - 0.06, zNear + 0.06].entries()) {
    l2.add(
      place(
        box(0.07, 0.85, 0.07, p.servoBlack, M(`WB-LC-POST-${i}`, `Light curtain post ${i}`, 'light curtain emitter/receiver', ev, 'ESTIMATED', 2)),
        x0 + 0.4, 1.455, z
      )
    );
  }

  // L3 functional
  const carrier = new THREE.Group();
  carrier.name = 'WB_PartCarrier';
  const rows = 8;
  const spacing = 0.3;
  const blankGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16);
  const blanks = new THREE.InstancedMesh(blankGeo, p.partSteel, rows * 3);
  const m4 = new THREE.Matrix4();
  let bi = 0;
  for (let r = 0; r < rows; r++) {
    const bx = x0 + 0.1 + r * spacing;
    for (const bz of [LINE_Z - 0.2, LINE_Z, LINE_Z + 0.2]) {
      m4.makeTranslation(bx, BELT_Y + 0.025, bz);
      blanks.setMatrixAt(bi++, m4);
    }
  }
  blanks.instanceMatrix.needsUpdate = true;
  tagInstanced(blanks, M('WB-BLANKS', 'Blank parts on conveyor (instanced)', 'workpiece blanks', ev, 'ESTIMATED', 3));
  carrier.add(blanks);
  l3.add(carrier);
  rig.partCarriers.push(carrier);

  l3.add(
    at(
      box(0.1, 0.16, 0.07, p.hoseGreen, M('WB-SCANNER', 'Handheld barcode scanner (mounted)', 'DataMatrix/barcode reader', ev, 'ESTIMATED', 3)),
      BLANK_CX + 0.5, 1.47, LINE_Z + 0.05, -0.5, 0, 0
    )
  );
  l3.add(
    at(
      box(0.11, 0.05, 0.09, p.servoBlack, M('WB-SCN-HEAD', 'Scanner head', 'reader optics', ev, 'ESTIMATED', 3)),
      BLANK_CX + 0.5, 1.4, LINE_Z - 0.01, -0.5, 0, 0
    )
  );
  l3.add(
    place(
      box(0.12, 0.12, 0.05, p.frameYellow, M('WB-ESTOP-M', 'E-stop yellow mount', 'emergency stop mount', ev, 'ESTIMATED', 3)),
      x1 - 0.15, 1.35, 0.33
    )
  );
  l3.add(
    at(
      cyl(0.032, 0.032, 0.05, 14, p.redCover, M('WB-ESTOP', 'Emergency stop button', 'emergency stop', ev, 'ESTIMATED', 3)),
      x1 - 0.15, 1.35, 0.37, Math.PI / 2, 0, 0
    )
  );

  // L5 visualisation: light-curtain beam (photo shows a red beam)
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.5 });
  const beam = part(
    new THREE.BoxGeometry(0.02, 0.05, 0.84),
    beamMat,
    M('WB-LC-BEAM', 'Light curtain red beam', 'safety light curtain', ev, 'ESTIMATED', 5)
  );
  beam.castShadow = false;
  beam.position.set(x0 + 0.4, 1.12, LINE_Z);
  l5.add(beam);
  rig.beams.push(beam);

  // L4 detail: placards, signs, sticker, bolts
  const p1 = plate('OP_100102', 0.42, 0.16, M('WB-PLACARD-1', 'Station placard OP_100102', 'station identification placard', ev, 'ESTIMATED', 4));
  l4.add(place(p1, x1 - 0.15, 1.95, 0.34));
  const p2 = plate('CV OR #4', 0.42, 0.16, M('WB-PLACARD-2', 'Line placard CV OR #4', 'line identification placard', ev, 'ESTIMATED', 4));
  l4.add(place(p2, x1 - 0.15, 1.76, 0.34));
  const p3 = plate('SV-000088', 0.42, 0.16, M('WB-PLACARD-3', 'Asset placard SV-000088', 'asset identification placard', ev, 'ESTIMATED', 4));
  l4.add(place(p3, x0 + 0.15, 1.7, 0.34));
  const air = plate('A-1', 0.16, 0.16, M('WB-SIGN-AIR', 'Air point sign A-1', 'utility identification sign', ev, 'ESTIMATED', 4), '#f7d117');
  l4.add(place(air, x0 + 0.15, 1.5, 0.34));
  l4.add(
    place(
      warningPlate(0.16, 0.14, M('WB-WARN', 'Warning sticker', 'safety label', ev, 'ESTIMATED', 4)),
      BLANK_CX, 0.98, zNear + 0.03
    )
  );
  const boltGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.02, 8);
  const bolts = new THREE.InstancedMesh(boltGeo, p.bolt, 8);
  let bo = 0;
  for (let i = 0; i < 8; i++) {
    const bx = x0 + 0.3 + (i * (BLANK_LEN - 0.6)) / 7;
    m4.makeRotationX(Math.PI / 2);
    m4.setPosition(bx, 0.98, zNear + 0.04);
    bolts.setMatrixAt(bo++, m4);
  }
  bolts.instanceMatrix.needsUpdate = true;
  tagInstanced(bolts, M('WB-BOLTS', 'Frame bolts (instanced)', 'fasteners', ev, 'ESTIMATED', 4));
  l4.add(bolts);
}

// ----------------------------------------------------------------- WASH-TPCV
function buildTunnel(c: WCtx): void {
  const { p, l1, l2, l3, l4, l5, conceptual, rig, windows } = c;
  const M = metaFor('WASH-TPCV');
  const ev = EVIDENCE_CATS.photoMedium(F_TUNNEL);
  const evInf = EVIDENCE_CATS.inference(`PHOTO:${F_TUNNEL} (nozzle feeding structure not clearly visible)`);
  const evA = EVIDENCE_CATS.assumption('washer internals and rear skid ASSUMED - not visible in any supplied photo');
  const x0 = TUN_CX - TUN_LEN / 2;
  const x1 = TUN_CX + TUN_LEN / 2;
  // dedicated stainless shell material: the tunnel dominates the PHOTO-06 frame,
  // so it must not reuse the brighter induction panel grey (v1 over-exposed at
  // luma 152.7 vs photo 118.4 in docs/compare/wash-stations/model_wt_v1_metrics.json)
  const shell = new THREE.MeshStandardMaterial({
    color: 0x99a0a7,
    roughness: 0.45,
    metalness: 0.6
  });
  const H = TUN_TOP - TUN_BOT; // 1.8
  const midY = (TUN_TOP + TUN_BOT) / 2; // 1.45

  // L1 silhouette: shell panels + end frames (conveyor openings)
  l1.add(place(box(TUN_LEN, 0.06, TUN_DEPTH, shell, M('WT-SHELL-TOP', 'Washer tunnel roof', 'enclosure shell', ev, 'ESTIMATED', 1)), TUN_CX, TUN_TOP - 0.03, LINE_Z));
  l1.add(place(box(TUN_LEN, 0.06, TUN_DEPTH, shell, M('WT-SHELL-BOT', 'Washer tunnel drip pan', 'enclosure shell', ev, 'ESTIMATED', 1)), TUN_CX, TUN_BOT + 0.03, LINE_Z));
  l1.add(place(box(TUN_LEN, H, 0.06, shell, M('WT-SHELL-BACK', 'Washer tunnel rear wall', 'enclosure shell', ev, 'ESTIMATED', 1)), TUN_CX, midY, LINE_Z - TUN_DEPTH / 2));
  l1.add(place(box(TUN_LEN, 0.12, 0.06, shell, M('WT-FRONT-TOP', 'Front top rail', 'enclosure frame', ev, 'ESTIMATED', 1)), TUN_CX, TUN_TOP - 0.06, LINE_Z + TUN_DEPTH / 2));
  l1.add(place(box(TUN_LEN, 0.16, 0.06, shell, M('WT-FRONT-BOT', 'Front bottom rail', 'enclosure frame', ev, 'ESTIMATED', 1)), TUN_CX, TUN_BOT + 0.08, LINE_Z + TUN_DEPTH / 2));
  // end walls as frames around the conveyor opening
  for (const [i, x] of [x0, x1].entries()) {
    l1.add(place(box(0.06, 0.4, TUN_DEPTH, shell, M(`WT-END-BOT-${i}`, `Tunnel end apron ${i}`, 'enclosure end wall', ev, 'ESTIMATED', 1)), x, TUN_BOT + 0.2, LINE_Z));
    l1.add(place(box(0.06, 0.65, TUN_DEPTH, shell, M(`WT-END-TOP-${i}`, `Tunnel end header ${i}`, 'enclosure end wall', ev, 'ESTIMATED', 1)), x, TUN_TOP - 0.325, LINE_Z));
    l1.add(place(box(0.06, 0.75, 0.2, shell, M(`WT-END-SIDE-${i}A`, `Tunnel end side ${i}A`, 'enclosure end wall', ev, 'ESTIMATED', 1)), x, 1.325, LINE_Z - TUN_DEPTH / 2 + 0.1));
    l1.add(place(box(0.06, 0.75, 0.2, shell, M(`WT-END-SIDE-${i}B`, `Tunnel end side ${i}B`, 'enclosure end wall', ev, 'ESTIMATED', 1)), x, 1.325, LINE_Z + TUN_DEPTH / 2 - 0.1));
  }

  // L2 mechanical: mullions, doors (frame + glazing), hinges, handles, frame, wheels, conduit
  const mullions = [-5.655, -4.875, -4.1, -3.325, -2.545];
  for (const [i, mx] of mullions.entries()) {
    l2.add(place(box(0.09, 1.6, 0.06, shell, M(`WT-MULL-${i}`, `Front mullion ${i}`, 'door frame mullion', ev, 'ESTIMATED', 2)), mx, midY, LINE_Z + TUN_DEPTH / 2));
  }
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xdff1f5,
    roughness: 0.1,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const doors = [-5.26, -4.49, -3.71, -2.94];
  for (const [i, dx] of doors.entries()) {
    l2.add(place(box(0.14, 1.5, 0.05, shell, M(`WT-DOOR-L${i}`, `Access door ${i} left stile`, 'hinged door', ev, 'ESTIMATED', 2)), dx - 0.28, 1.5, LINE_Z + TUN_DEPTH / 2 + 0.025));
    l2.add(place(box(0.14, 1.5, 0.05, shell, M(`WT-DOOR-R${i}`, `Access door ${i} right stile`, 'hinged door', ev, 'ESTIMATED', 2)), dx + 0.28, 1.5, LINE_Z + TUN_DEPTH / 2 + 0.025));
    l2.add(place(box(0.7, 0.35, 0.05, shell, M(`WT-DOOR-T${i}`, `Access door ${i} top rail`, 'hinged door', ev, 'ESTIMATED', 2)), dx, 2.075, LINE_Z + TUN_DEPTH / 2 + 0.025));
    l2.add(place(box(0.7, 0.2, 0.05, shell, M(`WT-DOOR-B${i}`, `Access door ${i} bottom rail`, 'hinged door', ev, 'ESTIMATED', 2)), dx, 0.85, LINE_Z + TUN_DEPTH / 2 + 0.025));
    const glass = part(
      new THREE.BoxGeometry(0.42, 0.95, 0.02),
      winMat.clone(),
      M(`WT-DOOR-GLASS-${i}`, `Access door ${i} viewing window`, 'viewing window', ev, 'ESTIMATED', 2)
    );
    glass.castShadow = false;
    glass.position.set(dx, 1.425, LINE_Z + TUN_DEPTH / 2 + 0.025);
    l2.add(glass);
    windows.push(glass);
    for (const [j, hy] of [2.05, 0.95].entries()) {
      l2.add(place(cyl(0.015, 0.015, 0.09, 10, p.steel, M(`WT-HINGE-${i}${j}`, `Door ${i} hinge ${j}`, 'door hinge', ev, 'ESTIMATED', 2)), dx - 0.34, hy, LINE_Z + TUN_DEPTH / 2 + 0.04));
    }
    l2.add(place(box(0.03, 0.16, 0.05, p.steel, M(`WT-HANDLE-${i}`, `Door ${i} handle`, 'door handle', ev, 'ESTIMATED', 2)), dx + 0.3, 1.5, LINE_Z + TUN_DEPTH / 2 + 0.05));
  }
  // lower frame with wheels/feet (photo-observed)
  for (const [i, lx] of [-5.4, -4.1, -2.8].entries()) {
    for (const [j, lz] of [LINE_Z - 0.35, LINE_Z + 0.35].entries()) {
      l2.add(place(box(0.07, 0.43, 0.07, p.steel, M(`WT-LEG-${i}${j}`, `Support leg ${i}${j}`, 'support frame', ev, 'ESTIMATED', 2)), lx, 0.335, lz));
      l2.add(at(cyl(0.06, 0.06, 0.04, 14, p.panelDark, M(`WT-WHEEL-${i}${j}`, `Caster wheel ${i}${j}`, 'caster/wheel', ev, 'ESTIMATED', 2)), lx, 0.06, lz, Math.PI / 2, 0, 0));
    }
  }
  for (const [i, lz] of [LINE_Z - 0.35, LINE_Z + 0.35].entries()) {
    l2.add(place(box(2.7, 0.06, 0.06, p.steel, M(`WT-CROSSRAIL-${i}`, `Lower frame cross rail ${i}`, 'support frame', ev, 'ESTIMATED', 2)), TUN_CX, 0.14, lz));
  }
  const conduit = cyl(0.04, 0.04, 3.0, 12, p.steel, M('WT-CONDUIT', 'Side conduit run', 'service conduit', ev, 'ESTIMATED', 2));
  l2.add(at(conduit, TUN_CX, 0.75, LINE_Z + TUN_DEPTH / 2 + 0.07, 0, 0, Math.PI / 2));
  l2.add(place(cyl(0.035, 0.035, 0.6, 12, p.steel, M('WT-CONDUIT-UP', 'Conduit riser', 'service conduit', ev, 'ESTIMATED', 2)), x0 + 0.2, 1.05, LINE_Z + TUN_DEPTH / 2 + 0.07));
  for (const [i, cx] of [-5.2, -4.4, -3.6, -2.8].entries()) {
    l2.add(place(box(0.06, 0.09, 0.05, p.bolt, M(`WT-CLAMP-${i}`, `Conduit clamp ${i}`, 'conduit clamp', ev, 'ESTIMATED', 2)), cx, 0.75, LINE_Z + TUN_DEPTH / 2 + 0.05));
  }

  // L3 functional: manifolds + yellow nozzles (visible through the windows)
  const topM = cyl(0.03, 0.03, 2.9, 12, p.steel, M('WT-MANIFOLD-TOP', 'Upper wash manifold', 'wash manifold', evInf, 'ESTIMATED', 3));
  l3.add(at(topM, TUN_CX, 1.9, LINE_Z, 0, 0, Math.PI / 2));
  const lowM = cyl(0.025, 0.025, 2.9, 12, p.steel, M('WT-MANIFOLD-LOW', 'Lower wash manifold', 'wash manifold', evInf, 'ESTIMATED', 3));
  l3.add(at(lowM, TUN_CX, 1.2, LINE_Z + 0.25, 0, 0, Math.PI / 2));
  const tBelt = box(TUN_LEN, 0.03, 0.36, p.conveyorBelt, M('WT-CV-BELT', 'Conveyor belt through tunnel', 'part feed conveyor belt', ev, 'ESTIMATED', 3));
  l3.add(place(tBelt, TUN_CX, BELT_Y - 0.015, LINE_Z));

  // parts transiting the tunnel (inference: the conveyor is continuous)
  const tCar = new THREE.Group();
  tCar.name = 'WT_PartCarrier';
  const tRows = 11;
  const tParts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16),
    p.partSteel,
    tRows * 3
  );
  const tm4 = new THREE.Matrix4();
  let ti = 0;
  for (let r = 0; r < tRows; r++) {
    const bx = x0 + 0.1 + r * 0.3;
    for (const bz of [LINE_Z - 0.2, LINE_Z, LINE_Z + 0.2]) {
      tm4.makeTranslation(bx, BELT_Y + 0.025, bz);
      tParts.setMatrixAt(ti++, tm4);
    }
  }
  tParts.instanceMatrix.needsUpdate = true;
  tagInstanced(tParts, M('WT-PARTS', 'Parts transiting tunnel (instanced)', 'workpiece blanks', EVIDENCE_CATS.inference(`${F_TUNNEL} (conveyor continuity - parts not directly visible)`), 'ESTIMATED', 3));
  tCar.add(tParts);
  l3.add(tCar);
  rig.partCarriers.push(tCar);

  const nozzleGeo = new THREE.CylinderGeometry(0.026, 0.012, 0.055, 10);
  const nozzles = new THREE.InstancedMesh(nozzleGeo, p.frameYellow, 22);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const qDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  const one = new THREE.Vector3(1, 1, 1);
  let ni = 0;
  for (let i = 0; i < 11; i++) {
    const nx = -5.4 + i * 0.26;
    m4.compose(new THREE.Vector3(nx, 1.85, LINE_Z), qDown, one);
    nozzles.setMatrixAt(ni++, m4);
    m4.compose(new THREE.Vector3(nx, 1.24, LINE_Z + 0.25), q, one);
    nozzles.setMatrixAt(ni++, m4);
  }
  nozzles.instanceMatrix.needsUpdate = true;
  tagInstanced(nozzles, M('WT-NOZZLES', 'Yellow spray nozzles (instanced)', 'wash spray nozzle', ev, 'ESTIMATED', 3));
  l3.add(nozzles);

  // L5 visualisation: wash spray droplets (local demo state, no signal bus yet)
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x9fc8e8,
    roughness: 0.25,
    transparent: true,
    opacity: 0.7
  });
  const dropGeo = new THREE.SphereGeometry(0.013, 6, 4);
  const sprayGroup = new THREE.Group();
  sprayGroup.name = 'WT_SprayGroup';
  const droplets: THREE.Mesh[] = [];
  for (let i = 0; i < 20; i++) {
    const d = part(
      dropGeo,
      waterMat,
      M(
        `WT-DROP-${i}`,
        `Wash droplet ${i} (visualisation)`,
        'wash spray droplet',
        EVIDENCE_CATS.assumption('droplet visualisation is a local demo placeholder - no signal bus until Phase 3'),
        'ASSUMED',
        5
      )
    );
    d.castShadow = false;
    const hx = -5.3 + (i % 10) * 0.52;
    const hz = LINE_Z + ((i % 3) - 1) * 0.2;
    d.userData = { ...d.userData, phase: i / 20, home: new THREE.Vector3(hx, 0, hz) };
    d.position.set(hx, 1.9, hz);
    sprayGroup.add(d);
    droplets.push(d);
  }
  sprayGroup.visible = false;
  l5.add(sprayGroup);
  const spray: WashSpray = { group: sprayGroup, droplets };
  rig.sprays.push(spray);

  // L4 detail: nameplate, sticker, bolts
  l4.add(place(plate('WASHER', 0.5, 0.14, M('WT-NAMEPLATE', 'Washer station nameplate', 'station nameplate', EVIDENCE_CATS.assumption('nameplate wording ASSUMED - not legible in the supplied photo'), 'ASSUMED', 4)), TUN_CX, TUN_TOP - 0.06, LINE_Z + TUN_DEPTH / 2 + 0.03));
  l4.add(place(warningPlate(0.16, 0.16, M('WT-WARN', 'Warning sticker', 'safety label', ev, 'ESTIMATED', 4)), -3.0, 0.63, LINE_Z + TUN_DEPTH / 2 + 0.03));
  const boltGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.02, 8);
  const bolts = new THREE.InstancedMesh(boltGeo, p.bolt, 10);
  let bo = 0;
  for (let i = 0; i < 10; i++) {
    const bx = x0 + 0.3 + (i * (TUN_LEN - 0.6)) / 9;
    m4.makeRotationX(Math.PI / 2);
    m4.setPosition(bx, TUN_TOP - 0.06, LINE_Z + TUN_DEPTH / 2 + 0.04);
    bolts.setMatrixAt(bo++, m4);
  }
  bolts.instanceMatrix.needsUpdate = true;
  tagInstanced(bolts, M('WT-BOLTS', 'Roof bolts (instanced)', 'fasteners', ev, 'ESTIMATED', 4));
  l4.add(bolts);

  // conceptual layer (toggleable): rear pump/tank skid + far-side manifold
  conceptual.add(place(box(1.2, 0.7, 0.6, p.panelDark, M('WT-SKID', 'Rear pump/tank skid (assumed)', 'wash fluid skid', evA, 'ASSUMED', 'conceptual')), -4.6, 0.9, LINE_Z - TUN_DEPTH / 2 - 0.5));
  for (const [i, px] of [-4.9, -4.3].entries()) {
    conceptual.add(place(cyl(0.12, 0.12, 0.5, 16, p.steel, M(`WT-PUMP-${i}`, `Wash pump ${i} (assumed)`, 'wash pump', evA, 'ASSUMED', 'conceptual')), px, 1.5, LINE_Z - TUN_DEPTH / 2 - 0.5));
  }
  const farM = cyl(0.025, 0.025, 2.9, 12, p.steel, M('WT-MANIFOLD-BACK', 'Rear side manifold (assumed)', 'wash manifold', evA, 'ASSUMED', 'conceptual'));
  conceptual.add(at(farM, TUN_CX, 1.5, LINE_Z - TUN_DEPTH / 2 + 0.1, 0, 0, Math.PI / 2));
}

export function buildWashStations(palette: Palette): BuiltWash {
  const root = new THREE.Group();
  root.name = 'STATION_Wash_Stations';

  const layerGroups: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_Wash_Layer${n}`;
    layerGroups[n] = g;
    root.add(g);
  }
  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_Wash_Conceptual';
  root.add(conceptual);

  const rig: WashRig = { sprays: [], partCarriers: [], beams: [] };
  const ctx: WCtx = {
    p: palette,
    l1: layerGroups['1'],
    l2: layerGroups['2'],
    l3: layerGroups['3'],
    l4: layerGroups['4'],
    l5: layerGroups['5'],
    conceptual,
    rig,
    windows: []
  };

  buildBlank(ctx);
  buildTunnel(ctx);

  return { layerGroups, conceptual, rig, windows: ctx.windows };
}
