# Hexboard Library Technical Design

_Draft - June 7, 2025_

## Workspace and Library Setup

To facilitate easy development of the `hexboard` library alongside client
applications within the same VS Code workspace, while allowing `hexboard` to be
an independently packaged library, we'll use a **monorepo setup**.

It should be possible to build and export individual application packages for
use in the web browser.

- **Tooling**: Utilize npm/yarn/pnpm workspaces. This allows `hexboard` to be a
  distinct package.
- **Local Linking**: Client applications within the monorepo can depend on a
  local version of `hexboard`. Changes in the `hexboard` source will be
  immediately available to the client application during development without
  needing to publish and reinstall.
  - Example: In the client application's `package.json`:
    `"dependencies": { "hexboard": "workspace:*" }` (syntax varies slightly by
    package manager).
- **Directory Structure (Conceptual)**:
  ```
  /your-monorepo-workspace
      package.json        // Root package.json for workspace config
      tsconfig.base.json  // Optional: base TypeScript config
      apps/
          hexboard-test/        // Example client application
              package.json    // Depends on hexboard
              src/
                  main.ts
      packages/
          hexboard/       // The hexboard library
              package.json
              tsconfig.json
              src/
                  // ... library code ...
  ```

## Additional Requirements

Provide placeholders for 3D model loading. These should be stubs at most.

Client applications will not scale beyond 200 hex cells and 50 entities. This is
a maximum, for safety; expected applications will be smaller.

## Coding Guidelines

Avoid the `any` type. Require client applications to use subclasses or subtypes
when providing additional behavior or data.

## `hexboard` Library Design

### Core Concepts & Data Structures

1. **Coordinates**:

   - We'll use **Cubic coordinates** for the hexagonal grid, as they are
     well-suited for algorithms.
   - A helper module will provide functions for coordinate manipulation,
     distance calculation, etc.

   ```typescript
   // filepath: packages/hexboard/src/core/coordinates.ts
   export interface HexCoordinates {
     q: number;
     r: number;
     s: number; // Invariant: q + r + s = 0
   }

   export function axialToCubic(q: number, r: number): HexCoordinates {
     return { q, r, s: -q - r };
   }
   // ... other conversion and utility functions
   ```

2. **Cell**: Represents the game-logic concept.

Review https://www.redblobgames.com/grids/hexagons/ for information about hex
geometry. In particular, review the "Spacing" heading,
https://www.redblobgames.com/grids/hexagons/#spacing.

- Hex cells will use the "flat top" orientation. Define spacing calculations
  accordingly.
- It will be generic, to allow client applications to define custom properties
  with type safety.

```typescript
// filepath: packages/hexboard/src/core/cell.ts
import { HexCoordinates } from './coordinates';

/**
 * Base properties for defining a cell in a map definition.
 * Optional properties will be filled with defaults during map processing.
 */
export interface CellDefinition<CustomProps extends Record<string, any> = {}> {
  q: number;
  r: number;
  s?: number; // Optional, can be derived: s = -q -r
  elevation?: number;
  movementCost?: number;
  isImpassable?: boolean;
  customProperties?: CustomProps;
}

/**
 * Represents a fully processed cell in the game logic grid.
 * All optional properties from CellDefinition are now mandatory, filled by defaults.
 */
export interface Cell<CustomProps extends Record<string, any> = {}>
  extends HexCoordinates {
  id: string; // Unique identifier, e.g., `${q},${r},${s}`
  elevation: number;
  movementCost: number;
  isImpassable: boolean;
  customProperties: CustomProps;
}
```

3. **Tile**: The 3D visual representation of a `Cell`.

   - A `THREE.Mesh` (e.g., `THREE.CylinderGeometry` with 6 sides or
     `THREE.ExtrudeGeometry` from a hexagonal shape).
   - Its vertical height will be determined by the `Cell`'s `elevation`.
   - Horizontal dimensions will be uniform.

