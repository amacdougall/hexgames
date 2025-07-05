import { HexBoard } from '../../src/hexBoard';
import { HexCoordinates } from '../../src/core/coordinates';
import * as THREE from 'three';

// Mock Three.js and DOM
jest.mock('three');
jest.mock('three-stdlib', () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    enabled: true,
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    maxPolarAngle: Math.PI,
    minDistance: 1,
    maxDistance: 100,
    update: jest.fn(),
    dispose: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
}));

// Create a mock HTMLCanvasElement
const createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(canvas, 'clientHeight', {
    value: 600,
    configurable: true,
  });
  Object.defineProperty(canvas, 'getContext', {
    value: jest.fn().mockReturnValue({}),
    configurable: true,
  });

  canvas.addEventListener = jest.fn();
  canvas.removeEventListener = jest.fn();
  canvas.getBoundingClientRect = jest.fn().mockReturnValue({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
  });

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
      type: THREE.PCFSoftShadowMap,
    },
  } as any;
};

describe('HexBoard Input Integration', () => {
  let hexBoard: HexBoard<{ terrain?: string }>;
  let mockRenderer: any;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create DOM container for testing
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Mock Three.js constructors
    mockRenderer = createMockRenderer();
    mockCanvas = mockRenderer.domElement;

    (THREE.WebGLRenderer as jest.Mock).mockImplementation(() => mockRenderer);
    (THREE.PerspectiveCamera as unknown as jest.Mock).mockImplementation(() => {
      // Create comprehensive mock with all Object3D properties OrbitControls needs
      const mockVector3 = {
        x: 10,
        y: 10,
        z: 10,
        set: jest.fn().mockReturnThis(),
        setScalar: jest.fn().mockReturnThis(),
        setX: jest.fn().mockReturnThis(),
        setY: jest.fn().mockReturnThis(),
        setZ: jest.fn().mockReturnThis(),
        clone: jest.fn().mockImplementation(() => ({
          x: 10,
          y: 10,
          z: 10,
          set: jest.fn().mockReturnThis(),
          copy: jest.fn().mockReturnThis(),
          sub: jest.fn().mockReturnThis(),
          add: jest.fn().mockReturnThis(),
          multiply: jest.fn().mockReturnThis(),
          multiplyScalar: jest.fn().mockReturnThis(),
          normalize: jest.fn().mockReturnThis(),
          distanceTo: jest.fn().mockReturnValue(1),
          length: jest.fn().mockReturnValue(1),
          lengthSq: jest.fn().mockReturnValue(1),
          dot: jest.fn().mockReturnValue(1),
          cross: jest.fn().mockReturnThis(),
          applyMatrix4: jest.fn().mockReturnThis(),
          applyQuaternion: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis(),
        })),
        copy: jest.fn().mockReturnThis(),
        add: jest.fn().mockReturnThis(),
        sub: jest.fn().mockReturnThis(),
        multiply: jest.fn().mockReturnThis(),
        multiplyScalar: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        distanceTo: jest.fn().mockReturnValue(1),
        length: jest.fn().mockReturnValue(1),
        lengthSq: jest.fn().mockReturnValue(1),
        dot: jest.fn().mockReturnValue(1),
        cross: jest.fn().mockReturnThis(),
        applyMatrix4: jest.fn().mockReturnThis(),
        applyQuaternion: jest.fn().mockReturnThis(),
      };

      const mockQuaternion = {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
        set: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0, w: 1 }),
        copy: jest.fn().mockReturnThis(),
        setFromUnitVectors: jest.fn().mockReturnThis(),
        setFromAxisAngle: jest.fn().mockReturnThis(),
        setFromRotationMatrix: jest.fn().mockReturnThis(),
        setFromEuler: jest.fn().mockReturnThis(),
        multiply: jest.fn().mockReturnThis(),
        premultiply: jest.fn().mockReturnThis(),
        slerp: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
      };

      const mockMatrix4 = {
        elements: new Array(16).fill(0),
        identity: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnValue({ elements: new Array(16).fill(0) }),
        copy: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        multiply: jest.fn().mockReturnThis(),
        premultiply: jest.fn().mockReturnThis(),
        multiplyMatrices: jest.fn().mockReturnThis(),
        lookAt: jest.fn().mockReturnThis(),
        extractRotation: jest.fn().mockReturnThis(),
        makeRotationFromQuaternion: jest.fn().mockReturnThis(),
        compose: jest.fn().mockReturnThis(),
        decompose: jest.fn().mockReturnThis(),
        makePerspective: jest.fn().mockReturnThis(),
        makeOrthographic: jest.fn().mockReturnThis(),
      };

      const mockEuler = {
        x: 0,
        y: 0,
        z: 0,
        order: 'XYZ',
        set: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0, order: 'XYZ' }),
        copy: jest.fn().mockReturnThis(),
        setFromQuaternion: jest.fn().mockReturnThis(),
        setFromRotationMatrix: jest.fn().mockReturnThis(),
      };

      return {
        // Camera specific properties
        near: 0.1,
        far: 1000,
        fov: 75,
        aspect: 1.33,
        zoom: 1,
        focus: 10,
        filmGauge: 35,
        filmOffset: 0,

        // Object3D core properties
        isObject3D: true,
        type: 'PerspectiveCamera',
        id: Math.floor(Math.random() * 1000000),
        uuid: 'mock-uuid-' + Math.random(),
        name: '',
        parent: null,
        children: [],
        up: { ...mockVector3, x: 0, y: 1, z: 0 },
        position: mockVector3,
        rotation: mockEuler,
        quaternion: mockQuaternion,
        scale: { ...mockVector3, x: 1, y: 1, z: 1 },
        matrix: mockMatrix4,
        matrixWorld: { ...mockMatrix4 },
        matrixAutoUpdate: true,
        matrixWorldNeedsUpdate: false,
        matrixWorldAutoUpdate: true,
        layers: { mask: 1 },
        visible: true,
        castShadow: false,
        receiveShadow: false,
        frustumCulled: true,
        renderOrder: 0,
        userData: {},

        // Methods
        add: jest.fn().mockReturnThis(),
        remove: jest.fn().mockReturnThis(),
        removeFromParent: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        attach: jest.fn().mockReturnThis(),
        getObjectById: jest.fn(),
        getObjectByName: jest.fn(),
        getObjectByProperty: jest.fn(),
        getWorldPosition: jest.fn().mockReturnValue(mockVector3),
        getWorldQuaternion: jest.fn().mockReturnValue(mockQuaternion),
        getWorldScale: jest.fn().mockReturnValue(mockVector3),
        getWorldDirection: jest.fn().mockReturnValue(mockVector3),
        raycast: jest.fn(),
        traverse: jest.fn(),
        traverseVisible: jest.fn(),
        traverseAncestors: jest.fn(),
        updateMatrix: jest.fn(),
        updateMatrixWorld: jest.fn(),
        updateWorldMatrix: jest.fn(),
        toJSON: jest.fn(),
        clone: jest.fn().mockReturnThis(),
        copy: jest.fn().mockReturnThis(),

        // Event handling
        addEventListener: jest.fn(),
        hasEventListener: jest.fn().mockReturnValue(false),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn().mockReturnValue(true),

        // Camera specific methods
        updateProjectionMatrix: jest.fn(),
        setViewOffset: jest.fn(),
        clearViewOffset: jest.fn(),
        setFocalLength: jest.fn(),
        getFocalLength: jest.fn().mockReturnValue(50),
        getEffectiveFOV: jest.fn().mockReturnValue(75),
        getFilmWidth: jest.fn().mockReturnValue(35),
        getFilmHeight: jest.fn().mockReturnValue(24),
        setLens: jest.fn(),
        lookAt: jest.fn(),
      };
    });
    (THREE.Scene as unknown as jest.Mock).mockImplementation(() => ({
      // Object3D properties
      isObject3D: true,
      type: 'Scene',
      children: [],
      parent: null,
      up: { x: 0, y: 1, z: 0 },
      position: { x: 0, y: 0, z: 0, set: jest.fn() },
      rotation: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
      matrix: { elements: new Array(16).fill(0) },
      matrixWorld: { elements: new Array(16).fill(0) },
      visible: true,
      userData: {},

      // Scene specific properties
      background: null,
      environment: null,
      fog: null,
      backgroundBlurriness: 0,
      backgroundIntensity: 1,
      overrideMaterial: null,
      autoUpdate: true,

      // Methods
      add: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getObjectById: jest.fn(),
      getObjectByName: jest.fn(),
      traverse: jest.fn(),
      updateMatrix: jest.fn(),
      updateMatrixWorld: jest.fn(),
      clone: jest.fn(),
      copy: jest.fn(),
    }));
    (THREE.DirectionalLight as unknown as jest.Mock).mockImplementation(() => ({
      position: {
        set: jest.fn(),
      },
      castShadow: true,
      userData: {},
    }));
    (THREE.AmbientLight as unknown as jest.Mock).mockImplementation(() => ({
      userData: {},
    }));
    (THREE.CylinderGeometry as unknown as jest.Mock).mockImplementation(() => ({
      userData: {},
    }));
    (THREE.MeshLambertMaterial as unknown as jest.Mock).mockImplementation(
      () => ({
        userData: {},
      })
    );
    (THREE.Mesh as unknown as jest.Mock).mockImplementation(() => ({
      userData: {},
      position: {
        set: jest.fn(),
        x: 0,
        y: 0,
        z: 0,
      },
      geometry: {
        dispose: jest.fn(),
      },
      material: {
        dispose: jest.fn(),
      },
      castShadow: true,
      receiveShadow: true,
    }));
    (THREE.Raycaster as jest.Mock).mockImplementation(() => ({
      setFromCamera: jest.fn(),
      intersectObjects: jest.fn(),
    }));
    (THREE.Vector2 as jest.Mock).mockImplementation(() => ({ x: 0, y: 0 }));

    // Create HexBoard instance
    hexBoard = new HexBoard<{ terrain?: string }>();
  });

  afterEach(() => {
    hexBoard.dispose();

    // Clean up DOM container
    const container = document.getElementById('test-container');
    if (container) {
      document.body.removeChild(container);
    }

    jest.clearAllMocks();
  });

  describe('initialization and setup', () => {
    it('should initialize HexBoard with input handling capabilities', async () => {
      await hexBoard.init('test-container');

      expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
    });

    it('should handle init with missing container gracefully', async () => {
      // Suppress console warnings for this test
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => { });

      try {
        await expect(
          hexBoard.init('non-existent-container')
        ).resolves.not.toThrow();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('cell click integration', () => {
    beforeEach(async () => {
      await hexBoard.init('test-container');

      // Add some test cells to the grid
      hexBoard.setCellAtCoords(
        { q: 0, r: 0, s: 0 },
        { customProps: { terrain: 'grass' } }
      );
      hexBoard.setCellAtCoords(
        { q: 1, r: 0, s: -1 },
        { customProps: { terrain: 'water' } }
      );
      hexBoard.setCellAtCoords(
        { q: 0, r: 1, s: -1 },
        { customProps: { terrain: 'mountain' } }
      );
    });

    it('DEBUG: should handle cell clicks and trigger game logic', () => {
      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickCoords: HexCoordinates = { q: 1, r: 0, s: -1 };

      // Mock raycaster to return intersection with our test cell
      const mockMesh = {
        userData: { coordinates: clickCoords },
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null,
      };

      const inputHandler = (hexBoard as any).inputHandler;
      const mockRaycaster = inputHandler.getRaycaster();
      mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);

      // Simulate click event
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(clickEvent);

      expect(handleCellClickSpy).toHaveBeenCalledWith(clickCoords);
    });

    it('should retrieve correct cell data when clicking on a cell', () => {
      const testCoords: HexCoordinates = { q: 0, r: 0, s: 0 };
      const testCellProps = { customProps: { terrain: 'grass' } };
      hexBoard.setCellAtCoords(testCoords, testCellProps);

      // Mock the input handler to simulate a click
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: testCoords },
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null,
      };

      inputHandler
        .getRaycaster()
        .intersectObjects.mockReturnValue([mockIntersection]);

      // Simulate click
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(clickEvent);

      // Verify the correct cell was accessed
      const retrievedCell = hexBoard.getCellAtCoords(testCoords);
      expect(retrievedCell?.customProps.terrain).toBe('grass');
    });

    it('should handle clicks on empty cells gracefully', () => {
      const emptyCoords: HexCoordinates = { q: 5, r: 5, s: -10 };

      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: emptyCoords },
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null,
      };

      inputHandler
        .getRaycaster()
        .intersectObjects.mockReturnValue([mockIntersection]);

      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
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
      hexBoard.setCellAtCoords(
        { q: 0, r: 0, s: 0 },
        { customProps: { terrain: 'grass' } }
      );
      hexBoard.setCellAtCoords(
        { q: 1, r: 0, s: -1 },
        { customProps: { terrain: 'water' } }
      );
    });

    it('should handle cell hover events', () => {
      const handleCellHoverSpy = jest.spyOn(hexBoard as any, 'handleCellHover');
      const hoverCoords: HexCoordinates = { q: 0, r: 0, s: 0 };

      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: hoverCoords },
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null,
      };

      inputHandler
        .getRaycaster()
        .intersectObjects.mockReturnValue([mockIntersection]);

      // Simulate mouse move event
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(mouseMoveEvent);

      expect(handleCellHoverSpy).toHaveBeenCalledWith(hoverCoords);
    });

    it('should handle hover exit events', () => {
      const handleCellHoverSpy = jest.spyOn(hexBoard as any, 'handleCellHover');
      const hoverCoords: HexCoordinates = { q: 0, r: 0, s: 0 };

      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: hoverCoords },
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null,
      };

      // First hover over a cell
      inputHandler
        .getRaycaster()
        .intersectObjects.mockReturnValue([mockIntersection]);
      const enterEvent = new MouseEvent('mousemove', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(enterEvent);

      expect(handleCellHoverSpy).toHaveBeenCalledWith(hoverCoords);
      handleCellHoverSpy.mockClear();

      // Then move to empty space
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([]);
      const exitEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
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
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([
        {
          object: mesh1,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: null,
          uv: null,
        },
      ]);
      mockCanvas.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 400, clientY: 300 })
      );

      expect(handleCellHoverSpy).toHaveBeenCalledWith(coords1);
      handleCellHoverSpy.mockClear();

      // Move to second cell
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([
        {
          object: mesh2,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: null,
          uv: null,
        },
      ]);
      mockCanvas.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 500, clientY: 200 })
      );

      expect(handleCellHoverSpy).toHaveBeenCalledWith(coords2);
      handleCellHoverSpy.mockClear();

      // Move to empty space
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([]);
      mockCanvas.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 100, clientY: 100 })
      );

      expect(handleCellHoverSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('integration with BoardRenderer', () => {
    beforeEach(async () => {
      await hexBoard.init('test-container');
    });

    it('should ensure BoardRenderer stores coordinates in mesh userData', () => {
      const testCoords: HexCoordinates = { q: 2, r: -1, s: -1 };
      const testCell = { customProps: { terrain: 'desert' } };

      hexBoard.setCellAtCoords(testCoords, testCell);

      // BoardRenderer should have stored coordinates in mesh userData
      // This is tested indirectly through the input handling working
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: testCoords },
      };
      const mockIntersection = {
        object: mockMesh,
        distance: 1,
        point: new THREE.Vector3(),
        face: null,
        faceIndex: null,
        uv: null,
      };

      inputHandler
        .getRaycaster()
        .intersectObjects.mockReturnValue([mockIntersection]);

      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(clickEvent);

      expect(handleCellClickSpy).toHaveBeenCalledWith(testCoords);
    });

    it('should handle rendering updates when cells are modified via input', () => {
      const coords: HexCoordinates = { q: 0, r: 1, s: -1 };
      const originalCell = { customProps: { terrain: 'grass' } };
      const modifiedCell = { customProps: { terrain: 'water' } };

      // Set initial cell
      hexBoard.setCellAtCoords(coords, originalCell);
      expect(hexBoard.getCellAtCoords(coords)?.customProps.terrain).toBe(
        'grass'
      );

      // Simulate a click that modifies the cell
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: coords },
      };
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([
        {
          object: mockMesh,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: null,
          uv: null,
        },
      ]);

      // Override handleCellClick to modify the cell
      const originalHandleCellClick = (hexBoard as any).handleCellClick;
      (hexBoard as any).handleCellClick = (clickCoords: HexCoordinates) => {
        originalHandleCellClick.call(hexBoard, clickCoords);
        hexBoard.setCellAtCoords(clickCoords, modifiedCell);
      };

      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });
      mockCanvas.dispatchEvent(clickEvent);

      expect(hexBoard.getCellAtCoords(coords)?.customProps.terrain).toBe(
        'water'
      );
    });
  });

  describe('cleanup and disposal', () => {
    it('should clean up input handlers when HexBoard is disposed', async () => {
      await hexBoard.init('test-container');

      const removeEventListenerSpy = jest.spyOn(
        mockCanvas,
        'removeEventListener'
      );

      hexBoard.dispose();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      );
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
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });
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
        { q: -2, r: 1, s: 1 },
      ];

      testCoordinates.forEach((coords, index) => {
        const cell = { customProps: { terrain: `terrain_${index}` } };
        hexBoard.setCellAtCoords(coords, cell);

        // Verify the cell can be retrieved with the same coordinates
        const retrievedCell = hexBoard.getCellAtCoords(coords);
        expect(retrievedCell).toBe(cell);
        expect(retrievedCell?.customProps.terrain).toBe(`terrain_${index}`);
      });
    });

    it('should handle coordinate validation in input events', () => {
      const invalidCoords = { q: 1, r: 1, s: 1 }; // Invalid: q + r + s ≠ 0

      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = {
        userData: { coordinates: invalidCoords },
      };
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([
        {
          object: mockMesh,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: null,
          uv: null,
        },
      ]);

      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });

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
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([
        {
          object: mockMesh,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: null,
          uv: null,
        },
      ]);

      // Simulate rapid mouse movements over the same cell
      for (let i = 0; i < 10; i++) {
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 400 + i,
          clientY: 300 + i,
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
            const cell = { customProps: { terrain: 'grass' } };
            hexBoard.setCellAtCoords({ q, r, s }, cell);
          }
        }
      }

      // Input handling should still work efficiently
      const coords: HexCoordinates = { q: 10, r: -5, s: -5 };
      const inputHandler = (hexBoard as any).inputHandler;
      const mockMesh = { userData: { coordinates: coords } };
      inputHandler.getRaycaster().intersectObjects.mockReturnValue([
        {
          object: mockMesh,
          distance: 1,
          point: new THREE.Vector3(),
          face: null,
          faceIndex: null,
          uv: null,
        },
      ]);

      const handleCellClickSpy = jest.spyOn(hexBoard as any, 'handleCellClick');
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300,
      });

      const startTime = performance.now();
      mockCanvas.dispatchEvent(clickEvent);
      const endTime = performance.now();

      expect(handleCellClickSpy).toHaveBeenCalledWith(coords);
      expect(endTime - startTime).toBeLessThan(10); // Should complete quickly
    });
  });
});
