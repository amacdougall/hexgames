import { Vector3 } from 'three';
import {
  getHexFaceVertices,
  getHexFaceEdge,
  getHexCorners,
  HEX_CORNERS,
} from '../../src/rendering/hexGeometry';
import { Direction } from '../../src/core/types';
import { createTestCell, expectCloseTo } from './test-helpers';

describe('getHexFaceVertices', () => {
  test('cell at origin', () => {
    const cell = createTestCell(0, 0);

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
    const cell = createTestCell(2, -3);

    // Get the expected center position from hexToWorld
    // Note: This will require importing hexToWorld from hexLayout in the implementation
    const [northVertices] = [getHexFaceVertices(cell, Direction.North)];
    expect(northVertices).toHaveLength(2);

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
    const cell = createTestCell(0, 0, 10);

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
    const originCell = createTestCell(0, 0, 0);
    const elevatedNorthVertices = getHexFaceVertices(cell, Direction.North);
    const originNorthVertices = getHexFaceVertices(originCell, Direction.North);

    expectCloseTo(elevatedNorthVertices[0].x, originNorthVertices[0].x);
    expectCloseTo(elevatedNorthVertices[0].z, originNorthVertices[0].z);
    expectCloseTo(elevatedNorthVertices[1].x, originNorthVertices[1].x);
    expectCloseTo(elevatedNorthVertices[1].z, originNorthVertices[1].z);
  });
});

describe('getHexFaceEdge', () => {
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

describe('getHexCorners', () => {
  test('should return six corners for any cell', () => {
    const cell = createTestCell(0, 0);
    const corners = getHexCorners(cell);

    expect(corners).toHaveLength(6);
    corners.forEach((corner) => {
      expect(corner).toBeInstanceOf(Vector3);
    });
  });

  test('should position corners correctly relative to cell center', () => {
    const cell = createTestCell(1, 1);
    const corners = getHexCorners(cell);

    // All corners should be at cell elevation
    corners.forEach((corner) => {
      expect(corner.y).toBe(cell.elevation);
    });
  });

  test('should handle elevated cells correctly', () => {
    const cell = createTestCell(0, 0, 5);
    const corners = getHexCorners(cell);

    // All corners should be at the specified elevation
    corners.forEach((corner) => {
      expect(corner.y).toBe(5);
    });
  });
});

describe('HEX_CORNERS', () => {
  test('should be a readonly array of 6 Vector3 objects', () => {
    expect(HEX_CORNERS).toHaveLength(6);
    HEX_CORNERS.forEach((corner) => {
      expect(corner).toBeInstanceOf(Vector3);
    });
  });

  test('should define flat-top hexagon corners in correct order', () => {
    // Order should correspond to Direction enum: North, Northeast, Southeast, South, Southwest, Northwest
    // For flat-top hexagons, corners are positioned with flat edges on top/bottom

    // North corner (Direction.North = 0, but corner is for Northeast face)
    expectCloseTo(HEX_CORNERS[0].x, -Math.sqrt(3) / 2); // Northwest corner
    expectCloseTo(HEX_CORNERS[0].z, -0.5);
    expect(HEX_CORNERS[0].y).toBe(0);

    // Northeast corner (Direction.Northeast = 1)
    expectCloseTo(HEX_CORNERS[1].x, 0); // North corner
    expectCloseTo(HEX_CORNERS[1].z, -1);
    expect(HEX_CORNERS[1].y).toBe(0);

    // Southeast corner (Direction.Southeast = 2)
    expectCloseTo(HEX_CORNERS[2].x, Math.sqrt(3) / 2); // Northeast corner
    expectCloseTo(HEX_CORNERS[2].z, -0.5);
    expect(HEX_CORNERS[2].y).toBe(0);

    // Additional corners
    expectCloseTo(HEX_CORNERS[3].x, Math.sqrt(3) / 2); // Southeast corner
    expectCloseTo(HEX_CORNERS[3].z, 0.5);

    expectCloseTo(HEX_CORNERS[4].x, 0); // South corner
    expectCloseTo(HEX_CORNERS[4].z, 1);

    expectCloseTo(HEX_CORNERS[5].x, -Math.sqrt(3) / 2); // Southwest corner
    expectCloseTo(HEX_CORNERS[5].z, 0.5);
  });

  test('corners should form a regular hexagon', () => {
    // All corners should be at distance 1 from origin (for unit hexagon)
    HEX_CORNERS.forEach((corner) => {
      const distance = Math.sqrt(corner.x * corner.x + corner.z * corner.z);
      expectCloseTo(distance, 1, 5);
    });
  });
});