4. **Entity**: Represents game characters or pieces.

   ```typescript
   // filepath: packages/hexboard/src/core/entity.ts
   import * as THREE from 'three';
   import { Cell } from './cell';

   export interface Entity<CustomProps extends Record<string, any> = {}> {
     id: string; // Unique ID for the entity
     cellPosition: Cell<CustomProps>; // The cell the entity is on
     model: THREE.Object3D; // Client-provided 3D model
     movementSpeed?: number; // Optional: distance an entity can travel (default: e.g., 5)
     // Potentially other common entity properties
   }
   ```

   - Clients will provide the `THREE.Object3D` for the `model`, allowing
     arbitrary 3D models.

### Separation of Concerns: Logic vs. Rendering

- **Logic Module (`HexGrid`)**:

  - Manages `Cell` data, grid structure, pathfinding, movement range
    calculations.
  - No direct three.js dependencies.

  ```typescript
  // filepath: packages/hexboard/src/core/hexGrid.ts
  import { HexCoordinates, Cell, CellDefinition } from './cell';
  import { MapDefinition } from '../map/mapDefinition';

  export class HexGrid<CustomProps extends Record<string, any> = {}> {
    private cells: Map<string, Cell<CustomProps>>; // Key: cell.id
    private defaultCellProps: Required<
      Omit<CellDefinition<CustomProps>, 'q' | 'r' | 's'>
    >;

    constructor(mapDefinition: MapDefinition<CustomProps>) {
      // ... Initialize cells from mapDefinition, applying defaults
    }

    getCell(coords: HexCoordinates): Cell<CustomProps> | undefined {
      /* ... */
    }
    addCell(cellDef: CellDefinition<CustomProps>): Cell<CustomProps> {
      /* ... */
    }
    removeCell(coords: HexCoordinates): boolean {
      /* ... */
    }
    updateCell(
      coords: HexCoordinates,
      updates: Partial<CellDefinition<CustomProps>>
    ): Cell<CustomProps> | undefined {
      /* ... */
    }

    // Logic methods
    findPath(
      startCoords: HexCoordinates,
      endCoords: HexCoordinates
    ): Cell<CustomProps>[] | null {
      // A* algorithm implementation
      return null; // Placeholder
    }

    getCellsInRange(
      startCoords: HexCoordinates,
      movementPoints: number
    ): Cell<CustomProps>[] {
      // BFS/Dijkstra-like algorithm implementation
      return []; // Placeholder
    }
  }
  ```

- **Rendering Module (`BoardRenderer`)**:

  - Manages the three.js `Scene`, `Camera`, `WebGLRenderer`, lights.
  - Creates/updates `Tile` meshes based on `Cell` data from `HexGrid`.
  - Renders `Entity` models.
  - Handles 3D navigation (zoom, pan, rotate).

  ```typescript
  // filepath: packages/hexboard/src/rendering/boardRenderer.ts
  import * as THREE from 'three';
  import { HexGrid } from '../core/hexGrid';
  import { Cell } from '../core/cell';
  import { Entity } from '../core/entity';

  export class BoardRenderer<CustomProps extends Record<string, any> = {}> {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private tiles: Map<string, THREE.Mesh>; // Key: cell.id
    private entities: Map<string, THREE.Object3D>; // Key: entity.id
    // ... OrbitControls or custom navigation logic

    constructor(container: HTMLElement, grid: HexGrid<CustomProps>) {
      // ... Initialize three.js scene, camera, renderer
      // ... Create initial tiles based on grid.cells
    }

    render(): void {
      this.renderer.render(this.scene, this.camera);
    }
    addTileForCell(cell: Cell<CustomProps>): void {
      /* ... create and add tile mesh ... */
    }
    removeTileForCell(cellId: string): void {
      /* ... remove tile mesh ... */
    }
    updateTileForCell(cell: Cell<CustomProps>): void {
      /* ... update tile mesh (e.g., height) ... */
    }

    addEntity(entity: Entity<CustomProps>): void {
      /* ... add entity.model to scene ... */
    }
    removeEntity(entityId: string): void {
      /* ... remove entity.model from scene ... */
    }
    updateEntityPosition(entity: Entity<CustomProps>): void {
      /* ... update model position ... */
    }

    // Navigation API
    zoom(delta: number): void {
      /* ... */
    }
    pan(deltaX: number, deltaY: number): void {
      /* ... */
    }
    rotate(deltaAzimuth: number, deltaPolar: number): void {
      /* ... */
    }

    // Raycasting for tile clicks
    getCellAtScreenPosition(
      screenX: number,
      screenY: number,
      grid: HexGrid<CustomProps>
    ): Cell<CustomProps> | null {
      // ... Use THREE.Raycaster, intersect with tile meshes
      return null; // Placeholder
    }
  }
  ```

