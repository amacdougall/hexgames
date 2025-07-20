import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

/**
 * Type definition for model assets that can be registered.
 * Can be either a pre-loaded THREE.Object3D or a string URL for async loading.
 */
type ModelAsset = THREE.Object3D | string;

/**
 * Metadata about a 3D model that is cached for performance.
 * This avoids recalculating expensive operations like bounding box computation.
 */
export interface ModelMetadata {
  /** The bounding box of the model in its local coordinate system */
  boundingBox: THREE.Box3;
  /** The Y offset from the model's origin to its bottom (typically negative) */
  bottomOffset: number;
}

/**
 * Registry for managing 3D model assets used by entities.
 * Provides a centralized way to register and create instances of 3D models.
 * Supports both pre-loaded models and URL-based loading via GLTF.
 */
export class ModelRegistry {
  private modelAssets = new Map<string, ModelAsset>();
  private modelMetadata = new Map<string, ModelMetadata>();

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
   * Also calculates and caches model metadata on first load.
   * @param key - The model key to create an instance of
   * @returns Promise that resolves to a THREE.Object3D instance
   * @throws Error if the model key is not registered
   */
  async createModelInstance(key: string): Promise<THREE.Object3D> {
    const asset = this.modelAssets.get(key);
    if (!asset) {
      throw new Error(`Model key "${key}" not registered.`);
    }

    let modelInstance: THREE.Object3D;

    if (typeof asset === 'string') {
      // Load model from URL using GLTFLoader
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(asset);
      modelInstance = gltf.scene;
    } else {
      // Clone the pre-loaded object to create a new instance
      modelInstance = asset.clone();
    }

    // Calculate and cache metadata if not already done
    if (!this.modelMetadata.has(key)) {
      const metadata = this.calculateModelMetadata(modelInstance);
      this.modelMetadata.set(key, metadata);
    }

    return modelInstance;
  }

  /**
   * Get cached metadata for a model.
   * @param key - The model key to get metadata for
   * @returns ModelMetadata if available, undefined if model not loaded or key not found
   */
  getModelMetadata(key: string): ModelMetadata | undefined {
    return this.modelMetadata.get(key);
  }

  /**
   * Calculate metadata for a model instance.
   * This is called once per model type and the results are cached.
   * @param model - The model to calculate metadata for
   * @returns ModelMetadata with bounding box and bottom offset
   */
  private calculateModelMetadata(model: THREE.Object3D): ModelMetadata {
    const boundingBox = new THREE.Box3().setFromObject(model);
    const bottomOffset = boundingBox.min.y;

    return {
      boundingBox: boundingBox.clone(), // Clone to avoid mutation
      bottomOffset,
    };
  }
}
