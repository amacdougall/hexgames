import { Vector3 } from 'three';
import {
  applyElevationOffset,
  applyNormalOffset,
  calculateCentroid,
  scaleVertices,
} from '../../src/rendering/vertexUtils';
import { HexGrid } from '../../src/core/hexGrid';
import { createTestCell, createVector3 } from './test-helpers';

describe('applyElevationOffset', () => {
  test('should modify Y coordinates of vertices by offset amount', () => {
    const vertices = [
      createVector3(1, 0, 1),
      createVector3(2, 5, 2),
      createVector3(3, -2, 3),
    ];
    const offset = 0.5;

    applyElevationOffset(vertices, offset);

    expect(vertices[0].y).toBe(0.5);
    expect(vertices[1].y).toBe(5.5);
    expect(vertices[2].y).toBe(-1.5);
  });

  test('should not modify X and Z coordinates', () => {
    const vertices = [createVector3(1.5, 0, 2.7), createVector3(-3.2, 10, 4.8)];
    const originalX = [vertices[0].x, vertices[1].x];
    const originalZ = [vertices[0].z, vertices[1].z];

    applyElevationOffset(vertices, 1.25);

    expect(vertices[0].x).toBe(originalX[0]);
    expect(vertices[1].x).toBe(originalX[1]);
    expect(vertices[0].z).toBe(originalZ[0]);
    expect(vertices[1].z).toBe(originalZ[1]);
  });

  test('should handle positive, negative, and zero offsets', () => {
    const createVerticesSet = () => [
      createVector3(0, 1, 0),
      createVector3(0, 2, 0),
    ];

    // Positive offset
    const positiveVertices = createVerticesSet();
    applyElevationOffset(positiveVertices, 0.5);
    expect(positiveVertices[0].y).toBe(1.5);
    expect(positiveVertices[1].y).toBe(2.5);

    // Negative offset
    const negativeVertices = createVerticesSet();
    applyElevationOffset(negativeVertices, -0.3);
    expect(negativeVertices[0].y).toBe(0.7);
    expect(negativeVertices[1].y).toBe(1.7);

    // Zero offset
    const zeroVertices = createVerticesSet();
    applyElevationOffset(zeroVertices, 0);
    expect(zeroVertices[0].y).toBe(1);
    expect(zeroVertices[1].y).toBe(2);
  });

  test('should handle empty vertex array without error', () => {
    const vertices: Vector3[] = [];

    expect(() => {
      applyElevationOffset(vertices, 1.0);
    }).not.toThrow();

    expect(vertices).toHaveLength(0);
  });

  test('should modify vertices in place', () => {
    const vertices = [createVector3(0, 1, 0)];
    const originalVertex = vertices[0];

    applyElevationOffset(vertices, 0.5);

    // Should be the same object reference, modified in place
    expect(vertices[0]).toBe(originalVertex);
    expect(vertices[0].y).toBe(1.5);
  });
});