### Setup and Definition

1. **Map Definition**:

   - **JSON** will be used for defining custom maps. It's human-readable and
     easily parsable.

   ```typescript
   // filepath: packages/hexboard/src/map/mapDefinition.ts
   import { CellDefinition } from '../core/cell';

   export interface MapDefaultSettings<
     CustomProps extends Record<string, any> = {},
   > {
     elevation: number;
     movementCost: number;
     isImpassable: boolean;
     customProperties: CustomProps; // Default custom properties for all cells
   }

   export interface MapDefinition<
     CustomProps extends Record<string, any> = {},
   > {
     name: string;
     defaults: MapDefaultSettings<CustomProps>;
     cells: CellDefinition<CustomProps>[];
   }
   ```

   - Example `map.json`:
     ```json
     {
       "name": "Starter Valley",
       "defaults": {
         "elevation": 1,
         "movementCost": 1,
         "isImpassable": false,
         "customProperties": { "terrainType": "grassland" }
       },
       "cells": [
         { "q": 0, "r": 0, "s": 0 },
         { "q": 1, "r": 0, "s": -1, "elevation": 1.5 },
         {
           "q": 0,
           "r": 1,
           "s": -1,
           "isImpassable": true,
           "customProperties": { "terrainType": "water" }
         }
       ]
     }
     ```

