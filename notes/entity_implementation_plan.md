# Entity Implementation Plan

This document outlines the plan for implementing entities in the `hexboard` package.

## 1. Core Implementation (`packages/hexboard/src/core`)

### 1.1. `entity.ts`

The current `Entity` interface is a good starting point.

```typescript
export interface Entity<CustomProps extends Record<string, any> = {}> {
  id: string;
  cellPosition: Cell<CustomProps>;
  model: THREE.Object3D;
  movementSpeed?: number;
}
```

However, the `model` property, which is a `THREE.Object3D`, introduces a
rendering concern into the core logic. This should be decoupled. The core
`Entity` should only contain data, not presentation details.

**Action:**

1.  Create a new `EntityDefinition` interface to represent the initial state of
    an entity.
2.  Modify the `Entity` interface to remove the `model` property and add a
    `type` property for categorization.
3.  Create a new `EntityManager` class to manage the lifecycle of entities,
    including creation, deletion, and retrieval. This class will be responsible
    for associating entities with cells.

The new `entity.ts` will look like this:

```typescript
// packages/hexboard/src/core/entity.ts

import { Cell } from './cell';

export interface EntityDefinition<CustomProps extends Record<string, any> = {}> {
  id: string;
  type: string;
  cellPosition: Cell<CustomProps>;
  movementSpeed?: number;
  customProperties?: CustomProps;
}

export interface Entity<CustomProps extends Record<string, any> = {}> {
  id: string;
  type: string;
  cellPosition: Cell<CustomProps>;
  movementSpeed: number;
  customProperties: CustomProps;
}

export class EntityManager<CustomProps extends Record<string, any> = {}> {
  private entities: Map<string, Entity<CustomProps>> = new Map();
  private entityPositions: Map<string, string> = new Map(); // cellId -> entityId

  constructor() {}

  addEntity(entityDef: EntityDefinition<CustomProps>): Entity<CustomProps> {
    // Implementation to create and add an entity
  }

  removeEntity(entityId: string): void {
    // Implementation to remove an entity
  }

  getEntity(entityId: string): Entity<CustomProps> | undefined {
    // Implementation to get an entity by ID
  }

  getEntitiesAt(cellId: string): Entity<CustomProps>[] {
    // Implementation to get all entities at a given cell
  }

  moveEntity(entityId: string, newCell: Cell<CustomProps>): void {
    // Implementation to move an entity to a new cell
  }
}
```

### 1.2. `hexGrid.ts`

The `HexGrid` should not be directly responsible for managing entities. This
should be delegated to the `EntityManager`.

**Action:**

1.  The `HexGrid` class will not be modified.
2.  The `HexBoard` class will compose both `HexGrid` and `EntityManager`,
    orchestrating interactions between them. For example, when moving an entity,
    `HexBoard` will use `HexGrid` to validate the path and `EntityManager` to
    update the entity's position.

### 1.3. `hexBoard.ts`

The `HexBoard` class will be the main entry point for interacting with the hex
grid and entities. It will act as a facade, simplifying the API by composing
`HexGrid` and `EntityManager` and delegating calls to the appropriate manager.
This provides a single point of interaction for the user and hides the
underlying complexity of the two separate managers.

**Action:**

1.  Update `hexBoard.ts` to instantiate and hold references to both a `HexGrid`
    and an `EntityManager`.
2.  The `HexBoard` will expose a unified API. Grid-specific methods will
    delegate to `HexGrid`, while entity-specific methods will delegate to
    `EntityManager`.

```typescript
// packages/hexboard/src/hexBoard.ts

import { HexGrid, CellDefinition } from './core/hexGrid';
import { EntityManager, EntityDefinition, Entity } from './core/entity';
import { Cell } from './core/cell';

export class HexBoard<CustomProps extends Record<string, any> = {}> {
  private grid: HexGrid<CustomProps>;
  private entityManager: EntityManager<CustomProps>;

  constructor() {
    this.grid = new HexGrid<CustomProps>();
    this.entityManager = new EntityManager<CustomProps>();
  }

  // --- Grid Methods ---

  addCell(cellDef: CellDefinition<CustomProps>): Cell<CustomProps> {
    return this.grid.addCell(cellDef);
  }

  getCell(q: number, r: number): Cell<CustomProps> | undefined {
    return this.grid.getCell(q, r);
  }

  // --- Entity Methods ---

  addEntity(entityDef: EntityDefinition<CustomProps>): Entity<CustomProps> {
    const cell = this.grid.getCell(entityDef.cellPosition.q, entityDef.cellPosition.r);
    if (!cell) {
      throw new Error('Entity must be placed on a valid cell.');
    }
    // Ensure the entity definition uses the actual cell from the grid
    const definitionWithCell = { ...entityDef, cellPosition: cell };
    return this.entityManager.addEntity(definitionWithCell);
  }

  moveEntity(entityId: string, newCellCoords: { q: number; r: number }): void {
    const newCell = this.grid.getCell(newCellCoords.q, newCellCoords.r);
    if (!newCell) {
      throw new Error('Invalid target cell for entity movement.');
    }
    this.entityManager.moveEntity(entityId, newCell);
  }

  // ... other grid and entity methods
}
```

