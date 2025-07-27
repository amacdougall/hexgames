# Hexboard Movement Proposal

**Date:** 2025-07-08

**Audience:** Technical leads and contributors to the `hexboard` library.

**Author:** GitHub Copilot

This document outlines the proposed implementation of entity movement in the
`hexboard` library and a corresponding demo in `hexboard-test`. The goal is to
introduce a "movement mode" for entities, allowing them to highlight possible
destinations and move to a selected hex.

## Objectives

1. **Entity Movement Mode:**
   - Highlight the entity and its possible movement destinations.
   - Allow movement to a selected destination hex.
   - Update the logical `HexGrid` and re-render the entity model.

2. **Demo in `hexboard-test`:**
   - Render a simple entity (a metallic dodecahedron) to a random tile on app
     load.
   - Enter movement mode when the entity's hex is clicked.
   - Allow movement to hexes within two steps, respecting the "impassable"
     property.

## Implementation Plan

### 1. Core Changes to `hexboard`

#### 1.1. Entity Movement Mode

- **New State in `Entity`:** Add a `isInMovementMode` boolean property to the
  `Entity` interface to track whether the entity is in movement mode.

- **New State in `EntityManager`:** Add private state to `EntityManager` to
  track the active movement session, including the entity and its available
  destinations.

- **Initiating Movement:** Add a method
  `startMovement(   entityId: string,   availableDestinations: HexCoordinates[] ): void`
  to `EntityManager`. This method will:
  - Accept an entity's ID and an array of `HexCoordinates` as input.
  - Store the available destinations for the entity's movement session.
  - Set the entity's `isInMovementMode` property to `true`.

- **Movement Logic:** Update the existing
  `moveEntity(entityId: string, newCell: Cell): void` method in `EntityManager`.
  It will be enhanced to:
  - Validate that the destination cell is within the entity's stored available
    destinations for the current movement session.
  - Update the entity's position in the grid's spatial map.
  - Clear the movement session state and set the entity's `isInMovementMode`
    property to `false`.

#### 1.2. Pathfinding Utilities

To assist the application in calculating valid destinations, `hexboard` will
provide optional pathfinding utilities.

- **New Method in `HexGrid`:** Add a method
  `getReachableHexes(   start: HexCoordinates,   range: number,   options?: { respectImpassable?: boolean } ): HexCoordinates[]`.
  This method will:
  - Perform a breadth-first search (BFS) from the starting coordinate.
  - Return all hexes within the specified range.
  - Optionally respect the `isImpassable` flag on cells.
  - The application can use this as a starting point and apply its own
    game-specific logic to filter the results before passing them to
    `EntityManager.startMovement`.

#### 1.3. Input Handling

The existing `InputHandler` is sufficient. It will continue to detect clicks on
hex tiles and notify the application. The application will be responsible for
handling these events and implementing the movement logic, such as determining
if a clicked hex contains an entity or is a valid destination.

### 2. Rendering Changes

#### 2.1. Application-Defined Render Effects

To give the application full control over visual effects, `hexboard` will use an
injectable strategy pattern for custom rendering logic. This will be implemented
first for movement highlighting, but can be extended to other visual effects in
the future.

- **New `HighlightStrategy` Interface:** A new interface, `HighlightStrategy`,
  will be defined in the library:

  ```typescript
  interface HighlightStrategy {
    apply(object: THREE.Object3D): void;
    remove(object: THREE.Object3D): void;
  }
  ```

- **Update `BoardRenderer`:** The `BoardRenderer` will accept an optional
  `HighlightStrategy` in its constructor.
  - If no strategy is provided, a default implementation (e.g., applying an
    emissive glow) will be used.
  - The `BoardRenderer` will be responsible for _when_ to apply the highlight
    (i.e., when `startMovement` is active) by calling the strategy's `apply` and
    `remove` methods on the appropriate entity and cell meshes.

- **Default Strategy:** The package will provide a default `HighlightStrategy`
  which applies a yellow glow.

- **Application Responsibility:** The application may provide a concrete
  implementation of the `HighlightStrategy`. This gives the application
  developer full control over _how_ objects are highlighted, allowing for custom
  shaders, outlines, or any other visual effect.

#### 2.2. Re-rendering

- Ensure that `EntityRenderer` updates the entity's position in the 3D scene
  when it is moved in the logical grid.

### 3. Demo in `hexboard-test`

#### 3.1. Setup

- Create a simple entity represented by a metallic dodecahedron.
- Place the entity on a random tile when the app loads.

#### 3.2. Movement Mode

- When the entity's hex is clicked, the application will:
  - Call `HexGrid.getReachableHexes` to get all hexes within two steps,
    respecting impassable tiles.
  - In this simple demo, no further filtering is needed, so the application will
    immediately call `EntityManager.startMovement` with the returned hexes.
- The `BoardRenderer` will then highlight the entity and the valid movement
  destinations provided by the application.

#### 3.3. Movement

- When in movement mode, if a valid destination hex is clicked, the application
  will call `EntityManager.moveEntity` to move the entity to that cell in the
  logical grid.
- When in movement mode, if an invalid destination hex is clicked, the
  application will call a new method `cancelMovement(entityId: string)` on
  `EntityManager` to exit movement mode.
- Remember to preserve the unidirectional dataflow: input events change the game
  state, which is later rendered during the render loop.

### 4. Testing

#### 4.1. Unit Tests

- Add unit tests for `startMovement`, `moveEntity`, `cancelMovement`, and
  `getReachableHexes` in `EntityManager` and `HexGrid`.

#### 4.2. Integration Tests

- Add integration tests to verify the connection between `EntityManager`,
  `HexGrid`, `InputHandler`, and `BoardRenderer` during movement.

#### 4.3. Demo Validation

- Manually test the demo in `hexboard-test` to ensure that the entity can:
  - Enter movement mode.
  - Highlight valid destinations.
  - Move to a selected destination.

## Later Improvements

- Rename `Entity.cellPosition` to `Entity.cell` to reflect its actual value.

## Summary

This proposal introduces a movement mode for entities in `hexboard`, enabling
them to highlight and move to valid destinations. The implementation will
involve changes to the core logic, rendering, and input handling systems, as
well as a demo in `hexboard-test` to validate the functionality.