describe('applyNormalOffset', () => {
  let mockGrid: jest.Mocked<HexGrid>;
  let selectedCells: Set<string>;

  beforeEach(() => {
    // Create mock grid with necessary methods
    mockGrid = {
      getCellById: jest.fn(),
      getCellByCoords: jest.fn(),
      getNeighborCoordinates: jest.fn(),
    } as any;

    selectedCells = new Set(['0,0', '1,0']);
  });

  test('should apply minimal outward offset to avoid rendering conflicts', () => {
    // Mock a simple 2-cell horizontal selection
    const cell1 = createTestCell(0, 0);
    const cell2 = createTestCell(1, 0);

    mockGrid.getCellById.mockImplementation((id: string) => {
      if (id === '0,0') return cell1;
      if (id === '1,0') return cell2;
      return null;
    });

    // Mock neighbor detection to simulate boundary detection
    mockGrid.getNeighborCoordinates.mockReturnValue([
      { q: -1, r: 0, s: 1 }, // Southwest neighbor (outside selection)
      { q: 0, r: -1, s: 1 }, // Northwest neighbor (outside selection)
      { q: 1, r: -1, s: 0 }, // North neighbor (outside selection)
      { q: 2, r: 0, s: -2 }, // Northeast neighbor (outside selection)
      { q: 1, r: 1, s: -2 }, // Southeast neighbor (outside selection)
      { q: 0, r: 1, s: -1 }, // South neighbor (outside selection)
    ]);

    // Vertices representing a face on the boundary
    const originalVertices = [
      createVector3(0, 0, -0.5), // North face of cell (0,0)
      createVector3(0.5, 0, -Math.sqrt(3) / 2),
    ];
    const vertices = originalVertices.map((v) => createVector3(v.x, v.y, v.z));

    // Apply minimal offset (typical values: 0.001-0.005)
    applyNormalOffset(vertices, mockGrid, selectedCells, 0.002);

    // Vertices should be pushed outward but minimally
    // Should be moved but very close to original position
    expect(vertices[0].z).toBeLessThan(-0.5);
    expect(vertices[0].z).toBeCloseTo(-0.5, 2); // Within 0.01 of original
    expect(vertices[1].z).toBeLessThan(-Math.sqrt(3) / 2);
    expect(vertices[1].z).toBeCloseTo(-Math.sqrt(3) / 2, 2);

    // X coordinates should also be minimally adjusted outward
    expect(vertices[0].x).toBeCloseTo(0, 2); // Should stay very close to 0
    expect(vertices[1].x).toBeGreaterThan(0.5);
    expect(vertices[1].x).toBeCloseTo(0.5, 2); // Should stay very close to 0.5
  });

  test('should not modify vertices with zero offset', () => {
    const vertices = [createVector3(1, 2, 3), createVector3(4, 5, 6)];
    const originalCoords = vertices.map((v) => ({ x: v.x, y: v.y, z: v.z }));

    applyNormalOffset(vertices, mockGrid, selectedCells, 0);

    vertices.forEach((vertex, index) => {
      expect(vertex.x).toBe(originalCoords[index].x);
      expect(vertex.y).toBe(originalCoords[index].y);
      expect(vertex.z).toBe(originalCoords[index].z);
    });
  });

  test('should handle empty vertex array without error', () => {
    const vertices: Vector3[] = [];

    expect(() => {
      applyNormalOffset(vertices, mockGrid, selectedCells, 0.1);
    }).not.toThrow();

    expect(vertices).toHaveLength(0);
  });

  test('should modify vertices in place', () => {
    const vertices = [createVector3(0, 0, 0)];
    const originalVertex = vertices[0];

    // Mock minimal grid behavior for this test
    mockGrid.getCellById.mockReturnValue(createTestCell(0, 0));
    mockGrid.getNeighborCoordinates.mockReturnValue([]);

    applyNormalOffset(vertices, mockGrid, selectedCells, 0.1);

    // Should be the same object reference
    expect(vertices[0]).toBe(originalVertex);
  });

  test('should handle various offset magnitudes proportionally', () => {
    const createTestVertices = () => [createVector3(1, 0, 0)];

    // Mock simple boundary scenario
    mockGrid.getCellById.mockReturnValue(createTestCell(0, 0));
    mockGrid.getNeighborCoordinates.mockReturnValue([]);

    const smallOffset = createTestVertices();
    const largeOffset = createTestVertices();

    applyNormalOffset(smallOffset, mockGrid, selectedCells, 0.001);
    applyNormalOffset(largeOffset, mockGrid, selectedCells, 0.01);

    // Larger offset should move vertices further from original position
    // but both should still be very close to original (minimal offset principle)
    const smallDistance = Math.abs(smallOffset[0].x - 1);
    const largeDistance = Math.abs(largeOffset[0].x - 1);

    expect(largeDistance).toBeGreaterThan(smallDistance);
    expect(smallDistance).toBeLessThan(0.01); // Small offset stays very close
    expect(largeDistance).toBeLessThan(0.1); // Even large offset is minimal
  });
});

