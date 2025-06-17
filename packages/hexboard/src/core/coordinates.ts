// Coordinate system for hexagonal grids

export interface HexCoordinates {
  q: number;
  r: number;
  s: number; // Invariant: q + r + s = 0
}

/**
 * Convert axial coordinates (q, r) to cubic coordinates (q, r, s)
 */
export function axialToCubic(q: number, r: number): HexCoordinates {
  return { q, r, s: -q - r };
}

/**
 * Validate that cubic coordinates satisfy the constraint q + r + s = 0
 */
export function isValidHexCoordinate(coords: HexCoordinates): boolean {
  return coords.q + coords.r + coords.s === 0;
}
