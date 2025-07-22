# Hexboard System Brief

**Date:** 2025-07-22

**Audience:** AI coding agents contributing to the `hexboard` library.

**Author:** Updated by Claude Sonnet 4 based on current codebase state.
Originally written by Gemini 2.5 Pro with some human edits and addenda. The
original prompt can be found at the bottom of this document.

This document provides a technical overview of the `hexboard` library, its
architecture, and its core components. The library is designed to provide a
foundation for turn-based games on a 3D hexagonal grid, running in a web
browser.

## Core Philosophy

The `hexboard` library is built on a principle of separation of concerns. The
core logic of the game state is decoupled from the rendering engine. This allows
for a unidirectional data flow:

1.  **Input:** User interactions (e.g., mouse clicks) are captured by the
    rendering layer.
2.  **State Update:** The input is translated into actions that modify the
    logical game state (e.g., moving a unit).
3.  **Render:** The rendering engine observes changes in the game state and
    updates the 3D visualization accordingly.

The `HexBoard` class orchestrates the interaction between the logical and
rendering systems. This class is the primary interaction point for application
which use this library.

### Usage

Exact library usage patterns are still evolving, but in general we expect
applications to expand upon the capabilities of the `hexboard` library through
dependency injection, including but not limited to the Strategy pattern.

## System Architecture

The system is divided into two main domains: **Core (Game Logic)** and
**Rendering**.

### 1. Core (Game Logic)

The core domain is responsible for representing the abstract game board and its
state. It is environment-agnostic and contains no rendering-specific code.

#### 1.1. Coordinate System (`src/core/coordinates.ts`)

The foundation of the grid is the coordinate system. We use a 3-axis cubic
coordinate system (`q`, `r`, `s`) for all logical operations. This system is
elegant because it ensures that `q + r + s = 0` for any valid hex on the grid.
See https://www.redblobgames.com/grids/hexagons/ for much more information.

- **`HexCoordinates`**: Interface for cubic coordinates.
- **`axialToCubic()`**: A utility to convert from 2-axis axial coordinates
  (often used for storage or definition) to our internal 3-axis cubic
  representation.
- **`isValidHexCoordinate()`**: A validator to enforce the `q + r + s = 0`
  invariant.

#### 1.2. Cells (`src/core/cell.ts`)

Cells are the individual tiles of the hexagonal grid.

- **`CellDefinition`**: A plain object interface used to define a cell's initial
  properties when creating a map. It uses axial coordinates (`q`, `r`).
- **`Cell`**: The internal representation of a cell. It extends `HexCoordinates`
  and includes properties like `id`, `elevation`, `movementCost`,
  `isImpassable`, and a generic `customProps` object for game-specific data.

#### 1.3. The Grid (`src/core/hexGrid.ts`)

`HexGrid` is the container and manager for all `Cell` objects.

- It stores cells in a `Map` keyed by a unique string ID generated from the
  cell's coordinates.
- It handles the creation of cells from `CellDefinition` objects, applying
  default values for properties like elevation and movement cost.
- It provides methods for adding, removing, and retrieving cells.

#### 1.4. Entities (`src/core/entity.ts`)

Entities represent dynamic game objects that reside on cells (e.g., characters,
items).

- **`EntityDefinition`** and **`Entity`**: Similar to cells, these interfaces
  define the data for creating and representing entities. Entities have an ID,
  position on the grid, movement properties, and can have `customProps`.
  Entities support `modelKey` for linking to 3D models in the rendering system,
  and `isInMovementMode` to track whether they're currently in a movement
  session.
- **`EntityManager`**: A manager class responsible for the lifecycle of
  entities. It tracks all entities and their positions on the grid (mapping cell
  IDs to entity IDs). It provides methods to create, delete, move, and query
  entities. The EntityManager supports sophisticated movement sessions where
  entities can be put into "movement mode" with a list of valid destinations,
  allowing for turn-based movement validation.

### 2. Rendering

The rendering domain uses **Three.js** to create a 3D visualization of the state
held in the Core domain.

#### 2.1. Layout Conversion (`src/rendering/layout.ts`)

This module is the bridge between the logical grid and the 3D world.

- **`hexToWorld()`**: Converts `HexCoordinates` into a `THREE.Vector3` world
  position.
- **`worldToHex()`**: Converts a `THREE.Vector3` world position back into the
  nearest `HexCoordinates`.

This conversion is essential for placing objects in the 3D scene and for
translating user input (e.g., a click in the 3D world) back into a logical grid
coordinate. The current implementation assumes a "flat-top" hexagon orientation.

#### 2.2. Board Renderer (`src/rendering/boardRenderer.ts`)

`BoardRenderer` is responsible for rendering the `HexGrid` itself.

- It manages the `THREE.Scene`, `THREE.Camera`, and `THREE.WebGLRenderer`.
- It uses `OrbitControls` for camera manipulation (zoom, pan, rotate).
- It creates and manages `THREE.Mesh` objects for each cell in the `HexGrid`,
  storing them in a `Map`.
- It uses a strategy pattern for cell coloring, allowing for flexible and
  interchangeable coloring logic.
- It supports pluggable highlight strategies for visual effects, enabling
  highlighting of cells and entities.
- It integrates with EntityRenderer for automatic entity model updates during
  the render loop.
- It provides a comprehensive highlighting API for individual cells, multiple
  cells, and entities.
- It includes ground plane rendering functionality for creating base surfaces.

#### 2.3. Cell Coloring (`src/rendering/cellColorStrategy.ts`)

This defines the strategy for how cells are colored.

- **`CellColorStrategy`**: An interface that defines a single method,
  `getCellColor()`, which takes a `Cell` and returns a color.
