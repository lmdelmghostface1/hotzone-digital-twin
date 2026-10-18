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
import type { IdentificationRig, LineEndRig, OvenRig, PartMeta, WashRig, WorkpieceRig } from './util';

const F_MESH = '4.20.44 PM (1).jpeg';
const F_WINDOW = '4.20.42 PM (3).jpeg';
const F_INTERIOR = '4.20.42 PM (2).jpeg';
const F_PART = '4.20.43 PM.jpeg';
const F_PANEL = '4.20.44 PM (4).jpeg';
const F_CONV = '4.20.41 PM.jpeg';

export interface StationRig {
  doorPivot: THREE.Group;
  glazing: THREE.Mesh[];
  coilMaterial: THREE.MeshStandardMaterial;
  sprayGroup: THREE.Group;
  droplets: THREE.Mesh[];
  beaconLens: THREE.Mesh;
  root: THREE.Group;
}

export interface BuiltStation {
  root: THREE.Group;
  layerGroups: Record<string, THREE.Group>;
  conceptual: THREE.Group;
  rig: StationRig;
  washRig?: WashRig;
  ovenRig?: OvenRig;
  workpieceRig?: WorkpieceRig;
  lineEndRig?: LineEndRig;
  identRig?: IdentificationRig;
}

interface Ctx {
  p: Palette;
  root: THREE.Group;
  l1: THREE.Group;
  l2: THREE.Group;
  l3: THREE.Group;
  l4: THREE.Group;
  l5: THREE.Group;
  conceptual: THREE.Group;
  rig: StationRig;
}

function meta(
  id: string,
  name: string,
  fn: string,
  evidence: PartMeta['evidence'],
  dimension: PartMeta['dimension'],
  layer: PartMeta['layer']
): PartMeta {
  return { id, name, station: 'INDUCTION', function: fn, evidence, dimension, layer };
}

function tube(
  points: [number, number, number][],
  radius: number,
  material: THREE.Material,
  m: PartMeta
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return part(new THREE.TubeGeometry(curve, 72, radius, 10, false), material, m);
}

export function buildInductionMachine(palette: Palette): BuiltStation {
  const root = new THREE.Group();
  root.name = 'STATION_Induction_CV4';

  const layerGroups: Record<string, THREE.Group> = {};
  for (const n of ['1', '2', '3', '4', '5']) {
    const g = new THREE.Group();
    g.name = `STATION_Induction_Layer${n}`;
    layerGroups[n] = g;
    root.add(g);
  }
  const conceptual = new THREE.Group();
  conceptual.name = 'STATION_Induction_Conceptual';
  root.add(conceptual);

  const ctx: Ctx = {
    p: palette,
    root,
    l1: layerGroups['1'],
    l2: layerGroups['2'],
    l3: layerGroups['3'],
    l4: layerGroups['4'],
    l5: layerGroups['5'],
    conceptual,
    rig: {
      doorPivot: new THREE.Group(),
      glazing: [],
      coilMaterial: palette.copper,
      sprayGroup: new THREE.Group(),
      droplets: [],
      beaconLens: new THREE.Mesh(),
      root
    }
  };

  buildSilhouette(ctx);
  buildMechanical(ctx);
  buildFunctional(ctx);
  buildFineDetail(ctx);
  buildVisualisation(ctx);
  buildConceptual(ctx);

  ctx.rig.sprayGroup.visible = false;
  ctx.l5.add(ctx.rig.sprayGroup);
  ctx.l2.add(ctx.rig.doorPivot);

  return { root, layerGroups, conceptual, rig: ctx.rig };
}

