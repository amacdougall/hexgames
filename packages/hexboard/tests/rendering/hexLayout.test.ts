import { Vector3 } from 'three';
import {
  hexToWorld,
  worldToHex,
  roundHexCoordinates,
} from '../../src/rendering/hexLayout';
import { expectCloseTo } from './test-helpers';

describe('hexToWorld', () => {
  test('converts origin hex coordinates to world position', () => {
    const result = hexToWorld({ q: 0, r: 0, s: 0 });

    expect(result).toBeInstanceOf(Vector3);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  test('converts positive hex coordinates to world position', () => {
    const result = hexToWorld({ q: 1, r: 0, s: -1 });

    expectCloseTo(result.x, Math.sqrt(3));
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  test('converts negative hex coordinates to world position', () => {
    const result = hexToWorld({ q: -1, r: 0, s: 1 });

    expectCloseTo(result.x, -Math.sqrt(3));
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  test('converts hex coordinates with r component to world position', () => {
    const result = hexToWorld({ q: 0, r: 1, s: -1 });

    expectCloseTo(result.x, Math.sqrt(3) / 2);
    expect(result.y).toBe(0);
    expectCloseTo(result.z, 1.5);
  });

  test('flat-top orientation properties', () => {
    // In flat-top layout, moving in +r direction should go southeast
    const center = hexToWorld({ q: 0, r: 0, s: 0 });
    const rPlus = hexToWorld({ q: 0, r: 1, s: -1 });

    // +r should move in positive x and positive z directions
    expect(rPlus.x).toBeGreaterThan(center.x);
    expect(rPlus.z).toBeGreaterThan(center.z);

    // Moving in +q direction should go northeast
    const qPlus = hexToWorld({ q: 1, r: 0, s: -1 });

    // +q should move in positive x direction only
    expect(qPlus.x).toBeGreaterThan(center.x);
    expect(qPlus.z).toBe(center.z);
  });
});

describe('worldToHex', () => {
  test('converts origin world position to hex coordinates', () => {
    const result = worldToHex(new Vector3(0, 0, 0));

    expect(result.q).toBe(0);
    expect(result.r).toBe(0);
    expect(Math.abs(result.s)).toBe(0); // Handle -0 vs 0 equality
  });

  test('converts positive world position to hex coordinates', () => {
    const worldPos = new Vector3(Math.sqrt(3), 0, 0);
    const result = worldToHex(worldPos);

    expect(result.q).toBe(1);
    expect(result.r).toBe(0);
    expect(result.s).toBe(-1);
  });

  test('round-trip conversion preserves coordinates', () => {
    const originalHex = { q: 2, r: -1, s: -1 };
    const worldPos = hexToWorld(originalHex);
    const convertedHex = worldToHex(worldPos);

    expect(convertedHex.q).toBe(originalHex.q);
    expect(convertedHex.r).toBe(originalHex.r);
    expect(convertedHex.s).toBe(originalHex.s);
  });

  test('converts fractional world positions correctly', () => {
    // Test a position that's between hex centers
    const betweenPos = new Vector3(Math.sqrt(3) / 2, 0, 0.75);
    const result = worldToHex(betweenPos);

    // Should round to the nearest valid hex coordinate
    expect(result.q + result.r + result.s).toBe(0);
    expect(Number.isInteger(result.q)).toBe(true);
    expect(Number.isInteger(result.r)).toBe(true);
    expect(Number.isInteger(result.s)).toBe(true);
  });
});

describe('roundHexCoordinates', () => {
  test('rounds coordinates that are already integers', () => {
    const result = roundHexCoordinates({ q: 1, r: -1, s: 0 });

    expect(result.q).toBe(1);
    expect(result.r).toBe(-1);
    expect(result.s).toBe(0);
  });

  test('rounds fractional coordinates to nearest valid hex', () => {
    const result = roundHexCoordinates({ q: 1.1, r: -0.9, s: -0.2 });

    // Should sum to zero (hex constraint)
    expect(result.q + result.r + result.s).toBe(0);
    expect(Number.isInteger(result.q)).toBe(true);
    expect(Number.isInteger(result.r)).toBe(true);
    expect(Number.isInteger(result.s)).toBe(true);
  });

  test('handles edge case where multiple coordinates are equally far', () => {
    const result = roundHexCoordinates({ q: 0.5, r: -0.5, s: 0 });

    // Should still maintain hex constraint
    expect(result.q + result.r + result.s).toBe(0);
    expect(Number.isInteger(result.q)).toBe(true);
    expect(Number.isInteger(result.r)).toBe(true);
    expect(Number.isInteger(result.s)).toBe(true);
  });

  test('preserves hex coordinate constraint (q + r + s = 0)', () => {
    const testCases = [
      { q: 1.7, r: -0.3, s: -1.4 },
      { q: -2.1, r: 1.8, s: 0.3 },
      { q: 0.1, r: 0.1, s: -0.2 },
    ];

    testCases.forEach((coords) => {
      const result = roundHexCoordinates(coords);
      expect(result.q + result.r + result.s).toBe(0);
    });
  });
});