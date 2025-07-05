# Input Handling Implementation Plan

## Overview

This document provides a step-by-step guide for a junior developer to implement
the input handling system as described in the `input_handling_proposal.md`. The
goal is to translate 3D scene interactions (mouse clicks) into logical hex grid
coordinates that the game logic can consume.

We will follow the phased approach outlined in the proposal. Please complete the
tasks in order for each phase.

## Phase 1: Basic Click Detection

The goal of this phase is to implement the core functionality of detecting a
click on a hex cell and retrieving its coordinates.

### 1.1. Enhance `BoardRenderer` to Store Coordinates

**File to Edit:** `packages/hexboard/src/rendering/boardRenderer.ts`

**Task:** Modify the `renderHexCell` method to attach the cell's
`HexCoordinates` to the `userData` property of the `THREE.Mesh` object it
creates. This will allow us to easily identify a cell when its mesh is
intersected by a raycaster.

**Instructions:**

1.  Locate the `renderHexCell` method.
2.  After the `THREE.Mesh` (often named `mesh`) is created, add the following
    line:
    ```typescript
    // Store coordinates in mesh for input handling
    mesh.userData.coordinates = coordinates;
    ```

### 1.2. Implement the `InputHandler` Class

**File to Edit:** `packages/hexboard/src/rendering/inputHandler.ts`

**Task:** Flesh out the `InputHandler` class to manage mouse events, perform
raycasting, and trigger callbacks.

**Instructions:**

1.  Define the class structure with the private properties outlined in the
    proposal (`renderer`, `camera`, `scene`, `raycaster`, `mouse`, and the event
    callbacks).
2.  Implement the constructor to initialize these properties. It should accept
    the `WebGLRenderer`, `PerspectiveCamera`, and `Scene` as arguments.
3.  Add a public method, let's call it `initialize()`, that sets up the DOM
    event listeners for mouse movements and clicks on the renderer's canvas.
4.  Implement a private method for the click handler. This method should:
    - Update the `this.mouse` vector with the corrected coordinates of the mouse
      click.
    - Configure and use `this.raycaster` to find intersected objects in the
      scene.
    - Check if the first intersected object has `userData.coordinates`.
    - If coordinates are present, invoke the `onCellClick` callback with them.
5.  Add a `dispose()` method to clean up the event listeners when the handler is
    no longer needed.

### 1.3. Integrate `InputHandler` with `HexBoard`

**File to Edit:** `packages/hexboard/src/hexBoard.ts`

**Task:** Create an instance of the `InputHandler` within the `HexBoard` and
connect its events to the board's logic.

**Instructions:**

1.  Add a private `inputHandler` property to the `HexBoard` class.
2.  In the `HexBoard`'s `init` method (or wherever the renderer and scene are
    available), instantiate the `InputHandler`, passing the required `renderer`,
    `camera`, and `scene` objects.
3.  Call the `inputHandler.initialize()` method you created in the previous
    step.
4.  Assign a new method in `HexBoard`, `handleCellClick`, to the
    `inputHandler.onCellClick` callback.
5.  Implement the `private handleCellClick(coords: HexCoordinates)` method. For
    now, a simple `console.log` of the coordinates is sufficient to verify that
    the system is working.

### 1.4. Testing for Phase 1

**Task:** Manually test the implementation in a sample application.

**Instructions:**

1.  Run the `hexboard-test` application.
2.  Open the browser's developer console.
3.  Click on various hex cells on the board.
4.  Verify that the hex coordinates for the clicked cells are being logged to
    the console.