function buildSilhouette(c: Ctx): void {
  const { p, l1 } = c;
  const ev = EVIDENCE_CATS.photo(F_MESH);

  const padPos: [number, number][] = [
    [-1.15, -0.8],
    [1.15, -0.8],
    [-1.15, 0],
    [1.15, 0],
    [-1.15, 0.8],
    [1.15, 0.8]
  ];
  padPos.forEach(([x, z], i) => {
    l1.add(
      at(
        cyl(0.07, 0.08, 0.05, 16, p.bolt, meta(`IND-F-PAD-${i}`, `Levelling pad ${i}`, 'leveling foot',
          ev, 'ESTIMATED', 2)),
        x, 0.025, z
      )
    );
    l1.add(
      at(
        cyl(0.022, 0.022, 0.2, 10, p.steel, meta(`IND-F-STEM-${i}`, `Foot stem ${i}`, 'foot stem',
          ev, 'ESTIMATED', 2)),
        x, 0.13, z
      )
    );
  });

  const beams: [number, number, number, number, number, string][] = [
    [2.4, 0.13, 0.1, 0, 0.8, 'front'],
    [2.4, 0.13, 0.1, 0, -0.8, 'rear'],
    [0.1, 0.13, 1.7, -1.15, 0, 'left'],
    [0.1, 0.13, 1.7, 1.15, 0, 'right'],
    [0.08, 0.1, 1.5, -0.45, 0, 'cross-left'],
    [0.08, 0.1, 1.5, 0.45, 0, 'cross-right']
  ];
  beams.forEach(([w, h, d, x, z, label], i) => {
    l1.add(
      place(
        box(w, h, d, p.frameYellow,
          meta(`IND-F-BEAM-${i}`, `Base frame beam ${label}`, 'structural frame',
            ev, 'ESTIMATED', 2)),
        x, 0.26, z
      )
    );
  });

  l1.add(
    place(
      box(1.65, 1.55, 1.3, p.panelGrey,
        meta('IND-E-SHELL', 'Wet-cell enclosure shell', 'process enclosure (washer/quench cell)',
          ev, 'ESTIMATED', 2)),
      0, 1.095, -0.45
    )
  );

  l1.add(
    place(
      box(1.15, 0.42, 1.0, p.panelDark,
        meta('IND-E-HEAD', 'Upper head assembly', 'upper machine head / drive housing',
          ev, 'ESTIMATED', 2)),
      0, 2.06, -0.45
    )
  );

  const posts: [number, number, string][] = [
    [-0.9, 1.25, 'left'],
    [0.9, 1.25, 'right']
  ];
  posts.forEach(([x, z, label], i) => {
    l1.add(
      place(
        box(0.1, 1.9, 0.1, p.frameYellow,
          meta(`IND-B-POST-${i}`, `Bay frame post ${label}`, 'open bay frame',
            ev, 'ESTIMATED', 2)),
        x, 1.25, z
      )
    );
  });
  l1.add(
    place(
      box(1.9, 0.1, 0.1, p.frameYellow,
        meta('IND-B-BEAM', 'Bay frame top beam', 'open bay frame', ev, 'ESTIMATED', 2)),
      0, 2.15, 1.25
    )
  );

  l1.add(
    place(
      box(1.63, 0.1, 0.42, p.panelGrey,
        meta('IND-C-BED', 'Feed conveyor bed (left entry)', 'part feed conveyor',
          EVIDENCE_CATS.inference(`${F_CONV} (wash-station conveyor style, same line)`), 'ESTIMATED', 2)),
      -1.63, 0.95, -0.15
    )
  );
  l1.add(
    place(
      box(1.63, 0.03, 0.36, p.conveyorBelt,
        meta('IND-C-BELT', 'Conveyor belt surface', 'part feed conveyor belt',
          EVIDENCE_CATS.inference(`${F_CONV} (wash-station conveyor style, same line)`), 'ESTIMATED', 2)),
      -1.63, 1.01, -0.15
    )
  );

  const guardBars: [number, number, number, number, number][] = [
    [2.3, 0.06, 0.06, 0, 0.33],
    [2.3, 0.06, 0.06, 0, 1.58]
  ];
  guardBars.forEach(([w, h, d, x, y], i) => {
    l1.add(
      place(
        box(w, h, d, p.steel,
          meta(`IND-G-RAIL-${i}`, `Mesh guard rail ${i}`, 'wire-mesh safety guard',
            ev, 'ESTIMATED', 2)),
        x, y, 1.4
      )
    );
  });
  for (const [i, x] of [-1.12, 1.12].entries()) {
    l1.add(
      place(
        box(0.06, 1.31, 0.06, p.steel,
          meta(`IND-G-POST-${i}`, `Mesh guard post ${i}`, 'wire-mesh safety guard',
            ev, 'ESTIMATED', 2)),
        x, 0.955, 1.4
      )
    );
  }

  l1.add(
    place(
      box(2.4, 0.08, 0.3, p.panelDark,
        meta('IND-T-TRAY', 'Overhead cable tray', 'cable/hose routing',
          ev, 'ESTIMATED', 2)),
      0, 2.45, 0.2
    )
  );
}

