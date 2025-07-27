import { Vector3 } from 'three';
import { Cell } from '../../src/core/cell';

/**
 * Helper function to check if two numbers are approximately equal
 */
export const expectCloseTo = (actual: number, expected: number, precision = 10) => {
  expect(actual).toBeCloseTo(expected, precision);
};

/**
 * Helper to create a standard test cell
 */
export const createTestCell = (q: number, r: number, elevation = 0): Cell => ({
  q,
  r,
  s: -q - r,
  id: `${q},${r}`,
  elevation,
  movementCost: 1,
  isImpassable: false,
  customProps: {},
});

/**
 * Helper to create Vector3 objects for testing
 */
export const createVector3 = (x: number, y: number, z: number) =>
  new Vector3(x, y, z);