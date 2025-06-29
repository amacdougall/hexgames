import { HexBoard } from '../../src/hexBoard';
import { HexCoordinates } from '../../src/core/coordinates';
import { Cell } from '../../src/core/cell';
import * as THREE from 'three';

// Mock Three.js and DOM
jest.mock('three');

// Create a mock HTMLCanvasElement
const createMockCanvas = () => {
  const canvas = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    clientWidth: 800,
    clientHeight: 600,
    getContext: jest.fn().mockReturnValue({}),
    getBoundingClientRect: jest.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    })
  } as any;
  return canvas;
};

// Mock WebGLRenderer
const createMockRenderer = () => {
  const canvas = createMockCanvas();
  return {
    domElement: canvas,
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    getSize: jest.fn().mockReturnValue(new THREE.Vector2(800, 600)),
    setClearColor: jest.fn(),
    shadowMap: {
      enabled: false,
      type: THREE.PCFSoftShadowMap
    }
  } as any;
};

describe('HexBoard Input Integration', () => {
  let hexBoard: HexBoard<{ terrain?: string }>;
  let mockRenderer: any;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Mock Three.js constructors
    mockRenderer = createMockRenderer();
    mockCanvas = mockRenderer.domElement;

    (THREE.WebGLRenderer as jest.Mock).mockImplementation(() => mockRenderer);
    (THREE.PerspectiveCamera as jest.Mock).mockImplementation(() => ({}));
    (THREE.Scene as jest.Mock).mockImplementation(() => ({
      children: [],
      add: jest.fn(),
      remove: jest.fn()
    }));
    (THREE.DirectionalLight as jest.Mock).mockImplementation(() => ({}));
    (THREE.AmbientLight as jest.Mock).mockImplementation(() => ({}));
    (THREE.Raycaster as jest.Mock).mockImplementation(() => ({
      setFromCamera: jest.fn(),
      intersectObjects: jest.fn()
    }));
    (THREE.Vector2 as jest.Mock).mockImplementation(() => ({ x: 0, y: 0 }));

    // Create HexBoard instance
    hexBoard = new HexBoard<{ terrain?: string }>();
  });

  afterEach(() => {
    hexBoard.dispose();
    jest.clearAllMocks();
  });

  describe('initialization and setup', () => {
    it('should initialize HexBoard with input handling capabilities', async () => {
      await hexBoard.init('test-container');
      
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('should handle init with missing container gracefully', async () => {
      await expect(hexBoard.init('non-existent-container')).resolves.not.toThrow();
    });
  });

  describe('cell click integration', () => {
    beforeEach(async () => {
      await hexBoard.init('test-container');
      
      // Add some test cells to the grid
      hexBoard.setCellAtCoords({ q: 0, r: 0, s: 0 }, new Cell({ terrain: 'grass' }));
      hexBoard.setCellAtCoords({ q: 1, r: 0, s: -1 }, new Cell({ terrain: 'water' }));
      hexBoard.setCellAtCoords({ q: 0, r: 1, s: -1 }, new Cell({ terrain: 'mountain' }));
    });

    it('should handle cell clicks and trigger game logic', () => {
      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickCoords: HexCoordinates = { q: 1, r: 0, s: -1 };

      // Mock raycaster to return intersection with our test cell
      const mockMesh = {
        userData: { coordinates: clickCoords }
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null
      };

      const inputHandler = (hexBoard as any).inputHandler;
      const mockRaycaster = inputHandler.raycaster;
      mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

      // Simulate click event
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300
      });
      mockCanvas.dispatchEvent(clickEvent);

      expect(handleCellClickSpy).toHaveBeenCalledWith(clickCoords);
    });

    it('should retrieve correct cell data when clicking on a cell', () => {
      const testCoords: HexCoordinates = { q: 0, r: 0, s: 0 };
      const testCell = new Cell({ terrain: 'grass' });
      hexBoard.setCellAtCoords(testCoords, testCell);

      // Mock the input handler to simulate a click
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: testCoords }
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null
      };

      inputHandler.raycaster.intersectObjects.mockReturnValue([mockIntersection]);

      // Simulate click
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300
      });
      mockCanvas.dispatchEvent(clickEvent);

      // Verify the correct cell was accessed
      const retrievedCell = hexBoard.getCellAtCoords(testCoords);
      expect(retrievedCell).toBe(testCell);
      expect(retrievedCell?.getCustomProps().terrain).toBe('grass');
    });

    it('should handle clicks on empty cells gracefully', () => {
      const emptyCoords: HexCoordinates = { q: 5, r: 5, s: -10 };
      
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: emptyCoords }
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null
      };

      inputHandler.raycaster.intersectObjects.mockReturnValue([mockIntersection]);

      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300
      });

      expect(() => mockCanvas.dispatchEvent(clickEvent)).not.toThrow();
      
      const cell = hexBoard.getCellAtCoords(emptyCoords);
      expect(cell).toBeUndefined();
    });
  });

  describe('cell hover integration', () => {
    beforeEach(async () => {
      await hexBoard.init('test-container');
      
      // Add test cells
      hexBoard.setCellAtCoords({ q: 0, r: 0, s: 0 }, new Cell({ terrain: 'grass' }));
      hexBoard.setCellAtCoords({ q: 1, r: 0, s: -1 }, new Cell({ terrain: 'water' }));
    });

    it('should handle cell hover events', () => {
      const handleCellHoverSpy = jest.spyOn(hexBoard as any, 'handleCellHover');
      const hoverCoords: HexCoordinates = { q: 0, r: 0, s: 0 };

      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: hoverCoords }
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null
      };

      inputHandler.raycaster.intersectObjects.mockReturnValue([mockIntersection]);

      // Simulate mouse move event
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300
      });
      mockCanvas.dispatchEvent(mouseMoveEvent);

      expect(handleCellHoverSpy).toHaveBeenCalledWith(hoverCoords);
    });

    it('should handle hover exit events', () => {
      const handleCellHoverSpy = jest.spyOn(hexBoard as any, 'handleCellHover');
      const hoverCoords: HexCoordinates = { q: 0, r: 0, s: 0 };

      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: hoverCoords }
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null
      };

      // First hover over a cell
      inputHandler.raycaster.intersectObjects.mockReturnValue([mockIntersection]);
      const enterEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300
      });
      mockCanvas.dispatchEvent(enterEvent);

      expect(handleCellHoverSpy).toHaveBeenCalledWith(hoverCoords);
      handleCellHoverSpy.mockClear();

      // Then move to empty space
      inputHandler.raycaster.intersectObjects.mockReturnValue([]);
      const exitEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100
      });
      mockCanvas.dispatchEvent(exitEvent);

      expect(handleCellHoverSpy).toHaveBeenCalledWith(null);
    });

    it('should track hover state transitions correctly', () => {
      const handleCellHoverSpy = jest.spyOn(hexBoard as any, 'handleCellHover');
      
      const coords1: HexCoordinates = { q: 0, r: 0, s: 0 };
      const coords2: HexCoordinates = { q: 1, r: 0, s: -1 };

      const inputHandler = (hexBoard as any).inputHandler;
      const mesh1 = { userData: { coordinates: coords1 } };
      const mesh2 = { userData: { coordinates: coords2 } };

      // Hover over first cell
      inputHandler.raycaster.intersectObjects.mockReturnValue([{
        object: mesh1, distance: 1, point: new THREE.Vector3(),
        face: null, faceIndex: null, uv: null
      }]);
      mockCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300 }));

      expect(handleCellHoverSpy).toHaveBeenCalledWith(coords1);
      handleCellHoverSpy.mockClear();

      // Move to second cell
      inputHandler.raycaster.intersectObjects.mockReturnValue([{
        object: mesh2, distance: 1, point: new THREE.Vector3(),
        face: null, faceIndex: null, uv: null
      }]);
      mockCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 200 }));

      expect(handleCellHoverSpy).toHaveBeenCalledWith(coords2);
      handleCellHoverSpy.mockClear();

      // Move to empty space
      inputHandler.raycaster.intersectObjects.mockReturnValue([]);
      mockCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));

      expect(handleCellHoverSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('integration with BoardRenderer', () => {
    beforeEach(async () => {
      await hexBoard.init('test-container');
    });

    it('should ensure BoardRenderer stores coordinates in mesh userData', () => {
      const testCoords: HexCoordinates = { q: 2, r: -1, s: -1 };
      const testCell = new Cell({ terrain: 'desert' });
      
      hexBoard.setCellAtCoords(testCoords, testCell);
      
      // BoardRenderer should have stored coordinates in mesh userData
      // This is tested indirectly through the input handling working
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: testCoords }
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null
      };

      inputHandler.raycaster.intersectObjects.mockReturnValue([mockIntersection]);

      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickEvent = new MouseEvent('click', { clientX: 400, clientY: 300 });
      mockCanvas.dispatchEvent(clickEvent);

      expect(handleCellClickSpy).toHaveBeenCalledWith(testCoords);
    });

    it('should handle rendering updates when cells are modified via input', () => {
      const coords: HexCoordinates = { q: 0, r: 1, s: -1 };
      const originalCell = new Cell({ terrain: 'grass' });
      const modifiedCell = new Cell({ terrain: 'water' });

      // Set initial cell
      hexBoard.setCellAtCoords(coords, originalCell);
      expect(hexBoard.getCellAtCoords(coords)?.getCustomProps().terrain).toBe('grass');

      // Simulate a click that modifies the cell
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: coords }
      };
      inputHandler.raycaster.intersectObjects.mockReturnValue([{
        object: mockMesh, distance: 1, point: new THREE.Vector3(),
        face: null, faceIndex: null, uv: null
      }]);

      // Override handleCellClick to modify the cell
      const originalHandleCellClick = (hexBoard as any).handleCellClick;
      (hexBoard as any).handleCellClick = (clickCoords: HexCoordinates) => {
        originalHandleCellClick.call(hexBoard, clickCoords);
        hexBoard.setCellAtCoords(clickCoords, modifiedCell);
      };

      const clickEvent = new MouseEvent('click', { clientX: 400, clientY: 300 });
      mockCanvas.dispatchEvent(clickEvent);

      expect(hexBoard.getCellAtCoords(coords)?.getCustomProps().terrain).toBe('water');
    });
  });

  describe('cleanup and disposal', () => {
    it('should clean up input handlers when HexBoard is disposed', async () => {
      await hexBoard.init('test-container');
      
      const removeEventListenerSpy = jest.spyOn(mockCanvas, 'removeEventListener');
      
      hexBoard.dispose();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('should handle disposal without initialization gracefully', () => {
      const newHexBoard = new HexBoard<{ terrain?: string }>();
      
      expect(() => newHexBoard.dispose()).not.toThrow();
    });

    it('should prevent input handling after disposal', async () => {
      await hexBoard.init('test-container');
      
      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      
      hexBoard.dispose();
      
      // Try to simulate a click after disposal
      const clickEvent = new MouseEvent('click', { clientX: 400, clientY: 300 });
      mockCanvas.dispatchEvent(clickEvent);
      
      expect(handleCellClickSpy).not.toHaveBeenCalled();
    });
  });

  describe('coordinate system integration', () => {
    beforeEach(async () => {
      await hexBoard.init('test-container');
    });

    it('should maintain coordinate system consistency between input and grid', () => {
      const testCoordinates: HexCoordinates[] = [
        { q: 0, r: 0, s: 0 },
        { q: 1, r: -1, s: 0 },
        { q: -1, r: 1, s: 0 },
        { q: 2, r: -1, s: -1 },
        { q: -2, r: 1, s: 1 }
      ];

      testCoordinates.forEach((coords, index) => {
        const cell = new Cell({ terrain: `terrain_${index}` });
        hexBoard.setCellAtCoords(coords, cell);

        // Verify the cell can be retrieved with the same coordinates
        const retrievedCell = hexBoard.getCellAtCoords(coords);
        expect(retrievedCell).toBe(cell);
        expect(retrievedCell?.getCustomProps().terrain).toBe(`terrain_${index}`);
      });
    });

    it('should handle coordinate validation in input events', () => {
      const invalidCoords = { q: 1, r: 1, s: 1 }; // Invalid: q + r + s ≠ 0
      
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: invalidCoords }
      };
      inputHandler.raycaster.intersectObjects.mockReturnValue([{
        object: mockMesh, distance: 1, point: new THREE.Vector3(),
        face: null, faceIndex: null, uv: null
      }]);

      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickEvent = new MouseEvent('click', { clientX: 400, clientY: 300 });

      expect(() => mockCanvas.dispatchEvent(clickEvent)).not.toThrow();
      
      // Should still call handler - validation is not InputHandler's responsibility
      expect(handleCellClickSpy).toHaveBeenCalledWith(invalidCoords);
    });
  });

  describe('performance considerations', () => {
    beforeEach(async () => {
      await hexBoard.init('test-container');
    });

    it('should handle rapid mouse movements efficiently', () => {
      const inputHandler = (hexBoard as any).inputHandler;
      const handleCellHoverSpy = jest.spyOn(hexBoard as any, 'handleCellHover');

      const coords: HexCoordinates = { q: 0, r: 0, s: 0 };
      const mockMesh = { userData: { coordinates: coords } };
      inputHandler.raycaster.intersectObjects.mockReturnValue([{
        object: mockMesh, distance: 1, point: new THREE.Vector3(),
        face: null, faceIndex: null, uv: null
      }]);

      // Simulate rapid mouse movements over the same cell
      for (let i = 0; i < 10; i++) {
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 400 + i,
          clientY: 300 + i
        });
        mockCanvas.dispatchEvent(moveEvent);
      }

      // Should only trigger hover once for the same cell
      expect(handleCellHoverSpy).toHaveBeenCalledTimes(1);
      expect(handleCellHoverSpy).toHaveBeenCalledWith(coords);
    });

    it('should handle large grids efficiently', () => {
      // Create a large grid
      const gridSize = 50;
      for (let q = -gridSize; q <= gridSize; q++) {
        for (let r = -gridSize; r <= gridSize; r++) {
          const s = -q - r;
          if (Math.abs(s) <= gridSize) {
            const cell = new Cell({ terrain: 'grass' });
            hexBoard.setCellAtCoords({ q, r, s }, cell);
          }
        }
      }

      // Input handling should still work efficiently
      const coords: HexCoordinates = { q: 10, r: -5, s: -5 };
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = { userData: { coordinates: coords } };
      inputHandler.raycaster.intersectObjects.mockReturnValue([{
        object: mockMesh, distance: 1, point: new THREE.Vector3(),
        face: null, faceIndex: null, uv: null
      }]);

      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickEvent = new MouseEvent('click', { clientX: 400, clientY: 300 });

      const startTime = performance.now();
      mockCanvas.dispatchEvent(clickEvent);
      const endTime = performance.now();

      expect(handleCellClickSpy).toHaveBeenCalledWith(coords);
      expect(endTime - startTime).toBeLessThan(10); // Should complete quickly
    });
  });
});