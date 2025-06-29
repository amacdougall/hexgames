# Proposal: Entity Model Rendering in `hexboard`

## 1. Introduction

The objective is to add the capability to render 3D models for `Entity` objects within the `hexboard` library. A key requirement is to position entities on top of the hex tiles they occupy. This proposal outlines an approach that achieves this while maintaining a strong separation of concerns between the core game state management (`src/core`) and the 3D rendering logic (`src/rendering`).

## 2. Current State Analysis

- **`Entity` (`src/core/entity.ts`):** The `Entity` interface currently includes a `model: THREE.Object3D;` property. While this directly associates a 3D object with an entity, it creates a hard dependency from the core logic to the Three.js rendering library. This is undesirable as it breaks the separation of concerns, making the core logic harder to test in isolation and preventing it from being used in non-rendering contexts (e.g., a server).
- **`EntityManager` (`src/core/entity.ts`):** This class manages the lifecycle of entities. When it creates an `Entity`, it currently populates the `model` property with a placeholder object. It has no knowledge of how to load or create actual 3D models.
- **`BoardRenderer` (`src/rendering/boardRenderer.ts`):** This class is responsible for rendering the `HexGrid` and its cells. It currently has no knowledge of the `EntityManager` or the entities themselves, so it cannot render them.

## 3. Proposed Architecture

To cleanly integrate entity rendering, we will introduce two new concepts: a `ModelRegistry` for managing 3D assets and an `EntityRenderer` dedicated to handling the visual representation of entities. We will also refactor the `Entity` interface to decouple it from Three.js.

### 3.1. Decoupling Core and Rendering

The first step is to remove the direct dependency on `three` from the core `Entity` object.

**`packages/hexboard/src/core/entity.ts` Changes:**

1.  **Modify `EntityDefinition` and `Entity`:** Replace the `model` property with an optional `modelKey` of type `string`. This key will act as an identifier that the rendering layer can use to look up the appropriate 3D model.

    ```typescript
    // Before
    export interface Entity {
      // ...
      model: THREE.Object3D;
    }

    // After
    export interface EntityDefinition {
      // ...
      modelKey?: string;
    }

    export interface Entity {
      // ...
      modelKey?: string;
    }
    ```

2.  **Update `EntityManager`:** The `addEntity` method will be updated to copy the `modelKey` from the definition to the new entity instance.

This change makes the core `Entity` a pure data object, free of rendering-specific concerns. It is now serializable and can be used independently of the 3D client.

### 3.2. Introducing the `ModelRegistry`

The `ModelRegistry` will be a new class in the rendering layer responsible for mapping `modelKey` strings to loadable 3D assets. This provides a flexible interface for the library user to define their game's assets.

**`packages/hexboard/src/rendering/modelRegistry.ts` (New File):**

```typescript
import * as THREE from 'three';

type ModelAsset = THREE.Object3D | string; // Can be a pre-loaded object or a URL

export class ModelRegistry {
  private modelAssets = new Map<string, ModelAsset>();

  registerModel(key: string, asset: ModelAsset) {
    this.modelAssets.set(key, asset);
  }

  async createModelInstance(key: string): Promise<THREE.Object3D> {
    const asset = this.modelAssets.get(key);
    if (!asset) {
      throw new Error(`Model key "${key}" not registered.`);
    }

    if (typeof asset === 'string') {
      // Load model from URL (e.g., using GLTFLoader)
      // For simplicity, this is a placeholder for async loading logic
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(asset);
      return gltf.scene;
    } else {
      // Clone the pre-loaded object to create a new instance
      return asset.clone();
    }
  }
}
```

### 3.3. Introducing the `EntityRenderer`

This new class will bridge the gap between the `EntityManager` and the `BoardRenderer`. It will observe the state of entities and manage their corresponding 3D models in the scene.

**`packages/hexboard/src/rendering/entityRenderer.ts` (New File):**

