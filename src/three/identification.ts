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
  warningTexture
} from './util';
import type { BuiltLayers, IdentificationRig, PartEvidence, PartMeta } from './util';

// Phase 2b increment 5: the identification stations on the induction feed belt -
// the laser marking station (EQ-005) and the DataMatrix / 2D code reader
// (EQ-006, Keyence SR-20AH).
//
// Evidence note: NO photograph shows either station's hardware. PHOTO-02 is a PC
// monitor running AutoID Network Navigator (it names the reader model SR-20AH and
// its tuning features) and PHOTO-46 is a wall-mounted network plate listing
// 2D CAMERA / LASER SENSOR / STATION DE MARQUAGE with 172.38.22.x addresses.
// Both stations therefore exist as documented equipment, but their form here is
// ASSUMED and their positions are INFERRED:
//   - the reader stands at the induction station entrance (EP-006 states EP
//     verification is performed before the DataMatrix reader at the induction
//     station entrance; PF-003 puts the 2D code scan after the blank wash and
//     before induction heat) - x -1.1 on the Phase 2a feed belt;
//   - the marking station must be UPSTREAM of that reader, because EP-003
//     requires a blank with the laser disabled to be rejected by the reader, so
//     its code is written before it is read (x -2.05, immediately after the
//     TP/CV wash tunnel exit). No source states the marking station position:
//     see NV-021. Nothing here is MEASURED (NV-011).
const F_AUTOID = '4.20.42 PM (1).jpeg'; // PHOTO-02 AutoID Network Navigator screen (SR-20AH)
const F_PLATE = '4.21.02 PM (3).jpeg'; // PHOTO-46 EMMEPI network plate (STATION DE MARQUAGE, LASER SENSOR)

// ---- estimated line layout (no dimensioned drawings exist; NV-011) ----
// The Phase 2a feed belt (IND-C-BELT, x -2.445 .. -0.815, z -0.33 .. 0.03) runs
// from the TP/CV wash tunnel exit (x -2.5) to the induction enclosure (x -0.825).
const LINE_Z = -0.15;
const BELT_Y = 1.025;
const LM_CX = -2.05;
const LM_W = 0.8;
const LM_D = 0.7;
const LM_TOP = 1.79;
const RD_X = -1.1;

export interface BuiltIdentification extends BuiltLayers {
  rig: IdentificationRig;
  /** glazing panes that join the shared glass x-ray toggle */
  windows: THREE.Mesh[];
}