function buildMechanical(c: Ctx): void {
  const { p, l2, rig } = c;
  const evW = EVIDENCE_CATS.photo(F_WINDOW);
  const evI = EVIDENCE_CATS.photo(F_INTERIOR);

  const recess = box(1.0, 0.72, 0.05, p.servoBlack,
    meta('IND-D-RECESS', 'Window opening recess', 'front access opening',
      evW, 'ESTIMATED', 2));
  place(recess, 0, 1.18, 0.21);
  l2.add(recess);

  const door = new THREE.Group();
  door.name = 'IND_DoorPivot';
  rig.doorPivot.position.set(-0.5, 1.18, 0.235);

  const frameParts: [number, number, number, number][] = [
    [1.0, 0.06, 0.03, 0.36],
    [1.0, 0.06, 0.03, -0.36],
    [0.06, 0.78, 0.03, -0.47],
    [0.06, 0.78, 0.03, 0.47]
  ];
  frameParts.forEach(([w, h, d, y], i) => {
    const bar = box(w, h, d, p.steel,
      meta(`IND-D-FRAME-${i}`, `Access door frame bar ${i}`, 'door frame',
        evW, 'ESTIMATED', 2));
    bar.position.set(0.5, y, 0);
    door.add(bar);
  });

  const glazing = part(
    new THREE.BoxGeometry(0.94, 0.68, 0.02),
    p.glazing.clone(),
    meta('IND-D-GLASS', 'Access window glazing', 'polycarbonate window',
      evW, 'ESTIMATED', 2)
  );
  glazing.position.set(0.5, 0, 0.01);
  glazing.castShadow = false;
  door.add(glazing);
  rig.glazing.push(glazing);

  const seal = box(1.0, 0.72, 0.01, p.rubberBlack,
    meta('IND-D-SEAL', 'Window seal', 'door seal', evW, 'ESTIMATED', 2));
  seal.position.set(0.5, 0, -0.012);
  door.add(seal);

  for (const [i, y] of [0.3, -0.3].entries()) {
    const hinge = cyl(0.018, 0.018, 0.1, 10, p.steel,
      meta(`IND-D-HINGE-${i}`, `Door hinge ${i}`, 'door hinge', evW, 'ESTIMATED', 2));
    hinge.position.set(0, y, 0.02);
    door.add(hinge);
  }

  const handle = box(0.03, 0.16, 0.05, p.steel,
    meta('IND-D-HANDLE', 'Door handle', 'door handle', evW, 'ESTIMATED', 2));
  handle.position.set(0.93, 0, 0.04);
  door.add(handle);

  rig.doorPivot.add(door);

  const seams: [number, number, number, number, number, number][] = [
    [1.66, 0.02, 0.02, 0, 0.34, 0.205],
    [1.66, 0.02, 0.02, 0, 1.85, 0.205],
    [0.02, 1.5, 0.02, -0.55, 1.09, 0.205],
    [0.02, 1.5, 0.02, 0.55, 1.09, 0.205],
    [0.02, 1.5, 1.3, -0.83, 1.09, -0.45],
    [0.02, 1.5, 1.3, 0.83, 1.09, -0.45]
  ];
  seams.forEach(([w, h, d, x, y, z], i) => {
    l2.add(
      place(
        box(w, h, d, p.panelDark,
          meta(`IND-P-SEAM-${i}`, `Panel seam ${i}`, 'panel seam / joint', evW, 'ESTIMATED', 4)),
        x, y, z
      )
    );
  });

  for (const [i, y] of [1.5, 1.35, 1.2].entries()) {
    l2.add(
      at(
        box(0.02, 0.05, 0.5, p.panelDark,
          meta(`IND-P-VENT-${i}`, `Side vent louver ${i}`, 'ventilation louver',
            evI, 'ESTIMATED', 2)),
        0.84, y, -0.45, 0, 0, 0.25
      )
    );
  }

  const legPos: [number, number][] = [
    [-2.2, 0],
    [-2.2, -0.3],
    [-1.15, 0],
    [-1.15, -0.3]
  ];
  legPos.forEach(([x, dz], i) => {
    l2.add(
      place(
        box(0.07, 0.9, 0.07, p.steel,
          meta(`IND-C-LEG-${i}`, `Conveyor leg ${i}`, 'conveyor support',
            EVIDENCE_CATS.inference(`${F_CONV} (wash-station conveyor style, same line)`), 'ESTIMATED', 2)),
        x, 0.45, -0.15 + dz
      )
    );
  });
  for (const [i, dz] of [0.19, -0.19].entries()) {
    l2.add(
      place(
        box(1.63, 0.06, 0.03, p.steel,
          meta(`IND-C-RAIL-${i}`, `Conveyor side rail ${i}`, 'conveyor guide rail',
            EVIDENCE_CATS.inference(`${F_CONV} (wash-station conveyor style, same line)`), 'ESTIMATED', 2)),
        -1.63, 1.06, -0.15 + dz
      )
    );
  }
  for (const [i, x] of [-2.42, -0.85].entries()) {
    l2.add(
      at(
        cyl(0.05, 0.05, 0.4, 14, p.steel,
          meta(`IND-C-ROLLER-${i}`, `Conveyor end roller ${i}`, 'conveyor roller',
            EVIDENCE_CATS.inference(`${F_CONV} (wash-station conveyor style, same line)`), 'ESTIMATED', 2)),
        x, 1.0, -0.15, Math.PI / 2, 0, 0
      )
    );
  }

  const latGeo = new THREE.BoxGeometry(1, 1, 1);
  const latCount = 160;
  const lattice = new THREE.InstancedMesh(latGeo, p.mesh, latCount);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const v = new THREE.Vector3();
  let idx = 0;
  for (let x = -1.1; x <= 1.1001 && idx < latCount; x += 0.028) {
    v.set(x, 0.955, 1.4);
    s.set(0.005, 1.24, 0.005);
    m4.compose(v, q, s);
    lattice.setMatrixAt(idx++, m4);
  }
  for (let y = 0.36; y <= 1.56 && idx < latCount; y += 0.028) {
    v.set(0, y, 1.4);
    s.set(2.2, 0.005, 0.005);
    m4.compose(v, q, s);
    lattice.setMatrixAt(idx++, m4);
  }
  lattice.count = idx;
  tagInstanced(lattice, meta('IND-G-LATTICE', 'Wire mesh lattice', 'wire-mesh safety guard',
    EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 2));
  l2.add(lattice);

  l2.add(
    tube(
      [
        [1.1, 2.44, 0.2],
        [1.3, 2.3, 0.1],
        [1.2, 2.0, 0.35],
        [0.95, 1.75, 0.7],
        [0.8, 1.6, 0.9]
      ],
      0.035,
      p.hoseGreen,
      meta('IND-H-GREEN', 'Green overhead hose', 'service hose route',
        EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 2)
    )
  );
  l2.add(
    tube(
      [
        [0.9, 2.44, 0.24],
        [1.1, 2.28, 0.16],
        [1.0, 1.98, 0.42],
        [0.75, 1.72, 0.76],
        [0.6, 1.55, 0.95]
      ],
      0.035,
      p.hoseRed,
      meta('IND-H-RED', 'Red overhead hose', 'service hose route',
        EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 2)
    )
  );

  l2.add(
    place(
      box(0.34, 0.46, 0.22, p.maroon,
        meta('IND-B-BOX', 'Maroon junction/auxiliary box', 'electrical junction box',
          EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 3)),
      0.42, 1.3, 1.0
    )
  );
  l2.add(
    place(
      box(0.45, 0.3, 0.35, p.binBlue,
        meta('IND-B-BIN', 'Blue parts bin', 'parts bin',
          EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 3)),
      -0.9, 0.42, 1.0
    )
  );

  l2.add(
    at(
      box(0.3, 0.28, 0.03, p.redCover,
        meta('IND-B-REDCOVER', 'Red cover plate', 'component cover',
          EVIDENCE_CATS.photo(F_INTERIOR), 'ESTIMATED', 3)),
      0.38, 1.28, -0.05, 0, 0.3, 0
    )
  );

  const panelPost = cyl(0.035, 0.035, 1.0, 12, p.steel,
    meta('IND-PNL-POST', 'Operator panel post', 'operator panel mount',
      EVIDENCE_CATS.photo(F_PANEL), 'ESTIMATED', 3));
  place(panelPost, 1.18, 1.1, 1.15);
  l2.add(panelPost);

  const trayPosts: [number, number][] = [
    [-1.0, 0.2],
    [1.0, 0.2]
  ];
  trayPosts.forEach(([x, z], i) => {
    l2.add(
      place(
        box(0.06, 0.3, 0.06, p.steel,
          meta(`IND-T-SUP-${i}`, `Cable tray support ${i}`, 'cable tray support',
            EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 2)),
        x, 2.32, z
      )
    );
  });
}

