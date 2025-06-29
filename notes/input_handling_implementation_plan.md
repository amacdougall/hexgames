# Input Handling Implementation Plan

## Overview

This document provides a step-by-step guide for a junior developer to implement the input handling system as described in the `input_handling_proposal.md`. The goal is to translate 3D scene interactions (mouse clicks) into logical hex grid coordinates that the game logic can consume.

We will follow the phased approach outlined in the proposal. Please complete the tasks in order for each phase.

## Phase 1: Basic Click Detection

The goal of this phase is to implement the core functionality of detecting a click on a hex cell and retrieving its coordinates.

### 1.1. Enhance `BoardRenderer` to Store Coordinates

**File to Edit:** `packages/hexboard/src/rendering/boardRenderer.ts`

**Task:** Modify the `renderHexCell` method to attach the cell's `HexCoordinates` to the `userData` property of the `THREE.Mesh` object it creates. This will allow us to easily identify a cell when its mesh is intersected by a raycaster.

**Instructions:**
1.  Locate the `renderHexCell` method.
2.  After the `THREE.Mesh` (often named `mesh`) is created, add the following line:
    ```typescript
    // Store coordinates in mesh for input handling
    mesh.userData.coordinates = coordinates;
    ```

### 1.2. Implement the `InputHandler` Class

**File to Edit:** `packages/hexboard/src/rendering/inputHandler.ts`

**Task:** Flesh out the `InputHandler` class to manage mouse events, perform raycasting, and trigger callbacks.

**Instructions:**
1.  Define the class structure with the private properties outlined in the proposal (`renderer`, `camera`, `scene`, `raycaster`, `mouse`, and the event callbacks).
2.  Implement the constructor to initialize these properties. It should accept the `WebGLRenderer`, `PerspectiveCamera`, and `Scene` as arguments.
3.  Add a public method, let's call it `initialize()`, that sets up the DOM event listeners for mouse movements and clicks on the renderer's canvas.
4.  Implement a private method for the click handler. This method should:
    *   Update the `this.mouse` vector with the corrected coordinates of the mouse click.
    *   Configure and use `this.raycaster` to find intersected objects in the scene.
    *   Check if the first intersected object has `userData.coordinates`.
    *   If coordinates are present, invoke the `onCellClick` callback with them.
5.  Add a `dispose()` method to clean up the event listeners when the handler is no longer needed.

### 1.3. Integrate `InputHandler` with `HexBoard`

**File to Edit:** `packages/hexboard/src/hexBoard.ts`

**Task:** Create an instance of the `InputHandler` within the `HexBoard` and connect its events to the board's logic.

**Instructions:**
1.  Add a private `inputHandler` property to the `HexBoard` class.
2.  In the `HexBoard`'s `init` method (or wherever the renderer and scene are available), instantiate the `InputHandler`, passing the required `renderer`, `camera`, and `scene` objects.
3.  Call the `inputHandler.initialize()` method you created in the previous step.
4.  Assign a new method in `HexBoard`, `handleCellClick`, to the `inputHandler.onCellClick` callback.
5.  Implement the `private handleCellClick(coords: HexCoordinates)` method. For now, a simple `console.log` of the coordinates is sufficient to verify that the system is working.

### 1.4. Testing for Phase 1

**Task:** Manually test the implementation in a sample application.

**Instructions:**

1.  Run the `hexboard-test` application.
2.  Open the browser's developer console.
3.  Click on various hex cells on the board.
4.  Verify that the hex coordinates for the clicked cells are being logged to the console.

## Phase 2: Hover Events and Visual Feedback

The goal of this phase is to provide users with visual feedback when they hover over cells.

### 2.1. Extend `InputHandler` for Hover Events

**File to Edit:** `packages/hexboard/src/rendering/inputHandler.ts`

**Task:** Add logic to the `InputHandler` to track the currently hovered cell and trigger hover events.

**Instructions:**
1.  Add a private property `hoveredHex` to store the coordinates of the currently hovered cell.
2.  In your `initialize` method, add an event listener for `mousemove`.
3.  The `mousemove` handler will be similar to the click handler:
    *   It will perform raycasting on every mouse move.
    *   It will determine which cell (if any) is under the cursor.
    *   It must include logic to detect when the mouse enters a new cell or leaves a cell.
    *   When the hovered cell changes, invoke the `onCellHover` callback with the new cell's coordinates, or `null` if the cursor is no longer over any cell.

### 2.2. Implement Visual Feedback

**File to Edit:** `packages/hexboard/src/hexBoard.ts`

**Task:** Use the `onCellHover` event to change the appearance of the hovered cell.

**Instructions:**

1.  In `HexBoard`, assign a new method, `handleCellHover`, to the `inputHandler.onCellHover` callback.
2.  The `handleCellHover` method will receive coordinates or `null`.
3.  You will need a way to change the color or material of a specific cell's mesh. This requires a way to look up a mesh by its coordinates.
4.  **TODO:** The current `BoardRenderer` does not provide a way to get a mesh by its coordinates. A child document should be created to detail the plan for a `MeshRegistry` or a similar mechanism within `BoardRenderer` to manage and retrieve cell meshes. For now, you can implement a simple, less efficient solution like searching through `scene.children`.

## Phase 3: Advanced Interactions

This phase is currently out of scope for the initial implementation.

*   **TODO:** A detailed design document should be created for advanced interactions like dragging, multi-select, and handling keyboard modifiers before implementation begins. This document will serve as a proposal for how to extend the `InputHandler` and `HexBoard` to support these more complex features.