2. **Main Board Class (`HexBoard`)**: The primary API for the library.

   ```typescript
   // filepath: packages/hexboard/src/index.ts
   import { HexGrid } from './core/hexGrid';
   import { BoardRenderer } from './rendering/boardRenderer';
   import { InputHandler } from './rendering/inputHandler';
   import { MapDefinition } from './map/mapDefinition';
   import { Entity } from './core/entity';
   import { Cell, HexCoordinates, CellDefinition } from './core/cell';

   export class HexBoard<CustomProps extends Record<string, any> = {}> {
     public grid: HexGrid<CustomProps>;
     public renderer: BoardRenderer<CustomProps>;
     private inputHandler: InputHandler;
     private entities: Map<string, Entity<CustomProps>>; // Key: entity.id

     constructor(
       containerElement: HTMLElement,
       mapDefinition: MapDefinition<CustomProps>
     ) {
       this.grid = new HexGrid<CustomProps>(mapDefinition);
       this.renderer = new BoardRenderer<CustomProps>(
         containerElement,
         this.grid
       );
       this.inputHandler = new InputHandler(containerElement, this.renderer);
       this.entities = new Map();

       // Initial render of all cells from the grid
       this.grid
         .getAllCells()
         .forEach((cell) => this.renderer.addTileForCell(cell));
     }

     // Dynamic map modifications
     addCell(
       cellDef: CellDefinition<CustomProps>
     ): Cell<CustomProps> | undefined {
       const cell = this.grid.addCell(cellDef);
       if (cell) {
         this.renderer.addTileForCell(cell);
       }
       return cell;
     }

     removeCell(coords: HexCoordinates): boolean {
       const cellId = `${coords.q},${coords.r},${coords.s}`;
       const success = this.grid.removeCell(coords);
       if (success) {
         this.renderer.removeTileForCell(cellId);
       }
       return success;
     }

     updateCell(
       coords: HexCoordinates,
       updates: Partial<CellDefinition<CustomProps>>
     ): Cell<CustomProps> | undefined {
       const cell = this.grid.updateCell(coords, updates);
       if (cell) {
         this.renderer.updateTileForCell(cell);
       }
       return cell;
     }

     // Entity Management
     addEntity(
       entityData: Omit<Entity<CustomProps>, 'cellPosition'> & {
         initialPos: HexCoordinates;
       }
     ): Entity<CustomProps> | undefined {
       const cell = this.grid.getCell(entityData.initialPos);
       if (!cell) return undefined;

       const entity: Entity<CustomProps> = {
         ...entityData,
         id: entityData.id || crypto.randomUUID(), // Ensure ID
         cellPosition: cell,
         movementSpeed:
           entityData.movementSpeed === undefined
             ? 5
             : entityData.movementSpeed, // Default movement speed
       };
       this.entities.set(entity.id, entity);
       this.renderer.addEntity(entity);
       return entity;
     }

     removeEntity(entityId: string): void {
       if (this.entities.has(entityId)) {
         this.entities.delete(entityId);
         this.renderer.removeEntity(entityId);
       }
     }

     moveEntity(entityId: string, targetCoords: HexCoordinates): boolean {
       const entity = this.entities.get(entityId);
       const targetCell = this.grid.getCell(targetCoords);
       if (entity && targetCell && !targetCell.isImpassable) {
         entity.cellPosition = targetCell;
         this.renderer.updateEntityPosition(entity);
         return true;
       }
       return false;
     }

     // Event handling and game loop
     start(): void {
       const animate = () => {
         requestAnimationFrame(animate);
         // Any per-frame updates
         this.renderer.render();
       };
       animate();
     }

     // Tile click handling
     onTileClick(callback: (cell: Cell<CustomProps> | null) => void): void {
       this.inputHandler.onTileClick = (screenX, screenY) => {
         const cell = this.renderer.getCellAtScreenPosition(
           screenX,
           screenY,
           this.grid
         );
         callback(cell);
       };
     }
   }
   ```

### Rendering and Navigation

- **Rendering**: Done by `BoardRenderer` as described.
- **Navigation API**: Methods like `zoom`, `pan`, `rotate` on `BoardRenderer`.
- **Default Event Handlers**: An `InputHandler` class will listen for
  mouse/keyboard events on the renderer's DOM element and call the
  `BoardRenderer`'s navigation API.

  ```typescript
  // filepath: packages/hexboard/src/rendering/inputHandler.ts
  import { BoardRenderer } from './boardRenderer';

  export class InputHandler {
    public onTileClick?: (screenX: number, screenY: number) => void;

    constructor(domElement: HTMLElement, renderer: BoardRenderer<any>) {
      // Add mousedown, mousemove, mouseup, wheel, keydown listeners to domElement
      // These listeners will call renderer.zoom(), renderer.pan(), renderer.rotate()
      // For clicks, it will call this.onTileClick after converting to local coords.
      // Example for click:
      domElement.addEventListener('click', (event) => {
        if (this.onTileClick) {
          const rect = domElement.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          this.onTileClick(x, y);
        }
      });
    }
  }
  ```

- **Tile Click Handlers**: `BoardRenderer.getCellAtScreenPosition` will use
  `THREE.Raycaster`. The raycaster will be configured to intersect only with
  tile meshes, ignoring entities for this specific requirement.

### Logic Implementation

- **Find Cells in Movement Range**: `HexGrid.getCellsInRange` will use a
  Breadth-First Search (BFS) or Dijkstra-like algorithm, considering
  `movementCost` and `movementPoints`.
- **Pathfinding**: `HexGrid.findPath` will use the A\* (A-star) algorithm,
  incorporating `movementCost` and a suitable heuristic for hex grids (e.g.,
  Manhattan distance on cubic coordinates).
- **Extensible Cell Properties**: Achieved using generics (`Cell<CustomProps>`),
  allowing client applications to define and use their own strongly-typed custom
  data per cell.