function buildFunctional(c: Ctx): void {
  const { p, l3 } = c;
  const evW = EVIDENCE_CATS.photo(F_WINDOW);
  const evI = EVIDENCE_CATS.photo(F_INTERIOR);

  for (const [i, x] of [-0.28, 0.28].entries()) {
    l3.add(
      place(
        cyl(0.075, 0.075, 0.6, 20, p.gold,
          meta(`IND-A-CYL-${i}`, `Gold actuator cylinder ${i}`, 'actuator (gold anodised)',
            evW, 'ESTIMATED', 3)),
        x, 1.62, -0.2
      )
    );
    l3.add(
      place(
        cyl(0.028, 0.028, 0.34, 12, p.steel,
          meta(`IND-A-ROD-${i}`, `Actuator rod ${i}`, 'actuator rod',
            evW, 'ESTIMATED', 3)),
        x, 1.22, -0.2
      )
    );
    l3.add(
      place(
        cyl(0.09, 0.09, 0.04, 20, p.gold,
          meta(`IND-A-CAP-${i}`, `Actuator top cap ${i}`, 'actuator cap',
            evW, 'ESTIMATED', 4)),
        x, 1.93, -0.2
      )
    );
  }

  l3.add(
    place(
      cyl(0.1, 0.1, 0.34, 20, p.servoBlack,
        meta('IND-A-SERVO', 'Central servo motor', 'servo drive',
          evW, 'ESTIMATED', 3)),
      0, 1.5, -0.05
    )
  );
  l3.add(
    place(
      cyl(0.13, 0.13, 0.03, 20, p.steel,
        meta('IND-A-FLANGE', 'Servo flange', 'servo mount flange', evW, 'ESTIMATED', 4)),
      0, 1.68, -0.05
    )
  );

  const transformer = new THREE.Group();
  const tMat = p.steel.clone();
  tMat.color.setHex(0xc8ccd0);
  tMat.roughness = 0.3;
  tMat.metalness = 0.85;
  const tBody = cyl(0.19, 0.19, 0.75, 24, tMat,
    meta('IND-X-TRANS', 'Silver transformer cylinder', 'induction transformer',
      EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 3));
  transformer.add(tBody);
  const tCap = cyl(0.21, 0.21, 0.05, 24, p.redCover,
    meta('IND-X-TCAP', 'Transformer top cap (red)', 'transformer end cap',
      EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 4));
  tCap.position.y = 0.4;
  transformer.add(tCap);
  const tBase = cyl(0.22, 0.22, 0.04, 24, p.panelDark,
    meta('IND-X-TBASE', 'Transformer base plate', 'transformer mount',
      EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 4));
  tBase.position.y = -0.395;
  transformer.add(tBase);
  for (const [i, y] of [-0.12, 0.15].entries()) {
    const strap = cyl(0.2, 0.2, 0.04, 24, p.panelDark,
      meta(`IND-X-TSTRAP-${i}`, `Transformer strap ${i}`, 'transformer strap',
        EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 4));
    strap.position.y = y;
    transformer.add(strap);
  }
  transformer.position.set(-0.05, 1.35, 0.75);
  l3.add(transformer);

  l3.add(
    place(
      box(0.4, 0.35, 0.35, p.frameYellow,
        meta('IND-B-YBOX', 'Yellow sub-assembly housing (visible behind mesh)',
          'painted machine sub-assembly',
          EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 3)),
      0.42, 1.1, 0.8
    )
  );
  l3.add(
    place(
      box(0.36, 0.06, 0.31, p.panelDark,
        meta('IND-B-YCAP', 'Yellow housing top cap', 'sub-assembly cover',
          EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 4)),
      0.42, 1.305, 0.8
    )
  );

  const tBlack = p.rubberBlack;
  const cableRoutes: [number, number, number, number][] = [
    [0.15, 0.55, 0.1, 0.95],
    [-0.35, 0.4, -0.25, 1.0],
    [0.55, 0.3, 0.45, 0.88]
  ];
  cableRoutes.forEach(([x0, w, x1, y1], i) => {
    l3.add(
      tube(
        [
          [x0, 2.44, 0.22 + w],
          [x0 + 0.08, 2.05, 0.3 + w],
          [x1 - 0.05, 1.7, 0.55 + w * 0.5],
          [x1, y1, 0.7]
        ],
        0.008 + i * 0.002,
        tBlack,
        meta(`IND-H-CABLE-${i}`, `Thin hanging cable ${i}`, 'cable routing',
          EVIDENCE_CATS.photo(F_MESH), 'ESTIMATED', 4)
      )
    );
  });

  l3.add(
    place(
      box(0.3, 0.2, 0.12, p.panelDark,
        meta('IND-N-MANIFOLD', 'Pneumatic manifold block', 'pneumatic valve manifold',
          evI, 'ESTIMATED', 3)),
      0.72, 1.5, 0.55
    )
  );
  for (const [i, x] of [0.65, 0.74, 0.83].entries()) {
    l3.add(
      place(
        cyl(0.02, 0.02, 0.1, 8, i === 1 ? p.hoseRed : p.hoseBlue,
          meta(`IND-N-VALVE-${i}`, `Valve cartridge ${i}`, 'solenoid valve',
            evI, 'ESTIMATED', 4)),
        x, 1.63, 0.55
      )
    );
  }

  l3.add(
    tube(
      [
        [0.72, 1.44, 0.5],
        [0.6, 1.3, 0.25],
        [0.45, 1.2, -0.05],
        [0.3, 1.1, -0.18]
      ],
      0.022,
      p.hoseBlue,
      meta('IND-H-BLUE1', 'Blue pneumatic hose 1', 'pneumatic supply',
        EVIDENCE_CATS.photo(F_INTERIOR), 'ESTIMATED', 3)
    )
  );
  l3.add(
    tube(
      [
        [0.78, 1.44, 0.5],
        [0.68, 1.26, 0.3],
        [0.5, 1.12, 0.0],
        [0.36, 1.04, -0.14]
      ],
      0.022,
      p.hoseBlue,
      meta('IND-H-BLUE2', 'Blue pneumatic hose 2', 'pneumatic supply',
        EVIDENCE_CATS.photo(F_INTERIOR), 'ESTIMATED', 3)
    )
  );

  const fixture = box(0.34, 0.1, 0.22, p.steel,
    meta('IND-FIX-BASE', 'Workpiece fixture base', 'part fixture',
      EVIDENCE_CATS.photo(F_PART), 'ESTIMATED', 3));
  place(fixture, 0, 1.0, -0.15);
  l3.add(fixture);

  const jawL = box(0.05, 0.12, 0.2, p.panelDark,
    meta('IND-FIX-JAWL', 'Fixture jaw left', 'part clamp', EVIDENCE_CATS.photo(F_PART), 'ESTIMATED', 3));
  place(jawL, -0.14, 1.1, -0.15);
  l3.add(jawL);
  const jawR = box(0.05, 0.12, 0.2, p.panelDark,
    meta('IND-FIX-JAWR', 'Fixture jaw right', 'part clamp', EVIDENCE_CATS.photo(F_PART), 'ESTIMATED', 3));
  place(jawR, 0.14, 1.1, -0.15);
  l3.add(jawR);

  // The Phase 2a workpiece proxy (IND-PART-SHAFT/HEAD/STUB) was removed in
  // Phase 2b increment 3: the CV OR workpiece is now a dedicated model
  // (src/three/workpiece.ts, STATION_Workpiece) mounted by line.ts on this
  // fixture. See docs/model-checklist/cv-or-workpiece.md.

  const ring = part(
    new THREE.TorusGeometry(0.17, 0.022, 12, 40),
    p.quench,
    meta('IND-Q-RING', 'Quench shower ring', 'quench shower ring',
      EVIDENCE_CATS.photo(F_WINDOW), 'ESTIMATED', 3)
  );
  ring.position.set(0.05, 1.1, -0.15);
  ring.rotation.y = Math.PI / 2;
  l3.add(ring);

  const nozzleCount = 8;
  const nozzleGeo = new THREE.ConeGeometry(0.016, 0.05, 10);
  const nozzles = new THREE.InstancedMesh(nozzleGeo, p.quench, nozzleCount);
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < nozzleCount; i++) {
    const a = (i / nozzleCount) * Math.PI * 2;
    const y = 1.1 + Math.sin(a) * 0.15;
    const z = -0.15 + Math.cos(a) * 0.15;
    const dir = new THREE.Vector3(0, -Math.sin(a), -Math.cos(a)).normalize();
    quat.setFromUnitVectors(up, dir);
    m4.compose(new THREE.Vector3(0.05, y, z), quat, new THREE.Vector3(1, 1, 1));
    nozzles.setMatrixAt(i, m4);
  }
  tagInstanced(nozzles, meta('IND-Q-NOZZLES', 'Quench nozzles (x8)', 'quench spray nozzles',
    EVIDENCE_CATS.assumption('nozzle count ASSUMED - not countable in any photo'), 'ASSUMED', 3));
  l3.add(nozzles);

  l3.add(
    tube(
      [
        [0.05, 1.27, -0.15],
        [0.2, 1.4, 0.0],
        [0.4, 1.5, 0.3],
        [0.6, 1.55, 0.5]
      ],
      0.026,
      p.hoseGreen,
      meta('IND-Q-FEED', 'Quench feed hose', 'quench supply',
        EVIDENCE_CATS.photo(F_WINDOW), 'ESTIMATED', 3)
    )
  );

  for (const [i, x] of [-0.32, 0.32].entries()) {
    const sensor = box(0.05, 0.08, 0.12, p.panelDark,
      meta(`IND-S-SENSOR-${i}`, `Presence sensor ${i}`, 'part presence sensor',
        EVIDENCE_CATS.inference(`${F_WINDOW} - small sensor blocks visible near fixture`), 'ESTIMATED', 3));
    place(sensor, x, 1.22, -0.3);
    l3.add(sensor);
    const lens = part(
      new THREE.SphereGeometry(0.014, 10, 8),
      i === 0 ? p.ledGreen : p.ledRed,
      meta(`IND-S-LENS-${i}`, `Sensor lens ${i}`, 'sensor indicator',
        EVIDENCE_CATS.inference(`${F_WINDOW} - small sensor blocks visible near fixture`), 'ESTIMATED', 3)
    );
    place(lens, x, 1.22, -0.235);
    l3.add(lens);
  }

  const panelBox = box(0.36, 0.3, 0.07, p.panelDark,
    meta('IND-PNL-BOX', 'Operator panel housing', 'operator panel',
      EVIDENCE_CATS.photo(F_PANEL), 'ESTIMATED', 3));
  at(panelBox, 1.18, 1.65, 1.15, -0.25, -0.5, 0);
  l3.add(panelBox);

  const screen = part(
    new THREE.PlaneGeometry(0.24, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0d1b24, roughness: 0.25, emissive: 0x0a2333, emissiveIntensity: 0.7 }),
    meta('IND-PNL-SCREEN', 'Operator panel screen', 'HMI screen surface',
      EVIDENCE_CATS.photo(F_PANEL), 'ESTIMATED', 3)
  );
  at(screen, 1.165, 1.67, 1.19, -0.25, -0.5 + Math.PI, 0);
  l3.add(screen);

  const estop = cyl(0.028, 0.028, 0.03, 16, p.ledRed,
    meta('IND-PNL-ESTOP', 'Emergency stop', 'E-stop actuator',
      EVIDENCE_CATS.photo(F_PANEL), 'ESTIMATED', 3));
  at(estop, 1.24, 1.55, 1.17, Math.PI / 2 - 0.25, 0, 0);
  l3.add(estop);
}

