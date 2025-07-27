import * as THREE from 'three';
import { HexGrid } from '../core/hexGrid';

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

/**
 * Calculates the centroid of an array of vertices.
 *
 * @param vertices - Array of Vector3 vertices
 * @returns Vector3 representing the centroid position
 */
export function calculateCentroid(vertices: THREE.Vector3[]): THREE.Vector3 {
  if (vertices.length === 0) {
    return new THREE.Vector3(0, 0, 0);
  }

  const sum = vertices.reduce(
    (acc, vertex) => {
      acc.x += vertex.x;
      acc.y += vertex.y;
      acc.z += vertex.z;
      return acc;
    },
    { x: 0, y: 0, z: 0 }
  );

  return new THREE.Vector3(
    sum.x / vertices.length,
    sum.y / vertices.length,
    sum.z / vertices.length
  );
}

/**
 * Applies uniform scaling to vertices around a center point.
 * The vertices are modified in-place.
 *
 * @param vertices - Array of Vector3 vertices to scale
 * @param scale - Scale factor to apply
 * @param center - Center point for scaling (defaults to origin)
 */
export function scaleVertices(
  vertices: THREE.Vector3[],
  scale: number,
  center?: THREE.Vector3
): void {
  const scaleCenter = center || new THREE.Vector3(0, 0, 0);

  for (const vertex of vertices) {
    // Translate to origin relative to center
    vertex.sub(scaleCenter);

    // Apply scaling
    vertex.multiplyScalar(scale);

    // Translate back
    vertex.add(scaleCenter);
  }
}
