import * as THREE from 'three';
import { Cell } from '../core/cell';
import { Direction } from '../core/types';
import { hexToWorld } from './hexLayout';

/**
 * Local corner positions for flat-top hexagon.
 * Order corresponds to Direction enum: North, Northeast, Southeast, South, Southwest, Northwest
 * For flat-top hexagons, corners are positioned with flat edges on top/bottom
 */
export const HEX_CORNERS: readonly THREE.Vector3[] = [
  new THREE.Vector3(-Math.sqrt(3) / 2, 0, -0.5), // Northwest corner for North face
  new THREE.Vector3(0, 0, -1), // North corner for Northeast face
  new THREE.Vector3(Math.sqrt(3) / 2, 0, -0.5), // Northeast corner for Southeast face
  new THREE.Vector3(Math.sqrt(3) / 2, 0, 0.5), // Southeast corner for South face
  new THREE.Vector3(0, 0, 1), // South corner for Southwest face
  new THREE.Vector3(-Math.sqrt(3) / 2, 0, 0.5), // Southwest corner for Northwest face
];

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
 * Gets all six corner positions of a hex cell in world space.
 *
 * @param cell - The hexagonal cell
 * @returns Array of six Vector3 objects representing all hex corners
 */
export function getHexCorners<T extends Record<string, unknown>>(
  cell: Cell<T>
): THREE.Vector3[] {
  // Get the world-space center of the hex cell
  const center = hexToWorld(cell);

  // Transform all corners to world space with elevation
  return HEX_CORNERS.map((corner) => {
    const worldCorner = corner.clone();
    worldCorner.add(center);
    worldCorner.y = cell.elevation;
    return worldCorner;
  });
}
