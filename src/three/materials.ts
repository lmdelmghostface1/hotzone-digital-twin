import * as THREE from 'three';

export interface Palette {
  frameYellow: THREE.MeshStandardMaterial;
  panelGrey: THREE.MeshStandardMaterial;
  panelDark: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  servoBlack: THREE.MeshStandardMaterial;
  rubberBlack: THREE.MeshStandardMaterial;
  hoseGreen: THREE.MeshStandardMaterial;
  hoseRed: THREE.MeshStandardMaterial;
  hoseBlue: THREE.MeshStandardMaterial;
  glazing: THREE.MeshPhysicalMaterial;
  mesh: THREE.MeshStandardMaterial;
  maroon: THREE.MeshStandardMaterial;
  binBlue: THREE.MeshStandardMaterial;
  redCover: THREE.MeshStandardMaterial;
  partSteel: THREE.MeshStandardMaterial;
  quench: THREE.MeshStandardMaterial;
  conveyorBelt: THREE.MeshStandardMaterial;
  labelWhite: THREE.MeshStandardMaterial;
  warning: THREE.MeshStandardMaterial;
  bolt: THREE.MeshStandardMaterial;
  ledGreen: THREE.MeshStandardMaterial;
  ledRed: THREE.MeshStandardMaterial;
}

export function makePalette(): Palette {
  const std = (
    color: number,
    roughness = 0.6,
    metalness = 0.2
  ): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color, roughness, metalness });

  return {
    frameYellow: std(0xd9a400, 0.55, 0.25),
    panelGrey: std(0xb9bec4, 0.5, 0.35),
    panelDark: std(0x53595f, 0.6, 0.3),
    steel: std(0x9aa1a8, 0.35, 0.85),
    gold: std(0xc9a227, 0.3, 0.9),
    copper: new THREE.MeshStandardMaterial({
      color: 0xb87333,
      roughness: 0.3,
      metalness: 0.95,
      emissive: 0x000000
    }),
    servoBlack: std(0x1b1b1e, 0.45, 0.4),
    rubberBlack: std(0x141416, 0.9, 0.05),
    hoseGreen: std(0x2f7d32, 0.7, 0.05),
    hoseRed: std(0xa32b2b, 0.7, 0.05),
    hoseBlue: std(0x2a5d9e, 0.7, 0.05),
    glazing: new THREE.MeshPhysicalMaterial({
      color: 0xf0f8fa,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.55,
      thickness: 0.02,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    }),
    mesh: std(0x70767c, 0.5, 0.8),
    maroon: std(0x6b2233, 0.55, 0.3),
    binBlue: std(0x1f5fa8, 0.7, 0.1),
    redCover: std(0x8f2f2f, 0.55, 0.3),
    partSteel: std(0x8d949b, 0.3, 0.9),
    quench: std(0x6f7377, 0.4, 0.7),
    conveyorBelt: std(0x2b2b2e, 0.85, 0.1),
    labelWhite: new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.8 }),
    warning: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    bolt: std(0x4c5054, 0.4, 0.9),
    ledGreen: new THREE.MeshStandardMaterial({
      color: 0x1f8f3a,
      emissive: 0x1f8f3a,
      emissiveIntensity: 1.4,
      roughness: 0.3
    }),
    ledRed: new THREE.MeshStandardMaterial({
      color: 0xb02121,
      emissive: 0xb02121,
      emissiveIntensity: 1.4,
      roughness: 0.3
    })
  };
}
