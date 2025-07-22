# Implementation Plan: Layout and Coordinate Conversion

**Date:** 2025-07-22 **Author:** GitHub Copilot

## 1. Objective

This document provides the implementation steps for creating the
`getHexFaceVertices` function as specified in subsection 3.2 of the Cell Group
Highlight design proposal. This function will be added to the
`packages/hexboard/src/rendering/layout.ts` module.

You should only begin this implementation after the tests outlined in the
corresponding test plan are in place and failing correctly.

## 2. Implementation Steps

### Step 1: Define Hexagon Corner Constants

To perform the calculations efficiently and consistently, we first need to
define the local coordinates of a hexagon's corners relative to its center.

1.  **Location:** `packages/hexboard/src/rendering/layout.ts`
2.  **Action:** Add a new constant array named `HEX_CORNERS`. This array will
    store six `THREE.Vector3` objects, each representing a corner of a
    flat-topped hexagon of size 1. The order is important and should correspond
    to the `Direction` enum (North, Northeast, etc.).

    ```typescript
    // Order corresponds to Direction enum: N, NE, SE, S, SW, NW
    const HEX_CORNERS = [
      new THREE.Vector3(-0.5, 0, -Math.sqrt(3) / 2), // North-West corner for North face
      new THREE.Vector3(0.5, 0, -Math.sqrt(3) / 2), // North-East corner for North/Northeast face
      new THREE.Vector3(1, 0, 0), // East corner for Northeast/Southeast face
      new THREE.Vector3(0.5, 0, Math.sqrt(3) / 2), // South-East corner for Southeast/South face
      new THREE.Vector3(-0.5, 0, Math.sqrt(3) / 2), // South-West corner for South/Southwest face
      new THREE.Vector3(-1, 0, 0), // West corner for Southwest/Northwest face
    ];
    ```

### Step 2: Implement `getHexFaceVertices` Function

Now, create the main function.

1.  **Location:** `packages/hexboard/src/rendering/layout.ts`
2.  **Action:** Define and export a new function `getHexFaceVertices`.

    ```typescript
    import { Cell } from '../core/cell';
    import { Direction } from '../core/types';

    // ... other imports and HEX_CORNERS constant

    export function getHexFaceVertices(
      cell: Cell,
      direction: Direction
    ): [THREE.Vector3, THREE.Vector3] {
      // 1. Get the world-space center of the hex cell
      const center = hexToWorld(cell);

      // 2. Determine the two corners for the given face direction
      const corner1Index = direction;
      const corner2Index = (direction + 1) % 6;

      const corner1 = HEX_CORNERS[corner1Index].clone();
      const corner2 = HEX_CORNERS[corner2Index].clone();

      // 3. Add the cell's center to the local corner offsets
      corner1.add(center);
      corner2.add(center);

      // 4. Apply the cell's elevation to the Y-coordinate
      corner1.y = cell.elevation;
      corner2.y = cell.elevation;

      return [corner1, corner2];
    }
    ```

### Step 3: Verify Implementation

After implementing the function, run the test suite from
`packages/hexboard/tests/rendering/layout.test.ts`. All tests related to
`getHexFaceVertices` should now pass. If they do not, debug the implementation
until all tests are green.

This completes the implementation for subsection 3.2. The `getHexFaceVertices`
function is now ready to be used by rendering strategies to draw boundary lines
or other face-based effects.
