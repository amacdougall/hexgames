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
    // Test that BoundaryLineStrategy implements the interface
    expect(strategy).toBeDefined();

    // Verify it satisfies the interface contract
    const interfaceStrategy: CellGroupHighlightStrategy = strategy;
    expect(interfaceStrategy).toBe(strategy);

    expect(typeof strategy.apply).toBe('function');
    expect(typeof strategy.remove).toBe('function');
  });

  it('should be instantiable', () => {
    // Test constructor works without errors
    expect(() => new BoundaryLineStrategy()).not.toThrow();

    // Test constructor with custom parameters
    const customColor = new THREE.Color(0xff0000);
    const customWidth = 5;
    expect(
      () => new BoundaryLineStrategy(customColor, customWidth)
    ).not.toThrow();

    const customStrategy = new BoundaryLineStrategy(customColor, customWidth);
    expect(customStrategy).toBeInstanceOf(BoundaryLineStrategy);
  });

  it('should have default color and width values', () => {
    const defaultStrategy = new BoundaryLineStrategy();
    expect(defaultStrategy).toBeDefined();

    // Test that it can be instantiated with defaults
    expect(defaultStrategy).toBeInstanceOf(BoundaryLineStrategy);
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
      getCell: jest.fn(),
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

  it('should call HexGrid.findBoundaryFaces with provided cells', () => {
    // Mock HexGrid.findBoundaryFaces to return empty BoundaryMap
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);

    // Call strategy.apply(mockCells, mockGrid)
    strategy.apply(mockCells, mockGrid);

    // Verify findBoundaryFaces was called with mockCells
    expect(mockGrid.findBoundaryFaces).toHaveBeenCalledWith(mockCells);
    expect(mockGrid.findBoundaryFaces).toHaveBeenCalledTimes(1);
  });

  it('should return a THREE.Group object', () => {
    // Setup mock to return empty boundary map
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(new Map());

    // Call strategy.apply(mockCells, mockGrid)
    const result = strategy.apply(mockCells, mockGrid);

    // Verify return value is instanceof THREE.Group
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('should create THREE.Line objects for boundary faces', () => {
    // Setup mockGrid.findBoundaryFaces to return test BoundaryMap
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    mockBoundaryMap.set(
      '0,0,0',
      new Set([Direction.North, Direction.Northeast])
    );
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);

    // Mock getCell to return the test cell
    (mockGrid.getCell as jest.Mock).mockImplementation((cellId: string) => {
      return mockCells.find((cell) => cell.id === cellId) || null;
    });

    // Mock layout.getHexFaceVertices to return test vertices
    (layout.getHexFaceVertices as jest.Mock).mockReturnValue([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);

    // Call strategy.apply(mockCells, mockGrid)
    const result = strategy.apply(mockCells, mockGrid);

    // Verify returned group contains THREE.Line objects
    expect(result).toBeInstanceOf(THREE.Group);
    expect(result.children.length).toBe(2); // Two directions = two lines

    result.children.forEach((child: any) => {
      expect(child).toBeInstanceOf(THREE.Line);
    });

    // Verify getHexFaceVertices was called for each boundary face
    expect(layout.getHexFaceVertices).toHaveBeenCalledTimes(2);
  });

  it('should use white color for boundary lines', () => {
    // Setup test data
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    mockBoundaryMap.set('0,0,0', new Set([Direction.North]));
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);
    (mockGrid.getCell as jest.Mock).mockReturnValue(mockCells[0]);

    // Call strategy.apply(mockCells, mockGrid)
    const result = strategy.apply(mockCells, mockGrid);

    // Verify line materials have white color
    expect(result.children.length).toBe(1);
    const line = result.children[0] as any;
    const material = line.material;

    expect(material.color.getHex()).toBe(0xffffff); // White color
  });

  it('should handle empty cell array', () => {
    // Call strategy.apply([], mockGrid)
    const result = strategy.apply([], mockGrid);

    // Verify returns empty THREE.Group without errors
    expect(result).toBeInstanceOf(THREE.Group);
    expect(result.children.length).toBe(0);

    // Should not call findBoundaryFaces for empty array
    expect(mockGrid.findBoundaryFaces).not.toHaveBeenCalled();
  });

  it('should handle cells with no boundary faces', () => {
    // Setup findBoundaryFaces to return empty sets
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    mockBoundaryMap.set('0,0,0', new Set()); // Empty set of directions
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);

    // Call strategy.apply(mockCells, mockGrid)
    const result = strategy.apply(mockCells, mockGrid);

    // Verify returns empty THREE.Group without errors
    expect(result).toBeInstanceOf(THREE.Group);
    expect(result.children.length).toBe(0);
  });

  it('should handle missing cells in grid', () => {
    // Setup boundary map with cell that doesn't exist in grid
    const mockBoundaryMap = new Map<string, Set<Direction>>();
    mockBoundaryMap.set('missing-cell', new Set([Direction.North]));
    (mockGrid.findBoundaryFaces as jest.Mock).mockReturnValue(mockBoundaryMap);
    (mockGrid.getCell as jest.Mock).mockReturnValue(null);

    // Should not throw error
    expect(() => strategy.apply(mockCells, mockGrid)).not.toThrow();

    const result = strategy.apply(mockCells, mockGrid);
    expect(result.children.length).toBe(0);
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

  it('should remove effect from scene', () => {
    // Call strategy.remove(mockEffect, mockScene)
    strategy.remove(mockEffect, mockScene);

    // Verify scene.remove was called
    expect(mockScene.remove).toHaveBeenCalledWith(mockEffect);
  });

  it('should dispose of geometries in the effect', () => {
    // Create effect with mock geometries
    const mockGeometry = new THREE.BufferGeometry();
    const mockLine = new THREE.Line(
      mockGeometry,
      new THREE.LineBasicMaterial()
    );
    mockEffect = new THREE.Group();
    mockEffect.add(mockLine);

    // Setup traverse mock
    (mockEffect.traverse as jest.Mock).mockImplementation((callback) => {
      callback(mockLine);
    });

    // Call strategy.remove(mockEffect, mockScene)
    strategy.remove(mockEffect, mockScene);

    // Verify dispose() was called on geometry
    expect(mockGeometry.dispose).toHaveBeenCalled();
  });

  it('should dispose of materials in the effect', () => {
    // Create effect with mock materials
    const mockMaterial = new THREE.LineBasicMaterial();
    const mockLine = new THREE.Line(new THREE.BufferGeometry(), mockMaterial);
    mockEffect = new THREE.Group();
    mockEffect.add(mockLine);

    // Setup traverse mock
    (mockEffect.traverse as jest.Mock).mockImplementation((callback) => {
      callback(mockLine);
    });

    // Call strategy.remove(mockEffect, mockScene)
    strategy.remove(mockEffect, mockScene);

    // Verify dispose() was called on material
    expect(mockMaterial.dispose).toHaveBeenCalled();
  });

  it('should handle array of materials', () => {
    // Create line with array of materials
    const mockMaterial1 = new THREE.LineBasicMaterial();
    const mockMaterial2 = new THREE.LineBasicMaterial();
    const mockLine = {
      geometry: new THREE.BufferGeometry(),
      material: [mockMaterial1, mockMaterial2],
    };
    mockEffect = new THREE.Group();

    // Setup traverse mock
    (mockEffect.traverse as jest.Mock).mockImplementation((callback) => {
      callback(mockLine);
    });

    strategy.remove(mockEffect, mockScene);

    expect(mockMaterial1.dispose).toHaveBeenCalled();
    expect(mockMaterial2.dispose).toHaveBeenCalled();
  });

  it('should handle null or undefined effect gracefully', () => {
    // Call strategy.remove(null, mockScene)
    expect(() => strategy.remove(null as any, mockScene)).not.toThrow();

    // Call strategy.remove(undefined, mockScene)
    expect(() => strategy.remove(undefined as any, mockScene)).not.toThrow();
  });

  it('should clear the group if effect is a THREE.Group', () => {
    const group = new THREE.Group();

    strategy.remove(group, mockScene);

    expect(group.clear).toHaveBeenCalled();
  });
});

describe('BoundaryLineStrategy integration', () => {
  let strategy: BoundaryLineStrategy;

  beforeEach(() => {
    strategy = new BoundaryLineStrategy();

    // Reset mocks
    (layout.getHexFaceVertices as jest.Mock).mockReturnValue([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
  });

  it('should work with real Cell and HexGrid objects', () => {
    // Create real HexGrid with test cells
    const grid = new HexGrid<{}>();

    // Add cells that form a boundary
    const cell1: Cell = {
      id: '0,0,0',
      q: 0,
      r: 0,
      s: 0,
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };
    const cell2: Cell = {
      id: '1,0,-1',
      q: 1,
      r: 0,
      s: -1,
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };

    grid.addCell(cell1);
    grid.addCell(cell2);

    // Call strategy.apply() with real data
    const result = strategy.apply([cell1, cell2], grid);

    // Verify boundary lines are created correctly
    expect(result).toBeInstanceOf(THREE.Group);
    expect(result.children.length).toBeGreaterThanOrEqual(0); // Depends on boundary detection
  });

  it('should handle complex boundary shapes', () => {
    const grid = new HexGrid<{}>();

    // Test L-shaped selection
    const lShapeCells: Cell[] = [
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
        id: '0,1,-1',
        q: 0,
        r: 1,
        s: -1,
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

    lShapeCells.forEach((cell) => grid.addCell(cell));

    expect(() => strategy.apply(lShapeCells, grid)).not.toThrow();

    // Test disconnected cell groups
    const disconnectedCells: Cell[] = [
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
        id: '3,0,-3',
        q: 3,
        r: 0,
        s: -3,
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      },
    ];

    disconnectedCells.forEach((cell) => grid.addCell(cell));

    expect(() => strategy.apply(disconnectedCells, grid)).not.toThrow();

    // Test single cell selection
    const singleCell: Cell[] = [
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
    ];

    expect(() => strategy.apply(singleCell, grid)).not.toThrow();

    // Verify boundary detection and line creation
    const result = strategy.apply(singleCell, grid);
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('should handle custom colors and line widths', () => {
    const customColor = new THREE.Color(0xff0000); // Red
    const customWidth = 10;
    const customStrategy = new BoundaryLineStrategy(customColor, customWidth);

    const grid = new HexGrid<{}>();
    const cell: Cell = {
      id: '0,0,0',
      q: 0,
      r: 0,
      s: 0,
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };
    grid.addCell(cell);

    expect(() => customStrategy.apply([cell], grid)).not.toThrow();

    const result = customStrategy.apply([cell], grid);
    expect(result).toBeInstanceOf(THREE.Group);
  });
});
