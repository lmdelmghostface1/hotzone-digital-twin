import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BuiltStation } from './induction';

export interface SceneApi {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  station: BuiltStation;
  setPose: (id: string) => boolean;
  zoom: (factor: number) => void;
  fit: () => void;

  applyCut: (enabled: boolean) => void;
  resize: (w: number, h: number) => void;
  render: () => void;
  pick: (ndcX: number, ndcY: number) => THREE.Object3D | null;
  selectObject: (obj: THREE.Object3D | null) => void;
  selectedId: () => string | null;
  setLayerVisible: (layer: string, visible: boolean) => void;
  setConceptualVisible: (visible: boolean) => void;
  triangles: () => number;
  dispose: () => void;
}

import refCameras from './refCameras.json';

interface RefCam {
  id: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export function createScene(
  canvas: HTMLCanvasElement,
  station: BuiltStation,
  opts: { poseId?: string } = {}
): SceneApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2b323a);
  scene.add(station.root);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
  camera.position.set(3.4, 2.6, 3.8);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.zoomSpeed = 1.1;
  controls.zoomToCursor = true;
  controls.panSpeed = 0.85;
  controls.keyPanSpeed = 20;
  controls.target.set(0, 1.0, 0);
  controls.maxPolarAngle = Math.PI * 0.55;
  controls.minDistance = 0.8;
  controls.maxDistance = 24;

  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x2a2622, 1.2);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.46);
  scene.add(amb);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4.5, 6.5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  // widened in Phase 2b so the shadow frustum covers the whole line
  // (wash stations sit at x -8.3 .. -2.5, the line end now reaches x ~13,
  // outside the old +-5 box)
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 14;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fc2ff, 0.5);
  fill.position.set(-5, 3, -2);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'Environment_Floor';
  ground.userData = {
    id: 'ENV-FLOOR',
    name: 'Plant floor (environment)',
    station: 'ENV',
    function: 'environment',
    evidence: {
      sourceId: 'environment placeholder - not plant data',
      category: 'assumption',
      confidence: 'low',
      status: 'unverified',
      reviewed: '2026-10-15'
    },
    dimension: 'ASSUMED',
    layer: 1
  };
  scene.add(ground);

  const grid = new THREE.GridHelper(20, 40, 0x2f353c, 0x272c33);
  grid.position.y = 0.002;
  grid.userData = { id: 'ENV-GRID', name: 'Measurement grid', station: 'ENV', layer: 1 };
  scene.add(grid);

  const floorLine = new THREE.Mesh(
    new THREE.PlaneGeometry(4.0, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.85 })
  );
  floorLine.rotation.x = -Math.PI / 2;
  floorLine.position.set(0, 0.004, 1.7);
  floorLine.name = 'ENV_FloorLine';
  floorLine.userData = {
    id: 'ENV-LINE',
    name: 'Floor safety line (assumed)',
    station: 'ENV',
    function: 'environment',
    evidence: {
      sourceId: 'environment placeholder - not plant data',
      category: 'assumption',
      confidence: 'low',
      status: 'unverified',
      reviewed: '2026-10-15'
    },
    dimension: 'ASSUMED',
    layer: 1
  };
  scene.add(floorLine);

  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.15);

  const cameras = (refCameras as unknown as { cameras: RefCam[] }).cameras;
  const setPose = (id: string): boolean => {
    const cam = cameras.find((c) => c.id === id);
    if (!cam) return false;
    camera.position.set(...cam.position);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    controls.target.set(...cam.target);
    controls.update();
    return true;
  };
  if (opts.poseId) setPose(opts.poseId);

  // Dolly the camera toward/away from the orbit target (used by the zoom
  // buttons; the mouse wheel does the same through OrbitControls).
  const zoom = (factor: number): void => {
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    const dist = THREE.MathUtils.clamp(
      dir.length() * factor,
      controls.minDistance,
      controls.maxDistance
    );
    camera.position.copy(controls.target).add(dir.setLength(dist));
    controls.update();
  };

  // Frame the whole built line in the current viewport.
  const fit = (): void => {
    const box = new THREE.Box3().setFromObject(station.root);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const dist = (radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.05;
    controls.target.copy(center);
    camera.position
      .copy(center)
      .add(new THREE.Vector3(0.9, 0.7, 1).normalize().multiplyScalar(dist));
    camera.updateProjectionMatrix();
    controls.update();
  };

  const raycaster = new THREE.Raycaster();
  const pick = (x: number, y: number): THREE.Object3D | null => {
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const hits = raycaster.intersectObject(station.root, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !(o.userData as { id?: string }).id) o = o.parent;
      if (o && (o.userData as { id?: string }).id) return o;
    }
    return null;
  };

  let selected: THREE.Object3D | null = null;
  let savedMaterial: THREE.Material | THREE.Material[] | null = null;

  const highlight = (m: THREE.Material): THREE.Material => {
    const c = m.clone();
    if ('emissive' in c) {
      c.emissive = new THREE.Color(0x1f6feb);
      (c as THREE.MeshStandardMaterial).emissiveIntensity = 0.85;
    }
    return c;
  };

  const restoreMaterial = (): void => {
    if (selected && savedMaterial && selected instanceof THREE.Mesh) {
      selected.material = savedMaterial;
    }
    savedMaterial = null;
  };

  const selectObject = (obj: THREE.Object3D | null): void => {
    restoreMaterial();
    selected = obj;
    if (obj instanceof THREE.Mesh) {
      savedMaterial = obj.material;
      obj.material = Array.isArray(obj.material)
        ? obj.material.map(highlight)
        : highlight(obj.material);
    }
  };

  const setLayerVisible = (layer: string, visible: boolean): void => {
    if (layer === 'conceptual') station.conceptual.visible = visible;
    else {
      const g = station.layerGroups[layer];
      if (g) g.visible = visible;
    }
  };

  const triangles = (): number => renderer.info.render.triangles;

  const resize = (w: number, h: number): void => {
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const render = (): void => {
    controls.update();
    renderer.render(scene, camera);
  };

  return {
    renderer,
    scene,
    camera,
    controls,
    station,
    setPose,
    zoom,
    fit,
    applyCut: (enabled: boolean) => {
      renderer.clippingPlanes = enabled ? [clipPlane] : [];
    },
    resize,
    render,
    pick,
    selectObject,
    selectedId: () => (selected ? String(selected.userData.id ?? '') : null),
    setLayerVisible,
    setConceptualVisible: (v) => setLayerVisible('conceptual', v),
    triangles,
    dispose: () => {
      renderer.dispose();
      controls.dispose();
    }
  };
}
