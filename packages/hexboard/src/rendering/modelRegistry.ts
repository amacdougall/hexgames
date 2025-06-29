import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

/**
 * Type definition for model assets that can be registered.
 * Can be either a pre-loaded THREE.Object3D or a string URL for async loading.
 */
type ModelAsset = THREE.Object3D | string;

/**
 * Registry for managing 3D model assets used by entities.
 * Provides a centralized way to register and create instances of 3D models.
 * Supports both pre-loaded models and URL-based loading via GLTF.
 */
export class ModelRegistry {
  private modelAssets = new Map<string, ModelAsset>();

  /**
   * Register a model asset with a key.
   * @param key - Unique identifier for the model
   * @param asset - Either a pre-loaded THREE.Object3D or a URL string for loading
   */
  registerModel(key: string, asset: ModelAsset): void {
    this.modelAssets.set(key, asset);
  }

  /**
   * Create a new instance of a registered model.
   * For pre-loaded objects, returns a clone.
   * For URL strings, loads the model using GLTFLoader.
   * @param key - The model key to create an instance of
   * @returns Promise that resolves to a THREE.Object3D instance
   * @throws Error if the model key is not registered
   */
  async createModelInstance(key: string): Promise<THREE.Object3D> {
    const asset = this.modelAssets.get(key);
    if (!asset) {
      throw new Error(`Model key "${key}" not registered.`);
    }

    if (typeof asset === 'string') {
      // Load model from URL using GLTFLoader
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(asset);
      return gltf.scene;
    } else {
      // Clone the pre-loaded object to create a new instance
      return asset.clone();
    }
  }
}
