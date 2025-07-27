# Test Plan: Layout and Coordinate Conversion

**Date:** 2025-07-22 **Author:** GitHub Copilot

## 1. Objective

This document outlines the test plan for the `getHexFaceVertices` function, as
specified in subsection 3.2 of the Cell Group Highlight design proposal. This
function is a critical component for translating logical cell boundaries into
renderable, world-space coordinates.

As we are following a Test-Driven Development (TDD) approach, you will create
and run these tests _before_ writing the implementation. The tests must be
well-formed and are expected to fail initially because the `getHexFaceVertices`
function does not yet exist. Any test failures should be due to the missing
implementation, not syntax or type errors in the test code itself.

## 2. Test Setup

1.  **Create a new test file:**
    - Location: `packages/hexboard/tests/rendering/layout.test.ts`

2.  **Add necessary imports:**
    - Import `getHexFaceVertices` from
      `packages/hexboard/src/rendering/layout.ts`.
    - Import `Direction` from `packages/hexboard/src/core/types.ts`.
    - Import `Cell` from `packages/hexboard/src/core/cell.ts`.
    - Import `Vector3` from `three`.

## 3. Test Cases

You will implement the following unit tests within a `describe` block for
`getHexFaceVertices`.

### 3.1. Test Case: Cell at Origin

This test verifies the vertex calculations for a standard cell at the grid's
origin with no elevation.

- **Description:** Create a test that calls `getHexFaceVertices` for a cell at
  `(q:0, r:0, s:0)` with `elevation: 0`.
- **Assertions:**
  - Iterate through all six `Direction` enum values.
  - For each direction, assert that the returned array contains two
    `THREE.Vector3` objects.
  - Use `expect(...).toMatchSnapshot()` to verify the coordinates of the
    returned vertices for each direction. This will establish a baseline for
    correct vertex positions. Ensure the snapshot values are manually reviewed
    for correctness upon first creation.

### 3.2. Test Case: Cell at a Non-Origin Position

This test ensures the function correctly incorporates the cell's world position.

- **Description:** Create a test for a cell at an arbitrary, non-origin
  coordinate, such as `(q: 2, r: -3, s: 1)`, with `elevation: 0`.
- **Assertions:**
  - Calculate the expected vertices by first getting the cell's world center
    using the existing `hexToWorld` function, and then adding the same local
    corner offsets as determined in the origin test case.
  - For each `Direction`, use `toBeCloseTo` to compare the components of the
    returned `Vector3` objects against your calculated expected values. This
    accounts for potential floating-point inaccuracies.

### 3.3. Test Case: Cell with Elevation

This test validates that the cell's elevation is correctly applied to the Y-axis
of the vertices.

- **Description:** Create a test for a cell at the origin `(q:0, r:0, s:0)` but
  with a non-zero `elevation`, for example, `10`.
- **Assertions:**
  - For each `Direction`, assert that the `y` component of both returned
    `Vector3` objects is equal to the cell's elevation (`10`).
  - The `x` and `z` components should match the values from the origin test case
    (3.1).

By implementing these tests, we can be confident that the `getHexFaceVertices`
function will be accurate, reliable, and correctly integrated with our existing
coordinate systems. Proceed with writing these tests, and once they are failing
as expected, you can move on to the implementation plan.
