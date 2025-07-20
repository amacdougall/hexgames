// Mock the entire 'three' library
jest.mock('three', () => ({
  Object3D: jest.fn().mockImplementation(() => ({
    clone: jest.fn().mockReturnThis(),
    position: { set: jest.fn() },
  })),
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
  Vector3: jest.fn().mockImplementation((x, y, z) => ({
    x: x || 0,
    y: y || 0,
    z: z || 0,
    set: jest.fn(),
  })),
  Box3: jest.fn().mockImplementation(() => ({
    setFromObject: jest.fn().mockReturnThis(),
    min: { y: 0 }, // Mock the minimum bounds
    max: { y: 1 }, // Mock the maximum bounds
  })),
}));

// Mock the layout utility
jest.mock('../../src/rendering/layout');

import * as THREE from 'three';
import { EntityRenderer } from '../../src/rendering/entityRenderer';
import { Entity, EntityManager } from '../../src/core/entity';
import { ModelRegistry } from '../../src/rendering/modelRegistry';
import { Cell } from '../../src/core/cell';
import { MockEntityManager, MockModelRegistry } from '../types/mocks';
import { hexToWorld } from '../../src/rendering/layout';

// Cast hexToWorld to jest.Mock so we can control its behavior in tests
const mockedHexToWorld = hexToWorld as jest.MockedFunction<typeof hexToWorld>;

// Mock the dependencies
const mockEntityManager: MockEntityManager = {
  getAllEntities: jest.fn(),
};

const mockModelRegistry: MockModelRegistry = {
  registerModel: jest.fn(),
  createModelInstance: jest.fn(),
  getModelMetadata: jest.fn(),
};

const mockScene = new THREE.Scene();

