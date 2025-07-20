import { HexBoard } from '../../src/hexBoard';
import { EntityManager, EntityDefinition, Entity } from '../../src/core/entity';
import { EntityRenderer } from '../../src/rendering/entityRenderer';
import { ModelRegistry } from '../../src/rendering/modelRegistry';
import { Cell } from '../../src/core/cell';
import { HexCoordinates } from '../../src/core/coordinates';
import * as THREE from 'three';

// Mock Three.js and related libraries
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
  GLTFLoader: jest.fn().mockImplementation(() => ({
    loadAsync: jest.fn().mockResolvedValue({
      scene: { clone: jest.fn().mockReturnValue({}) },
    }),
  })),
}));

// Mock EntityManager
jest.mock('../../src/core/entity', () => {
  const originalModule = jest.requireActual('../../src/core/entity');
  return {
    ...originalModule,
    EntityManager: jest.fn().mockImplementation(() => ({
      addEntity: jest.fn(),
      removeEntity: jest.fn(),
      moveEntity: jest.fn(),
      getEntity: jest.fn(),
      getEntitiesAt: jest.fn(),
      getAllEntities: jest.fn(),
      startMovement: jest.fn(),
      cancelMovement: jest.fn(),
      getMovementDestinations: jest.fn(),
    })),
  };
});

// Mock EntityRenderer
jest.mock('../../src/rendering/entityRenderer', () => ({
  EntityRenderer: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    dispose: jest.fn(),
  })),
}));

// Mock ModelRegistry
jest.mock('../../src/rendering/modelRegistry', () => ({
  ModelRegistry: jest.fn().mockImplementation(() => ({
    registerModel: jest.fn(),
    createModelInstance: jest.fn(),
  })),
}));

// Create mock canvas element
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

