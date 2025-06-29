# Input Handling Implementation Plan

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
