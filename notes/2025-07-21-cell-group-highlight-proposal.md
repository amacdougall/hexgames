# Cell Group Highlight Design Proposal

**Date:** 2025-07-21

## 1. Overview

This document outlines a design for a robust cell group highlighting system. The current `HighlightStrategy` operates on individual objects, which is insufficient for effects that require contextual awareness of a cell's neighbors, such as drawing a boundary around a selected group.

The proposed design introduces a system capable of analyzing a group of logical `Cell` objects to determine their collective boundary. The output of this analysis will be a versatile data structure that can be consumed by new, more powerful rendering strategies to create a wide range of visual effects, from simple boundary lines to more complex animations.

## 2. Core Problem: Boundary Detection

The fundamental challenge is to identify which edges of which hexagonal cells lie on the exterior of a given selection. An edge is on the boundary if the cell on one side of the edge is in the selection, and the cell on the other side is not.

### 2.1. Boundary Detection Algorithm

A straightforward and efficient algorithm can be used to solve this:

1.  **Input:** A collection of selected `Cell` objects.
2.  **Preparation:** Convert the input collection of cells into a `Set` of cell IDs for O(1) average time complexity lookups.
3.  **Iteration:** For each `cell` in the original input collection:
    a. Retrieve its six neighbors from the `HexGrid`.
    b. For each of the six `neighbor` directions (e.g., North, Northeast, etc.):
    i. If the neighbor does not exist on the grid or its ID is *not* in the selection `Set`, then the face corresponding to that direction is a boundary face.
4.  **Output:** A data structure mapping each selected cell to its set of boundary faces.

This algorithm correctly handles non-contiguous selections by design. If the selection contains multiple "islands" of cells, the process will independently identify the complete boundary for each island.

### 2.2. Proposed Data Structure for Boundary Representation

To maximize flexibility for rendering strategies, the output of the boundary detection function should not be pre-rendered geometry. Instead, it should be a logical representation of the boundary.

I propose the following output structure:

```typescript
// A map where the key is the string ID of a cell in the selection,
// and the value is a set of directions representing its boundary faces.
type BoundaryMap = Map<string, Set<Direction>>;

// Direction enum to represent the six faces of a hexagon.
enum Direction { North, Northeast, Southeast, South, Southwest, Northwest }
```

This `BoundaryMap` is highly versatile. A rendering strategy can use it to:
*   Draw lines along the boundary by finding the vertices of each face.
*   Place special markers (e.g., `THREE.Sprite` or `THREE.Mesh`) at the corners where boundary faces meet.
*   Apply a different material or texture to only the boundary faces of a tile mesh, if the geometry is structured to support it.

## 3. High-Level Implementation Plan

### 3.1. Core Logic

A new utility function should be created, likely as a static method or in a dedicated `hex-utils.ts` file, to encapsulate the boundary detection logic.

TODO: why not in HexGrid?

-   **`HexUtils.findBoundaryFaces(cells: Cell[], grid: HexGrid): BoundaryMap`**
    -   **Description:** Implements the boundary detection algorithm described in section 2.1. It takes a list of cells and the grid context and returns the `BoundaryMap`.

### 3.2. Layout and Coordinate Conversion

The `rendering/layout.ts` module will need a new helper function to translate a logical face into world-space coordinates.

-   **`layout.getHexFaceVertices(cell: Cell, direction: Direction): [THREE.Vector3, THREE.Vector3]`**
    -   **Description:** Calculates the two 3D world-space vertices that define a specific face of a given hex cell. This will be crucial for drawing lines or placing objects along the boundary. It will use the cell's center, elevation, and the hex geometry constants.

### 3.3. Rendering Strategy

The existing `HighlightStrategy` should be complemented by a new, more powerful strategy interface for group-based effects.

-   **`GroupHighlightStrategy` (Interface)**
    -   **Description:** Defines a contract for strategies that create visual effects for a group of cells.
    -   **`apply(cells: Cell[], grid: HexGrid): THREE.Object3D`**: The core method. It receives the logical data, performs its calculations (likely using `findBoundaryFaces`), generates a `THREE.Object3D` representing the visual effect, and returns it.
    -   **`remove(effect: THREE.Object3D, scene: THREE.Scene)`**: A method to properly dispose of the geometry and materials created by `apply` and remove the object from the scene.

-   **`BoundaryLineStrategy` (Concrete Class)**
    -   **Description:** A default implementation of `GroupHighlightStrategy`.
    -   Its `apply` method will use `findBoundaryFaces` and `getHexFaceVertices` to generate a `THREE.Group` containing `THREE.Line` meshes that outline the selection.

### 3.4. `BoardRenderer` Integration

The `BoardRenderer` will orchestrate the use of these new strategies.

-   It should be initialized with a `GroupHighlightStrategy`.
-   It will need a way to manage the lifecycle of the created highlight effects. A `Map` to track active effects is appropriate.
    -   `private activeGroupHighlights: Map<string, THREE.Object3D> = new Map();` (The key could be a unique ID for the highlight group).
-   **`addHighlightGroup(groupId: string, cells: Cell[]): void`**
    -   **Description:** Takes a list of cells to highlight. It invokes the `groupHighlightStrategy.apply()` method, adds the returned `THREE.Object3D` to the scene, and stores it in the `activeGroupHighlights` map.
-   **`removeHighlightGroup(groupId: string): void`**
    -   **Description:** Looks up the effect by its ID, calls the strategy's `remove` method to dispose of its resources, and removes it from the `activeGroupHighlights` map.

This design provides a clean separation of concerns: boundary logic is decoupled from rendering, and the `BoardRenderer` remains the single authority for managing objects in the `THREE.Scene`.
