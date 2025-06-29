import {
  HexCoordinates,
  axialToCubic,
  isValidHexCoordinate,
} from '../../src/core/coordinates';

describe('Coordinate System', () => {
  describe('axialToCubic', () => {
    test('converts axial to cubic coordinates correctly', () => {
      const result = axialToCubic(1, 2);
      expect(result).toEqual({ q: 1, r: 2, s: -3 });
      expect(result.q + result.r + result.s).toBe(0);
    });

    test('handles negative coordinates', () => {
      const result = axialToCubic(-2, -1);
      expect(result).toEqual({ q: -2, r: -1, s: 3 });
      expect(result.q + result.r + result.s).toBe(0);
    });

    test('handles zero coordinates', () => {
      const result = axialToCubic(0, 0);
      expect(result.q).toBe(0);
      expect(result.r).toBe(0);
      expect(result.s === 0 || Object.is(result.s, 0)).toBe(true); // Handle -0 vs 0
      expect(result.q + result.r + result.s).toBe(0);
    });

    test('handles mixed positive and negative coordinates', () => {
      const result = axialToCubic(5, -3);
      expect(result).toEqual({ q: 5, r: -3, s: -2 });
      expect(result.q + result.r + result.s).toBe(0);
    });

    test('maintains coordinate invariant for all conversions', () => {
      const testCases = [
        [1, 1],
        [0, 1],
        [1, 0],
        [-1, -1],
        [10, -5],
        [-7, 3],
      ];

      testCases.forEach(([q, r]) => {
        const result = axialToCubic(q, r);
        expect(result.q + result.r + result.s).toBe(0);
      });
    });
  });

  describe('isValidHexCoordinate', () => {
    test('validates correct cubic coordinates', () => {
      const validCoords: HexCoordinates[] = [
        { q: 0, r: 0, s: 0 },
        { q: 1, r: -1, s: 0 },
        { q: 2, r: -3, s: 1 },
        { q: -5, r: 2, s: 3 },
        { q: 10, r: -7, s: -3 },
      ];

      validCoords.forEach((coord) => {
        expect(isValidHexCoordinate(coord)).toBe(true);
      });
    });

    test('rejects invalid cubic coordinates', () => {
      const invalidCoords: HexCoordinates[] = [
        { q: 1, r: 1, s: 1 },
        { q: 0, r: 1, s: 1 },
        { q: 2, r: 2, s: -3 },
        { q: -1, r: -1, s: -1 },
        { q: 5, r: 0, s: -4 },
      ];

      invalidCoords.forEach((coord) => {
        expect(isValidHexCoordinate(coord)).toBe(false);
      });
    });

    test('handles floating point precision issues', () => {
      // Test coordinates with exact floating point representation
      const precisionCoords: HexCoordinates[] = [
        { q: 0.5, r: 0.25, s: -0.75 },
        { q: 1.0, r: 2.0, s: -3.0 },
        { q: -0.5, r: -0.25, s: 0.75 },
      ];

      precisionCoords.forEach((coord) => {
        expect(isValidHexCoordinate(coord)).toBe(true);
      });

      // Test coordinates that should fail due to precision
      const invalidPrecisionCoords: HexCoordinates[] = [
        { q: 0.1, r: 0.2, s: -0.30000001 }, // Slightly off due to precision
        { q: 1 / 3, r: 1 / 3, s: -2 / 3 + 0.000001 }, // Manually introduce error
      ];

      invalidPrecisionCoords.forEach((coord) => {
        expect(isValidHexCoordinate(coord)).toBe(false);
      });

      // Test that values that should be exactly zero work
      expect(isValidHexCoordinate({ q: 1, r: -1, s: 0 })).toBe(true);
      expect(isValidHexCoordinate({ q: 2, r: -1, s: -1 })).toBe(true);
    });

    test('validates coordinates from axialToCubic conversion', () => {
      const axialPairs = [
        [0, 0],
        [1, 2],
        [-3, 1],
        [5, -2],
        [-1, -1],
      ];

      axialPairs.forEach(([q, r]) => {
        const cubic = axialToCubic(q, r);
        expect(isValidHexCoordinate(cubic)).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    test('handles large coordinate values', () => {
      // Test with large numbers to ensure no overflow issues
      const largeCoords = [
        [1000000, -500000],
        [-999999, 999999],
        [Number.MAX_SAFE_INTEGER / 3, -Number.MAX_SAFE_INTEGER / 3],
      ];

      largeCoords.forEach(([q, r]) => {
        const result = axialToCubic(q, r);
        expect(isValidHexCoordinate(result)).toBe(true);
        expect(result.q).toBe(q);
        expect(result.r).toBe(r);
        expect(result.s).toBe(-q - r);
      });
    });

    test('handles boundary conditions', () => {
      // Test coordinates at various boundaries
      const boundaryTests = [
        // Origin
        { q: 0, r: 0, s: 0 },
        // Single unit movements in each direction
        { q: 1, r: 0, s: -1 },
        { q: 0, r: 1, s: -1 },
        { q: -1, r: 1, s: 0 },
        { q: -1, r: 0, s: 1 },
        { q: 0, r: -1, s: 1 },
        { q: 1, r: -1, s: 0 },
      ];

      boundaryTests.forEach((coords) => {
        expect(isValidHexCoordinate(coords)).toBe(true);
      });

      // Test that axialToCubic produces the same results
      expect(axialToCubic(1, 0)).toEqual({ q: 1, r: 0, s: -1 });
      expect(axialToCubic(0, 1)).toEqual({ q: 0, r: 1, s: -1 });
      expect(axialToCubic(-1, 1)).toEqual({ q: -1, r: 1, s: 0 });
    });

    test('maintains type safety with HexCoordinates interface', () => {
      // Ensure converted coordinates conform to the interface
      const result = axialToCubic(3, -1);

      expect(typeof result.q).toBe('number');
      expect(typeof result.r).toBe('number');
      expect(typeof result.s).toBe('number');

      // Ensure all required properties exist
      expect(result).toHaveProperty('q');
      expect(result).toHaveProperty('r');
      expect(result).toHaveProperty('s');
    });
  });
});
