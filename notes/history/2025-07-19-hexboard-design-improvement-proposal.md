# Hexboard Design Improvement Proposal

**Date:** 2025-07-19

**Author:** GitHub Copilot

## 1. Overview

The `hexboard` library aims to provide a robust foundation for hexagonal
grid-based games, with the `HexBoard` class serving as the primary public-facing
API. The core design philosophy emphasizes a separation of concerns between game
logic and rendering.

Currently, the responsibility of creating and managing `EntityManager` and
`EntityRenderer` instances falls to the consuming application. This approach
deviates from the facade pattern, requiring the application to understand and
wire together multiple components of the library, which increases boilerplate
and couples the application more tightly to the library's internal structure
than is ideal.

This proposal outlines a refactoring to integrate entity management directly
into the `HexBoard` class. This will centralize control, simplify the public
API, and strengthen the library's adherence to its design goals, making it
easier for developers to build games upon this foundation.

## 2. Analysis of Current Design

The test application `apps/hexboard-test/src/main.ts` demonstrates the current
usage pattern:

1.  An `HexBoard` instance is created.
2.  Separately, an `EntityManager` is created to manage game entities.
3.  A `ModelRegistry` is created and populated with 3D models.
4.  An `EntityRenderer` is created, linking the `EntityManager`, the
    `ModelRegistry`, and the `THREE.Scene` obtained from the `HexBoard`'s
    `BoardRenderer`.
5.  Application logic, such as the `handleCellClick` function, directly
    manipulates both `hexBoard` and `entityManager` to handle game state
    changes.

This design has several drawbacks:

- **Leaky Abstraction:** The application must have knowledge of `EntityManager`,
  `EntityRenderer`, and their dependencies. The `HexBoard` fails to act as a
  complete facade for the library's core features.
- **Increased Boilerplate:** Every application using the library must repeat the
  setup logic for creating and connecting the entity management systems.
- **Complex Data Flow:** The application logic becomes a central hub for
  coordinating between the `HexBoard` and the `EntityManager`, instead of
  interacting with a single, unified system.

## 3. Proposed Refactoring

The core of this proposal is to make `HexBoard` responsible for the entire
lifecycle of the grid, cells, and entities.

### 3.1. `HexBoard` Class Enhancements

The `HexBoard` class will be updated to internally manage `EntityManager` and
`EntityRenderer`.

- **Internal Instances:** `HexBoard` will have private instances of
  `EntityManager` and `EntityRenderer`.
- **Initialization:** The `HexBoard.init()` method will be the ideal place to
  instantiate these components. To support entity rendering, `init()` should be
  updated to accept a `ModelRegistry` provided by the application. This
  preserves the dependency injection pattern for assets.
- **Lifecycle Management:** `HexBoard` will manage the creation of
  `EntityManager` and `EntityRenderer`, wiring them together with the
  `BoardRenderer`'s scene automatically. The `dispose` method will also be
  updated to clean up these new components.

### 3.2. Public API for Entity Management

`HexBoard` will expose a new set of public methods for entity management. These
methods will delegate to the internal `EntityManager` and `EntityRenderer`
instances.

**Proposed new methods for `HexBoard`:**

```typescript
// To be added to HexBoard class
public addEntity(definition: EntityDefinition): Entity | undefined;
public removeEntity(entityId: string): boolean;
public moveEntity(entityId: string, toCell: Cell): void;
public getEntityById(entityId: string): Entity | undefined;
public getEntitiesAt(cellId: string): Entity[];
public getAllEntities(): Entity[];

// For movement-specific logic, mirroring EntityManager
public startEntityMovement(entityId: string, reachableHexes: HexCoordinates[]): void;
public cancelEntityMovement(entityId: string): void;
public getEntityMovementDestinations(entityId: string): HexCoordinates[];
```

### 3.3. Revised Data Flow

With these changes, the data flow for an action like moving an entity becomes
much cleaner:

1.  **Input:** A user clicks a cell.
2.  **Event:** `InputHandler` captures the click and invokes the `onCellClick`
    callback on `HexBoard`.
3.  **Action:** The application's logic within `onCellClick` (which could be a
    strategy injected into `HexBoard`) calls `hexBoard.moveEntity(...)`.
4.  **State Update:** `HexBoard` delegates the call to its internal
    `EntityManager`, which updates the logical position of the entity and emits
    an `entityMoved` event.
5.  **Render:** The `EntityRenderer`, which was initialized to listen to the
    `EntityManager`, catches the event and updates the 3D position of the
    entity's model in the scene.

This revised flow places `HexBoard` firmly as the central controller, as
intended by the original system brief.

## 4. Example Usage (After Refactoring)

The application code in `apps/hexboard-test/src/main.ts` would be significantly
simplified.

**Before:**

```typescript
// apps/hexboard-test/src/main.ts (current)
let entityManager: EntityManager<GameCellProps>;
let entityRenderer: EntityRenderer<GameCellProps>;
let hexBoard: HexBoard<GameCellProps>;

// ...
entityManager = new EntityManager();
const modelRegistry = new ModelRegistry();
modelRegistry.registerModel('dodecahedron', createDodecahedronModel());
entityRenderer = new EntityRenderer(
  entityManager,
  modelRegistry,
  hexBoard.getRenderer().getScene()
);
// ...
entityManager.moveEntity(entity.id, cell);
```

**After:**

```typescript
// apps/hexboard-test/src/main.ts (proposed)
let hexBoard: HexBoard<GameCellProps>;

// ...
const modelRegistry = new ModelRegistry();
modelRegistry.registerModel('dodecahedron', createDodecahedronModel());
hexBoard = new HexBoard(new GameColorStrategy());
await hexBoard.init('hexboard-container', modelRegistry); // Pass registry
// ...
hexBoard.moveEntity(entity.id, cell);
```

## 5. Benefits

- **Improved Encapsulation:** The internal workings of entity management are
  hidden behind the `HexBoard` facade, leading to a cleaner separation of
  concerns.
- **Simplified API:** Game developers will have a single, primary class to
  interact with, reducing the learning curve and potential for errors.
- **Reduced Boilerplate:** The setup for a basic board with entities becomes
  much more concise.
- **Enhanced Extensibility:** With a solid, unified foundation, adding more
  complex, game-specific logic via injected strategies or event listeners
  becomes more straightforward. This better positions the `hexboard` library to
  serve as a base for a wide variety of turn-based games.
