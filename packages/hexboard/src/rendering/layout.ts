import * as THREE from 'three';
import { HexCoordinates } from '../core/coordinates';

/* NOTE: This file contains utility functions related to conversion from the
 * logical hex grid to a rendered 3D scene.
 *
 * It should only include functions that bridge between these two domains. For
 * example, a pathfinding algorithm would not belong here. Neither would a method
 * which identifies the neighbors of a cell.
 */

/**
 * Returns world coordinates for the supplied HexCoordinates.
 *
 * @param { q, r } - Hexagonal grid coordinates (q, r).
 */
export function hexToWorld({ q, r }: HexCoordinates): THREE.Vector3 {
  // Flat-top hexagon layout with size 1
  const size = 1;
  const x = size * (3/2 * q);
  const z = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return new THREE.Vector3(x, 0, z);
}

export function worldToHex(position: THREE.Vector3): HexCoordinates {
  // Inverse of flat-top hexagon layout with size 1
  const size = 1;
  const q = (2/3 * position.x) / size;
  const r = (-1/3 * position.x + Math.sqrt(3)/3 * position.z) / size;
  const qRound = Math.round(q);
  const rRound = Math.round(r);
  const sRound = -qRound - rRound;
  return { q: qRound, r: rRound, s: sRound };
}
