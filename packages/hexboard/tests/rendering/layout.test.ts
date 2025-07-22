import { Vector3 } from 'three';
import { getHexFaceVertices, hexToWorld } from '../../src/rendering/layout';
import { Direction } from '../../src/core/types';
import { Cell } from '../../src/core/cell';

describe('getHexFaceVertices', () => {
  // Helper function to check if two numbers are approximately equal
  const expectCloseTo = (actual: number, expected: number, precision = 10) => {
    expect(actual).toBeCloseTo(expected, precision);
  };

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

    // North face should connect northwest corner to northeast corner
    expectCloseTo(northVertices[0].x, -0.5); // Northwest corner
    expectCloseTo(northVertices[0].z, -Math.sqrt(3) / 2);
    expect(northVertices[0].y).toBe(0);

    expectCloseTo(northVertices[1].x, 0.5); // Northeast corner
    expectCloseTo(northVertices[1].z, -Math.sqrt(3) / 2);
    expect(northVertices[1].y).toBe(0);

    // Test Northeast face (Direction.Northeast = 1)
    const northeastVertices = getHexFaceVertices(cell, Direction.Northeast);
    expectCloseTo(northeastVertices[0].x, 0.5); // Northeast corner
    expectCloseTo(northeastVertices[0].z, -Math.sqrt(3) / 2);
    expectCloseTo(northeastVertices[1].x, 1); // East corner
    expectCloseTo(northeastVertices[1].z, 0);

    // Test Southeast face (Direction.Southeast = 2)
    const southeastVertices = getHexFaceVertices(cell, Direction.Southeast);
    expectCloseTo(southeastVertices[0].x, 1); // East corner
    expectCloseTo(southeastVertices[0].z, 0);
    expectCloseTo(southeastVertices[1].x, 0.5); // Southeast corner
    expectCloseTo(southeastVertices[1].z, Math.sqrt(3) / 2);

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
    expectCloseTo(northVertices[0].x, expectedCenter.x - 0.5); // Northwest corner + center
    expectCloseTo(northVertices[0].z, expectedCenter.z - Math.sqrt(3) / 2);
    expect(northVertices[0].y).toBe(0);

    expectCloseTo(northVertices[1].x, expectedCenter.x + 0.5); // Northeast corner + center
    expectCloseTo(northVertices[1].z, expectedCenter.z - Math.sqrt(3) / 2);
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