```typescript
import * as THREE from 'three';
import { EntityManager } from '../core/entity';
import { ModelRegistry } from './modelRegistry';
import { hexToWorld } from './layout';

export class EntityRenderer {
  private entityManager: EntityManager;
  private scene: THREE.Scene;
  private modelRegistry: ModelRegistry;
  private entityModels = new Map<string, THREE.Object3D>();

  constructor(
    entityManager: EntityManager,
    scene: THREE.Scene,
    modelRegistry: ModelRegistry
  ) {
    this.entityManager = entityManager;
    this.scene = scene;
    this.modelRegistry = modelRegistry;
  }

  // This method should be called in the main render loop
  public update(): void {
    const allEntities = this.entityManager.getAllEntities(); // Assumes EntityManager has this method
    const renderedEntityIds = new Set(this.entityModels.keys());

    // Add/update entities
    allEntities.forEach(async (entity) => {
      if (this.entityModels.has(entity.id)) {
        // Entity already exists, update its position
        const model = this.entityModels.get(entity.id)!;
        const worldPos = hexToWorld(entity.cellPosition);
        model.position.set(
          worldPos.x,
          entity.cellPosition.elevation,
          worldPos.z
        );
      } else if (entity.modelKey) {
        // New entity, create and add its model
        const model = await this.modelRegistry.createModelInstance(
          entity.modelKey
        );
        this.entityModels.set(entity.id, model);
        this.scene.add(model);
        // Position it
        const worldPos = hexToWorld(entity.cellPosition);
        model.position.set(
          worldPos.x,
          entity.cellPosition.elevation,
          worldPos.z
        );
      }
      renderedEntityIds.delete(entity.id);
    });

    // Remove entities that no longer exist
    renderedEntityIds.forEach((id) => {
      const model = this.entityModels.get(id)!;
      this.scene.remove(model);
      this.entityModels.delete(id);
    });
  }
}
```

### 3.4. Updating `BoardRenderer`

The `BoardRenderer` will be updated to use the `EntityRenderer`.

**`packages/hexboard/src/rendering/boardRenderer.ts` Changes:**

```typescript
// ... imports
import { EntityRenderer } from './entityRenderer';
import { EntityManager } from '../core/entity';
import { ModelRegistry } from './modelRegistry';

export class BoardRenderer {
  // ... existing properties
  private entityRenderer: EntityRenderer;

  constructor(
    hexGrid: HexGrid,
    entityManager: EntityManager,
    modelRegistry: ModelRegistry
    // ... other params
  ) {
    // ...
    this.scene = new THREE.Scene();
    this.entityRenderer = new EntityRenderer(
      entityManager,
      this.scene,
      modelRegistry
    );
    // ...
  }

  public render(): void {
    this.controls.update();
    this.entityRenderer.update(); // Update entity models
    this.renderer.render(this.scene, this.camera);
  }
}
```

## 4. Use Case Analysis

This architecture is flexible enough to handle a variety of use cases.

- **Board Games (Simple Pieces):** For a simple board game, the user can register basic geometric shapes as models.

  ```typescript
  const registry = new ModelRegistry();
  const pawnMaterial = new THREE.MeshStandardMaterial({ color: 'red' });
  const pawnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
  registry.registerModel('pawn', new THREE.Mesh(pawnGeometry, pawnMaterial));
  ```

  The system will work without any changes, rendering static, non-animated pieces.

- **Strategy/RPG Games (Animated Models):** For more complex games, the user can register animated models loaded from files (e.g., `.gltf`). The `EntityRenderer` can be extended to manage animations.
  - The `ModelRegistry` would load the full `gltf` scene, including animations.
  - The `EntityRenderer` would store the `AnimationMixer` for each model instance.
  - Its `update(deltaTime)` method would be responsible for updating the mixers each frame.
  - It could expose methods like `playAnimation(entityId: string, animationName: string)` that could be called in response to game events.

## 5. Advanced Feature: Level of Detail (LOD)

The proposed design can be easily extended to support Level of Detail (LOD) for performance optimization, which is crucial for games with many entities.

- **`ModelRegistry`:** Can be adapted to store `THREE.LOD` objects. The user would register different levels of detail for a single `modelKey`.
- **`EntityRenderer`:** When creating a model instance, it would receive a `THREE.LOD` object from the registry and add it to the scene. Three.js automatically handles switching the visible mesh based on the camera's distance. The `EntityRenderer`'s `update` loop would need to be slightly modified to correctly handle the `LOD` object's position.

## 6. Conclusion

This proposal provides a robust and scalable solution for rendering entities in the `hexboard` library. By decoupling the core logic from rendering concerns and introducing an `EntityRenderer` and `ModelRegistry`, we achieve:

- **Strong Separation of Concerns:** Core game logic remains pure and independent of the rendering engine.
- **Flexibility:** The library user has full control over defining, loading, and managing 3D assets.
- **Scalability:** The architecture supports simple static models, complex animated characters, and performance optimizations like LOD.