describe('EntityRenderer', () => {
  let entityRenderer: EntityRenderer;
  let mockModel: THREE.Object3D;

  beforeEach(() => {
    entityRenderer = new EntityRenderer(
      mockEntityManager as unknown as EntityManager,
      mockScene,
      mockModelRegistry as unknown as ModelRegistry
    );
    mockModel = new THREE.Object3D();

    // Setup default metadata mock
    (mockModelRegistry.getModelMetadata as jest.Mock).mockReturnValue({
      boundingBox: new THREE.Box3(),
      bottomOffset: -0.5,
    });

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize correctly with dependencies', () => {
      expect(() => {
        new EntityRenderer(
          mockEntityManager as unknown as EntityManager,
          mockScene,
          mockModelRegistry as unknown as ModelRegistry
        );
      }).not.toThrow();
    });
  });

  describe('update method', () => {
    it('should create and add a model for a new entity with a modelKey', async () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 5,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const testEntity: Entity & { modelKey?: string } = {
        id: 'test-entity',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        modelKey: 'warrior-model',
        movementSpeed: 1,
        isInMovementMode: false,
      };

      // Mock EntityManager to return our test entity
      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([
        testEntity,
      ]);

      // Mock ModelRegistry to return our test model
      (mockModelRegistry.createModelInstance as jest.Mock).mockResolvedValue(
        mockModel
      );

      // Mock hexToWorld to return specific coordinates
      mockedHexToWorld.mockReturnValue(new THREE.Vector3(15, 0, 25));

      await entityRenderer.update();

      expect(mockModelRegistry.createModelInstance).toHaveBeenCalledWith(
        'warrior-model'
      );
      expect(mockScene.add).toHaveBeenCalledWith(mockModel);
      expect(mockModel.position.set).toHaveBeenCalledWith(15, 5.5, 25);
      // Note: hexToWorld is mocked and called within our mock implementation
    });

    it('should not add a model for a new entity without a modelKey', async () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const testEntity: Entity = {
        id: 'test-entity-no-model',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        movementSpeed: 1,
        isInMovementMode: false,
      };

      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([
        testEntity,
      ]);

      await entityRenderer.update();

      expect(mockModelRegistry.createModelInstance).not.toHaveBeenCalled();
      expect(mockScene.add).not.toHaveBeenCalled();
    });

    it('should remove a model when an entity is no longer present', async () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const testEntity: Entity & { modelKey?: string } = {
        id: 'removable-entity',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        modelKey: 'temp-model',
        movementSpeed: 1,
        isInMovementMode: false,
      };

      // First update: add the entity
      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([
        testEntity,
      ]);
      (mockModelRegistry.createModelInstance as jest.Mock).mockResolvedValue(
        mockModel
      );

      await entityRenderer.update();

      // Verify model was added
      expect(mockScene.add).toHaveBeenCalledWith(mockModel);

      // Reset mocks
      jest.clearAllMocks();

      // Second update: entity is gone
      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([]);

      await entityRenderer.update();

      // Verify model was removed
      expect(mockScene.remove).toHaveBeenCalledWith(mockModel);
    });

    it("should update the position of an existing entity's model", async () => {
      const initialCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const newCell: Cell = {
        q: 1,
        r: -1,
        s: 0,
        id: '1,-1',
        elevation: 2,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const testEntity: Entity & { modelKey?: string } = {
        id: 'movable-entity',
        cellPosition: initialCell,
        model: {} as THREE.Object3D,
        modelKey: 'moving-model',
        movementSpeed: 1,
        isInMovementMode: false,
      };

      // First update: add the entity
      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([
        testEntity,
      ]);
      (mockModelRegistry.createModelInstance as jest.Mock).mockResolvedValue(
        mockModel
      );
      mockedHexToWorld.mockReturnValue(new THREE.Vector3(10, 0, 20));

      await entityRenderer.update();

      // Verify initial position
      expect(mockModel.position.set).toHaveBeenCalledWith(10, 0.5, 20);

      // Reset mocks
      jest.clearAllMocks();

      // Second update: entity moved
      testEntity.cellPosition = newCell;
      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([
        testEntity,
      ]);
      mockedHexToWorld.mockReturnValue(new THREE.Vector3(30, 0, 40));

      await entityRenderer.update();

      // Verify position was updated but model wasn't re-added
      expect(mockModel.position.set).toHaveBeenCalledWith(30, 2.5, 40);
      expect(mockScene.add).not.toHaveBeenCalled();
    });

    it('should handle multiple entities correctly', async () => {
      const cell1: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const cell2: Cell = {
        q: 1,
        r: -1,
        s: 0,
        id: '1,-1',
        elevation: 1,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const entity1: Entity & { modelKey?: string } = {
        id: 'entity-1',
        cellPosition: cell1,
        model: {} as THREE.Object3D,
        modelKey: 'model-1',
        movementSpeed: 1,
        isInMovementMode: false,
      };

      const entity2: Entity & { modelKey?: string } = {
        id: 'entity-2',
        cellPosition: cell2,
        model: {} as THREE.Object3D,
        modelKey: 'model-2',
        movementSpeed: 1,
        isInMovementMode: false,
      };

      const model1 = new THREE.Object3D();
      const model2 = new THREE.Object3D();

      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([
        entity1,
        entity2,
      ]);
      (mockModelRegistry.createModelInstance as jest.Mock)
        .mockResolvedValueOnce(model1)
        .mockResolvedValueOnce(model2);

      mockedHexToWorld
        .mockReturnValueOnce(new THREE.Vector3(10, 0, 20))
        .mockReturnValueOnce(new THREE.Vector3(30, 0, 40));

      await entityRenderer.update();

      expect(mockModelRegistry.createModelInstance).toHaveBeenCalledTimes(2);
      expect(mockModelRegistry.createModelInstance).toHaveBeenCalledWith(
        'model-1'
      );
      expect(mockModelRegistry.createModelInstance).toHaveBeenCalledWith(
        'model-2'
      );
      expect(mockScene.add).toHaveBeenCalledTimes(2);
      expect(mockScene.add).toHaveBeenCalledWith(model1);
      expect(mockScene.add).toHaveBeenCalledWith(model2);
    });
  });

  describe('error handling', () => {
    it('should handle model creation errors gracefully', async () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const testEntity: Entity & { modelKey?: string } = {
        id: 'error-entity',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        modelKey: 'error-model',
        movementSpeed: 1,
        isInMovementMode: false,
      };

      (mockEntityManager.getAllEntities as jest.Mock).mockReturnValue([
        testEntity,
      ]);
      (mockModelRegistry.createModelInstance as jest.Mock).mockRejectedValue(
        new Error('Model creation failed')
      );

      // This should not throw, but handle the error gracefully
      await expect(entityRenderer.update()).resolves.not.toThrow();
    });
  });
});
