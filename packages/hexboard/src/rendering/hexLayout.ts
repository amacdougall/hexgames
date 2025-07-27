import * as THREE from 'three';
import { HexCoordinates } from '../core/coordinates';

/**
 * Size constants and layout parameters for flat-top hexagon layout.
 * In flat-top layout, hexagons have flat edges on top/bottom and neighbors
 * in N, NE, SE, S, SW, NW directions.
 */
const HEX_SIZE = 1;

/**
 * Converts hex coordinates to world position using flat-top hexagon layout.
 * In flat-top layout, hexagons have flat edges on top/bottom and neighbors
 * in N, NE, SE, S, SW, NW directions.
 *
 * @param { q, r } - Hexagonal grid coordinates (q, r).
 */
export function hexToWorld({ q, r }: HexCoordinates): THREE.Vector3 {
  // Flat-top layout formulas
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const z = HEX_SIZE * ((3 / 2) * r);
  return new THREE.Vector3(x, 0, z);
}

/**
 * Converts world position back to hex coordinates using flat-top layout.
 */
export function worldToHex(worldPos: THREE.Vector3): HexCoordinates {
  // Flat-top reverse conversion
  const q = ((Math.sqrt(3) / 3) * worldPos.x - (1 / 3) * worldPos.z) / HEX_SIZE;
  const r = ((2 / 3) * worldPos.z) / HEX_SIZE;
  const s = -q - r;

  // Round to nearest integer coordinates
  return roundHexCoordinates({ q, r, s });
}

/**
 * Rounds fractional hex coordinates to the nearest valid integer coordinates.
 * Exposed for testing and advanced use cases.
 */
export function roundHexCoordinates({
  q,
  r,
  s,
}: HexCoordinates): HexCoordinates {
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
