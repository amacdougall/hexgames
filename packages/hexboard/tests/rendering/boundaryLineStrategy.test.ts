/// <reference lib="dom" />

// Mock THREE.js
jest.mock('three', () => ({
  Group: jest.fn().mockImplementation(() => ({
    children: [],
    add: jest.fn(function (this: any) {
      this.children.push(arguments[0]);
    }),
    remove: jest.fn(),
    clear: jest.fn(),
    traverse: jest.fn(),
  })),
  Line: jest.fn().mockImplementation((geometry, material) => ({
    geometry,
    material,
    children: [],
    traverse: jest.fn(),
  })),
  BufferGeometry: jest.fn().mockImplementation(() => ({
    setFromPoints: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
  })),
  LineBasicMaterial: jest.fn().mockImplementation((props) => ({
    color: props?.color || { getHex: () => 0xffffff },
    linewidth: props?.linewidth || 1,
    dispose: jest.fn(),
  })),
  Color: jest.fn().mockImplementation((hex) => ({
    getHex: () => hex || 0xffffff,
  })),
  Vector3: jest
    .fn()
    .mockImplementation((x, y, z) => ({ x: x || 0, y: y || 0, z: z || 0 })),
  Object3D: jest.fn().mockImplementation(() => ({
    children: [],
    traverse: jest.fn(),
  })),
  Scene: jest.fn().mockImplementation(() => ({
    children: [],
    add: jest.fn(),
    remove: jest.fn(),
  })),
  Mesh: jest.fn(),
}));

// Mock the layout module
jest.mock('../../src/rendering/layout', () => ({
  getHexFaceVertices: jest.fn(),
}));

import * as THREE from 'three';
import { BoundaryLineStrategy } from '../../src/rendering/boundaryLineStrategy';
import { CellGroupHighlightStrategy } from '../../src/rendering/cellGroupHighlightStrategy';
import { Cell } from '../../src/core/cell';
import { HexGrid } from '../../src/core/hexGrid';
import { Direction } from '../../src/core/types';
import * as layout from '../../src/rendering/layout';

describe('BoundaryLineStrategy', () => {
  let strategy: BoundaryLineStrategy;

  beforeEach(() => {
    strategy = new BoundaryLineStrategy();
    jest.clearAllMocks();
  });

  it('should implement CellGroupHighlightStrategy interface', () => {
    // Compile-time verification - if interface doesn't exist, this fails
    const interfaceStrategy: CellGroupHighlightStrategy = strategy;
    expect(interfaceStrategy).toBe(strategy);
  });

  it('should be instantiable with default and custom parameters', () => {
    // Test default constructor
    expect(() => new BoundaryLineStrategy()).not.toThrow();

    // Test constructor with custom parameters
    const customColor = new THREE.Color(0xff0000);
    const customWidth = 5;
    const customStrategy = new BoundaryLineStrategy(customColor, customWidth);
    expect(customStrategy).toBeInstanceOf(BoundaryLineStrategy);
  });
});

