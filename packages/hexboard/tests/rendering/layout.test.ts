import { Vector3 } from 'three';
import {
  getHexFaceVertices,
  hexToWorld,
  getHexFaceEdge,
  applyElevationOffset,
  applyNormalOffset,
} from '../../src/rendering/layout';
import { Direction } from '../../src/core/types';
import { Cell } from '../../src/core/cell';
import { HexGrid } from '../../src/core/hexGrid';

describe('getHexFaceVertices', () => {
  // Helper function to check if two numbers are approximately equal
  const expectCloseTo = (actual: number, expected: number, precision = 10) => {
    expect(actual).toBeCloseTo(expected, precision);
  };

  // Helper to create a standard test cell (can reuse existing cell creation pattern)
  const createTestCell = (q: number, r: number, elevation = 0): Cell => ({
    q,
    r,
    s: -q - r,
    id: `${q},${r}`,
    elevation,
    movementCost: 1,
    isImpassable: false,
    customProps: {},
  });

  // Helper to create Vector3 objects for testing
  const createVector3 = (x: number, y: number, z: number) =>
    new Vector3(x, y, z);

  test('cell at origin', () => {
    const cell: Cell = {
      q: 0,
      r: 0,
      s: 0,
      id: '0,0',
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };

    // Test North face (Direction.North = 0)
    const northVertices = getHexFaceVertices(cell, Direction.North);
    expect(northVertices).toHaveLength(2);
    expect(northVertices[0]).toBeInstanceOf(Vector3);
    expect(northVertices[1]).toBeInstanceOf(Vector3);

    // North face should connect northwest corner to north corner (flat-top orientation)
    expectCloseTo(northVertices[0].x, -Math.sqrt(3) / 2); // Northwest corner
    expectCloseTo(northVertices[0].z, -0.5);
    expect(northVertices[0].y).toBe(0);

    expectCloseTo(northVertices[1].x, 0); // North corner
    expectCloseTo(northVertices[1].z, -1);
    expect(northVertices[1].y).toBe(0);

    // Test Northeast face (Direction.Northeast = 1)
    const northeastVertices = getHexFaceVertices(cell, Direction.Northeast);
    expectCloseTo(northeastVertices[0].x, 0); // North corner
    expectCloseTo(northeastVertices[0].z, -1);
    expectCloseTo(northeastVertices[1].x, Math.sqrt(3) / 2); // Northeast corner
    expectCloseTo(northeastVertices[1].z, -0.5);

    // Test Southeast face (Direction.Southeast = 2)
    const southeastVertices = getHexFaceVertices(cell, Direction.Southeast);
    expectCloseTo(southeastVertices[0].x, Math.sqrt(3) / 2); // Northeast corner
    expectCloseTo(southeastVertices[0].z, -0.5);
    expectCloseTo(southeastVertices[1].x, Math.sqrt(3) / 2); // Southeast corner
    expectCloseTo(southeastVertices[1].z, 0.5);

    // Test all directions have correct elevation (0)
    [
      Direction.North,
      Direction.Northeast,
      Direction.Southeast,
      Direction.South,
      Direction.Southwest,
      Direction.Northwest,
    ].forEach((direction) => {
      const vertices = getHexFaceVertices(cell, direction);
      expect(vertices[0].y).toBe(0);
      expect(vertices[1].y).toBe(0);
    });
  });

  test('cell at non-origin position', () => {
    const cell: Cell = {
      q: 2,
      r: -3,
      s: 1,
      id: '2,-3',
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };

    // Get the expected center position
    const expectedCenter = hexToWorld(cell);

    // Test North face - should be offset by the cell's world position
    const northVertices = getHexFaceVertices(cell, Direction.North);
    expect(northVertices).toHaveLength(2);

    // Vertices should be the local hex corners plus the cell's center position
    expectCloseTo(northVertices[0].x, expectedCenter.x - Math.sqrt(3) / 2); // Northwest corner + center
    expectCloseTo(northVertices[0].z, expectedCenter.z - 0.5);
    expect(northVertices[0].y).toBe(0);

    expectCloseTo(northVertices[1].x, expectedCenter.x + 0); // North corner + center
    expectCloseTo(northVertices[1].z, expectedCenter.z - 1);
    expect(northVertices[1].y).toBe(0);

    // Test that all directions are properly offset
    [
      Direction.North,
      Direction.Northeast,
      Direction.Southeast,
      Direction.South,
      Direction.Southwest,
      Direction.Northwest,
    ].forEach((direction) => {
      const vertices = getHexFaceVertices(cell, direction);
      expect(vertices[0].y).toBe(0); // Should have zero elevation
      expect(vertices[1].y).toBe(0);
    });
  });

  test('cell with elevation', () => {
    const cell: Cell = {
      q: 0,
      r: 0,
      s: 0,
      id: '0,0',
      elevation: 10,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };

    // Test that elevation is correctly applied to Y coordinates
    [
      Direction.North,
      Direction.Northeast,
      Direction.Southeast,
      Direction.South,
      Direction.Southwest,
      Direction.Northwest,
    ].forEach((direction) => {
      const vertices = getHexFaceVertices(cell, direction);

      expect(vertices).toHaveLength(2);
      expect(vertices[0]).toBeInstanceOf(Vector3);
      expect(vertices[1]).toBeInstanceOf(Vector3);

      // Y component should equal elevation
      expect(vertices[0].y).toBe(10);
      expect(vertices[1].y).toBe(10);
    });

    // Test that X and Z coordinates are the same as origin case (only Y should change)
    const originCell: Cell = { ...cell, elevation: 0 };
    const elevatedNorthVertices = getHexFaceVertices(cell, Direction.North);
    const originNorthVertices = getHexFaceVertices(originCell, Direction.North);

    expectCloseTo(elevatedNorthVertices[0].x, originNorthVertices[0].x);
    expectCloseTo(elevatedNorthVertices[0].z, originNorthVertices[0].z);
    expectCloseTo(elevatedNorthVertices[1].x, originNorthVertices[1].x);
    expectCloseTo(elevatedNorthVertices[1].z, originNorthVertices[1].z);
  });
});