## 2. Rendering Implementation (`packages/hexboard/src/rendering`)

### 2.1. `boardRenderer.ts`

The `BoardRenderer` will be responsible for rendering the visual representation
of entities. It will need a way to map entity types to 3D models.

**Action:**

1.  Create a new `EntityRenderer` class to handle the rendering of entities.
    This class will be responsible for creating and managing the
    `THREE.Object3D` instances for each entity.
2.  The `BoardRenderer` will instantiate and use the `EntityRenderer`.
3.  The `BoardRenderer` will have a method to register entity models by type.

```typescript
// packages/hexboard/src/rendering/entityRenderer.ts

import * as THREE from 'three';
import { Entity } from '../core/entity';
import { hexToWorld } from './layout';

export class EntityRenderer<CustomProps extends Record<string, any> = {}> {
  private scene: THREE.Scene;
  private entityModels: Map<string, THREE.Object3D> = new Map();
  private modelRegistry: Map<string, THREE.Object3D> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  registerModel(entityType: string, model: THREE.Object3D) {
    this.modelRegistry.set(entityType, model);
  }

  addEntity(entity: Entity<CustomProps>) {
    const model = this.modelRegistry.get(entity.type);
    if (model) {
      const newModel = model.clone();
      const worldPos = hexToWorld(entity.cellPosition);
      newModel.position.set(worldPos.x, 0, worldPos.y);
      this.scene.add(newModel);
      this.entityModels.set(entity.id, newModel);
    }
  }

  removeEntity(entityId: string) {
    const model = this.entityModels.get(entityId);
    if (model) {
      this.scene.remove(model);
      this.entityModels.delete(entityId);
    }
  }

  updateEntityPosition(entity: Entity<CustomProps>) {
    const model = this.entityModels.get(entity.id);
    if (model) {
      const worldPos = hexToWorld(entity.cellPosition);
      model.position.set(worldPos.x, 0, worldPos.y);
    }
  }
}
```

The `BoardRenderer` will be updated to use the `EntityRenderer`.

```typescript
// packages/hexboard/src/rendering/boardRenderer.ts

// ... imports
import { EntityRenderer } from './entityRenderer';
import { Entity } from '../core/entity';

export class BoardRenderer<CustomProps extends object = Record<string, never>> {
  // ... existing properties
  private entityRenderer: EntityRenderer<CustomProps>;

  constructor(
    hexGrid: HexGrid<CustomProps>,
    colorStrategy?: CellColorStrategy<CustomProps>
  ) {
    // ... existing constructor logic
    this.entityRenderer = new EntityRenderer(this.scene);
  }

  registerEntityModel(entityType: string, model: THREE.Object3D) {
    this.entityRenderer.registerModel(entityType, model);
  }

  addEntity(entity: Entity<CustomProps>) {
    this.entityRenderer.addEntity(entity);
  }

  removeEntity(entityId: string) {
    this.entityRenderer.removeEntity(entityId);
  }

  updateEntityPosition(entity: Entity<CustomProps>) {
    this.entityRenderer.updateEntityPosition(entity);
  }

  // ... rest of the class
}
```

## 3. Execution Plan

1.  **Core:**
    1.  Implement the changes in `packages/hexboard/src/core/entity.ts`.
    2.  Implement the `EntityManager` class.
    3.  Update `packages/hexboard/src/hexBoard.ts` to use the `EntityManager`.
2.  **Rendering:**
    1.  Implement the `EntityRenderer` class in a new file `packages/hexboard/src/rendering/entityRenderer.ts`.
    2.  Update `packages/hexboard/src/rendering/boardRenderer.ts` to use the `EntityRenderer`.
3.  **Testing:**
    1.  Create new tests for the `EntityManager`.
    2.  Update existing tests to reflect the changes.
