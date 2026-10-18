import * as THREE from 'three';
import type { Palette } from './materials';
import { buildInductionMachine, type BuiltStation } from './induction';
import { buildIdentification } from './identification';
import { buildLineEnd } from './lineEnd';
import { buildGageActors, type GageRig, type OperatorRig } from './actors';
import { buildOven } from './oven';
import { buildCvOuterRace, WP_SCALE } from './workpiece';
import { buildWashStations } from './washers';
import type { IdentificationRig, LineEndRig, OvenRig, WashRig, WorkpieceRig } from './util';

// Phase 2b composite: wash stations (blank wash, TP/CV wash), the Phase 2a
// induction machine, the Phase 2b increment 2 draw oven, the Phase 2b increment
// 3 CV OR workpiece, the Phase 2b increment 4 line end (cooling / unload +
// boxing) and the Phase 2b increment 5 identification stations (laser marking +
// 2D code reader), re-parented into one line-level layer tree so the single
// L1-L5 / conceptual toggle set in scene.ts drives the whole line.
export interface BuiltLine extends BuiltStation {
  gageRig: GageRig;
  operator: OperatorRig;
}

export function buildLine(palette: Palette): BuiltLine {
  const ind = buildInductionMachine(palette);
  const wash = buildWashStations(palette);
  const oven = buildOven(palette);
  const workpiece = buildCvOuterRace(palette);
  const lineEnd = buildLineEnd(palette);
  const ident = buildIdentification(palette);
  const actors = buildGageActors(palette);

  const root = new THREE.Group();
  root.name = 'STATION_Line';

  // The workpiece is modelled upright (axis +Y); the mount lays it into the
  // Phase 2a induction fixture at (0, 1.1, -0.15) with the stem toward -X and
  // the bell mouth toward +X. `ZYX` order spins the part about its own axis
  // before tilting it: -90 deg puts the part marks (WP-MARK-*) toward the
  // front-right close-up pose while the tripod windows stay visible at an angle.
  const mount = (sub: THREE.Group, name: string): THREE.Group => {
    const g = new THREE.Group();
    g.name = name;
    g.rotation.order = 'ZYX';
    g.rotation.set(0, -Math.PI / 2, -Math.PI / 2);
    g.position.set(0, 1.1, -0.15);
    g.scale.setScalar(WP_SCALE);
    g.add(sub);
    return g;
  };

  const layerGroups: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_Line_Layer${n}`;
    g.add(ind.layerGroups[n]);
    g.add(wash.layerGroups[n]);
    g.add(oven.layerGroups[n]);
    g.add(lineEnd.layerGroups[n]);
    g.add(ident.layerGroups[n]);
    g.add(actors.gage.layerGroups[n]);
    g.add(mount(workpiece.layerGroups[n], `STATION_Workpiece_Layer${n}`));
    layerGroups[n] = g;
    root.add(g);
  }

  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_Line_Conceptual';
  conceptual.add(ind.conceptual);
  conceptual.add(wash.conceptual);
  conceptual.add(oven.conceptual);
  conceptual.add(lineEnd.conceptual);
  conceptual.add(ident.conceptual);
  conceptual.add(actors.gage.conceptual);
  conceptual.add(mount(workpiece.conceptual, 'STATION_Workpiece_Conceptual'));
  root.add(conceptual);

  // the demo operator stands with the line (not layer-gated - it is an actor)
  root.add(actors.operator.root);

  // washer / identification viewing windows join the shared glass x-ray toggle
  for (const w of wash.windows) ind.rig.glazing.push(w);
  for (const w of ident.windows) ind.rig.glazing.push(w);

  const washRig: WashRig = wash.rig;
  const ovenRig: OvenRig = oven.rig;
  const workpieceRig: WorkpieceRig = workpiece.rig;
  const lineEndRig: LineEndRig = lineEnd.rig;
  const identRig: IdentificationRig = ident.rig;
  return {
    root,
    layerGroups,
    conceptual,
    rig: ind.rig,
    washRig,
    ovenRig,
    workpieceRig,
    lineEndRig,
    identRig,
    gageRig: actors.gage.rig,
    operator: actors.operator
  };
}
