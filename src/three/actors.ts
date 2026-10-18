import * as THREE from 'three';
import type { Palette } from './materials';
import {
  at,
  box,
  cyl,
  labelTexture,
  part,
  place,
  EVIDENCE_CATS,
  type BuiltLayers,
  type PartEvidence,
  type PartMeta
} from './util';
import { GAGE_BENCH_X } from '../sim/lineSim';

// Phase 3 actors - the human operator, the (conceptual) manual GO/NO-GO gage
// station and the part marker that travels the line.
//
// HONESTY: the gage station (EQ-007) has NO photograph (NV-016, deferred) and
// the pin diameters in the source are only an example, not a program table
// (NV-014). Everything here is therefore ASSUMED / illustrative and is drawn on
// the unverified "conceptual" layer: it shows the *principle* of a manual
// go / no-go size check, it is not the plant's gage or its limits. The operator
// is a generic demo actor (no photo, no PPE spec claimed).

const REVIEWED = '2026-10-18';
const ASSUMED: PartEvidence = {
  sourceId: 'INFERENCE:gage station = EQ-007 (NV-016 - no photograph)',
  category: 'inference',
  confidence: 'low',
  status: 'unverified',
  reviewed: REVIEWED
};
const GAGE_SS: PartEvidence = {
  sourceId: 'INFERENCE:manual GO/NO-GO check (PF-010) - limits illustrative (NV-014)',
  category: 'inference',
  confidence: 'low',
  status: 'unverified',
  reviewed: REVIEWED
};
const OPERATOR_EV: PartEvidence = EVIDENCE_CATS.inference('INFERENCE:demo operator actor (Phase 3) - generic, not plant staff');

function meta(
  id: string,
  name: string,
  fn: string,
  evidence: PartEvidence = ASSUMED,
  layer: PartMeta['layer'] = 'conceptual'
): PartMeta {
  return { id, name, station: 'GAGE', function: fn, evidence, dimension: 'ASSUMED', layer };
}

export interface GageRig {
  goMaterial: THREE.MeshStandardMaterial;
  noGoMaterial: THREE.MeshStandardMaterial;
  /** the plunger / bore-gage that drops onto the part when it is checked */
  plunger: THREE.Object3D;
  flagMaterial: THREE.MeshStandardMaterial;
}

export interface OperatorRig {
  root: THREE.Group;
  /** shoulder pivot; rotate about Z to swing the right arm in / out */
  rightArm: THREE.Object3D;
  rightHand: THREE.Object3D;
}