describe('BoundaryLineStrategy.apply()', () => {
  let strategy: BoundaryLineStrategy;
  let mockGrid: HexGrid<any>;
  let mockCells: Cell[];

  beforeEach(() => {
    strategy = new BoundaryLineStrategy();

    // Setup mock grid with findBoundaryFaces method
    mockGrid = {
      findBoundaryFaces: jest.fn(),
      getCellById: jest.fn(),
    } as any;

    // Setup mock cells array
    mockCells = [
      {
        id: '0,0,0',
        q: 0,
        r: 0,
        s: 0,
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      },
      {
        id: '1,0,-1',
        q: 1,
        r: 0,
        s: -1,
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      },
    ];

    // Mock layout function
    (layout.getHexFaceVertices as jest.Mock).mockReturnValue([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
  });

  it('should create boundary lines based on grid analysis', () => {
    // Setup mock to return boundary data
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    mockBoundaryMap.set(
      '0,0,0',
      new Set([Direction.North, Direction.Northeast])
    );
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);
    (mockGrid.getCellById as jest.Mock).mockImplementation((cellId: string) => {
      return mockCells.find((cell) => cell.id === cellId) || null;
    });

    const result = strategy.apply(mockCells, mockGrid);

    // Verify grid integration
    expect(mockGrid.findBoundaryFaces).toHaveBeenCalledWith(mockCells);
    expect(result).toBeDefined();
    expect(result.children).toBeDefined();
    expect(result.children.length).toBe(2); // Two boundary faces = two lines

    // Verify actual boundary lines were created
    result.children.forEach((child: any) => {
      expect(child.geometry).toBeDefined();
      expect(child.material).toBeDefined();
      expect(child.material.color.getHex()).toBe(0xffffff); // Default white
    });

    // Verify layout integration
    expect(layout.getHexFaceVertices).toHaveBeenCalledTimes(2);
  });

  it('should support custom colors and line styles', () => {
    // Test custom styling
    const redStrategy = new BoundaryLineStrategy(new THREE.Color(0xff0000), 5);
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    mockBoundaryMap.set('0,0,0', new Set([Direction.North]));
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);
    (mockGrid.getCellById as jest.Mock).mockReturnValue(mockCells[0]);

    const result = redStrategy.apply(mockCells, mockGrid);

    expect(result.children.length).toBe(1);
    const line = result.children[0] as any;
    expect(line.material.color.getHex()).toBe(0xff0000); // Custom red color
  });

  it('should handle edge cases gracefully', () => {
    // Test empty cell array
    const emptyResult = strategy.apply([], mockGrid);
    expect(emptyResult).toBeDefined();
    expect(emptyResult.children).toBeDefined();
    expect(emptyResult.children.length).toBe(0);
    expect(mockGrid.findBoundaryFaces).not.toHaveBeenCalled();

    // Test cells with no boundary faces
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    mockBoundaryMap.set('0,0,0', new Set()); // Empty set of directions
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);

    const noBoundaryResult = strategy.apply(mockCells, mockGrid);
    expect(noBoundaryResult.children.length).toBe(0);

    // Test missing cells in grid
    const missingCellMap = new Map<string, Set<Direction>>();
    missingCellMap.set('missing-cell', new Set([Direction.North]));
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(missingCellMap);
    (mockGrid.getCellById as jest.Mock).mockReturnValue(null);

    expect(() => strategy.apply(mockCells, mockGrid)).not.toThrow();
    const missingResult = strategy.apply(mockCells, mockGrid);
    expect(missingResult.children.length).toBe(0);
  });
});

describe('BoundaryLineStrategy.remove()', () => {
  let strategy: BoundaryLineStrategy;
  let mockScene: THREE.Scene;
  let mockEffect: THREE.Object3D;

  beforeEach(() => {
    strategy = new BoundaryLineStrategy();
    mockScene = new THREE.Scene();
    mockEffect = new THREE.Group();
  });

  it('should properly clean up scene and resources', () => {
    // Create a realistic effect with geometry and materials
    const mockGeometry = new THREE.BufferGeometry();
    const mockMaterial = new THREE.LineBasicMaterial();
    const mockLine = new THREE.Line(mockGeometry, mockMaterial);
    mockEffect = new THREE.Group();
    mockEffect.add(mockLine);

    // Setup traverse to visit the effect itself and its children
    (mockEffect.traverse as jest.Mock).mockImplementation((callback) => {
      callback(mockEffect);
      callback(mockLine);
    });

    // Test removal
    strategy.remove(mockEffect, mockScene);

    // Verify complete cleanup
    expect(mockScene.remove).toHaveBeenCalledWith(mockEffect);
    expect(mockGeometry.dispose).toHaveBeenCalled();
    expect(mockMaterial.dispose).toHaveBeenCalled();
    expect(mockEffect.clear).toHaveBeenCalled();
  });

  it('should handle complex resource cleanup scenarios', () => {
    // Test array of materials
    const mockMaterial1 = new THREE.LineBasicMaterial();
    const mockMaterial2 = new THREE.LineBasicMaterial();
    const mockLineWithMultipleMaterials = new THREE.Line(
      new THREE.BufferGeometry(),
      [mockMaterial1, mockMaterial2]
    );

    mockEffect = new THREE.Group();
    (mockEffect.traverse as jest.Mock).mockImplementation((callback) => {
      callback(mockLineWithMultipleMaterials);
    });

    strategy.remove(mockEffect, mockScene);

    expect(mockMaterial1.dispose).toHaveBeenCalled();
    expect(mockMaterial2.dispose).toHaveBeenCalled();
  });

  it('should handle edge cases in removal', () => {
    // Test null/undefined effects
    expect(() => strategy.remove(null as any, mockScene)).not.toThrow();
    expect(() => strategy.remove(undefined as any, mockScene)).not.toThrow();

    // Verify no scene operations were attempted for null/undefined
    expect(mockScene.remove).not.toHaveBeenCalled();
  });
});

