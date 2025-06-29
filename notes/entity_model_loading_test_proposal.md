# Proposal: Caching for GLTF Model Loading

- **Date**: 2025-06-29
- **Author**: GitHub Copilot

## 1. Summary

This document proposes an enhancement to the `ModelRegistry` to improve performance and efficiency. The core of the proposal is to introduce a caching layer for models loaded from `.gltf` files. This will prevent redundant network requests and parsing when creating multiple instances of the same model, significantly reducing load times and network traffic.

## 2. Existing Functionality

The `packages/hexboard/src/rendering/modelRegistry.ts` file currently contains a `ModelRegistry` class with the following capabilities:

- **Model Registration**: A `registerModel(key: string, asset: ModelAsset)` method allows registering either a pre-created `THREE.Object3D` or a URL `string` pointing to a model file.
- **Instance Creation**: An `async createModelInstance(key: string)` method is responsible for providing a `THREE.Object3D`.
- **URL Loading**: If the registered asset is a URL, `createModelInstance` uses `GLTFLoader` to load the model from the network _on every call_.
- **Object Cloning**: If the registered asset is a `THREE.Object3D`, `createModelInstance` returns a clone of the object.

## 3. Problem Statement

The current implementation of `createModelInstance` for URL-based assets is inefficient. It fetches and parses the GLTF file from the network every time an instance is requested. For a game scenario where multiple entities share the same visual appearance (e.g., 10 "knight" units), this would result in 10 identical and unnecessary network requests. This approach does not scale and will lead to significant performance degradation.

## 4. Proposed Changes

To resolve this, I propose modifying the `ModelRegistry` to cache the result of a model-loading operation. The public API of the class will remain unchanged, ensuring backward compatibility.

### 4.1. Introduce a GLTF Cache

A new private `Map` will be added to the `ModelRegistry` to store loaded GLTF model data. To gracefully handle concurrent requests for the same model (e.g., multiple calls to `createModelInstance('player')` before the first one has finished), the cache will store the `Promise<THREE.Group>` of the loading operation.

```typescript
// packages/hexboard/src/rendering/modelRegistry.ts

export class ModelRegistry {
  private modelAssets = new Map<string, ModelAsset>();

  // NEW: Cache for loaded GLTF models.
  // Storing the promise handles concurrent requests for the same model key.
  private loadedGltfCache = new Map<string, Promise<THREE.Group>>();

  // ... rest of the class
}
```

### 4.2. Update `createModelInstance` Logic

The `createModelInstance` method will be updated with the following logic:

1.  Retrieve the `asset` associated with the given `key` from `modelAssets`.
2.  **If the asset is a URL string**:
    a. Check the `loadedGltfCache` for an existing loading promise associated with the `key`.
    b. If a promise exists, `await` it to get the cached `THREE.Group`.
    c. If no promise exists, initiate a new load using `GLTFLoader`. Store the returned promise in the `loadedGltfCache` _immediately_. Then, `await` the promise to get the loaded `THREE.Group`.
    d. Once the `THREE.Group` is obtained (either from cache or a new load), return a `clone()` of it. This ensures each entity gets a unique object instance that can be manipulated independently.
3.  **If the asset is a `THREE.Object3D`**:
    a. The behavior remains the same: return a `clone()` of the object.

This change ensures that for any given model URL, the network request and parsing happen only once. All subsequent requests for that model will receive a clone of the already-loaded asset.

## 5. Benefits

- **Efficiency**: Models are fetched from the network and parsed only once per URL.
- **Performance**: Drastically reduces latency when creating many instances of the same entity type.
- **Robustness**: The promise-based caching mechanism correctly handles concurrent requests without race conditions.
- **No Breaking Changes**: The public API of `ModelRegistry` is unchanged, so no refactoring of consuming code is required.
