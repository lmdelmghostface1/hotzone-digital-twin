import * as THREE from 'three';

export type DimensionTag = 'MEASURED' | 'ESTIMATED' | 'ASSUMED';
export type LayerId = 1 | 2 | 3 | 4 | 5;

export interface PartEvidence {
  sourceId: string;
  category: string;
  confidence: string;
  status: string;
  reviewed: string;
}

export interface PartMeta {
  id: string;
  name: string;
  station: string;
  function: string;
  evidence: PartEvidence;
  dimension: DimensionTag;
  layer: LayerId | 'conceptual';
}

const STATUS = 'unverified';
const REVIEWED = '2026-10-15';

export const EVIDENCE_CATS = {
  photo: (file: string): PartEvidence => ({
    sourceId: `PHOTO:${file}`,
    category: 'photographic',
    confidence: 'high',
    status: STATUS,
    reviewed: REVIEWED
  }),
  photoLow: (file: string): PartEvidence => ({
    sourceId: `PHOTO:${file}`,
    category: 'photographic',
    confidence: 'low',
    status: STATUS,
    reviewed: REVIEWED
  }),
  photoMedium: (file: string): PartEvidence => ({
    sourceId: `PHOTO:${file}`,
    category: 'photographic',
    confidence: 'medium',
    status: STATUS,
    reviewed: REVIEWED
  }),
  inference: (sourceId: string): PartEvidence => ({
    sourceId,
    category: 'inference',
    confidence: 'medium',
    status: STATUS,
    reviewed: REVIEWED
  }),
  assumption: (sourceId: string): PartEvidence => ({
    sourceId,
    category: 'assumption',
    confidence: 'low',
    status: STATUS,
    reviewed: REVIEWED
  }),
  document: (sourceId: string, page: string): PartEvidence & { page?: string } => ({
    sourceId,
    page,
    category: 'document',
    confidence: 'high',
    status: STATUS,
    reviewed: REVIEWED
  })
} as const;

/** Layer-5 rig for the wash stations (Phase 2b): local demo state only. */
export interface WashSpray {
  group: THREE.Group;
  droplets: THREE.Mesh[];
}

export interface WashRig {
  sprays: WashSpray[];
  partCarriers: THREE.Group[];
  beams: THREE.Mesh[];
}

/** Layer-5 rig for the line end (cooling / unload + boxing, Phase 2b increment 4):
 *  local demo state only. */
export interface LineEndRig {
  lamps: {
    red: THREE.MeshStandardMaterial;
    amber: THREE.MeshStandardMaterial;
    green: THREE.MeshStandardMaterial;
  };
  beltParts: THREE.Group;
}

/** Layer-5 rig for the identification stations (laser marking + 2D code reader,
 *  Phase 2b increment 5): local demo state only. */
export interface IdentificationRig {
  laserBeam: THREE.Mesh;
  markingLamp: THREE.MeshStandardMaterial;
  readerLamp: THREE.MeshStandardMaterial;
  screen: THREE.MeshStandardMaterial;
}

/** Layer-5 rig for the draw oven (Phase 2b increment 2): local demo state only. */
export interface OvenRig {
  chamberMaterial: THREE.MeshStandardMaterial;
}

/** Layer-5 rig for the CV OR workpiece (Phase 2b increment 3): local demo state only. */
export interface WorkpieceRig {
  heat: THREE.MeshStandardMaterial;
}

/** Common shape returned by every non-induction station builder. */
export interface BuiltLayers {
  layerGroups: Record<string, THREE.Group>;
  conceptual: THREE.Group;
}

export function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  meta: PartMeta
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = meta.name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    id: meta.id,
    name: meta.name,
    station: meta.station,
    function: meta.function,
    evidence: { ...meta.evidence },
    dimension: meta.dimension,
    layer: meta.layer
  };
  return mesh;
}

export function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  meta: PartMeta
): THREE.Mesh {
  return part(new THREE.BoxGeometry(w, h, d), material, meta);
}

export function cyl(
  rTop: number,
  rBottom: number,
  h: number,
  seg: number,
  material: THREE.Material,
  meta: PartMeta
): THREE.Mesh {
  return part(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material, meta);
}

export function place(mesh: THREE.Object3D, x: number, y: number, z: number): THREE.Mesh {
  mesh.position.set(x, y, z);
  return mesh as THREE.Mesh;
}

export function at(
  mesh: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0
): THREE.Object3D {
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

export function tagInstanced(
  mesh: THREE.InstancedMesh,
  meta: PartMeta
): THREE.InstancedMesh {
  mesh.name = meta.name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    id: meta.id,
    name: meta.name,
    station: meta.station,
    function: meta.function,
    evidence: meta.evidence,
    dimension: meta.dimension,
    layer: meta.layer
  };
  return mesh;
}

export function labelTexture(text: string, bg = '#f2f2f2', fg = '#1a1a1a'): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 90);
    ctx.fillStyle = fg;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 50);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function warningTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f7d117';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(64, 14);
    ctx.lineTo(116, 106);
    ctx.lineTo(12, 106);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7d117';
    ctx.font = 'bold 62px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 64, 88);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