describe('calculateCentroid', () => {
  test('should calculate centroid of triangle vertices', () => {
    const vertices = [
      createVector3(0, 0, 0),
      createVector3(3, 0, 0),
      createVector3(0, 3, 0),
    ];

    const centroid = calculateCentroid(vertices);

    expect(centroid.x).toBe(1);
    expect(centroid.y).toBe(1);
    expect(centroid.z).toBe(0);
  });

  test('should handle single vertex', () => {
    const vertices = [createVector3(5, 10, 15)];

    const centroid = calculateCentroid(vertices);

    expect(centroid.x).toBe(5);
    expect(centroid.y).toBe(10);
    expect(centroid.z).toBe(15);
  });

  test('should handle empty vertex array', () => {
    const vertices: Vector3[] = [];

    const centroid = calculateCentroid(vertices);

    expect(centroid.x).toBe(0);
    expect(centroid.y).toBe(0);
    expect(centroid.z).toBe(0);
  });

  test('should handle vertices with negative coordinates', () => {
    const vertices = [
      createVector3(-1, -1, -1),
      createVector3(1, 1, 1),
    ];

    const centroid = calculateCentroid(vertices);

    expect(centroid.x).toBe(0);
    expect(centroid.y).toBe(0);
    expect(centroid.z).toBe(0);
  });
});

describe('scaleVertices', () => {
  test('should scale vertices around origin by default', () => {
    const vertices = [
      createVector3(1, 0, 0),
      createVector3(0, 2, 0),
      createVector3(0, 0, 3),
    ];

    scaleVertices(vertices, 2);

    expect(vertices[0].x).toBe(2);
    expect(vertices[0].y).toBe(0);
    expect(vertices[0].z).toBe(0);
    
    expect(vertices[1].x).toBe(0);
    expect(vertices[1].y).toBe(4);
    expect(vertices[1].z).toBe(0);
    
    expect(vertices[2].x).toBe(0);
    expect(vertices[2].y).toBe(0);
    expect(vertices[2].z).toBe(6);
  });

  test('should scale vertices around specified center', () => {
    const vertices = [
      createVector3(2, 2, 2),
      createVector3(4, 2, 2),
    ];
    const center = createVector3(2, 2, 2);

    scaleVertices(vertices, 2, center);

    // First vertex is at center, so it shouldn't move
    expect(vertices[0].x).toBe(2);
    expect(vertices[0].y).toBe(2);
    expect(vertices[0].z).toBe(2);
    
    // Second vertex was 2 units away in X, now should be 4 units away (2*2)
    expect(vertices[1].x).toBe(6); // 2 + (4 * 2) = 6
    expect(vertices[1].y).toBe(2);
    expect(vertices[1].z).toBe(2);
  });

  test('should handle scale factor of 1 (no change)', () => {
    const vertices = [createVector3(1, 2, 3)];
    const originalCoords = { x: vertices[0].x, y: vertices[0].y, z: vertices[0].z };

    scaleVertices(vertices, 1);

    expect(vertices[0].x).toBe(originalCoords.x);
    expect(vertices[0].y).toBe(originalCoords.y);
    expect(vertices[0].z).toBe(originalCoords.z);
  });

  test('should handle empty vertex array', () => {
    const vertices: Vector3[] = [];

    expect(() => {
      scaleVertices(vertices, 2);
    }).not.toThrow();

    expect(vertices).toHaveLength(0);
  });

  test('should modify vertices in place', () => {
    const vertices = [createVector3(1, 1, 1)];
    const originalVertex = vertices[0];

    scaleVertices(vertices, 2);

    expect(vertices[0]).toBe(originalVertex);
    expect(vertices[0].x).toBe(2);
    expect(vertices[0].y).toBe(2);
    expect(vertices[0].z).toBe(2);
  });
});