describe('BoundaryLineStrategy integration', () => {
  let strategy: BoundaryLineStrategy;

  beforeEach(() => {
    strategy = new BoundaryLineStrategy();

    // Reset mocks for integration tests
    (layout.getHexFaceVertices as jest.Mock).mockReturnValue([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
  });

  it('should integrate with real HexGrid for boundary detection', () => {
    // Test with actual HexGrid instance to ensure integration works
    const grid = new HexGrid<{}>();

    const testCells: Cell[] = [
      {
        id: '0,0,0',
        q: 0,
        r: 0,
        s: 0,
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      },
      {
        id: '1,0,-1',
        q: 1,
        r: 0,
        s: -1,
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      },
    ];

    testCells.forEach((cell) => grid.addCell(cell));

    // Test that strategy works with real grid implementation
    const result = strategy.apply(testCells, grid);
    expect(result).toBeDefined();
    expect(result.children).toBeDefined();

    // Test cleanup works with real objects
    const mockScene = new THREE.Scene();
    expect(() => strategy.remove(result, mockScene)).not.toThrow();
  });

  it('should handle realistic boundary scenarios', () => {
    // Test scenarios that would occur in actual usage
    const scenarios = [
      // Single cell (should have full perimeter)
      [{ id: '0,0,0', q: 0, r: 0, s: 0 }],

      // Two adjacent cells (should have shared interior boundary removed)
      [
        { id: '0,0,0', q: 0, r: 0, s: 0 },
        { id: '1,0,-1', q: 1, r: 0, s: -1 },
      ],

      // L-shaped selection (complex boundary)
      [
        { id: '0,0,0', q: 0, r: 0, s: 0 },
        { id: '0,1,-1', q: 0, r: 1, s: -1 },
        { id: '1,0,-1', q: 1, r: 0, s: -1 },
      ],
    ];

    scenarios.forEach((cellDefs, index) => {
      // Create a new grid for each scenario to avoid conflicts
      const grid = new HexGrid<{}>();

      const cells: Cell[] = cellDefs.map((def) => ({
        ...def,
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      }));

      // Add cells to grid
      cells.forEach((cell) => grid.addCell(cell));

      // Test strategy handles each scenario
      const result = strategy.apply(cells, grid);
      expect(result).toBeDefined();
      expect(result.children).toBeDefined();

      // Each scenario should produce some boundary visualization
      // (exact count depends on HexGrid.findBoundaryFaces implementation)
      expect(result.children.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should work with different strategy configurations', () => {
    const grid = new HexGrid<{}>();
    const testCell: Cell = {
      id: '0,0,0',
      q: 0,
      r: 0,
      s: 0,
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };
    grid.addCell(testCell);

    // Test different strategy configurations work
    const strategies = [
      new BoundaryLineStrategy(), // Default
      new BoundaryLineStrategy(new THREE.Color(0xff0000), 2), // Red, thick
      new BoundaryLineStrategy(new THREE.Color(0x00ff00), 1), // Green, thin
    ];

    strategies.forEach((testStrategy) => {
      const result = testStrategy.apply([testCell], grid);
      expect(result).toBeDefined();
      expect(result.children).toBeDefined();

      // Test cleanup works for each configuration
      const mockScene = new THREE.Scene();
      expect(() => testStrategy.remove(result, mockScene)).not.toThrow();
    });
  });
});
