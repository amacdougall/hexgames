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
}));

// Mock three-stdlib for GLTFLoader
jest.mock('three-stdlib', () => ({
  GLTFLoader: jest.fn().mockImplementation(() => ({
    loadAsync: jest.fn().mockResolvedValue({ scene: {} }),
  })),
}));

import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { ModelRegistry } from '../../src/rendering/modelRegistry';

describe('ModelRegistry', () => {
  let modelRegistry: ModelRegistry;
  let _mockObject3D: THREE.Object3D;

  beforeEach(() => {
    modelRegistry = new ModelRegistry();
    _mockObject3D = new THREE.Object3D();
    jest.clearAllMocks();
  });

  describe('registerModel', () => {
    it('should store a pre-loaded THREE.Object3D asset', () => {
      const testModel = new THREE.Object3D();

      expect(() => {
        modelRegistry.registerModel('warrior', testModel);
      }).not.toThrow();

      // We can't directly access the private map, but we can test via createModelInstance
      // This is tested in the createModelInstance section
    });

    it('should store a string path for an asset to be loaded', () => {
      const modelPath = '/path/to/model.gltf';

      expect(() => {
        modelRegistry.registerModel('archer', modelPath);
      }).not.toThrow();

      // We can't directly access the private map, but we can test via createModelInstance
      // This is tested in the createModelInstance section
    });
  });

  describe('createModelInstance', () => {
    it('should clone and return a pre-registered Object3D', async () => {
      const originalModel = new THREE.Object3D();
      const clonedModel = new THREE.Object3D();

      // Mock the clone method to return our test model
      (originalModel.clone as jest.Mock).mockReturnValue(clonedModel);

      modelRegistry.registerModel('knight', originalModel);

      const result = await modelRegistry.createModelInstance('knight');

      expect(originalModel.clone).toHaveBeenCalled();
      expect(result).toBe(clonedModel);
    });

    it('should throw an error for an unregistered model key', async () => {
      await expect(
        modelRegistry.createModelInstance('unregistered-model')
      ).rejects.toThrow('Model key "unregistered-model" not registered.');
    });

    it('should handle asset loading from a URL', async () => {
      const modelUrl = '/path/to/model.gltf';
      const mockScene = new THREE.Object3D();
      const mockGLTF = { scene: mockScene };

      // Mock GLTFLoader
      const mockLoader = new GLTFLoader();
      (mockLoader.loadAsync as jest.Mock).mockResolvedValue(mockGLTF);

      // Mock GLTFLoader constructor to return our mock
      (GLTFLoader as unknown as jest.Mock).mockImplementation(() => mockLoader);

      modelRegistry.registerModel('loaded-model', modelUrl);

      const result = await modelRegistry.createModelInstance('loaded-model');

      expect(GLTFLoader).toHaveBeenCalled();
      expect(mockLoader.loadAsync).toHaveBeenCalledWith(modelUrl);
      expect(result).toBe(mockScene);
    });

    it('should handle multiple model registrations and instances', async () => {
      const model1 = new THREE.Object3D();
      const model2 = new THREE.Object3D();
      const cloned1 = new THREE.Object3D();
      const cloned2 = new THREE.Object3D();

      (model1.clone as jest.Mock).mockReturnValue(cloned1);
      (model2.clone as jest.Mock).mockReturnValue(cloned2);

      modelRegistry.registerModel('model1', model1);
      modelRegistry.registerModel('model2', model2);

      const result1 = await modelRegistry.createModelInstance('model1');
      const result2 = await modelRegistry.createModelInstance('model2');

      expect(result1).toBe(cloned1);
      expect(result2).toBe(cloned2);
      expect(model1.clone).toHaveBeenCalled();
      expect(model2.clone).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle loading errors gracefully', async () => {
      const modelUrl = '/invalid/path.gltf';
      const mockLoader = new GLTFLoader();
      const loadError = new Error('Failed to load model');

      (mockLoader.loadAsync as jest.Mock).mockRejectedValue(loadError);
      (GLTFLoader as unknown as jest.Mock).mockImplementation(() => mockLoader);

      modelRegistry.registerModel('error-model', modelUrl);

      await expect(
        modelRegistry.createModelInstance('error-model')
      ).rejects.toThrow('Failed to load model');
    });

    it('should allow re-registering a model key', () => {
      const model1 = new THREE.Object3D();
      const model2 = new THREE.Object3D();

      modelRegistry.registerModel('same-key', model1);

      expect(() => {
        modelRegistry.registerModel('same-key', model2);
      }).not.toThrow();
    });
  });
});