function buildGageStation(p: Palette): BuiltLayers & { rig: GageRig } {
  const layers: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_Gage_Layer${n}`;
    layers[n] = g;
  }
  const l5 = layers['5'];
  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_Gage_Conceptual';

  const BX = GAGE_BENCH_X;
  const BZ = 0.95;
  const TOP = 0.9;

  const goMat = new THREE.MeshStandardMaterial({ color: 0x1f8f3a, roughness: 0.5, metalness: 0.2 });
  const noGoMat = new THREE.MeshStandardMaterial({ color: 0xb02121, roughness: 0.5, metalness: 0.2 });

  // bench
  l5.add(place(box(1.2, 0.06, 0.6, p.panelGrey, meta('GAGE-BENCH', 'Inspection bench top', 'operator gaging bench')), BX, TOP, BZ));
  for (const sx of [-0.56, 0.56]) {
    l5.add(
      place(
        box(0.06, 0.84, 0.55, p.panelDark, meta(`GAGE-LEG-${sx > 0 ? 'R' : 'L'}`, 'Bench frame', 'bench support')),
        BX + sx,
        TOP / 2,
        BZ
      )
    );
  }
  // gage fixture base
  l5.add(place(box(0.36, 0.05, 0.26, p.steel, meta('GAGE-FIXT', 'Gage fixture base', 'holds the part for the size check')), BX, TOP + 0.055, BZ));
  // GO and NO-GO masters, side by side, labelled
  const goBlock = box(0.1, 0.05, 0.1, goMat, meta('GAGE-GO', 'GO gage master', 'GO member - part must enter', GAGE_SS, 5));
  const noGoBlock = box(0.1, 0.05, 0.1, noGoMat, meta('GAGE-NOGO', 'NO-GO gage master', 'NO-GO member - part must not exceed', GAGE_SS, 5));
  l5.add(place(goBlock, BX - 0.12, TOP + 0.12, BZ));
  l5.add(place(noGoBlock, BX + 0.12, TOP + 0.12, BZ));
  const goLabel = part(new THREE.PlaneGeometry(0.09, 0.03), new THREE.MeshStandardMaterial({ map: labelTexture('GO', '#1f8f3a', '#ffffff'), roughness: 0.7 }), meta('GAGE-GO-LBL', 'GO label', 'identification'));
  const noGoLabel = part(new THREE.PlaneGeometry(0.09, 0.03), new THREE.MeshStandardMaterial({ map: labelTexture('NO-GO', '#b02121', '#ffffff'), roughness: 0.7 }), meta('GAGE-NOGO-LBL', 'NO-GO label', 'identification'));
  l5.add(at(goLabel, BX - 0.12, TOP + 0.16, BZ + 0.052, -Math.PI / 2, 0, 0));
  l5.add(at(noGoLabel, BX + 0.12, TOP + 0.16, BZ + 0.052, -Math.PI / 2, 0, 0));

  // plunger / column with a sliding probe
  l5.add(place(cyl(0.02, 0.02, 0.5, 12, p.steel, meta('GAGE-COLUMN', 'Gage column', 'guides the probe')), BX, TOP + 0.25, BZ - 0.16));
  const plunger = new THREE.Group();
  plunger.name = 'GAGE-PLUNGER';
  const probe = cyl(0.012, 0.012, 0.16, 10, p.bolt, meta('GAGE-PROBE', 'Gage probe', 'contacts the part (illustrative)', GAGE_SS, 5));
  place(probe, 0, -0.08, 0);
  const knob = cyl(0.03, 0.03, 0.03, 12, p.servoBlack, meta('GAGE-KNOB', 'Probe knob', 'operator moves the probe', GAGE_SS, 5));
  place(knob, 0, 0.02, 0);
  plunger.add(probe, knob);
  plunger.position.set(BX, TOP + 0.34, BZ);
  l5.add(plunger);

  // placard: this is not the plant's gage
  const placard = at(
    part(new THREE.PlaneGeometry(0.5, 0.16), new THREE.MeshStandardMaterial({ map: labelTexture('GAGE (ASSUMED)', '#f7d117', '#111'), roughness: 0.7 }), meta('GAGE-PLACARD', 'Conceptual gage placard', 'marks the station as unverified')),
    BX,
    TOP + 0.02,
    BZ + 0.301
  );
  conceptual.add(placard);
  const nvNote = at(
    part(new THREE.PlaneGeometry(0.5, 0.1), new THREE.MeshStandardMaterial({ map: labelTexture('NV-016', '#eeeeee', '#333'), roughness: 0.7 }), meta('GAGE-NV', 'NV-016 reference', 'station not photographed')),
    BX,
    TOP - 0.1,
    BZ + 0.301
  );
  conceptual.add(nvNote);

  // status flag on the bench
  const flagMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x333333, emissiveIntensity: 0.4, roughness: 0.6 });
  l5.add(place(box(0.12, 0.05, 0.05, flagMaterial, meta('GAGE-FLAG', 'Gage result flag', 'shows GO / NO-GO (demo)')), BX, TOP + 0.03, BZ - 0.24));

  return {
    layerGroups: layers,
    conceptual,
    rig: { goMaterial: goMat, noGoMaterial: noGoMat, plunger, flagMaterial }
  };
}

function buildOperator(_p: Palette): OperatorRig {
  const root = new THREE.Group();
  root.name = 'STATION_Operator';
  const skin = new THREE.MeshStandardMaterial({ color: 0xc08c68, roughness: 0.8 });
  const hivis = new THREE.MeshStandardMaterial({ color: 0xd7ff1a, roughness: 0.7 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x2a3a55, roughness: 0.85 });
  const helmet = new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.5 });
  const gloves = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.8 });

  const m = (id: string, name: string): PartMeta => meta(id, name, 'demo operator actor (Phase 3)', OPERATOR_EV, 5);

  // legs
  root.add(place(cyl(0.07, 0.07, 0.85, 10, trousers, m('OP-LEG-L', 'Operator leg (L)')), -0.1, 0.425, 0));
  root.add(place(cyl(0.07, 0.07, 0.85, 10, trousers, m('OP-LEG-R', 'Operator leg (R)')), 0.1, 0.425, 0));
  // torso (hi-vis)
  root.add(place(cyl(0.16, 0.19, 0.62, 12, hivis, m('OP-TORSO', 'Hi-vis vest / torso')), 0, 1.16, 0));
  // head + helmet
  root.add(place(part(new THREE.SphereGeometry(0.11, 16, 12), skin, m('OP-HEAD', 'Operator head')), 0, 1.58, 0));
  root.add(
    place(
      part(new THREE.SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), helmet, m('OP-HELMET', 'Hard hat')),
      0,
      1.62,
      0
    )
  );
  // arms pivot at the shoulders (y 1.4)
  const mkArm = (side: 1 | -1, id: string): THREE.Object3D => {
    const pivot = new THREE.Group();
    pivot.name = id;
    pivot.position.set(side * 0.2, 1.4, 0);
    const upper = cyl(0.045, 0.045, 0.34, 8, hivis, m(`${id}-U`, 'Operator upper arm'));
    place(upper, 0, -0.17, 0);
    const fore = cyl(0.04, 0.04, 0.32, 8, skin, m(`${id}-F`, 'Operator forearm'));
    place(fore, 0, -0.5, 0);
    const hand = part(new THREE.SphereGeometry(0.055, 10, 8), gloves, m(`${id}-HAND`, 'Operator glove'));
    place(hand, 0, -0.68, 0);
    hand.name = `${id}-HAND`;
    pivot.add(upper, fore, hand);
    return pivot;
  };
  const rightArm = mkArm(1, 'OP-ARM-R');
  const leftArm = mkArm(-1, 'OP-ARM-L');
  root.add(rightArm, leftArm);
  // rest pose: arms slightly out
  rightArm.rotation.z = -0.25;
  leftArm.rotation.z = 0.25;

  root.position.set(GAGE_BENCH_X - 0.02, 0, 1.55);
  root.rotation.y = Math.PI; // face the line (-Z)

  return { root, rightArm, rightHand: rightArm.getObjectByName('OP-ARM-R-HAND') as THREE.Object3D };
}

/** A small CV OR-shaped marker used for the parts travelling the line. */
export function buildPartMarker(): { group: THREE.Group; material: THREE.MeshStandardMaterial } {
  const material = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.35, metalness: 0.85 });
  const g = new THREE.Group();
  g.name = 'SIM-PART';
  const m = meta('SIM-PART', 'Travelling CV OR part (demo)', 'shows the part moving along the line', EVIDENCE_CATS.inference('INFERENCE:Phase 3 part marker - illustrative shape (NV-018)'), 'conceptual');
  const stem = cyl(0.02, 0.02, 0.09, 12, material, m);
  place(stem, 0, 0.025, 0);
  const bell = cyl(0.05, 0.028, 0.06, 14, material, m);
  place(bell, 0, -0.05, 0);
  const shaft = cyl(0.012, 0.012, 0.09, 10, material, m);
  place(shaft, 0, 0.06, 0);
  g.add(stem, bell, shaft);
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
  });
  return { group: g, material };
}

export function buildGageActors(p: Palette): {
  gage: BuiltLayers & { rig: GageRig };
  operator: OperatorRig;
} {
  return { gage: buildGageStation(p), operator: buildOperator(p) };
}
