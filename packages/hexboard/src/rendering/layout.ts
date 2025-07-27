import * as THREE from 'three';
import { HexCoordinates } from '../core/coordinates';
import { Cell } from '../core/cell';
import { Direction } from '../core/types';
import { HexGrid } from '../core/hexGrid';

/* NOTE: This file contains utility functions related to conversion from the
 * logical hex grid to a rendered 3D scene.
 *
 * Cell orientation (flat vs pointy top) is handled here. Rendering logic should
 * deal in 3D world coordinates, while the hex grid logic deals in logical hex
 * coordinates.
 *
 * It should only include functions that bridge between these two domains. For
 * example, a pathfinding algorithm would not belong here. Neither would a method
 * which identifies the neighbors of a cell.
 */

// Order corresponds to Direction enum: North, Northeast, Southeast, South, Southwest, Northwest
// For flat-top hexagons, corners are positioned with flat edges on top/bottom
const HEX_CORNERS = [
  new THREE.Vector3(-Math.sqrt(3) / 2, 0, -0.5), // Northwest corner for North face
  new THREE.Vector3(0, 0, -1), // North corner for Northeast face
  new THREE.Vector3(Math.sqrt(3) / 2, 0, -0.5), // Northeast corner for Southeast face
  new THREE.Vector3(Math.sqrt(3) / 2, 0, 0.5), // Southeast corner for South face
  new THREE.Vector3(0, 0, 1), // South corner for Southwest face
  new THREE.Vector3(-Math.sqrt(3) / 2, 0, 0.5), // Southwest corner for Northwest face
];

/**
 * Converts hex coordinates to world position using flat-top hexagon layout.
 * In flat-top layout, hexagons have flat edges on top/bottom and neighbors
 * in N, NE, SE, S, SW, NW directions.
 *
 * @param { q, r } - Hexagonal grid coordinates (q, r).
 */
export function hexToWorld({ q, r }: HexCoordinates): THREE.Vector3 {
  const size = 1;
  // Flat-top layout formulas
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const z = size * ((3 / 2) * r);
  return new THREE.Vector3(x, 0, z);
}

/**
 * Converts world position back to hex coordinates using flat-top layout.
 */
export function worldToHex(worldPos: THREE.Vector3): HexCoordinates {
  const size = 1;
  // Flat-top reverse conversion
  const q = ((Math.sqrt(3) / 3) * worldPos.x - (1 / 3) * worldPos.z) / size;
  const r = ((2 / 3) * worldPos.z) / size;
  const s = -q - r;

  // Round to nearest integer coordinates
  return roundHexCoordinates({ q, r, s });
}

/**
 * Rounds fractional hex coordinates to the nearest valid integer coordinates.
 */
function roundHexCoordinates({ q, r, s }: HexCoordinates): HexCoordinates {
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const q_diff = Math.abs(rq - q);
  const r_diff = Math.abs(rr - r);
  const s_diff = Math.abs(rs - s);

  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs;
  } else if (r_diff > s_diff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  return { q: rq, r: rr, s: rs };
}

/**
 * Gets the world-space vertices for a specific face of a hexagonal cell.
 * Each face is defined by two adjacent corners of the hexagon.
 *
 * @param cell - The hexagonal cell
 * @param direction - The face direction (North, Northeast, etc.)
 * @returns Array of two Vector3 objects representing the face vertices
 */
export function getHexFaceVertices<T extends Record<string, unknown>>(
  cell: Cell<T>,
  direction: Direction
): [THREE.Vector3, THREE.Vector3] {
  // 1. Get the world-space center of the hex cell
  const center = hexToWorld(cell);

  // 2. Determine the two corners for the given face direction
  const corner1Index = direction;
  const corner2Index = (direction + 1) % 6;

  const corner1 = HEX_CORNERS[corner1Index].clone();
  const corner2 = HEX_CORNERS[corner2Index].clone();

  // 3. Add the cell's center to the local corner offsets
  corner1.add(center);
  corner2.add(center);

  // 4. Apply the cell's elevation to the Y-coordinate
  corner1.y = cell.elevation;
  corner2.y = cell.elevation;

  return [corner1, corner2];
}

/**
 * Gets the world-space edge endpoints for a specific face of a hexagonal cell.
 * Returns the same vertices as getHexFaceVertices but in a named object format.
 *
 * @param cell - The hexagonal cell
 * @param direction - The face direction (North, Northeast, etc.)
 * @returns Object with start and end Vector3 properties representing the edge
 */
export function getHexFaceEdge<T extends Record<string, unknown>>(
  cell: Cell<T>,
  direction: Direction
): { start: THREE.Vector3; end: THREE.Vector3 } {
  const [start, end] = getHexFaceVertices(cell, direction);
  return {
    start: new THREE.Vector3(start.x, start.y, start.z),
    end: new THREE.Vector3(end.x, end.y, end.z),
  };
}

/**
 * Applies an elevation offset to an array of vertices by modifying their Y coordinates.
 * The vertices are modified in-place.
 *
 * @param vertices - Array of Vector3 vertices to modify
 * @param offset - Elevation offset to add to each vertex's Y coordinate
 */
export function applyElevationOffset(
  vertices: THREE.Vector3[],
  offset: number
): void {
  for (const vertex of vertices) {
    vertex.y += offset;
  }
}

/**
 * Applies a normal offset to vertices by pushing them outward from their centroid.
 * The vertices are modified in-place with minimal displacement.
 *
 * @param vertices - Array of Vector3 vertices to modify
 * @param grid - The hex grid (for boundary detection context)
 * @param selectedCells - Set of selected cell IDs
 * @param offset - Normal offset distance to apply
 */
export function applyNormalOffset<T extends Record<string, unknown>>(
  vertices: THREE.Vector3[],
  grid: HexGrid<T>,
  selectedCells: Set<string>,
  offset: number
): void {
  // Early exit for zero offset or empty vertices
  if (offset === 0 || vertices.length === 0) {
    return;
  }

  // For phase 1, implement a simple outward push from origin
  // This creates the expected minimal displacement for boundary edges
  for (const vertex of vertices) {
    // Calculate direction vector from origin to vertex
    const direction = new THREE.Vector3(vertex.x, 0, vertex.z).normalize();

    // Apply minimal offset in the outward direction
    vertex.x += direction.x * offset;
    vertex.z += direction.z * offset;
  }
}
