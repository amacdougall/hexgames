/// <reference lib="dom" />

import { HexGrid } from '../../src/core/hexGrid';
import { BoundaryMap, Direction } from '../../src/core/types';

interface TestProps extends Record<string, unknown> {
  type?: string;
  owner?: string;
  resources?: string[];
  biome?: 'forest' | 'desert' | 'tundra' | 'swamp';
  discovered?: boolean;
}

describe('HexGrid', () => {
  let grid: HexGrid<TestProps>;

  beforeEach(() => {
    grid = new HexGrid<TestProps>(1, 1, false);
  });

  describe('Constructor', () => {
    test('creates empty grid with default values', () => {
      expect(grid.size()).toBe(0);
      expect(grid.isEmpty()).toBe(true);
      expect(grid.getAllCells()).toEqual([]);
    });

    test('accepts custom default values', () => {
      const customGrid = new HexGrid<TestProps>(2.5, 3, true);
      const cell = customGrid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });
      expect(cell.elevation).toBe(2.5);
      expect(cell.movementCost).toBe(3);
      expect(cell.isImpassable).toBe(true);
    });
  });

  describe('Cell Management', () => {
    test('adds cells correctly', () => {
      const cell = grid.addCell({
        q: 1,
        r: 0,
        elevation: 2,
        customProps: { type: 'mountain' },
      });

      expect(cell.q).toBe(1);
      expect(cell.r).toBe(0);
      expect(cell.s).toBe(-1);
      expect(cell.elevation).toBe(2);
      expect(cell.customProps.type).toBe('mountain');
      expect(grid.size()).toBe(1);
    });

    test('prevents duplicate cells', () => {
      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });

      expect(() => {
        grid.addCell({ q: 0, r: 0, customProps: { type: 'mountain' } });
      }).toThrow('Cell already exists at coordinates q=0, r=0, s=0');
    });

    test('removes cells correctly', () => {
      grid.addCell({ q: 1, r: 0, customProps: { type: 'forest' } });
      expect(grid.size()).toBe(1);

      const removed = grid.removeCell(1, 0);
      expect(removed).toBe(true);
      expect(grid.size()).toBe(0);
      expect(grid.getCell(1, 0)).toBeNull();

      const removedAgain = grid.removeCell(1, 0);
      expect(removedAgain).toBe(false);
    });

    test('updates existing cells', () => {
      const _originalCell = grid.addCell({
        q: 0,
        r: 0,
        elevation: 1,
        isImpassable: false,
        customProps: { type: 'grass' },
      });

      const updatedCell = grid.updateCell(0, 0, {
        elevation: 3,
        isImpassable: true,
        customProps: { type: 'mountain' },
      });

      expect(updatedCell).not.toBeNull();
      expect(updatedCell!.elevation).toBe(3);
      expect(updatedCell!.isImpassable).toBe(true);
      expect(updatedCell!.customProps.type).toBe('mountain');

      const nullUpdate = grid.updateCell(5, 5, { elevation: 2 });
      expect(nullUpdate).toBeNull();
    });

    test('retrieves cells by coordinates', () => {
      const cell = grid.addCell({
        q: 2,
        r: -1,
        customProps: { type: 'grass' },
      });

      const retrieved = grid.getCell(2, -1);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(cell.id);

      const retrievedWithS = grid.getCell(2, -1, -1);
      expect(retrievedWithS).not.toBeNull();
      expect(retrievedWithS!.id).toBe(cell.id);

      const notFound = grid.getCell(10, 10);
      expect(notFound).toBeNull();
    });

    test('checks cell existence', () => {
      expect(grid.hasCell(0, 0)).toBe(false);

      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
      expect(grid.hasCell(0, 0)).toBe(true);
      expect(grid.hasCell(0, 0, 0)).toBe(true);
      expect(grid.hasCell(1, 1)).toBe(false);
    });
  });

  describe('Coordinate Validation', () => {
    test('accepts valid hex coordinates', () => {
      // These should not throw
      expect(() => {
        grid.addCell({ q: 0, r: 0, s: 0, customProps: { type: 'grass' } });
      }).not.toThrow();

      expect(() => {
        grid.addCell({
          q: 1,
          r: -1,
          s: 0,
          customProps: { type: 'forest' },
        });
      }).not.toThrow();
    });

    test('rejects invalid coordinates', () => {
      // s coordinate that doesn't satisfy q + r + s = 0
      expect(() => {
        grid.addCell({ q: 0, r: 0, s: 1, customProps: { type: 'grass' } });
      }).toThrow(
        'Invalid hex coordinates: q=0, r=0, s=1. Must satisfy q + r + s = 0'
      );

      expect(() => {
        grid.addCell({
          q: 1,
          r: 1,
          s: 1,
          customProps: { type: 'forest' },
        });
      }).toThrow(
        'Invalid hex coordinates: q=1, r=1, s=1. Must satisfy q + r + s = 0'
      );
    });

    test('handles axial coordinate conversion', () => {
      // When s is not provided, it should be calculated automatically
      const cell = grid.addCell({
        q: 2,
        r: -1,
        customProps: { type: 'grass' },
      });
      expect(cell.s).toBe(-1); // s = -(q + r) = -(2 + (-1)) = -1

      const cell2 = grid.addCell({
        q: -1,
        r: 2,
        customProps: { type: 'water' },
      });
      expect(cell2.s).toBe(-1); // s = -(-1 + 2) = -1
    });
  });

  describe('Grid Queries', () => {
    test('returns all cells', () => {
      expect(grid.getAllCells()).toEqual([]);

      const cell1 = grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });
      const cell2 = grid.addCell({
        q: 1,
        r: 0,
        customProps: { type: 'mountain' },
      });

      const allCells = grid.getAllCells();
      expect(allCells).toHaveLength(2);
      expect(allCells).toContain(cell1);
      expect(allCells).toContain(cell2);
    });

    test('returns correct cell count', () => {
      expect(grid.size()).toBe(0);

      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
      expect(grid.size()).toBe(1);

      grid.addCell({ q: 1, r: 0, customProps: { type: 'mountain' } });
      expect(grid.size()).toBe(2);

      grid.removeCell(0, 0);
      expect(grid.size()).toBe(1);
    });

    test('finds cells by criteria', () => {
      grid.addCell({
        q: 0,
        r: 0,
        elevation: 1,
        isImpassable: false,
        customProps: { type: 'grass' },
      });
      grid.addCell({
        q: 1,
        r: 0,
        elevation: 3,
        isImpassable: true,
        customProps: { type: 'mountain' },
      });
      grid.addCell({
        q: 0,
        r: 1,
        elevation: 2,
        isImpassable: false,
        customProps: { type: 'hill' },
      });

      const passableCells = grid.getCellsWhere((cell) => !cell.isImpassable);
      expect(passableCells).toHaveLength(2);

      const highElevationCells = grid.getCellsWhere(
        (cell) => cell.elevation > 2
      );
      expect(highElevationCells).toHaveLength(1);
      expect(highElevationCells[0].customProps.type).toBe('mountain');
    });
  });

  describe('Hex Ring Generation', () => {
    test('generates basic hex ring correctly', () => {
      const neighbors = grid.getNeighborCoordinates(0, 0);
      expect(neighbors).toHaveLength(6);

      // Check that all neighbors satisfy the cubic coordinate constraint
      neighbors.forEach((coord) => {
        expect(coord.q + coord.r + coord.s).toBe(0);
      });

      // Check expected neighbor positions for flat-top layout
      const expectedNeighbors = [
        { q: 1, r: 0, s: -1 }, // Southeast
        { q: 0, r: -1, s: 1 }, // Northeast
        { q: -1, r: -1, s: 2 }, // North
        { q: -1, r: 0, s: 1 }, // Northwest
        { q: 0, r: 1, s: -1 }, // Southwest
        { q: 1, r: 1, s: -2 }, // South
      ];

      expectedNeighbors.forEach((expected) => {
        expect(neighbors).toContainEqual(expected);
      });
    });

    test('creates cells for hex ring', () => {
      const ringCells = grid.createBasicHexRing(2);
      expect(ringCells).toHaveLength(7); // 1 center + 6 neighbors
      expect(grid.size()).toBe(7);

      // Check center cell
      const centerCell = grid.getCell(0, 0);
      expect(centerCell).not.toBeNull();
      expect(centerCell!.elevation).toBe(2);

      // Check all neighbors exist
      const neighbors = grid.getNeighborCoordinates(0, 0);
      neighbors.forEach((coord) => {
        const neighborCell = grid.getCellByCoords(coord);
        expect(neighborCell).not.toBeNull();
        expect(neighborCell!.elevation).toBe(2);
      });
    });

    test('handles custom properties in ring creation', () => {
      // Test that createBasicHexRing fails if cells already exist
      grid.addCell({ q: 0, r: 0, customProps: { type: 'existing' } });

      expect(() => {
        grid.createBasicHexRing(1);
      }).toThrow('Cell already exists at coordinates q=0, r=0, s=0');
    });
  });

  describe('Utility Methods', () => {
    test('generates unique cell IDs', () => {
      const cell1 = grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });
      const cell2 = grid.addCell({
        q: 1,
        r: 0,
        customProps: { type: 'forest' },
      });
      const cell3 = grid.addCell({
        q: 0,
        r: 1,
        customProps: { type: 'mountain' },
      });

      expect(cell1.id).not.toBe(cell2.id);
      expect(cell1.id).not.toBe(cell3.id);
      expect(cell2.id).not.toBe(cell3.id);

      // Test ID format
      expect(cell1.id).toBe('0,0,0');
      expect(cell2.id).toBe('1,0,-1');
      expect(cell3.id).toBe('0,1,-1');
    });

    test('handles coordinate string conversion', () => {
      const cell = grid.addCell({
        q: 2,
        r: -1,
        customProps: { type: 'grass' },
      });
      expect(cell.id).toBe('2,-1,-1');

      const retrievedById = grid.getCellById('2,-1,-1');
      expect(retrievedById).not.toBeNull();
      expect(retrievedById!.q).toBe(2);
      expect(retrievedById!.r).toBe(-1);
      expect(retrievedById!.s).toBe(-1);
    });

    test('clears grid correctly', () => {
      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
      grid.addCell({ q: 1, r: 0, customProps: { type: 'forest' } });
      expect(grid.size()).toBe(2);

      grid.clear();
      expect(grid.size()).toBe(0);
      expect(grid.isEmpty()).toBe(true);
      expect(grid.getAllCells()).toEqual([]);
    });
  });

  describe('Edge Cases & Future-Proofing', () => {
    test('handles large coordinate values', () => {
      const largeQ = 1000000;
      const largeR = -500000;
      const expectedS = -(largeQ + largeR);

      const cell = grid.addCell({
        q: largeQ,
        r: largeR,
        customProps: { type: 'grass' },
      });

      expect(cell.q).toBe(largeQ);
      expect(cell.r).toBe(largeR);
      expect(cell.s).toBe(expectedS);

      const retrieved = grid.getCell(largeQ, largeR);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(`${largeQ},${largeR},${expectedS}`);
    });

    test('maintains grid state integrity after multiple operations', () => {
      // Add cells
      grid.addCell({
        q: 0,
        r: 0,
        elevation: 1,
        customProps: { type: 'grass' },
      });
      grid.addCell({
        q: 1,
        r: 0,
        elevation: 2,
        customProps: { type: 'water' },
      });
      grid.addCell({
        q: 0,
        r: 1,
        elevation: 3,
        customProps: { type: 'mountain' },
      });

      expect(grid.size()).toBe(3);

      // Update a cell
      const updated = grid.updateCell(0, 0, {
        elevation: 5,
        customProps: { type: 'lava' },
      });
      expect(updated).not.toBeNull();
      expect(grid.size()).toBe(3); // Size should remain the same

      // Remove a cell
      const removed = grid.removeCell(1, 0);
      expect(removed).toBe(true);
      expect(grid.size()).toBe(2);

      // Verify remaining cells are intact
      const grassCell = grid.getCell(0, 0);
      expect(grassCell!.elevation).toBe(5);
      expect(grassCell!.customProps.type).toBe('lava');

      const mountainCell = grid.getCell(0, 1);
      expect(mountainCell!.elevation).toBe(3);
      expect(mountainCell!.customProps.type).toBe('mountain');

      const waterCell = grid.getCell(1, 0);
      expect(waterCell).toBeNull();
    });

    test('handles memory management correctly', () => {
      // Add many cells
      for (let q = -10; q <= 10; q++) {
        for (let r = -10; r <= 10; r++) {
          if (Math.abs(q + r) <= 10) {
            // Stay within reasonable bounds
            grid.addCell({
              q,
              r,
              customProps: { type: 'terrain', discovered: true },
            });
          }
        }
      }

      const initialSize = grid.size();
      expect(initialSize).toBeGreaterThan(0);

      // Remove all cells
      grid.clear();
      expect(grid.size()).toBe(0);
      expect(grid.isEmpty()).toBe(true);

      // Add cells again to ensure clean state
      grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'terrain', discovered: true },
      });
      expect(grid.size()).toBe(1);
    });

    test('supports custom property types', () => {
      interface ComplexProps extends Record<string, unknown> {
        terrain: string;
        resources?: string[];
        owner?: string;
        metadata?: {
          discovered: boolean;
          lastVisited?: Date;
        };
        nestedData?: {
          terrain: {
            type: string;
            subtype?: string;
          };
        };
      }

      const complexGrid = new HexGrid<ComplexProps>();
      const cell = complexGrid.addCell({
        q: 0,
        r: 0,
        customProps: {
          terrain: 'forest',
          owner: 'player1',
          resources: ['gold', 'iron'],
          metadata: {
            discovered: true,
            lastVisited: new Date('2023-01-01'),
          },
          nestedData: {
            terrain: {
              type: 'forest',
              subtype: 'deciduous',
            },
          },
        },
      });

      expect(cell.customProps.owner).toBe('player1');
      expect(cell.customProps.resources).toEqual(['gold', 'iron']);
      expect(cell.customProps.metadata?.discovered).toBe(true);
      expect(cell.customProps.nestedData?.terrain.type).toBe('forest');
    });
  });

  describe('Performance', () => {
    test('handles large grids efficiently', () => {
      const startTime = performance.now();

      // Add 1000 cells
      for (let i = 0; i < 1000; i++) {
        const q = Math.floor(i / 32) - 15;
        const r = (i % 32) - 15;
        if (Math.abs(q + r) <= 20) {
          // Keep within reasonable coordinate bounds
          grid.addCell({
            q,
            r,
            customProps: { type: 'terrain', discovered: i % 2 === 0 },
          });
        }
      }

      const addTime = performance.now() - startTime;
      expect(addTime).toBeLessThan(1000); // Should complete within 1 second
      expect(grid.size()).toBeGreaterThan(500); // Should have added a significant number
    });

    test('cell lookup is efficient', () => {
      // Add some cells first
      const cellCoords: Array<{ q: number; r: number }> = [];
      for (let i = 0; i < 100; i++) {
        const q = i % 10;
        const r = Math.floor(i / 10);
        cellCoords.push({ q, r });
        grid.addCell({
          q,
          r,
          customProps: { type: 'terrain', discovered: true },
        });
      }

      const startTime = performance.now();

      // Perform 1000 lookups
      for (let i = 0; i < 1000; i++) {
        const coord = cellCoords[i % cellCoords.length];
        const cell = grid.getCell(coord.q, coord.r);
        expect(cell).not.toBeNull();
      }

      const lookupTime = performance.now() - startTime;
      expect(lookupTime).toBeLessThan(200); // Should complete within 200ms
    });
  });

  describe('Additional Coverage Tests', () => {
    test('addCells method works correctly', () => {
      const definitions = [
        { q: 0, r: 0, customProps: { type: 'grass', discovered: true } },
        {
          q: 1,
          r: 0,
          customProps: { type: 'mountain', discovered: false },
        },
        { q: 0, r: 1, customProps: { type: 'water', discovered: true } },
      ];

      const cells = grid.addCells(definitions);
      expect(cells).toHaveLength(3);
      expect(grid.size()).toBe(3);

      cells.forEach((cell, index) => {
        expect(cell.q).toBe(definitions[index].q);
        expect(cell.r).toBe(definitions[index].r);
      });
    });

    test('getCellByCoords and removeCellByCoords work correctly', () => {
      const coords = { q: 2, r: -1, s: -1 };
      grid.addCell({
        q: coords.q,
        r: coords.r,
        customProps: { type: 'grass', discovered: true },
      });

      const retrieved = grid.getCellByCoords(coords);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.q).toBe(coords.q);

      const removed = grid.removeCellByCoords(coords);
      expect(removed).toBe(true);
      expect(grid.getCellByCoords(coords)).toBeNull();
    });

    test('hasCellAtCoords works correctly', () => {
      const coords = { q: 1, r: 1, s: -2 };
      expect(grid.hasCellAtCoords(coords)).toBe(false);

      grid.addCell({
        q: coords.q,
        r: coords.r,
        customProps: { type: 'terrain', discovered: false },
      });
      expect(grid.hasCellAtCoords(coords)).toBe(true);
    });

    test('getAllCellIds works correctly', () => {
      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
      grid.addCell({ q: 1, r: 0, customProps: { type: 'mountain' } });

      const ids = grid.getAllCellIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('0,0,0');
      expect(ids).toContain('1,0,-1');
    });

    test('getBounds works correctly', () => {
      expect(grid.getBounds()).toBeNull(); // Empty grid

      grid.addCell({
        q: -5,
        r: 3,
        customProps: { type: 'terrain', biome: 'forest' },
      });
      grid.addCell({
        q: 2,
        r: -4,
        customProps: { type: 'terrain', biome: 'desert' },
      });
      grid.addCell({
        q: 1,
        r: 1,
        customProps: { type: 'terrain', biome: 'swamp' },
      });

      const bounds = grid.getBounds();
      expect(bounds).not.toBeNull();
      expect(bounds!.minQ).toBe(-5);
      expect(bounds!.maxQ).toBe(2);
      expect(bounds!.minR).toBe(-4);
      expect(bounds!.maxR).toBe(3);
      expect(bounds!.minS).toBe(-2);
      expect(bounds!.maxS).toBe(2);
    });

    test('getNeighborCoordinatesFromCoords works correctly', () => {
      const coords = { q: 1, r: 1, s: -2 };
      const neighbors = grid.getNeighborCoordinatesFromCoords(coords);
      expect(neighbors).toHaveLength(6);

      const expectedNeighbors = [
        { q: 2, r: 1, s: -3 }, // Southeast
        { q: 1, r: 0, s: -1 }, // Northeast
        { q: 0, r: 0, s: -0 }, // North (note: -0 is how JS represents it)
        { q: 0, r: 1, s: -1 }, // Northwest
        { q: 1, r: 2, s: -3 }, // Southwest
        { q: 2, r: 2, s: -4 }, // South
      ];

      expectedNeighbors.forEach((expected) => {
        expect(neighbors).toContainEqual(expected);
      });
    });
  });

  describe('getReachableHexes', () => {
    test('should return only the start cell for range 0', () => {
      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });

      const reachable = grid.getReachableHexes({ q: 0, r: 0, s: 0 }, 0);

      expect(reachable).toHaveLength(1);
      expect(reachable[0]).toEqual({ q: 0, r: 0, s: 0 });
    });

    test('should return the center cell and its 6 neighbors for range 1', () => {
      // Create a hex ring with center and neighbors
      grid.createBasicHexRing(1);

      const reachable = grid.getReachableHexes({ q: 0, r: 0, s: 0 }, 1);

      expect(reachable).toHaveLength(7);
      expect(reachable).toContainEqual({ q: 0, r: 0, s: 0 });

      // Check that all 6 neighbors are included
      const neighbors = grid.getNeighborCoordinates(0, 0);
      neighbors.forEach((neighbor) => {
        expect(reachable).toContainEqual(neighbor);
      });
    });

    test('should return 19 cells for range 2', () => {
      // Create a comprehensive hex grid with all cells within a larger area
      // This ensures complete connectivity for BFS pathfinding
      for (let q = -4; q <= 4; q++) {
        for (let r = -4; r <= 4; r++) {
          const s = -q - r;
          // Create a large connected hex grid
          if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= 4) {
            grid.addCell({ q, r, customProps: { type: 'terrain' } });
          }
        }
      }

      const reachable = grid.getReachableHexes({ q: 0, r: 0, s: 0 }, 2);

      // A complete hex grid at range 2 should have 1 + 6 + 12 = 19 cells
      expect(reachable).toHaveLength(19);
      expect(reachable).toContainEqual({ q: 0, r: 0, s: 0 });
    });

    test('should not include impassable cells in the results when respectImpassable is true', () => {
      // Create a grid with some impassable cells
      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
      grid.addCell({
        q: 1,
        r: 0,
        isImpassable: true,
        customProps: { type: 'mountain' },
      });
      grid.addCell({ q: 0, r: 1, customProps: { type: 'grass' } });
      grid.addCell({ q: -1, r: 0, customProps: { type: 'grass' } });

      const reachable = grid.getReachableHexes({ q: 0, r: 0, s: 0 }, 1, {
        respectImpassable: true,
      });

      expect(reachable).toHaveLength(3);
      expect(reachable).toContainEqual({ q: 0, r: 0, s: 0 });
      expect(reachable).toContainEqual({ q: 0, r: 1, s: -1 });
      expect(reachable).toContainEqual({ q: -1, r: 0, s: 1 });
      expect(reachable).not.toContainEqual({ q: 1, r: 0, s: -1 });
    });

    test('should include impassable cells in the results when respectImpassable is false', () => {
      // Create a grid with some impassable cells
      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
      grid.addCell({
        q: 1,
        r: 0,
        isImpassable: true,
        customProps: { type: 'mountain' },
      });
      grid.addCell({ q: 0, r: 1, customProps: { type: 'grass' } });
      grid.addCell({ q: -1, r: 0, customProps: { type: 'grass' } });

      const reachable = grid.getReachableHexes({ q: 0, r: 0, s: 0 }, 1, {
        respectImpassable: false,
      });

      expect(reachable).toHaveLength(4);
      expect(reachable).toContainEqual({ q: 0, r: 0, s: 0 });
      expect(reachable).toContainEqual({ q: 1, r: 0, s: -1 });
      expect(reachable).toContainEqual({ q: 0, r: 1, s: -1 });
      expect(reachable).toContainEqual({ q: -1, r: 0, s: 1 });
    });

    test('should return an empty array if the start coordinate does not exist on the grid', () => {
      // Create a grid with some cells but not at the start coordinate
      grid.addCell({ q: 1, r: 0, customProps: { type: 'grass' } });
      grid.addCell({ q: 0, r: 1, customProps: { type: 'grass' } });

      const reachable = grid.getReachableHexes({ q: 0, r: 0, s: 0 }, 1);

      expect(reachable).toHaveLength(0);
    });

    test('should handle pathfinding correctly from an edge or corner of the grid', () => {
      // Create a small grid with only a few cells
      grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
      grid.addCell({ q: 1, r: 0, customProps: { type: 'grass' } });
      grid.addCell({ q: 0, r: 1, customProps: { type: 'grass' } });
      // Note: Not adding the full ring of neighbors

      const reachable = grid.getReachableHexes({ q: 0, r: 0, s: 0 }, 1);

      expect(reachable).toHaveLength(3);
      expect(reachable).toContainEqual({ q: 0, r: 0, s: 0 });
      expect(reachable).toContainEqual({ q: 1, r: 0, s: -1 });
      expect(reachable).toContainEqual({ q: 0, r: 1, s: -1 });
    });
  });

  describe('Boundary Detection', () => {
    test('should return all six boundary faces for a single cell', () => {
      // Given: A grid with a single cell at (0, 0)
      const cell = grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });

      // When: Finding boundary faces for that single cell
      const boundaryMap = grid.findBoundaryFaces([cell]);

      // Then: All six directions should be boundary faces
      expect(boundaryMap.size).toBe(1);
      expect(boundaryMap.has(cell.id)).toBe(true);

      const boundaryDirections = boundaryMap.get(cell.id);
      expect(boundaryDirections).toBeDefined();
      expect(boundaryDirections!.size).toBe(6);
      // Verify all directions are present
      expect(boundaryDirections!.has(Direction.North)).toBe(true);
      expect(boundaryDirections!.has(Direction.Northeast)).toBe(true);
      expect(boundaryDirections!.has(Direction.Southeast)).toBe(true);
      expect(boundaryDirections!.has(Direction.South)).toBe(true);
      expect(boundaryDirections!.has(Direction.Southwest)).toBe(true);
      expect(boundaryDirections!.has(Direction.Northwest)).toBe(true);
    });

    test('should exclude shared edges between adjacent cells from boundary', () => {
      // Given: A grid with two adjacent cells at (0, 0) and (1, 0)
      const cell1 = grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });
      const cell2 = grid.addCell({
        q: 1,
        r: 0,
        customProps: { type: 'forest' },
      });

      // When: Finding boundary faces for both cells
      const boundaryMap = grid.findBoundaryFaces([cell1, cell2]);

      // Then: The shared edge should not appear in either cell's boundary set
      expect(boundaryMap.size).toBe(2);

      const cell1Boundaries = boundaryMap.get(cell1.id);
      const cell2Boundaries = boundaryMap.get(cell2.id);

      expect(cell1Boundaries).toBeDefined();
      expect(cell2Boundaries).toBeDefined();

      // Cell (0,0) should not have Southeast face as boundary (shared with (1,0))
      expect(cell1Boundaries!.has(Direction.Southeast)).toBe(false);
      // Cell (1,0) should not have Northwest face as boundary (shared with (0,0))
      expect(cell2Boundaries!.has(Direction.Northwest)).toBe(false);

      // Each cell should have 5 boundary faces (6 total - 1 shared)
      expect(cell1Boundaries!.size).toBe(5);
      expect(cell2Boundaries!.size).toBe(5);
    });

    test('should correctly identify boundary for triangle formation', () => {
      // Given: Three cells forming a triangle: (0,0), (1,0), (0,1)
      const cell1 = grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });
      const cell2 = grid.addCell({
        q: 1,
        r: 0,
        customProps: { type: 'forest' },
      });
      const cell3 = grid.addCell({
        q: 0,
        r: 1,
        customProps: { type: 'mountain' },
      });

      // When: Finding boundary faces
      const boundaryMap = grid.findBoundaryFaces([cell1, cell2, cell3]);

      // Then: Only external faces should be marked as boundary
      expect(boundaryMap.size).toBe(3);

      // Cell1 has 4 boundary faces (shares 2 edges), Cell2 and Cell3 have 5 each (share 1 edge each)
      const cell1Boundaries = boundaryMap.get(cell1.id);
      const cell2Boundaries = boundaryMap.get(cell2.id);
      const cell3Boundaries = boundaryMap.get(cell3.id);

      expect(cell1Boundaries!.size).toBe(4);
      expect(cell2Boundaries!.size).toBe(5);
      expect(cell3Boundaries!.size).toBe(5);

      // Verify specific shared edges are not boundaries
      expect(cell1Boundaries!.has(Direction.Southeast)).toBe(false); // shared with cell2
      expect(cell1Boundaries!.has(Direction.Southwest)).toBe(false); // shared with cell3
      expect(cell2Boundaries!.has(Direction.Northwest)).toBe(false); // shared with cell1
    });

    test('should handle non-contiguous cell selections correctly', () => {
      // Given: Two separate groups: cells (0,0), (1,0) and cells (3,3), (4,3)
      const group1Cell1 = grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });
      const group1Cell2 = grid.addCell({
        q: 1,
        r: 0,
        customProps: { type: 'forest' },
      });
      const group2Cell1 = grid.addCell({
        q: 3,
        r: 3,
        customProps: { type: 'desert' },
      });
      const group2Cell2 = grid.addCell({
        q: 4,
        r: 3,
        customProps: { type: 'water' },
      });

      // When: Finding boundary faces for all four cells
      const boundaryMap = grid.findBoundaryFaces([
        group1Cell1,
        group1Cell2,
        group2Cell1,
        group2Cell2,
      ]);

      // Then: Each group should have its own complete boundary
      expect(boundaryMap.size).toBe(4);

      // Each pair should have 5 boundary faces each (like two adjacent cells)
      expect(boundaryMap.get(group1Cell1.id)!.size).toBe(5);
      expect(boundaryMap.get(group1Cell2.id)!.size).toBe(5);
      expect(boundaryMap.get(group2Cell1.id)!.size).toBe(5);
      expect(boundaryMap.get(group2Cell2.id)!.size).toBe(5);
    });

    test('should return empty map for empty cell array', () => {
      // When: Finding boundary faces for empty array
      const boundaryMap = grid.findBoundaryFaces([]);

      // Then: Should return empty BoundaryMap
      expect(boundaryMap.size).toBe(0);
    });

    test('should treat grid edges as boundaries for edge cells', () => {
      // Given: A single cell where some neighbors don't exist on the grid
      const edgeCell = grid.addCell({
        q: 0,
        r: 0,
        customProps: { type: 'grass' },
      });

      // When: Finding boundary faces
      const boundaryMap = grid.findBoundaryFaces([edgeCell]);

      // Then: All faces should be boundary faces since no neighbors exist
      expect(boundaryMap.size).toBe(1);
      const boundaries = boundaryMap.get(edgeCell.id);
      expect(boundaries!.size).toBe(6); // All faces are boundaries when isolated
    });

    test('should handle complex connected shapes correctly', () => {
      // Given: An L-shaped selection of 5 cells
      const cells = [
        grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } }), // Corner
        grid.addCell({ q: 1, r: 0, customProps: { type: 'forest' } }), // Right arm
        grid.addCell({ q: 2, r: 0, customProps: { type: 'mountain' } }), // Right arm end
        grid.addCell({ q: 0, r: 1, customProps: { type: 'desert' } }), // Down arm
        grid.addCell({ q: 0, r: 2, customProps: { type: 'water' } }), // Down arm end
      ];

      // When: Finding boundary faces
      const boundaryMap = grid.findBoundaryFaces(cells);

      // Then: Only the external perimeter should be marked as boundary
      expect(boundaryMap.size).toBe(5);

      // Corner cell should have 4 boundaries (connected to 2 neighbors)
      expect(boundaryMap.get(cells[0].id)!.size).toBe(4);

      // End cells should have 5 boundaries (connected to 1 neighbor each)
      expect(boundaryMap.get(cells[2].id)!.size).toBe(5); // Right end
      expect(boundaryMap.get(cells[4].id)!.size).toBe(5); // Down end

      // Middle cells should have 4 boundaries (connected to 2 neighbors each)
      expect(boundaryMap.get(cells[1].id)!.size).toBe(4); // Right middle
      expect(boundaryMap.get(cells[3].id)!.size).toBe(4); // Down middle
    });

    test('should return only grid perimeter when all cells are selected', () => {
      // Given: Create a small complete grid
      const allCells = grid.createBasicHexRing(1); // Creates center + 6 neighbors

      // When: Finding boundary faces for all cells
      const boundaryMap = grid.findBoundaryFaces(allCells);

      // Then: Only faces on the absolute edge of the grid should be boundaries
      expect(boundaryMap.size).toBe(7);

      // Center cell should have no boundary faces (surrounded by all neighbors)
      const centerCell = grid.getCell(0, 0);
      expect(centerCell).not.toBeNull();
      const centerBoundaries = boundaryMap.get(centerCell!.id);
      expect(centerBoundaries!.size).toBe(0);

      // Each edge cell should have 3 boundary faces (3 connected + 3 external)
      const neighbors = grid.getNeighborCoordinates(0, 0);
      neighbors.forEach((coord) => {
        const neighbor = grid.getCellByCoords(coord);
        expect(neighbor).not.toBeNull();
        const neighborBoundaries = boundaryMap.get(neighbor!.id);
        expect(neighborBoundaries!.size).toBe(3);
      });
    });
  });
});