- **`DefaultCellColorStrategy`**: The default implementation, which colors cells
  based on a combination of `isImpassable` (water) and `elevation` (from
  lowlands to mountains).
- **`ElevationColorStrategy`**: A simpler strategy that only considers
  elevation.

#### 2.4. Highlight Strategies (`src/rendering/highlightStrategy.ts`)

This defines the strategy system for visual effects and highlighting.

- **`HighlightStrategy`**: An interface defining `apply()` and `remove()`
  methods for adding and removing visual effects from THREE.Object3D objects.
- **`DefaultHighlightStrategy`**: The default implementation that adds a bright
  yellow emissive glow to highlighted objects and restores original materials
  when highlighting is removed.

#### 2.5. Entity Rendering (`src/rendering/entityRenderer.ts` and `src/rendering/modelRegistry.ts`)

This system handles the visual representation of entities.

- **`ModelRegistry`**: A registry for 3D model assets. It can hold pre-loaded
  `THREE.Object3D` models or URLs to GLTF files for asynchronous loading. This
  allows for efficient reuse of model data. It includes model metadata caching
  with `bottomOffset` values to optimize entity positioning calculations.
- **`EntityRenderer`**: This class observes an `EntityManager`. When entities
  are added, removed, or moved in the logical state, the `EntityRenderer`
  creates, destroys, or repositions their corresponding 3D models in the
  `THREE.Scene`. It uses the `ModelRegistry` to get the appropriate model for
  each entity. It properly positions entities so their bottom sits precisely on
  the top surface of hex tiles, using cached model metadata for performance.

#### 2.6. Input Handling (`src/rendering/inputHandler.ts`)

`InputHandler` captures browser mouse events and translates them into
grid-specific events.

- It uses a `THREE.Raycaster` to determine which hex mesh in the 3D scene is
  under the mouse cursor.
- It converts the intersection point from world coordinates to hex coordinates
  using `worldToHex()`.
- It provides `onCellClick` and `onCellHover` callbacks, which are the primary
  mechanism for feeding user input back into the game's control flow.

### 3. The Main `HexBoard` Class (`src/hexBoard.ts`)

`HexBoard` is the high-level façade that simplifies the creation and management
of a hex board.

- It instantiates and holds references to the `HexGrid`, `BoardRenderer`,
  `InputHandler`, `EntityManager`, and optionally `EntityRenderer`.
- It provides a simple `init()` method to set up the rendering canvas in the DOM
  and optionally accept a `ModelRegistry` for entity rendering.
- It exposes a curated set of methods from the underlying systems, such as
  `getCellAtCoords()` from `HexGrid` and `renderAll()` from `BoardRenderer`.
- It provides a full entity management API including `addEntity()`,
  `removeEntity()`, `moveEntity()`, and sophisticated movement session
  management with `startEntityMovement()`, `cancelEntityMovement()`, and
  `getEntityMovementDestinations()`.
- It includes a complete render loop with `start()`, `stop()`, and automatic
  entity updates.
- This is the intended entry point for consumers of the library.

### 4. Map Definitions (`src/map/mapDefinition.ts`)

To facilitate creating and loading predefined game boards, the `MapDefinition`
interface is provided. It defines a structure for a JSON file that can specify:

- A map name.
- Default cell properties.
- A list of `CellDefinition` objects to populate the grid.

**NOTE**: This feature appears to be defined but may not be actively used in the
current implementation. The main usage pattern focuses on programmatic board
creation through the HexBoard API.

### 5. Testing (`/tests`)

The library is supported by a suite of tests written with **Jest**.

- **Unit Tests**: Core logic (`coordinates`, `cell`, `hexGrid`, `entity`) is
  thoroughly unit-tested.
- **Rendering Tests**: Rendering components are tested, but `three` and
  `three-stdlib` are mocked. This means we test the logic of our rendering
  classes, not the output of Three.js itself.
- **Integration Tests**: A small number of integration tests exist, for example,
  to verify the connection between `HexBoard` and the `InputHandler`.
- **Test Setup**: A `tests/setup.ts` file configures the `jsdom` environment
  with necessary browser mocks (like `requestAnimationFrame`) to allow
  Three.js-dependent code to run in Node.js. Mock type definitions are in
  `tests/types/mocks.ts`.

This structure provides a solid foundation for building and maintaining the
library. New contributors should familiarize themselves with the separation
between the `core` and `rendering` directories and respect the unidirectional
data flow paradigm.

# Original Prompt

`./packages/hexboard` is a library which provides a basis for development of
turn-based games (such as board games and RPGs) on a 3D grid. The target device
is the browser, and we are willing to assume a web browser context at all times
for now. It contains:

- classes dedicated to maintaining the logical game state, such as HexGrid
- classes dedicated to rendering the 3D scene based on the game state, such as
  BoardRenderer
- classes which can be used to integrate the two systems, such as InputHandler
- the HexBoard class is the "foundation" class which ties these two separate
  concerns together

With a few carefully chosen exceptions such as HexBoard, the game-logic and
rendering domains are intentionally separatated. We wish to maintain a
unidirectional dataflow, where input events in the browser cause game-state
updates, which are then rendered.

Based on this information, read _every_ source and test file in
`./packages/hexboard` and write a detailed description of the current state of
the system. Write this description from the perspective of a technical lead
giving onboarding documentation to a new developer. This is a guide for _code
contributors_, not game developers who wish to use the library.

Divide this guide into sections for each major area of functionality, beginning
with the abstract game logic.

Describe the current state of the system, without making plans for further
expansion.

Write this description to `./notes/2025-07-06-hexboard-system-brief.md`.