describe('getHexFaceEdge', () => {
  // Helper to create a standard test cell (can reuse existing cell creation pattern)
  const createTestCell = (q: number, r: number, elevation = 0): Cell => ({
    q,
    r,
    s: -q - r,
    id: `${q},${r}`,
    elevation,
    movementCost: 1,
    isImpassable: false,
    customProps: {},
  });

  test('should return object with start and end Vector3 properties', () => {
    const cell = createTestCell(0, 0);
    const result = getHexFaceEdge(cell, Direction.North);

    expect(result).toHaveProperty('start');
    expect(result).toHaveProperty('end');
    expect(result.start).toBeInstanceOf(Vector3);
    expect(result.end).toBeInstanceOf(Vector3);
  });

  test('should match getHexFaceVertices output for all directions', () => {
    const cell = createTestCell(0, 0, 5);

    // Test all six directions
    [
      Direction.North,
      Direction.Northeast,
      Direction.Southeast,
      Direction.South,
      Direction.Southwest,
      Direction.Northwest,
    ].forEach((direction) => {
      const edgeResult = getHexFaceEdge(cell, direction);
      const verticesResult = getHexFaceVertices(cell, direction);

      // Edge start should match first vertex
      expect(edgeResult.start.x).toBe(verticesResult[0].x);
      expect(edgeResult.start.y).toBe(verticesResult[0].y);
      expect(edgeResult.start.z).toBe(verticesResult[0].z);

      // Edge end should match second vertex
      expect(edgeResult.end.x).toBe(verticesResult[1].x);
      expect(edgeResult.end.y).toBe(verticesResult[1].y);
      expect(edgeResult.end.z).toBe(verticesResult[1].z);
    });
  });

  test('should handle elevation correctly', () => {
    const cellLow = createTestCell(1, 1, 0);
    const cellHigh = createTestCell(1, 1, 10);

    const edgeLow = getHexFaceEdge(cellLow, Direction.North);
    const edgeHigh = getHexFaceEdge(cellHigh, Direction.North);

    // Y coordinates should reflect elevation
    expect(edgeLow.start.y).toBe(0);
    expect(edgeLow.end.y).toBe(0);
    expect(edgeHigh.start.y).toBe(10);
    expect(edgeHigh.end.y).toBe(10);

    // X and Z should be the same regardless of elevation
    expect(edgeLow.start.x).toBe(edgeHigh.start.x);
    expect(edgeLow.start.z).toBe(edgeHigh.start.z);
    expect(edgeLow.end.x).toBe(edgeHigh.end.x);
    expect(edgeLow.end.z).toBe(edgeHigh.end.z);
  });

  test('should handle various cell positions', () => {
    const positions = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: -1, r: 1 },
      { q: 2, r: -1 },
    ];

    positions.forEach(({ q, r }) => {
      const cell = createTestCell(q, r);

      // Should not throw for any position
      expect(() => {
        getHexFaceEdge(cell, Direction.North);
      }).not.toThrow();

      // Result should always have proper structure
      const result = getHexFaceEdge(cell, Direction.North);
      expect(result.start).toBeInstanceOf(Vector3);
      expect(result.end).toBeInstanceOf(Vector3);
    });
  });
});

describe('applyElevationOffset', () => {
  // Helper to create Vector3 objects for testing
  const createVector3 = (x: number, y: number, z: number) =>
    new Vector3(x, y, z);

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
  // Helper to create Vector3 objects for testing
  const createVector3 = (x: number, y: number, z: number) =>
    new Vector3(x, y, z);

  // Helper to create a standard test cell (can reuse existing cell creation pattern)
  const createTestCell = (q: number, r: number, elevation = 0): Cell => ({
    q,
    r,
    s: -q - r,
    id: `${q},${r}`,
    elevation,
    movementCost: 1,
    isImpassable: false,
    customProps: {},
  });

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