function buildFineDetail(c: Ctx): void {
  const { p, l4 } = c;
  const ev = EVIDENCE_CATS.photo(F_MESH);

  const boltGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.012, 6);
  const boltPositions: [number, number, number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    boltPositions.push([-0.72 + i * 0.29, 0.36, 0.21, Math.PI / 2, 0]);
    boltPositions.push([-0.72 + i * 0.29, 1.83, 0.21, Math.PI / 2, 0]);
  }
  for (let i = 0; i < 4; i++) {
    boltPositions.push([-0.9, 0.5 + i * 0.5, 1.31, Math.PI / 2, 0]);
    boltPositions.push([0.9, 0.5 + i * 0.5, 1.31, Math.PI / 2, 0]);
  }
  for (let i = 0; i < 8; i++) {
    boltPositions.push([-1.1 + i * 0.32, 0.33, 1.44, 0, 0]);
    boltPositions.push([-1.1 + i * 0.32, 1.58, 1.44, 0, 0]);
  }
  const bolts = new THREE.InstancedMesh(boltGeo, p.bolt, boltPositions.length);
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3(1, 1, 1);
  boltPositions.forEach(([x, y, z, rx, ry], i) => {
    quat.setFromEuler(new THREE.Euler(rx, ry, 0));
    m4.compose(new THREE.Vector3(x, y, z), quat, scl);
    bolts.setMatrixAt(i, m4);
  });
  tagInstanced(bolts, meta('IND-D-BOLTS', 'Fasteners (instanced)', 'panel/frame fasteners',
    ev, 'ESTIMATED', 4));
  l4.add(bolts);

  const cv4 = part(
    new THREE.PlaneGeometry(0.4, 0.15),
    new THREE.MeshStandardMaterial({ map: labelTexture('CV 4'), roughness: 0.8 }),
    meta('IND-L-CV4', 'CV 4 machine label', 'machine identification label',
      EVIDENCE_CATS.photo('4.20.44 PM.jpeg'), 'ESTIMATED', 4)
  );
  place(cv4, 0, 2.06, 0.06);
  l4.add(cv4);

  const warn = part(
    new THREE.PlaneGeometry(0.14, 0.14),
    new THREE.MeshStandardMaterial({ map: warningTexture(), roughness: 0.8 }),
    meta('IND-L-WARN', 'Warning sticker', 'safety warning label',
      EVIDENCE_CATS.inference(`${F_MESH} - warning labels visible on frames`), 'ESTIMATED', 4)
  );
  place(warn, 0.62, 1.5, 0.222);
  l4.add(warn);

  const nameplate = part(
    new THREE.PlaneGeometry(0.34, 0.12),
    new THREE.MeshStandardMaterial({ map: labelTexture('INDUCTION CV 4', '#e8e8e8'), roughness: 0.8 }),
    meta('IND-L-PLATE', 'Station nameplate', 'station identification label',
      EVIDENCE_CATS.inference('station label ASSUMED wording - HMI shows CV 4'), 'ASSUMED', 4)
  );
  place(nameplate, 0.9, 1.62, 1.305);
  l4.add(nameplate);

  for (const [i, x] of [-0.28, 0.28].entries()) {
    const elbow = cyl(0.02, 0.02, 0.09, 8, p.hoseBlue,
      meta(`IND-L-ELBOW-${i}`, `Actuator air elbow ${i}`, 'air fitting',
        EVIDENCE_CATS.photo(F_INTERIOR), 'ESTIMATED', 4));
    at(elbow, x + 0.07, 1.75, -0.2, 0, 0, Math.PI / 2);
    l4.add(elbow);
  }

  const seamStrips: [number, number, number, number][] = [
    [0.5, 0.012, 0.012, -0.45],
    [0.5, 0.012, 0.012, -0.95],
    [0.5, 0.012, 0.012, 0.05]
  ];
  seamStrips.forEach(([w, h, d, z], i) => {
    l4.add(
      place(
        box(w, h, d, p.panelDark,
          meta(`IND-L-HSEAM-${i}`, `Head panel seam ${i}`, 'panel seam',
            ev, 'ESTIMATED', 4)),
        0, 2.06, z
      )
    );
  });
}

