import * as THREE from 'three';
import type { Palette } from './materials';
import { EVIDENCE_CATS, box, cyl, labelTexture, part, tagInstanced } from './util';
import type { BuiltLayers, PartMeta, WorkpieceRig } from './util';

// Phase 2b increment 3 - CV OR workpiece (MASTER_PROMPT section 5.4).
//
// HONESTY NOTES (see docs/model-checklist/cv-or-workpiece.md):
//  - There is no dimensioned drawing or CAD for the part (NV-011) and no
//    reference photograph shows the workpiece in isolation, so EVERY dimension
//    here is ESTIMATED from photo proportions (PHOTO-05, PHOTO-09, PHOTO-12) or
//    ASSUMED for features that are never visible (internal cage seat, spline
//    tooth count, flange bolt pattern). Nothing is MEASURED.
//  - The part is NOT a tripot: the sources describe a CV outer race ("CV OR")
//    with a bell/bowl and a stem (QN-004 bell colour, QN-005 stem heat zone,
//    PR-001/PR-002 Z2 axis positions). Spline, journal and flange details are
//    modelled because the documents reference spline gages (EQ-007) and PMI
//    marking (GD-004, GS-004), not because they were seen.
//  - Built upright (axis = +Y, mouth up, stem down) with the flange base at
//    y = 0. line.ts mounts and rotates it into the induction fixture.
const F_PART = '4.20.43 PM.jpeg';
const F_BOWL = '4.20.42 PM (4).jpeg';
const DOC = 'Project_Document.pdf';
export const WP_STATION = 'WORKPIECE';
export const WP_SCALE = 0.75;

interface Ctx {
  p: Palette;
  l1: THREE.Group;
  l2: THREE.Group;
  l3: THREE.Group;
  l4: THREE.Group;
  l5: THREE.Group;
  conceptual: THREE.Group;
  rig: WorkpieceRig;
}

function meta(
  id: string,
  name: string,
  fn: string,
  evidence: PartMeta['evidence'],
  dimension: PartMeta['dimension'],
  layer: PartMeta['layer']
): PartMeta {
  return { id, name, station: WP_STATION, function: fn, evidence, dimension, layer };
}

/** Radial placement helper: puts an object on the revolution surface at angle
 *  `theta` (measured from +Z) and radius `r`, with local +Z pointing outward. */
function onRadius(obj: THREE.Object3D, theta: number, r: number, y: number): THREE.Object3D {
  obj.position.set(Math.sin(theta) * r, y, Math.cos(theta) * r);
  obj.rotation.y = theta;
  return obj;
}

/** Radial stud helper: lies a short cylinder flat against the wall so its axis
 *  points radially outward (used for the OPD dot mark). */
function onRadiusRadial(obj: THREE.Object3D, theta: number, r: number, y: number): THREE.Object3D {
  obj.rotation.order = 'YXZ';
  obj.rotation.set(Math.PI / 2, theta, 0);
  obj.position.set(Math.sin(theta) * r, y, Math.cos(theta) * r);
  return obj;
}

