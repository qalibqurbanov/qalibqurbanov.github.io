/** Small 3D helpers for the themes that draw rotating solids on a 2D canvas. */

export type Vec3 = [number, number, number];

export function rotate(p: Vec3, rx: number, ry: number, rz = 0): Vec3 {
  let [x, y, z] = p;
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);
  [x, y] = [x * cz - y * sz, x * sz + y * cz];
  return [x, y, z];
}

/** A weak perspective: things nearer the viewer (negative z here) are a little larger. */
export function project(p: Vec3, cx: number, cy: number, size: number, strength = 0.16): [number, number, number] {
  const f = 1 / (1 + p[2] * strength);
  return [cx + p[0] * size * f, cy + p[1] * size * f, p[2]];
}

export interface Solid {
  verts: Vec3[];
  /** Each face is a list of vertex indices, counter-clockwise seen from outside. */
  faces: number[][];
}

export const CUBE: Solid = {
  verts: [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ],
  faces: [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 4, 7, 3],
    [1, 2, 6, 5],
    [0, 1, 5, 4],
    [3, 7, 6, 2],
  ],
};

export const OCTAHEDRON: Solid = {
  verts: [
    [0, -1.35, 0],
    [0, 1.35, 0],
    [-1, 0, -1],
    [1, 0, -1],
    [1, 0, 1],
    [-1, 0, 1],
  ],
  faces: [
    [0, 3, 2],
    [0, 4, 3],
    [0, 5, 4],
    [0, 2, 5],
    [1, 2, 3],
    [1, 3, 4],
    [1, 4, 5],
    [1, 5, 2],
  ],
};

export const PRISM: Solid = {
  verts: [
    [-1, 1, -0.8],
    [1, 1, -0.8],
    [0, -1.1, -0.8],
    [-1, 1, 0.8],
    [1, 1, 0.8],
    [0, -1.1, 0.8],
  ],
  faces: [
    [0, 2, 1],
    [3, 4, 5],
    [0, 3, 5, 2],
    [1, 2, 5, 4],
    [0, 1, 4, 3],
  ],
};

/** The unit normal of a face (after rotation). */
export function normal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

export interface FaceView {
  /** The face's corners, rotated (not yet projected). */
  pts: Vec3[];
  /** Outward unit normal; +z points away from the viewer. */
  n: Vec3;
  /** Mean depth, for sorting. */
  z: number;
}

/** The faces of a solid turned by the given angles that face the viewer, far ones first. The outward
 * direction is taken from the face's position about the solid's centre, so a face wound the wrong way
 * still comes out right. */
export function visibleFaces(solid: Solid, rx: number, ry: number, rz = 0): FaceView[] {
  const verts = solid.verts.map((v) => rotate(v, rx, ry, rz));
  const out: FaceView[] = [];
  for (const face of solid.faces) {
    const pts = face.map((i) => verts[i]);
    let n = normal(pts[0], pts[1], pts[2]);
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const cz = pts.reduce((a, p) => a + p[2], 0) / pts.length;
    if (n[0] * cx + n[1] * cy + n[2] * cz < 0) n = [-n[0], -n[1], -n[2]];
    if (n[2] < 0.02) out.push({ pts, n, z: cz });
  }
  return out.sort((a, b) => b.z - a.z);
}