describe('HexBoard Entity Management Integration', () => {
  let hexBoard: HexBoard<{ terrain?: string }>;
  let mockRenderer: any;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockEntityRenderer: jest.Mocked<EntityRenderer>;
  let mockModelRegistry: jest.Mocked<ModelRegistry>;

  beforeEach(() => {
    // Create DOM container for testing
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Mock Three.js constructors
    mockRenderer = createMockRenderer();
    (THREE.WebGLRenderer as jest.Mock).mockImplementation(() => mockRenderer);
    (THREE.PerspectiveCamera as unknown as jest.Mock).mockImplementation(
      () => ({
        near: 0.1,
        far: 1000,
        fov: 75,
        aspect: 1.33,
        position: { set: jest.fn(), x: 10, y: 10, z: 10 },
        lookAt: jest.fn(),
        updateProjectionMatrix: jest.fn(),
      })
    );
    (THREE.Scene as unknown as jest.Mock).mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    }));
    (THREE.DirectionalLight as unknown as jest.Mock).mockImplementation(() => ({
      position: {
        set: jest.fn(),
        x: 10,
        y: 10,
        z: 5,
      },
      castShadow: true,
    }));
    (THREE.AmbientLight as unknown as jest.Mock).mockImplementation(() => ({}));
    (THREE.CylinderGeometry as unknown as jest.Mock).mockImplementation(
      () => ({})
    );
    (THREE.MeshLambertMaterial as unknown as jest.Mock).mockImplementation(
      () => ({})
    );
    (THREE.Mesh as unknown as jest.Mock).mockImplementation(() => ({
      position: { set: jest.fn(), x: 0, y: 0, z: 0 },
      geometry: { dispose: jest.fn() },
      material: { dispose: jest.fn() },
    }));

    // Clear all mocks
    jest.clearAllMocks();

    // Create HexBoard instance
    hexBoard = new HexBoard<{ terrain?: string }>();

    // Create mock instances - these will be used when we set up the mocks for each test
    mockEntityManager = {
      addEntity: jest.fn(),
      removeEntity: jest.fn(),
      moveEntity: jest.fn(),
      getEntity: jest.fn(),
      getEntitiesAt: jest.fn(),
      getAllEntities: jest.fn(),
      startMovement: jest.fn(),
      cancelMovement: jest.fn(),
      getMovementDestinations: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    mockEntityRenderer = {
      update: jest.fn(),
      dispose: jest.fn(),
      getEntityModel: jest.fn(),
    } as unknown as jest.Mocked<EntityRenderer>;

    mockModelRegistry = {
      registerModel: jest.fn(),
      createModelInstance: jest.fn(),
    } as unknown as jest.Mocked<ModelRegistry>;
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

  describe('HexBoard Lifecycle', () => {
    it('should not have an EntityManager or EntityRenderer before init is called', () => {
      // Access private properties for testing using any type
      expect((hexBoard as any).entityManager).toBeUndefined();
      expect((hexBoard as any).entityRenderer).toBeUndefined();
    });

    it('should create an EntityManager when init is called', async () => {
      await hexBoard.init('test-container');

      // Verify EntityManager was created
      expect((hexBoard as any).entityManager).toBeDefined();
      expect(EntityManager).toHaveBeenCalled();
    });

    it('should create an EntityRenderer when init is called with a ModelRegistry', async () => {
      const mockModelRegistry = new ModelRegistry();

      await hexBoard.init('test-container', mockModelRegistry);

      // Verify EntityRenderer was created
      expect((hexBoard as any).entityRenderer).toBeDefined();

      // Verify EntityRenderer constructor was called with correct parameters
      expect(EntityRenderer).toHaveBeenCalledWith(
        expect.any(Object), // EntityManager mock
        expect.any(Object), // THREE.Scene mock
        mockModelRegistry
      );
    });

    it('should NOT create an EntityRenderer when init is called without a ModelRegistry', async () => {
      await hexBoard.init('test-container');

      // This will fail until the conditional EntityRenderer creation is implemented
      expect((hexBoard as any).entityRenderer).toBeUndefined();
    });

    it('should call dispose on the EntityRenderer when HexBoard is disposed', async () => {
      const mockModelRegistry = new ModelRegistry();
      await (hexBoard as any).init('test-container', mockModelRegistry);

      // This will fail until EntityRenderer integration and dispose method are implemented
      const entityRenderer = (hexBoard as any).entityRenderer;
      const disposeSpy = jest.spyOn(entityRenderer, 'dispose');

      hexBoard.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });

  describe('HexBoard Entity Management API', () => {
    let testCell: Cell<{ terrain?: string }>;
    let testEntityDefinition: EntityDefinition<{ terrain?: string }>;
    let testEntity: Entity<{ terrain?: string }>;

    beforeEach(async () => {
      testCell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: { terrain: 'grass' },
      };

      testEntityDefinition = {
        id: 'test-entity',
        type: 'warrior',
        cellPosition: testCell,
        modelKey: 'warrior-model',
      };

      testEntity = {
        id: 'test-entity',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        modelKey: 'warrior-model',
        isInMovementMode: false,
      };

      // Initialize HexBoard with EntityManager
      await hexBoard.init('test-container');

      // Set up the internal entityManager mock (this will fail until implementation exists)
      (hexBoard as any).entityManager = mockEntityManager;

      // Mock the EntityManager methods to return expected values
      mockEntityManager.addEntity.mockReturnValue(testEntity as Entity);
      mockEntityManager.removeEntity.mockReturnValue(true as any);
      mockEntityManager.getEntity.mockReturnValue(testEntity as Entity);
      mockEntityManager.getEntitiesAt.mockReturnValue([testEntity as Entity]);
      mockEntityManager.getAllEntities.mockReturnValue([testEntity as Entity]);
      mockEntityManager.getMovementDestinations.mockReturnValue([
        { q: 1, r: 0, s: -1 },
      ]);
    });

    describe('addEntity', () => {
      it('should call addEntity on the internal EntityManager with the correct definition', () => {
        // This will fail until the addEntity method is implemented on HexBoard
        (hexBoard as any).addEntity(testEntityDefinition);

        expect(mockEntityManager.addEntity).toHaveBeenCalledWith(
          testEntityDefinition
        );
      });

      it('should return the entity created by the EntityManager', () => {
        // This will fail until the addEntity method is implemented on HexBoard
        const result = (hexBoard as any).addEntity(testEntityDefinition);

        expect(result).toBe(testEntity);
      });
    });

    describe('removeEntity', () => {
      it('should call removeEntity on the internal EntityManager with the correct ID', () => {
        // This will fail until the removeEntity method is implemented on HexBoard
        (hexBoard as any).removeEntity('test-entity');

        expect(mockEntityManager.removeEntity).toHaveBeenCalledWith(
          'test-entity'
        );
      });

      it('should return the result from the EntityManager call', () => {
        // This will fail until the removeEntity method is implemented on HexBoard
        const result = (hexBoard as any).removeEntity('test-entity');

        expect(result).toBe(true);
      });
    });

    describe('moveEntity', () => {
      it('should call moveEntity on the internal EntityManager with the correct ID and cell', () => {
        // This will fail until the moveEntity method is implemented on HexBoard
        (hexBoard as any).moveEntity('test-entity', testCell);

        expect(mockEntityManager.moveEntity).toHaveBeenCalledWith(
          'test-entity',
          testCell
        );
      });
    });

    describe('getEntityById', () => {
      it('should call getEntity on the internal EntityManager and return the result', () => {
        // This will fail until the getEntityById method is implemented on HexBoard
        const result = (hexBoard as any).getEntityById('test-entity');

        expect(mockEntityManager.getEntity).toHaveBeenCalledWith('test-entity');
        expect(result).toBe(testEntity);
      });
    });

    describe('getEntitiesAt', () => {
      it('should call getEntitiesAt on the internal EntityManager and return the result', () => {
        // This will fail until the getEntitiesAt method is implemented on HexBoard
        const result = (hexBoard as any).getEntitiesAt('0,0,0');

        expect(mockEntityManager.getEntitiesAt).toHaveBeenCalledWith('0,0,0');
        expect(result).toEqual([testEntity as Entity]);
      });
    });

    describe('getAllEntities', () => {
      it('should call getAllEntities on the internal EntityManager and return the result', () => {
        // This will fail until the getAllEntities method is implemented on HexBoard
        const result = (hexBoard as any).getAllEntities();

        expect(mockEntityManager.getAllEntities).toHaveBeenCalled();
        expect(result).toEqual([testEntity as Entity]);
      });
    });
  });

  describe('HexBoard Entity Movement API', () => {
    let testEntity: Entity<{ terrain?: string }>;
    let testDestinations: HexCoordinates[];

    beforeEach(async () => {
      testEntity = {
        id: 'movement-entity',
        cellPosition: {
          q: 0,
          r: 0,
          s: 0,
          id: '0,0,0',
          elevation: 0,
          movementCost: 1,
          isImpassable: false,
          customProps: { terrain: 'grass' },
        },
        model: {} as THREE.Object3D,
        isInMovementMode: false,
      };

      testDestinations = [
        { q: 1, r: 0, s: -1 },
        { q: 0, r: 1, s: -1 },
        { q: -1, r: 1, s: 0 },
      ];

      await hexBoard.init('test-container');

      // Set up the internal entityManager mock (this will fail until implementation exists)
      (hexBoard as any).entityManager = mockEntityManager;

      // Mock EntityManager methods
      mockEntityManager.getMovementDestinations.mockReturnValue(
        testDestinations
      );
    });

    describe('startEntityMovement', () => {
      it('should call startMovement on the internal EntityManager with the correct entity ID and hexes', () => {
        // This will fail until the startEntityMovement method is implemented on HexBoard
        (hexBoard as any).startEntityMovement(
          'movement-entity',
          testDestinations
        );

        expect(mockEntityManager.startMovement).toHaveBeenCalledWith(
          'movement-entity',
          testDestinations
        );
      });
    });

    describe('cancelEntityMovement', () => {
      it('should call cancelMovement on the internal EntityManager with the correct entity ID', () => {
        // This will fail until the cancelEntityMovement method is implemented on HexBoard
        (hexBoard as any).cancelEntityMovement('movement-entity');

        expect(mockEntityManager.cancelMovement).toHaveBeenCalledWith(
          'movement-entity'
        );
      });
    });

    describe('getEntityMovementDestinations', () => {
      it('should call getMovementDestinations on the internal EntityManager and return the result', () => {
        // This will fail until the getEntityMovementDestinations method is implemented on HexBoard
        const result = (hexBoard as any).getEntityMovementDestinations(
          'movement-entity'
        );

        expect(mockEntityManager.getMovementDestinations).toHaveBeenCalledWith(
          'movement-entity'
        );
        expect(result).toEqual(testDestinations);
      });
    });
  });
});
