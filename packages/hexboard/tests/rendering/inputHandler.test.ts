import { InputHandler } from '../../src/rendering/inputHandler';
import { HexCoordinates } from '../../src/core/coordinates';
import * as THREE from 'three';

// Mock Three.js components
jest.mock('three');

describe('InputHandler', () => {
  let inputHandler: InputHandler<object>;
  let mockRenderer: jest.Mocked<THREE.WebGLRenderer>;
  let mockCamera: jest.Mocked<THREE.PerspectiveCamera>;
  let mockScene: jest.Mocked<THREE.Scene>;
  let mockCanvas: HTMLCanvasElement;
  let mockRaycaster: jest.Mocked<THREE.Raycaster>;
  let mockMouse: jest.Mocked<THREE.Vector2>;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement('canvas');
    Object.defineProperty(mockCanvas, 'clientWidth', { value: 800 });
    Object.defineProperty(mockCanvas, 'clientHeight', { value: 600 });

    // Mock renderer
    mockRenderer = {
      domElement: mockCanvas,
      getSize: jest.fn().mockReturnValue(new THREE.Vector2(800, 600)),
    } as any;

    // Mock camera
    mockCamera = {} as any;

    // Mock scene
    mockScene = {} as any;

    // Mock Three.js constructors
    mockRaycaster = {
      setFromCamera: jest.fn(),
      intersectObjects: jest.fn().mockReturnValue([]), // Default to empty array
    } as any;

    mockMouse = {
      x: 0,
      y: 0,
    } as any;

    (THREE.Raycaster as jest.Mock).mockImplementation(() => mockRaycaster);
    (THREE.Vector2 as jest.Mock).mockImplementation(() => mockMouse);

    inputHandler = new InputHandler(mockRenderer, mockCamera, mockScene);
  });

  afterEach(() => {
    inputHandler.dispose();
    jest.clearAllMocks();
  });

  describe('Phase 1: Basic Click Detection', () => {
    describe('constructor', () => {
      it('should initialize with renderer, camera, and scene', () => {
        expect(inputHandler).toBeInstanceOf(InputHandler);
        expect(THREE.Raycaster).toHaveBeenCalled();
        expect(THREE.Vector2).toHaveBeenCalled();
      });

      it('should accept generic type parameter', () => {
        interface CustomProps {
          customProp: string;
        }
        const typedHandler = new InputHandler<CustomProps>(
          mockRenderer,
          mockCamera,
          mockScene
        );
        expect(typedHandler).toBeInstanceOf(InputHandler);
      });
    });

    describe('initialize', () => {
      it('should add event listeners to canvas', () => {
        const addEventListenerSpy = jest.spyOn(mockCanvas, 'addEventListener');

        inputHandler.initialize();

        expect(addEventListenerSpy).toHaveBeenCalledWith(
          'click',
          expect.any(Function)
        );
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          'mousemove',
          expect.any(Function)
        );
      });

      it('should handle multiple initialize calls without duplicate listeners', () => {
        const addEventListenerSpy = jest.spyOn(mockCanvas, 'addEventListener');

        inputHandler.initialize();
        inputHandler.initialize();

        // Should only be called once per event type
        expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      });
    });

    describe('click handling', () => {
      let onCellClickMock: jest.Mock;

      beforeEach(() => {
        onCellClickMock = jest.fn();
        inputHandler.onCellClick = onCellClickMock;
        inputHandler.initialize();
      });

      it('should trigger onCellClick when clicking on a hex cell', () => {
        const mockCoordinates: HexCoordinates = { q: 1, r: 2, s: -3 };
        const mockMesh = {
          userData: { coordinates: mockCoordinates },
        };
        const mockIntersection = {
          object: mockMesh as any,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: undefined,
          uv: undefined,
        };

        mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

        // Simulate click event
        const clickEvent = new MouseEvent('click', {
          clientX: 400,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(clickEvent);

        expect(mockRaycaster.setFromCamera).toHaveBeenCalledWith(
          mockMouse,
          mockCamera
        );
        expect(mockRaycaster.intersectObjects).toHaveBeenCalledWith(
          mockScene.children,
          true
        );
        expect(onCellClickMock).toHaveBeenCalledWith(mockCoordinates);
      });

      it('should not trigger onCellClick when clicking on non-hex object', () => {
        const mockMesh = {
          userData: {}, // No coordinates
        };
        const mockIntersection = {
          object: mockMesh as any,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: undefined,
          uv: undefined,
        };

        mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

        const clickEvent = new MouseEvent('click', {
          clientX: 400,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(clickEvent);

        expect(onCellClickMock).not.toHaveBeenCalled();
      });

      it('should not trigger onCellClick when clicking on empty space', () => {
        mockRaycaster.intersectObjects.mockReturnValue([]);

        const clickEvent = new MouseEvent('click', {
          clientX: 400,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(clickEvent);

        expect(onCellClickMock).not.toHaveBeenCalled();
      });

      it('should handle clicks without onCellClick callback gracefully', () => {
        inputHandler.onCellClick = undefined;

        const mockCoordinates: HexCoordinates = { q: 1, r: 2, s: -3 };
        const mockMesh = {
          userData: { coordinates: mockCoordinates },
        };
        const mockIntersection = {
          object: mockMesh as any,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: undefined,
          uv: undefined,
        };

        mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

        const clickEvent = new MouseEvent('click', {
          clientX: 400,
          clientY: 300,
        });

        expect(() => mockCanvas.dispatchEvent(clickEvent)).not.toThrow();
      });
    });

    describe('coordinate conversion', () => {
      beforeEach(() => {
        inputHandler.initialize();
      });

      it('should convert screen coordinates to normalized device coordinates correctly', () => {
        const clickEvent = new MouseEvent('click', {
          clientX: 400, // Center X (800/2)
          clientY: 300, // Center Y (600/2)
        });

        mockCanvas.dispatchEvent(clickEvent);

        // Center of screen should be (0, 0) in NDC
        expect(mockMouse.x).toBe(0);
        expect(mockMouse.y).toBe(0);
      });

      it('should convert top-left corner coordinates correctly', () => {
        const clickEvent = new MouseEvent('click', {
          clientX: 0,
          clientY: 0,
        });

        mockCanvas.dispatchEvent(clickEvent);

        // Top-left should be (-1, 1) in NDC
        expect(mockMouse.x).toBe(-1);
        expect(mockMouse.y).toBe(1);
      });

      it('should convert bottom-right corner coordinates correctly', () => {
        const clickEvent = new MouseEvent('click', {
          clientX: 800,
          clientY: 600,
        });

        mockCanvas.dispatchEvent(clickEvent);

        // Bottom-right should be (1, -1) in NDC
        expect(mockMouse.x).toBe(1);
        expect(mockMouse.y).toBe(-1);
      });
    });

    describe('dispose', () => {
      it('should remove event listeners when disposed', () => {
        const removeEventListenerSpy = jest.spyOn(
          mockCanvas,
          'removeEventListener'
        );

        inputHandler.initialize();
        inputHandler.dispose();

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'click',
          expect.any(Function)
        );
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'mousemove',
          expect.any(Function)
        );
      });

      it('should handle dispose without initialize gracefully', () => {
        expect(() => inputHandler.dispose()).not.toThrow();
      });

      it('should handle multiple dispose calls gracefully', () => {
        inputHandler.initialize();
        inputHandler.dispose();

        expect(() => inputHandler.dispose()).not.toThrow();
      });
    });
  });

  describe('Phase 2: Hover Events and Visual Feedback', () => {
    let onCellHoverMock: jest.Mock;

    beforeEach(() => {
      onCellHoverMock = jest.fn();
      inputHandler.onCellHover = onCellHoverMock;
      inputHandler.initialize();
    });

    describe('hover detection', () => {
      it('should trigger onCellHover when entering a hex cell', () => {
        const mockCoordinates: HexCoordinates = { q: 1, r: 2, s: -3 };
        const mockMesh = {
          userData: { coordinates: mockCoordinates },
        };
        const mockIntersection = {
          object: mockMesh as any,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: undefined,
          uv: undefined,
        };

        mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 400,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(mouseMoveEvent);

        expect(onCellHoverMock).toHaveBeenCalledWith(mockCoordinates);
      });

      it('should trigger onCellHover with null when leaving a hex cell', () => {
        const mockCoordinates: HexCoordinates = { q: 1, r: 2, s: -3 };
        const mockMesh = {
          userData: { coordinates: mockCoordinates },
        };
        const mockIntersection = {
          object: mockMesh as any,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: undefined,
          uv: undefined,
        };

        // First hover over a cell
        mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);
        const firstMoveEvent = new MouseEvent('mousemove', {
          clientX: 400,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(firstMoveEvent);

        expect(onCellHoverMock).toHaveBeenCalledWith(mockCoordinates);
        onCellHoverMock.mockClear();

        // Then move to empty space
        mockRaycaster.intersectObjects.mockReturnValue([]);
        const secondMoveEvent = new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        });
        mockCanvas.dispatchEvent(secondMoveEvent);

        expect(onCellHoverMock).toHaveBeenCalledWith(null);
      });

      it('should not trigger onCellHover when hovering over the same cell consecutively', () => {
        const mockCoordinates: HexCoordinates = { q: 1, r: 2, s: -3 };
        const mockMesh = {
          userData: { coordinates: mockCoordinates },
        };
        const mockIntersection = {
          object: mockMesh as any,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: undefined,
          uv: undefined,
        };

        mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

        // First hover
        const firstMoveEvent = new MouseEvent('mousemove', {
          clientX: 400,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(firstMoveEvent);

        expect(onCellHoverMock).toHaveBeenCalledTimes(1);
        expect(onCellHoverMock).toHaveBeenCalledWith(mockCoordinates);
        onCellHoverMock.mockClear();

        // Second hover over same cell
        const secondMoveEvent = new MouseEvent('mousemove', {
          clientX: 405,
          clientY: 305,
        });
        mockCanvas.dispatchEvent(secondMoveEvent);

        expect(onCellHoverMock).not.toHaveBeenCalled();
      });

      it('should trigger onCellHover when moving between different hex cells', () => {
        const firstCoordinates: HexCoordinates = { q: 1, r: 2, s: -3 };
        const secondCoordinates: HexCoordinates = { q: 2, r: 1, s: -3 };

        const firstMesh = {
          userData: { coordinates: firstCoordinates },
        };
        const secondMesh = {
          userData: { coordinates: secondCoordinates },
        };

        // Hover over first cell
        mockRaycaster.intersectObjects.mockReturnValue([
          {
            object: firstMesh as any,
            distance: 1,
            point: new THREE.Vector3(),
            face: null,
            faceIndex: undefined,
            uv: undefined,
          },
        ]);

        const firstMoveEvent = new MouseEvent('mousemove', {
          clientX: 400,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(firstMoveEvent);

        expect(onCellHoverMock).toHaveBeenCalledWith(firstCoordinates);
        onCellHoverMock.mockClear();

        // Move to second cell
        mockRaycaster.intersectObjects.mockReturnValue([
          {
            object: secondMesh as any,
            distance: 1,
            point: new THREE.Vector3(),
            face: null,
            faceIndex: undefined,
            uv: undefined,
          },
        ]);

        const secondMoveEvent = new MouseEvent('mousemove', {
          clientX: 500,
          clientY: 200,
        });
        mockCanvas.dispatchEvent(secondMoveEvent);

        expect(onCellHoverMock).toHaveBeenCalledWith(secondCoordinates);
      });

      it('should handle hover events without onCellHover callback gracefully', () => {
        inputHandler.onCellHover = undefined;

        const mockCoordinates: HexCoordinates = { q: 1, r: 2, s: -3 };
        const mockMesh = {
          userData: { coordinates: mockCoordinates },
        };
        const mockIntersection = {
          object: mockMesh as any,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: undefined,
          uv: undefined,
        };

        mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: 400,
          clientY: 300,
        });

        expect(() => mockCanvas.dispatchEvent(mouseMoveEvent)).not.toThrow();
      });
    });

    describe('hover state tracking', () => {
      it('should maintain correct hover state across multiple mouse movements', () => {
        const coordinates1: HexCoordinates = { q: 1, r: 2, s: -3 };
        const coordinates2: HexCoordinates = { q: 2, r: 1, s: -3 };

        const mesh1 = { userData: { coordinates: coordinates1 } };
        const mesh2 = { userData: { coordinates: coordinates2 } };

        // Start with no hover
        mockRaycaster.intersectObjects.mockReturnValue([]);
        const emptyMoveEvent = new MouseEvent('mousemove', {
          clientX: 0,
          clientY: 0,
        });
        mockCanvas.dispatchEvent(emptyMoveEvent);

        expect(onCellHoverMock).not.toHaveBeenCalled();

        // Hover cell 1
        mockRaycaster.intersectObjects.mockReturnValue([
          {
            object: mesh1 as any,
            distance: 1,
            point: new THREE.Vector3(),
            face: null,
            faceIndex: undefined,
            uv: undefined,
          },
        ]);
        const move1Event = new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        });
        mockCanvas.dispatchEvent(move1Event);

        expect(onCellHoverMock).toHaveBeenLastCalledWith(coordinates1);
        onCellHoverMock.mockClear();

        // Move to cell 2
        mockRaycaster.intersectObjects.mockReturnValue([
          {
            object: mesh2 as any,
            distance: 1,
            point: new THREE.Vector3(),
            face: null,
            faceIndex: undefined,
            uv: undefined,
          },
        ]);
        const move2Event = new MouseEvent('mousemove', {
          clientX: 200,
          clientY: 200,
        });
        mockCanvas.dispatchEvent(move2Event);

        expect(onCellHoverMock).toHaveBeenLastCalledWith(coordinates2);
        onCellHoverMock.mockClear();

        // Move to empty space
        mockRaycaster.intersectObjects.mockReturnValue([]);
        const move3Event = new MouseEvent('mousemove', {
          clientX: 300,
          clientY: 300,
        });
        mockCanvas.dispatchEvent(move3Event);

        expect(onCellHoverMock).toHaveBeenLastCalledWith(null);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      inputHandler.initialize();
    });

    it('should handle raycaster intersectObjects throwing an error', () => {
      // Suppress console warnings for this test
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      try {
        const onCellClickMock = jest.fn();
        inputHandler.onCellClick = onCellClickMock;

        mockRaycaster.intersectObjects.mockImplementation(() => {
          throw new Error('Raycasting failed');
        });

        const clickEvent = new MouseEvent('click', {
          clientX: 400,
          clientY: 300,
        });

        expect(() => mockCanvas.dispatchEvent(clickEvent)).not.toThrow();
        expect(onCellClickMock).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle malformed userData coordinates', () => {
      const onCellClickMock = jest.fn();
      inputHandler.onCellClick = onCellClickMock;

      const mockMesh = {
        userData: { coordinates: 'invalid' }, // Should be HexCoordinates object
      };
      const mockIntersection = {
        object: mockMesh as any,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: undefined,
        uv: undefined,
      };

      mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(clickEvent);

      expect(onCellClickMock).not.toHaveBeenCalled();
    });

    it('should handle undefined userData', () => {
      const onCellClickMock = jest.fn();
      inputHandler.onCellClick = onCellClickMock;

      const mockMesh = {
        userData: undefined,
      };
      const mockIntersection = {
        object: mockMesh as any,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: undefined,
        uv: undefined,
      };

      mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });

      expect(() => mockCanvas.dispatchEvent(clickEvent)).not.toThrow();
      expect(onCellClickMock).not.toHaveBeenCalled();
    });

    it('should handle canvas with zero dimensions', () => {
      // Suppress console warnings for this test
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      try {
        // Create a new canvas with zero dimensions for this test
        const zeroCanvas = document.createElement('canvas');
        Object.defineProperty(zeroCanvas, 'clientWidth', {
          value: 0,
          configurable: true,
        });
        Object.defineProperty(zeroCanvas, 'clientHeight', {
          value: 0,
          configurable: true,
        });

        // Create a new input handler with zero-dimension canvas
        const zeroRenderer = {
          domElement: zeroCanvas,
          getSize: jest.fn().mockReturnValue(new THREE.Vector2(0, 0)),
        } as any;

        const zeroInputHandler = new InputHandler(
          zeroRenderer,
          mockCamera,
          mockScene
        );
        zeroInputHandler.initialize();

        const clickEvent = new MouseEvent('click', {
          clientX: 0,
          clientY: 0,
        });

        expect(() => zeroCanvas.dispatchEvent(clickEvent)).not.toThrow();

        zeroInputHandler.dispose();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle multiple intersections and select the closest one', () => {
      const onCellClickMock = jest.fn();
      inputHandler.onCellClick = onCellClickMock;

      const coordinates1: HexCoordinates = { q: 1, r: 2, s: -3 };
      const coordinates2: HexCoordinates = { q: 2, r: 1, s: -3 };

      const mesh1 = { userData: { coordinates: coordinates1 } };
      const mesh2 = { userData: { coordinates: coordinates2 } };

      const intersection1 = {
        object: mesh1 as any,
        distance: 5,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: undefined,
        uv: undefined,
      };

      const intersection2 = {
        object: mesh2 as any,
        distance: 2,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: undefined,
        uv: undefined,
      };

      // Return intersections with mesh2 closer (smaller distance)
      mockRaycaster.intersectObjects.mockReturnValue([
        intersection1,
        intersection2,
      ]);

      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(clickEvent);

      // Should select the first intersection (closest)
      expect(onCellClickMock).toHaveBeenCalledWith(coordinates1);
    });
  });
});