function buildVisualisation(c: Ctx): void {
  const { p, l5, rig } = c;

  const spray = new THREE.Group();
  const sprayMat = new THREE.MeshStandardMaterial({
    color: 0x9fd8ff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.2,
    emissive: 0x2a6f9e,
    emissiveIntensity: 0.4
  });
  const cone = part(
    new THREE.ConeGeometry(0.16, 0.3, 20, 1, true),
    sprayMat,
    meta('IND-V-SPRAYCONE', 'Quench spray cone (visualisation)', 'quench spray effect',
      EVIDENCE_CATS.assumption('visualisation effect - driven by demo state, not measured flow'),
      'ASSUMED', 5)
  );
  cone.castShadow = false;
  cone.position.set(0.05, 1.28, -0.15);
  cone.rotation.z = Math.PI;
  spray.add(cone);
  for (let i = 0; i < 14; i++) {
    const drop = part(
      new THREE.SphereGeometry(0.008, 6, 6),
      sprayMat.clone(),
      meta(`IND-V-DROP-${i}`, `Quench droplet ${i} (visualisation)`, 'quench spray effect',
        EVIDENCE_CATS.assumption('visualisation effect - driven by demo state, not measured flow'),
        'ASSUMED', 5)
    );
    drop.castShadow = false;
    drop.userData.phase = i / 14;
    drop.position.set(0.05, 1.2, -0.15);
    spray.add(drop);
    rig.droplets.push(drop);
  }
  spray.name = 'IND_Viz_Spray';
  rig.sprayGroup = spray;
  l5.add(spray);

  const beaconPost = cyl(0.012, 0.012, 0.18, 8, p.panelDark,
    meta('IND-V-BEACONPOST', 'Beacon post', 'status beacon mount',
      EVIDENCE_CATS.inference('beacon ASSUMED - not visible in supplied photos'), 'ASSUMED', 5));
  place(beaconPost, 0.4, 2.32, -0.2);
  l5.add(beaconPost);

  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x1f8f3a,
    emissive: 0x1f8f3a,
    emissiveIntensity: 1.6,
    roughness: 0.3
  });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 14), lensMat);
  lens.name = 'IND_Viz_BeaconLens';
  lens.position.set(0.4, 2.44, -0.2);
  lens.userData = {
    id: 'IND-V-BEACON',
    name: 'Status beacon lens',
    station: 'INDUCTION',
    function: 'status beacon (visualisation)',
    evidence: {
      sourceId: 'beacon ASSUMED - not visible in supplied photos',
      category: 'assumption',
      confidence: 'low',
      status: 'unverified',
      reviewed: '2026-10-15'
    },
    dimension: 'ASSUMED',
    layer: 5
  };
  l5.add(lens);
  rig.beaconLens = lens;
}

