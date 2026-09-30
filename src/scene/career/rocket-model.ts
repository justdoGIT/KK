import {
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from "three";

/** Total rocket height in world units (nozzle exit at y = 0). */
export const ROCKET_HEIGHT = 4.6;

/** Launch vehicle: lathed fuselage, nose cone, four fins, nozzle, crew windows. */
export function createRocket(): Group {
  const hull = new MeshStandardMaterial({ color: "#e2e8f0", metalness: 0.55, roughness: 0.28 });
  const accent = new MeshStandardMaterial({ color: "#38bdf8", metalness: 0.4, roughness: 0.3, emissive: "#0c4a6e", emissiveIntensity: 0.6 });
  const dark = new MeshStandardMaterial({ color: "#1e293b", metalness: 0.85, roughness: 0.35 });
  const glass = new MeshStandardMaterial({ color: "#0f172a", emissive: "#7dd3fc", emissiveIntensity: 1.6, metalness: 0.2, roughness: 0.1 });

  const rocket = new Group();
  rocket.name = "rocket";
  const add = (mesh: Mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    rocket.add(mesh);
    return mesh;
  };

  // Fuselage and nose cone in one lathe profile (radius, height).
  const profile = [
    [0.3, 0.3], [0.44, 0.45], [0.47, 0.8], [0.47, 3.2], [0.43, 3.65],
    [0.32, 4.05], [0.16, 4.38], [0.04, 4.56], [0, 4.6],
  ].map(([r, y]) => new Vector2(r, y));
  add(new Mesh(new LatheGeometry(profile, 48), hull));

  // Engine section and bell nozzle (own double-sided material: the bell is open).
  const nozzle = new MeshStandardMaterial({ color: "#1e293b", metalness: 0.85, roughness: 0.35, side: DoubleSide });
  add(new Mesh(new CylinderGeometry(0.31, 0.24, 0.12, 40), dark)).position.y = 0.27;
  add(new Mesh(new CylinderGeometry(0.2, 0.34, 0.28, 40, 1, true), nozzle)).position.y = 0.1;

  // Accent bands.
  for (const y of [0.95, 3.1]) {
    add(new Mesh(new CylinderGeometry(0.478, 0.478, 0.08, 48), accent)).position.y = y;
  }

  // Four swept fins.
  const fin = new Shape();
  fin.moveTo(0, 0);
  fin.lineTo(0.62, -0.18);
  fin.lineTo(0.62, 0.12);
  fin.lineTo(0, 1.05);
  fin.closePath();
  const finGeometry = new ExtrudeGeometry(fin, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
  finGeometry.translate(0, 0, -0.025);
  for (let i = 0; i < 4; i += 1) {
    const holder = new Group();
    holder.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
    const mesh = new Mesh(finGeometry, i % 2 === 0 ? accent : hull);
    mesh.castShadow = true;
    mesh.position.set(0.42, 0.32, 0);
    holder.add(mesh);
    rocket.add(holder);
  }

  // Crew windows facing the camera side (+Z).
  for (const y of [2.55, 2.1]) {
    const window = add(new Mesh(new SphereGeometry(0.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass));
    window.rotation.x = Math.PI / 2;
    window.position.set(0, y, 0.45);
    const frame = add(new Mesh(new TorusGeometry(0.105, 0.018, 12, 32), dark));
    frame.position.set(0, y, 0.462);
  }
  return rocket;
}

/** Service tower beside the pad: two columns, cross-bracing, and a crew-access arm. */
export function createLaunchTower(): Group {
  const steel = new MeshStandardMaterial({ color: "#334155", metalness: 0.7, roughness: 0.4 });
  const light = new MeshStandardMaterial({ color: "#0b1220", emissive: "#fbbf24", emissiveIntensity: 2 });
  const tower = new Group();
  tower.name = "launch-tower";
  const beam = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0) => {
    const mesh = new Mesh(new CylinderGeometry(w, w, h, 8), steel);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    if (d) mesh.rotation.x = d;
    mesh.castShadow = true;
    tower.add(mesh);
  };
  const height = 4.9;
  for (const x of [0, 0.7]) for (const z of [-0.35, 0.35]) beam(0.045, height, 0, x, height / 2, z);
  for (let y = 0.45; y < height; y += 0.6) {
    for (const z of [-0.35, 0.35]) beam(0.02, 0.92, 0, 0.35, y + 0.3, z, Math.atan2(0.7, 0.6));
    beam(0.022, 0.7, Math.PI / 2, 0, y, 0);
  }
  beam(0.05, 1.05, 0, -0.45, 3.35, 0, Math.PI / 2); // crew-access arm toward the rocket
  const beacon = new Mesh(new SphereGeometry(0.06, 16, 8), light);
  beacon.position.set(0.35, height + 0.08, 0);
  tower.add(beacon);
  return tower;
}