export function buildCvOuterRace(p: Palette): BuiltLayers & { rig: WorkpieceRig } {
  const root = new THREE.Group();
  root.name = 'STATION_Workpiece';

  const layerGroups: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_Workpiece_Layer${n}`;
    layerGroups[n] = g;
    root.add(g);
  }
  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_Workpiece_Conceptual';
  root.add(conceptual);

  const machined = new THREE.MeshStandardMaterial({ color: 0xb2b9c0, roughness: 0.2, metalness: 0.95 });
  const markDark = new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.5, metalness: 0.3 });
  const heat = new THREE.MeshStandardMaterial({
    color: 0x9aa1a8,
    roughness: 0.35,
    metalness: 0.85,
    emissive: 0x000000,
    emissiveIntensity: 0
  });
  const oil = new THREE.MeshStandardMaterial({
    color: 0x7d7355,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const ctx: Ctx = {
    p,
    l1: layerGroups['1'],
    l2: layerGroups['2'],
    l3: layerGroups['3'],
    l4: layerGroups['4'],
    l5: layerGroups['5'],
    conceptual,
    rig: { heat }
  };

  buildBell(ctx, machined, markDark, heat);
  buildStem(ctx, machined);
  buildMarks(ctx, markDark);
  buildVisualisation(ctx, oil);

  return { layerGroups, conceptual, rig: ctx.rig };
}

/** L1/L2: hollow bell (outer race) built as three lathe wall segments so the
 *  three tripod windows are real openings, plus rim, rails and flange. */
function buildBell(
  ctx: Ctx,
  machined: THREE.MeshStandardMaterial,
  markDark: THREE.MeshStandardMaterial,
  heat: THREE.MeshStandardMaterial
): void {
  const profile: [number, number][] = [
    [0.032, 0.01],
    [0.07, 0.01],
    [0.074, 0.04],
    [0.082, 0.09],
    [0.092, 0.132],
    [0.099, 0.142],
    [0.099, 0.152],
    [0.093, 0.146],
    [0.084, 0.12],
    [0.072, 0.07],
    [0.046, 0.022],
    [0.032, 0.01]
  ];
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  // The wall is a hollow casting: its inner surface is visible through the
  // three windows and the mouth, so the shell is rendered two-sided.
  const wallMat = ctx.p.partSteel.clone();
  wallMat.side = THREE.DoubleSide;
  const gap = 0.3;
  const span = (Math.PI * 2) / 3 - gap;
  for (let k = 0; k < 3; k++) {
    const phiStart = (k * Math.PI * 2) / 3 + gap / 2;
    const wall = part(
      new THREE.LatheGeometry(pts, 18, phiStart, span),
      wallMat,
      meta(
        `WP-RACE-WALL-${k + 1}`,
        `Outer race wall segment ${k + 1} of 3`,
        'bell / bowl wall between tripod windows',
        EVIDENCE_CATS.photoMedium(F_BOWL),
        'ESTIMATED',
        1
      )
    );
    ctx.l1.add(wall);
  }

  const lip = part(
    new THREE.TorusGeometry(0.096, 0.007, 10, 28),
    ctx.p.partSteel,
    meta(
      'WP-MOUTH-LIP',
      'Bell mouth lip',
      'open mouth of the outer race',
      EVIDENCE_CATS.photoLow(F_BOWL),
      'ESTIMATED',
      2
    )
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.152;
  ctx.l2.add(lip);

  for (let k = 0; k < 3; k++) {
    for (const s of [-1, 1]) {
      const theta = (k * Math.PI * 2) / 3 + (s * gap) / 2;
      const rail = box(
        0.012,
        0.128,
        0.008,
        machined,
        meta(
          `WP-WIN-RAIL-${k + 1}${s < 0 ? 'A' : 'B'}`,
          `Window edge rail ${k + 1}${s < 0 ? 'A' : 'B'}`,
          'cast rail framing a tripod window',
          EVIDENCE_CATS.photoLow(F_BOWL),
          'ESTIMATED',
          2
        )
      );
      onRadius(rail, theta, 0.086, 0.078);
      ctx.l2.add(rail);
    }
  }

  const flange = cyl(
    0.082,
    0.082,
    0.012,
    24,
    machined,
    meta(
      'WP-FLANGE',
      'Base flange',
      'bell base face for fixture clamping',
      EVIDENCE_CATS.inference('EQ-007 fixture/gage drawing set (flange not photographed)'),
      'ESTIMATED',
      2
    )
  );
  flange.position.y = 0.004;
  ctx.l2.add(flange);

  const holes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 8),
    markDark,
    6
  );
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    m4.makeTranslation(Math.sin(a) * 0.076, 0.0105, Math.cos(a) * 0.076);
    holes.setMatrixAt(i, m4);
  }
  tagInstanced(
    holes,
    meta(
      'WP-FLANGE-HOLES',
      'Base flange holes (6)',
      'mounting / locating holes',
      EVIDENCE_CATS.assumption('bolt pattern never visible in any source photograph'),
      'ASSUMED',
      2
    )
  );
  ctx.l2.add(holes);

  const bellBand = part(
    new THREE.TorusGeometry(0.079, 0.006, 8, 28),
    heat,
    meta(
      'WP-HEAT-BELL',
      'Bell colour band (L5 visualisation)',
      'heated bell colour - QN-004 straw/gray',
      EVIDENCE_CATS.document(DOC, '5'),
      'ESTIMATED',
      5
    )
  );
  bellBand.rotation.x = Math.PI / 2;
  bellBand.position.y = 0.062;
  ctx.l5.add(bellBand);
}

/** L1/L3: stem, spline, clamp journal and interior seats. */
function buildStem(ctx: Ctx, machined: THREE.MeshStandardMaterial): void {
  const stem = cyl(
    0.026,
    0.023,
    0.085,
    20,
    ctx.p.partSteel,
    meta(
      'WP-STEM',
      'Stem / shaft',
      'stem quenched at the induction station',
      EVIDENCE_CATS.photo(F_PART),
      'ESTIMATED',
      1
    )
  );
  stem.position.y = -0.0425;
  ctx.l1.add(stem);

  const band = cyl(
    0.0285,
    0.0285,
    0.05,
    20,
    ctx.rig.heat,
    meta(
      'WP-HEAT-BAND',
      'Stem heat band (L5 visualisation)',
      'stem heat zone - QN-005 clean heat band',
      EVIDENCE_CATS.document(DOC, '5'),
      'ESTIMATED',
      5
    )
  );
  band.position.y = -0.034;
  ctx.l5.add(band);

  const journal = cyl(
    0.0195,
    0.0195,
    0.026,
    16,
    machined,
    meta(
      'WP-CLAMP-JOURNAL',
      'Clamp journal',
      'machined seat gripped by the fixture jaws',
      EVIDENCE_CATS.document(DOC, '5'),
      'ESTIMATED',
      3
    )
  );
  journal.position.y = -0.032;
  ctx.l3.add(journal);

  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.004, 0.03, 0.006), machined, 16);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    e.set(0, a, 0);
    q.setFromEuler(e);
    m4.compose(
      new THREE.Vector3(Math.sin(a) * 0.0225, -0.062, Math.cos(a) * 0.0225),
      q,
      new THREE.Vector3(1, 1, 1)
    );
    teeth.setMatrixAt(i, m4);
  }
  tagInstanced(
    teeth,
    meta(
      'WP-SPLINE',
      'Spline teeth (16)',
      'spline drive feature checked with Go/NoGo gages',
      EVIDENCE_CATS.document(DOC, '3'),
      'ASSUMED',
      3
    )
  );
  ctx.l3.add(teeth);

  const seat = cyl(
    0.062,
    0.062,
    0.006,
    24,
    machined,
    meta(
      'WP-SEAT-FLOOR',
      'Interior seating face',
      'part seating face - QN-002 fully seated',
      EVIDENCE_CATS.document(DOC, '5'),
      'ESTIMATED',
      3
    )
  );
  seat.position.y = 0.016;
  ctx.l3.add(seat);

  const cageSeat = part(
    new THREE.TorusGeometry(0.08, 0.005, 8, 28),
    machined,
    meta(
      'WP-CAGE-SEAT',
      'Cage seat ring',
      'inner race / cage location (interior, not visible in photos)',
      EVIDENCE_CATS.assumption('interior of the bell is never visible in the sources'),
      'ASSUMED',
      3
    )
  );
  cageSeat.rotation.x = Math.PI / 2;
  cageSeat.position.y = 0.12;
  ctx.l3.add(cageSeat);

  const chamfer = cyl(
    0.02,
    0.024,
    0.006,
    16,
    machined,
    meta(
      'WP-CHAMFER-STEM',
      'Stem end chamfer',
      'lead-in chamfer on the stem end',
      EVIDENCE_CATS.inference('EQ-007 Go/NoGo gage drawing set'),
      'ESTIMATED',
      4
    )
  );
  chamfer.position.y = -0.0885;
  ctx.l4.add(chamfer);

  const mouthChamfer = part(
    new THREE.TorusGeometry(0.093, 0.0035, 8, 28),
    machined,
    meta(
      'WP-CHAMFER-MOUTH',
      'Mouth chamfer',
      'lead-in chamfer at the bell mouth',
      EVIDENCE_CATS.inference('EQ-007 Go/NoGo gage drawing set'),
      'ESTIMATED',
      4
    )
  );
  mouthChamfer.rotation.x = Math.PI / 2;
  mouthChamfer.position.y = 0.1555;
  ctx.l4.add(mouthChamfer);

  const finish = cyl(
    0.0265,
    0.0265,
    0.01,
    16,
    machined,
    meta(
      'WP-FINISH-BAND',
      'Machined finish band',
      'ground/machined finish reference band',
      EVIDENCE_CATS.inference('machined finish read from PHOTO-09 gloss, band position assumed'),
      'ESTIMATED',
      4
    )
  );
  finish.position.y = -0.014;
  ctx.l4.add(finish);
}

/** L4: part marks referenced by the documents (2D code, dot, 'V', numbering).
 *  All four sit on the outer bell wall because that is the only part surface
 *  the sources show clearly; their positions are ASSUMED, not documented. */
function buildMarks(ctx: Ctx, markDark: THREE.MeshStandardMaterial): void {
  const code = box(
    0.016,
    0.016,
    0.0015,
    markDark,
    meta(
      'WP-MARK-DM',
      'Laser DataMatrix mark (2D code)',
      'laser-marked 2D code read by the AutoID reader',
      EVIDENCE_CATS.inference('EQ-005 laser marking / EQ-006 code reader; mark position assumed'),
      'ASSUMED',
      4
    )
  );
  onRadius(code, 1.05, 0.0792, 0.07);
  ctx.l4.add(code);

  const dot = cyl(
    0.004,
    0.004,
    0.002,
    10,
    markDark,
    meta(
      'WP-MARK-DOT',
      'OPD dot mark',
      'bearing face dot mark - GD-004',
      EVIDENCE_CATS.document(DOC, '5'),
      'ESTIMATED',
      4
    )
  );
  onRadiusRadial(dot, 0.6, 0.0835, 0.1);
  ctx.l4.add(dot);

  const vMat = new THREE.MeshStandardMaterial({ map: labelTexture('V', '#e8e8e8', '#111') });
  const vMark = part(
    new THREE.PlaneGeometry(0.016, 0.016),
    vMat,
    meta(
      'WP-MARK-V',
      "OK 'V' mark",
      "OK part marked with 'V' - GS-004",
      EVIDENCE_CATS.document(DOC, '5'),
      'ASSUMED',
      4
    )
  );
  onRadius(vMark, 1.35, 0.0795, 0.09);
  ctx.l4.add(vMark);

  const numMat = new THREE.MeshStandardMaterial({ map: labelTexture('1-5', '#e8e8e8', '#111') });
  const numMark = part(
    new THREE.PlaneGeometry(0.02, 0.01),
    numMat,
    meta(
      'WP-MARK-NUM',
      'Part numbering mark (1-5)',
      'parts numbered 1-5 - GD-004 (stand-in for five number marks)',
      EVIDENCE_CATS.document(DOC, '5'),
      'ASSUMED',
      4
    )
  );
  onRadius(numMark, 0.75, 0.084, 0.115);
  ctx.l4.add(numMark);
}

/** Conceptual: coolant/oil film seen on the part in PHOTO-05. */
function buildVisualisation(ctx: Ctx, oil: THREE.MeshStandardMaterial): void {
  const film = cyl(
    0.076,
    0.076,
    0.11,
    20,
    oil,
    meta(
      'WP-OIL-FILM',
      'Coolant / oil film (conceptual)',
      'oil or coolant sheen on the part',
      EVIDENCE_CATS.photoLow(F_BOWL),
      'ASSUMED',
      'conceptual'
    )
  );
  film.position.y = 0.078;
  film.castShadow = false;
  film.receiveShadow = false;
  ctx.conceptual.add(film);
}