function buildConceptual(c: Ctx): void {
  const { p, conceptual, rig } = c;
  const evCoil = EVIDENCE_CATS.assumption(
    'coil geometry ASSUMED - coil not clearly visible in any supplied photo'
  );

  const pts: THREE.Vector3[] = [];
  const turns = 5;
  const coilR = 0.095;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const x = -0.14 + t * 0.28;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(x, 1.1 + Math.sin(a) * coilR, -0.15 + Math.cos(a) * coilR));
  }
  const coilCurve = new THREE.CatmullRomCurve3(pts);
  const coil = part(
    new THREE.TubeGeometry(coilCurve, 220, 0.013, 10, false),
    rig.coilMaterial,
    meta('IND-K-COIL', 'Copper work coil (conceptual)', 'induction work coil',
      evCoil, 'ASSUMED', 'conceptual')
  );
  coil.name = 'IND_K_Coil';
  conceptual.add(coil);

  const teflon = part(
    new THREE.TorusGeometry(0.07, 0.006, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6 }),
    meta('IND-K-TEFLON', 'Teflon gap spacer ring', 'coil centering / teflon gap (NV-003 conflict 1.5 vs 1 mm)',
      {
        sourceId: 'Project_Document.pdf',
        category: 'document',
        confidence: 'medium',
        status: 'unverified',
        reviewed: '2026-10-15'
      },
      'ASSUMED', 'conceptual')
  );
  teflon.position.set(0.16, 1.1, -0.15);
  teflon.rotation.y = Math.PI / 2;
  conceptual.add(teflon);

  const rearHatch = box(0.7, 0.7, 0.04, p.panelGrey,
    meta('IND-K-REARHATCH', 'Rear service hatch (conceptual)', 'rear access (never photographed)',
      EVIDENCE_CATS.assumption('rear of machine never photographed in any supplied photo'),
      'ASSUMED', 'conceptual'));
  place(rearHatch, 0.2, 1.2, -1.12);
  conceptual.add(rearHatch);

  const rearHoses = tube(
    [
      [-0.4, 2.4, 0.0],
      [-0.6, 2.1, -0.7],
      [-0.5, 1.6, -1.05],
      [-0.3, 1.3, -1.1]
    ],
    0.03,
    p.hoseGreen,
    meta('IND-K-REARHOSE', 'Rear hose route (conceptual)', 'rear service route (never photographed)',
      EVIDENCE_CATS.assumption('rear of machine never photographed in any supplied photo'),
      'ASSUMED', 'conceptual')
  );
  conceptual.add(rearHoses);
}