interface ICtx {
  p: Palette;
  l1: THREE.Group;
  l2: THREE.Group;
  l3: THREE.Group;
  l4: THREE.Group;
  l5: THREE.Group;
  conceptual: THREE.Group;
  rig: IdentificationRig;
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

function buildMarkingStation(c: ICtx): void {
  const { p, l1, l2, l3, l4, l5, rig, windows } = c;
  const M = metaFor('MARKING');
  const evEq = EVIDENCE_CATS.document('EQ-005 Laser Marking Station (equipment register)', 'PDF extract');
  const evPlate = EVIDENCE_CATS.photoMedium(F_PLATE);
  const evIP = EVIDENCE_CATS.document('IP-011 Laser Marking Station 172.38.22.39 (IP table)', 'PDF extract');
  const evIn = EVIDENCE_CATS.inference(
    'EP-003 (a blank run with the laser disabled must be rejected by the reader) - marking happens upstream of the reader; the station form itself is not photographed'
  );
  const evA = EVIDENCE_CATS.assumption('marking station size, form and position ASSUMED - never photographed (NV-021)');
  const evLaser = EVIDENCE_CATS.document('PC-010 (laser exposure listed among the post risks)', 'PDF extract');

  const zB = LINE_Z - 0.30; // rear (-z) wall plane
  const zF = LINE_Z + 0.30; // front door plane
  const xw = LM_CX - LM_W / 2; // -2.45
  const xe = LM_CX + LM_W / 2; // -1.65

  // L1 silhouette: four posts, roof, rear wall, belt-opening side walls with
  // strip brushes, and the glazed front door frame
  for (const [i, x] of [[1, xw + 0.03], [2, xe - 0.03]] as [number, number][]) {
    for (const [j, z] of [[1, zB + 0.03], [2, zF - 0.03]] as [number, number][]) {
      l1.add(place(box(0.06, 1.7, 0.06, p.steel, M(`LM-FRAME-POST-${i}${j}`, `Marking station post ${i}${j}`, 'station frame', evA, 'ESTIMATED', 1)), x, 0.85, z));
    }
  }
  l1.add(place(box(LM_W + 0.06, 0.04, LM_D + 0.06, p.panelGrey, M('LM-SHELL-ROOF', 'Marking station roof panel', 'laser safety enclosure', evLaser, 'ESTIMATED', 1)), LM_CX, LM_TOP, LINE_Z));
  l1.add(place(box(LM_W, 1.45, 0.03, p.panelGrey, M('LM-SHELL-WALL-N', 'Marking station rear wall', 'laser safety enclosure', evLaser, 'ESTIMATED', 1)), LM_CX, 1.02, zB));
  // side walls stop above the belt, leaving the conveyor opening
  for (const [end, x] of [['W', xw], ['E', xe]] as [string, number][]) {
    l1.add(place(box(0.03, 0.68, LM_D, p.panelGrey, M(`LM-SHELL-WALL-${end}-UP`, `Marking station ${end === 'W' ? 'infeed' : 'outfeed'} wall (above belt)`, 'laser safety enclosure', evA, 'ESTIMATED', 1)), x, 1.43, LINE_Z));
    l1.add(place(box(0.03, 0.06, LM_D - 0.07, p.rubberBlack, M(`LM-BRUSH-${end}`, `${end === 'W' ? 'Infeed' : 'Outfeed'} belt-opening brush`, 'strip brush at conveyor opening', evA, 'ASSUMED', 2)), x, 1.06, LINE_Z));
  }

  // L1/L2: glazed front door over the belt opening
  const frameBars: [string, number, number, number][] = [
    ['TOP', LM_CX, 1.75, LM_W],
    ['BOTTOM', LM_CX, 0.3, LM_W]
  ];
  for (const [name, x, y, w] of frameBars) {
    l1.add(place(box(w, 0.05, 0.05, p.frameYellow, M(`LM-DOOR-BAR-${name}`, `Marking door ${name.toLowerCase()} bar`, 'door frame', evA, 'ESTIMATED', 1)), x, y, zF));
  }
  for (const [i, x] of [[1, xw], [2, xe]] as [number, number][]) {
    l1.add(place(box(0.05, 1.5, 0.05, p.frameYellow, M(`LM-DOOR-BAR-${i === 1 ? 'W' : 'E'}`, `Marking door ${i === 1 ? 'infeed' : 'outfeed'} bar`, 'door frame', evA, 'ESTIMATED', 1)), x, 1.02, zF));
  }
  const glass = part(
    new THREE.BoxGeometry(LM_W - 0.12, 1.36, 0.012),
    p.glazing.clone(),
    M('LM-DOOR-GLASS', 'Laser safety viewing window', 'laser safety enclosure window', evA, 'ASSUMED', 2)
  );
  place(glass, LM_CX, 1.03, zF + 0.005);
  l2.add(glass);
  windows.push(glass);
  l2.add(place(box(0.05, 0.05, 0.16, p.bolt, M('LM-DOOR-HANDLE', 'Marking door handle', 'door hardware', evA, 'ASSUMED', 4)), xe - 0.09, 1.02, zF + 0.09));
  for (const [i, y] of [[1, 1.62], [2, 0.42]] as [number, number][]) {
    l2.add(place(cyl(0.014, 0.014, 0.09, 10, p.bolt, M(`LM-DOOR-HINGE-${i}`, `Marking door hinge ${i}`, 'door hardware', evA, 'ASSUMED', 4)), xw + 0.03, y, zF + 0.04));
  }

  // L2: laser control cabinet beside the station, feet and conduit
  l2.add(place(box(0.5, 0.75, 0.28, p.panelGrey, M('LM-CAB-BODY', 'Laser control cabinet', 'laser source cabinet', evEq, 'ESTIMATED', 2)), LM_CX, 0.375, 0.72));
  l2.add(place(box(0.44, 0.68, 0.02, p.panelGrey, M('LM-CAB-DOOR', 'Laser cabinet door', 'cabinet door', evA, 'ASSUMED', 2)), LM_CX, 0.375, 0.865));
  l2.add(place(box(0.16, 0.03, 0.03, p.bolt, M('LM-CAB-HANDLE', 'Laser cabinet handle', 'cabinet hardware', evA, 'ASSUMED', 4)), LM_CX + 0.12, 0.4, 0.885));
  for (const [i, dx] of [[1, -0.2], [2, 0.2]] as [number, number][]) {
    l2.add(place(box(0.06, 0.03, 0.06, p.panelDark, M(`LM-CAB-FOOT-${i}`, `Laser cabinet foot ${i}`, 'cabinet foot', evA, 'ASSUMED', 2)), LM_CX + dx, 0.015, 0.72));
  }
  l2.add(at(cyl(0.012, 0.012, 0.55, 10, p.rubberBlack, M('LM-CABLE-1', 'Marking head cable run', 'cable', evA, 'ASSUMED', 4)), LM_CX - 0.2, 1.62, LINE_Z, 0, 0, Math.PI / 2));

  // L3 functional: gantry beam, marking head with down-facing lens barrel, the
  // part being marked, the part-present sensor pair and the gantry cabling
  l3.add(place(box(0.62, 0.06, 0.12, p.steel, M('LM-HEAD-GANTRY', 'Marking head gantry beam', 'marking head support', evA, 'ESTIMATED', 3)), LM_CX, 1.52, LINE_Z));
  l3.add(place(box(0.18, 0.18, 0.16, p.servoBlack, M('LM-HEAD-BODY', 'Laser marking head', '2D DataMatrix marking', evEq, 'ASSUMED', 3)), LM_CX, 1.4, LINE_Z));
  l3.add(place(cyl(0.03, 0.035, 0.07, 16, p.steel, M('LM-HEAD-LENS', 'Marking head lens barrel', 'marking beam exit', evIn, 'ASSUMED', 3)), LM_CX, 1.29, LINE_Z));
  l3.add(place(cyl(0.055, 0.055, 0.06, 16, p.partSteel, M('LM-PART', 'Blank in the marking station', 'workpiece being marked', evIn, 'ESTIMATED', 3)), LM_CX, BELT_Y + 0.03, LINE_Z));
  for (const [i, x, z] of [[1, LM_CX - 0.26, zB + 0.01], [2, LM_CX + 0.26, zF - 0.01]] as [number, number, number][]) {
    l3.add(place(box(0.04, 0.06, 0.03, p.servoBlack, M(`LM-SENSOR-${i}`, `Part-present laser sensor ${i}`, 'laser sensor (IP 172.38.22.38)', evPlate, 'ASSUMED', 3)), x, 1.16, z));
  }
  l3.add(at(cyl(0.011, 0.011, 0.24, 8, p.rubberBlack, M('LM-CABLE-2', 'Marking head service loop', 'cable', evA, 'ASSUMED', 4)), LM_CX + 0.2, 1.46, LINE_Z + 0.06, 0.9, 0, 0));

  // L4 detail: foot plates, bolts, laser warning sign, placard and the IP label
  for (const [i, x] of [[1, xw + 0.03], [2, xe - 0.03]] as [number, number][]) {
    for (const [j, z] of [[1, zB + 0.03], [2, zF - 0.03]] as [number, number][]) {
      l4.add(place(box(0.12, 0.02, 0.12, p.panelDark, M(`LM-FOOT-${i}${j}`, `Marking station foot plate ${i}${j}`, 'levelling foot', evA, 'ASSUMED', 4)), x, 0.01, z));
    }
  }
  l4.add(place(warningPlate(0.16, 0.16, M('LM-LABEL-LASER', 'Laser warning sign', 'laser hazard label', evLaser, 'ESTIMATED', 4)), LM_CX - 0.28, 1.5, zF + 0.02));
  l4.add(place(plate('LASER MARK', 0.34, 0.16, M('LM-PLACARD', 'Laser marking placard', 'station placard', evEq, 'ASSUMED', 4)), LM_CX, 0.42, 0.882));
  l4.add(place(plate('172.38.22.39', 0.3, 0.1, M('LM-L-IP', 'Laser station IP label', 'device IP label', evIP, 'ESTIMATED', 4)), LM_CX, 0.62, 0.882));

  // L5 visualisation: marking beam and status lamp (demo placeholders)
  const beam = part(
    new THREE.CylinderGeometry(0.005, 0.005, 0.16, 8),
    new THREE.MeshStandardMaterial({
      color: 0xd32f2f,
      emissive: 0xd32f2f,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.55
    }),
    M('LM-BEAM', 'Marking beam (visualisation)', 'marking process visualisation', EVIDENCE_CATS.assumption('marking beam is a visualisation placeholder - not measured process data'), 'ASSUMED', 5)
  );
  beam.visible = false;
  place(beam, LM_CX, 1.17, LINE_Z);
  l5.add(beam);
  rig.laserBeam = beam;
  const statusLamp = cyl(0.035, 0.035, 0.07, 12, rig.markingLamp, M('LM-LAMP-STATUS', 'Marking station status lamp', 'station status light', EVIDENCE_CATS.assumption('status lamp ASSUMED - not visible in any photograph'), 'ASSUMED', 5));
  l5.add(place(statusLamp, LM_CX + 0.3, LM_TOP + 0.06, LINE_Z - 0.2));
}

function buildReaderStation(c: ICtx): void {
  const { p, l1, l2, l3, l4, l5, rig } = c;
  const M = metaFor('READER');
  const evAutoID = EVIDENCE_CATS.photoMedium(F_AUTOID);
  const evEq = EVIDENCE_CATS.document('EQ-006 2D camera / code reader (Keyence SR-20AH, IP 172.38.22.37)', 'PDF extract');
  const evPos = EVIDENCE_CATS.document('EP-006 (EP verification before the DataMatrix reader at the induction station entrance)', 'PDF extract');
  const evA = EVIDENCE_CATS.assumption('reader mounting form ASSUMED - only its screen (PHOTO-02) and IP table row are documented');

  // L1/L2: base plate, post, arm reaching over the belt, brace and conduit
  // (the position - the induction station entrance - is documented by EP-006;
  // the mounting form is not)
  l1.add(place(box(0.16, 0.02, 0.16, p.panelDark, M('RD-BASE-PLATE', 'Reader post base plate', 'reader mount', evPos, 'ASSUMED', 1)), RD_X, 0.01, 0.44));
  l2.add(place(cyl(0.035, 0.035, 1.45, 14, p.steel, M('RD-POST', 'Reader mounting post', 'reader mount', evPos, 'ESTIMATED', 2)), RD_X, 0.735, 0.44));
  l2.add(place(box(0.06, 0.06, 0.54, p.steel, M('RD-ARM', 'Reader mounting arm', 'reader mount', evA, 'ESTIMATED', 2)), RD_X, 1.44, 0.17));
  l2.add(at(cyl(0.02, 0.02, 0.42, 10, p.steel, M('RD-ARM-BRACE', 'Reader arm brace', 'reader mount', evA, 'ASSUMED', 2)), RD_X, 1.24, 0.33, Math.PI / 4, 0, 0));
  l2.add(place(cyl(0.02, 0.02, 1.2, 10, p.rubberBlack, M('RD-CONDUIT', 'Reader cable conduit', 'cable conduit', evA, 'ASSUMED', 4)), RD_X - 0.06, 0.7, 0.44));

  // L3 functional: camera head with lens and ring light above the belt, junction box
  l3.add(place(box(0.11, 0.12, 0.11, p.servoBlack, M('RD-HEAD', 'DataMatrix reader head', '2D code reading', evEq, 'ASSUMED', 3)), RD_X, 1.33, LINE_Z));
  l3.add(place(cyl(0.028, 0.028, 0.05, 16, p.steel, M('RD-LENS', 'Reader lens', 'code reading optics', evEq, 'ASSUMED', 3)), RD_X, 1.26, LINE_Z));
  const ring = part(
    new THREE.TorusGeometry(0.046, 0.008, 8, 20),
    p.ledGreen.clone(),
    M('RD-RING-LIGHT', 'Reader ring light', 'code reading illumination', evA, 'ASSUMED', 3)
  );
  ring.rotation.x = Math.PI / 2;
  place(ring, RD_X, 1.285, LINE_Z);
  l3.add(ring);
  l3.add(place(box(0.06, 0.1, 0.06, p.steel, M('RD-HEAD-BRACKET', 'Reader head bracket', 'reader mount', evA, 'ASSUMED', 2)), RD_X, 1.4, -0.06));
  l3.add(place(box(0.14, 0.2, 0.1, p.panelGrey, M('RD-JUNCTION', 'Reader junction box', 'reader wiring', evA, 'ASSUMED', 3)), RD_X, 0.55, 0.44));
  l3.add(place(cyl(0.055, 0.055, 0.06, 16, p.partSteel, M('RD-PART', 'Blank entering the readings zone', 'workpiece being read', EVIDENCE_CATS.inference('feed belt continuity - the reader must see the part on the belt'), 'ESTIMATED', 3)), RD_X, BELT_Y + 0.03, LINE_Z));

  // L3: AutoID Network Navigator operator panel (PHOTO-02 shows that screen)
  l3.add(place(cyl(0.03, 0.03, 1.15, 12, p.steel, M('RD-PANEL-POST', 'AutoID panel pedestal', 'HMI mount', evA, 'ASSUMED', 2)), -0.8, 0.575, 0.95));
  l3.add(place(box(0.42, 0.32, 0.05, p.servoBlack, M('RD-PANEL-BODY', 'AutoID operator panel body', 'HMI panel', evAutoID, 'ASSUMED', 3)), -0.8, 1.32, 0.95));
  const screen = part(
    new THREE.BoxGeometry(0.36, 0.26, 0.012),
    rig.screen,
    M('RD-PANEL-SCREEN', 'AutoID Network Navigator screen', 'DataMatrix live view and tuning', evAutoID, 'ASSUMED', 3)
  );
  place(screen, -0.8, 1.32, 0.978);
  l3.add(screen);

  // L4 detail: model and IP labels, base bolts
  l4.add(place(plate('SR-20AH', 0.2, 0.09, M('RD-L-MODEL', 'Reader model label', 'reader nameplate', evEq, 'ESTIMATED', 4)), RD_X, 1.33, -0.216));
  l4.add(place(plate('172.38.22.37', 0.3, 0.09, M('RD-L-IP', 'Reader IP label', 'device IP label', evEq, 'ESTIMATED', 4)), RD_X, 0.55, 0.505));
  for (const [i, dz] of [[1, -0.05], [2, 0.05]] as [number, number][]) {
    l4.add(place(cyl(0.012, 0.012, 0.014, 8, p.bolt, M(`RD-BOLT-${i}`, `Reader base bolt ${i}`, 'fastener', evA, 'ASSUMED', 4)), RD_X, 0.023, 0.44 + dz));
  }

  // L5 visualisation: read-OK lamp on the head (demo placeholder)
  const okLamp = part(
    new THREE.CylinderGeometry(0.018, 0.018, 0.03, 10),
    rig.readerLamp,
    M('RD-LAMP-OK', 'Reader OK lamp', 'read result indication', EVIDENCE_CATS.assumption('read-OK lamp ASSUMED - the source shows only the AutoID screen, not station lamps'), 'ASSUMED', 5)
  );
  place(okLamp, RD_X - 0.07, 1.33, LINE_Z);
  l5.add(okLamp);
}

export function buildIdentification(palette: Palette): BuiltIdentification {
  const root = new THREE.Group();
  root.name = 'STATION_Ident';

  const layerGroups: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_Ident_Layer${n}`;
    layerGroups[n] = g;
    root.add(g);
  }
  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_Ident_Conceptual';
  root.add(conceptual);

  const lamps = {
    marking: palette.ledGreen.clone(),
    reader: palette.ledGreen.clone()
  };
  lamps.marking.emissiveIntensity = 0.05;
  lamps.reader.emissiveIntensity = 0.05;

  const rig: IdentificationRig = {
    laserBeam: new THREE.Mesh(),
    markingLamp: lamps.marking,
    readerLamp: lamps.reader,
    screen: new THREE.MeshStandardMaterial({
      color: 0x16233a,
      emissive: 0x2f6fd0,
      emissiveIntensity: 1.1,
      roughness: 0.35
    })
  };

  const ctx: ICtx = {
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

  buildMarkingStation(ctx);
  buildReaderStation(ctx);

  return { layerGroups, conceptual, rig, windows: ctx.windows };
}
