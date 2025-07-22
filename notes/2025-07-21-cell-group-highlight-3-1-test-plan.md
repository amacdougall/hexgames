# Test Plan: Core Logic (HexGrid.findBoundaryFaces)

**Section:** 3.1 - Core Logic  
**Method:** `HexGrid.findBoundaryFaces(cells: Cell[]): BoundaryMap`  
**Date:** 2025-07-21

## Overview

This test plan covers the core boundary detection algorithm that will be
implemented as a public method on the `HexGrid` class. The method must correctly
identify which edges of hexagonal cells lie on the exterior of a given
selection.

## Prerequisites

Before writing tests, ensure that:

- The `Direction` enum is defined with values: North, Northeast, Southeast,
  South, Southwest, Northwest
- The `BoundaryMap` type is defined as `Map<string, Set<Direction>>`
- You have access to an existing `HexGrid` instance with populated cells for
  testing

## Unit Tests to Implement

### Test File Location

Add tests to the existing file: `packages/hexboard/tests/core/hexGrid.test.ts`

### Test Structure

Follow the existing pattern by adding a new `describe` block within the main
`HexGrid` describe block:

```typescript
describe('Boundary Detection', () => {
  // Tests go here using the shared grid variable from beforeEach
});
```

### Test Setup Pattern

- Use the existing `grid` variable initialized in `beforeEach`
- Follow the existing `TestProps` interface pattern for custom properties
- Use `test()` function (not `it()`) to match existing style
- Follow existing assertion patterns with `expect().toBe()`,
  `expect().toHaveLength()`, etc.

### 1. Basic Single Cell Test

**Purpose:** Verify that a single isolated cell has all six faces as boundary
faces.

```typescript
test('should return all six boundary faces for a single cell', () => {
  // Given: A grid with a single cell at (0, 0)
  const cell = grid.addCell({
    q: 0,
    r: 0,
    customProps: { type: 'grass' },
  });

  // When: Finding boundary faces for that single cell
  const boundaryMap = grid.findBoundaryFaces([cell]);

  // Then: All six directions should be boundary faces
  expect(boundaryMap.size).toBe(1);
  expect(boundaryMap.has(cell.id)).toBe(true);

  const boundaryDirections = boundaryMap.get(cell.id);
  expect(boundaryDirections).toBeDefined();
  expect(boundaryDirections!.size).toBe(6);
  // Verify all directions are present
  expect(boundaryDirections!.has(Direction.North)).toBe(true);
  expect(boundaryDirections!.has(Direction.Northeast)).toBe(true);
  expect(boundaryDirections!.has(Direction.Southeast)).toBe(true);
  expect(boundaryDirections!.has(Direction.South)).toBe(true);
  expect(boundaryDirections!.has(Direction.Southwest)).toBe(true);
  expect(boundaryDirections!.has(Direction.Northwest)).toBe(true);
});
```

### 2. Two Adjacent Cells Test

**Purpose:** Verify that adjacent cells share an internal edge that is not
marked as boundary.

```typescript
test('should exclude shared edges between adjacent cells from boundary', () => {
  // Given: A grid with two adjacent cells at (0, 0) and (1, 0)
  const cell1 = grid.addCell({
    q: 0,
    r: 0,
    customProps: { type: 'grass' },
  });
  const cell2 = grid.addCell({
    q: 1,
    r: 0,
    customProps: { type: 'forest' },
  });

  // When: Finding boundary faces for both cells
  const boundaryMap = grid.findBoundaryFaces([cell1, cell2]);

  // Then: The shared edge should not appear in either cell's boundary set
  expect(boundaryMap.size).toBe(2);

  const cell1Boundaries = boundaryMap.get(cell1.id);
  const cell2Boundaries = boundaryMap.get(cell2.id);

  expect(cell1Boundaries).toBeDefined();
  expect(cell2Boundaries).toBeDefined();

  // Cell (0,0) should not have Southeast face as boundary (shared with (1,0))
  expect(cell1Boundaries!.has(Direction.Southeast)).toBe(false);
  // Cell (1,0) should not have Northwest face as boundary (shared with (0,0))
  expect(cell2Boundaries!.has(Direction.Northwest)).toBe(false);

  // Each cell should have 5 boundary faces (6 total - 1 shared)
  expect(cell1Boundaries!.size).toBe(5);
  expect(cell2Boundaries!.size).toBe(5);
});
```

### 3. Triangle Formation Test

**Purpose:** Test boundary detection for a simple connected group.

```typescript
test('should correctly identify boundary for triangle formation', () => {
  // Given: Three cells forming a triangle: (0,0), (1,0), (0,1)
  const cell1 = grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });
  const cell2 = grid.addCell({ q: 1, r: 0, customProps: { type: 'forest' } });
  const cell3 = grid.addCell({ q: 0, r: 1, customProps: { type: 'mountain' } });

  // When: Finding boundary faces
  const boundaryMap = grid.findBoundaryFaces([cell1, cell2, cell3]);

  // Then: Only external faces should be marked as boundary
  expect(boundaryMap.size).toBe(3);

  // Each cell should have 4 boundary faces (6 total - 2 shared with neighbors)
  const cell1Boundaries = boundaryMap.get(cell1.id);
  const cell2Boundaries = boundaryMap.get(cell2.id);
  const cell3Boundaries = boundaryMap.get(cell3.id);

  expect(cell1Boundaries!.size).toBe(4);
  expect(cell2Boundaries!.size).toBe(4);
  expect(cell3Boundaries!.size).toBe(4);

  // Verify specific shared edges are not boundaries
  expect(cell1Boundaries!.has(Direction.Southeast)).toBe(false); // shared with cell2
  expect(cell1Boundaries!.has(Direction.Southwest)).toBe(false); // shared with cell3
  expect(cell2Boundaries!.has(Direction.Northwest)).toBe(false); // shared with cell1
});
```

### 4. Non-Contiguous Selection Test

**Purpose:** Verify algorithm handles disconnected "islands" of cells.

```typescript
test('should handle non-contiguous cell selections correctly', () => {
  // Given: Two separate groups: cells (0,0), (1,0) and cells (3,3), (4,3)
  const group1Cell1 = grid.addCell({
    q: 0,
    r: 0,
    customProps: { type: 'grass' },
  });
  const group1Cell2 = grid.addCell({
    q: 1,
    r: 0,
    customProps: { type: 'forest' },
  });
  const group2Cell1 = grid.addCell({
    q: 3,
    r: 3,
    customProps: { type: 'desert' },
  });
  const group2Cell2 = grid.addCell({
    q: 4,
    r: 3,
    customProps: { type: 'water' },
  });

  // When: Finding boundary faces for all four cells
  const boundaryMap = grid.findBoundaryFaces([
    group1Cell1,
    group1Cell2,
    group2Cell1,
    group2Cell2,
  ]);

  // Then: Each group should have its own complete boundary
  expect(boundaryMap.size).toBe(4);

  // Each pair should have 5 boundary faces each (like two adjacent cells)
  expect(boundaryMap.get(group1Cell1.id)!.size).toBe(5);
  expect(boundaryMap.get(group1Cell2.id)!.size).toBe(5);
  expect(boundaryMap.get(group2Cell1.id)!.size).toBe(5);
  expect(boundaryMap.get(group2Cell2.id)!.size).toBe(5);
});
```

### 5. Empty Input Test

**Purpose:** Verify graceful handling of edge case inputs.

```typescript
test('should return empty map for empty cell array', () => {
  // When: Finding boundary faces for empty array
  const boundaryMap = grid.findBoundaryFaces([]);

  // Then: Should return empty BoundaryMap
  expect(boundaryMap.size).toBe(0);
});
```

### 6. Grid Edge Cells Test

**Purpose:** Verify cells at grid boundaries are handled correctly.

```typescript
test('should treat grid edges as boundaries for edge cells', () => {
  // Given: A single cell where some neighbors don't exist on the grid
  const edgeCell = grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } });

  // When: Finding boundary faces
  const boundaryMap = grid.findBoundaryFaces([edgeCell]);

  // Then: All faces should be boundary faces since no neighbors exist
  expect(boundaryMap.size).toBe(1);
  const boundaries = boundaryMap.get(edgeCell.id);
  expect(boundaries!.size).toBe(6); // All faces are boundaries when isolated
});
```

### 7. Complex Shape Test

**Purpose:** Test a more complex connected shape to ensure algorithm scales.

```typescript
test('should handle complex connected shapes correctly', () => {
  // Given: An L-shaped selection of 5 cells
  const cells = [
    grid.addCell({ q: 0, r: 0, customProps: { type: 'grass' } }), // Corner
    grid.addCell({ q: 1, r: 0, customProps: { type: 'forest' } }), // Right arm
    grid.addCell({ q: 2, r: 0, customProps: { type: 'mountain' } }), // Right arm end
    grid.addCell({ q: 0, r: 1, customProps: { type: 'desert' } }), // Down arm
    grid.addCell({ q: 0, r: 2, customProps: { type: 'water' } }), // Down arm end
  ];

  // When: Finding boundary faces
  const boundaryMap = grid.findBoundaryFaces(cells);

  // Then: Only the external perimeter should be marked as boundary
  expect(boundaryMap.size).toBe(5);

  // Corner cell should have 4 boundaries (connected to 2 neighbors)
  expect(boundaryMap.get(cells[0].id)!.size).toBe(4);

  // End cells should have 5 boundaries (connected to 1 neighbor each)
  expect(boundaryMap.get(cells[2].id)!.size).toBe(5); // Right end
  expect(boundaryMap.get(cells[4].id)!.size).toBe(5); // Down end

  // Middle cells should have 4 boundaries (connected to 2 neighbors each)
  expect(boundaryMap.get(cells[1].id)!.size).toBe(4); // Right middle
  expect(boundaryMap.get(cells[3].id)!.size).toBe(4); // Down middle
});
```

### 8. All Grid Cells Test

**Purpose:** Verify behavior when entire grid is selected.

```typescript
test('should return only grid perimeter when all cells are selected', () => {
  // Given: Create a small complete grid
  const allCells = grid.createBasicHexRing(1); // Creates center + 6 neighbors

  // When: Finding boundary faces for all cells
  const boundaryMap = grid.findBoundaryFaces(allCells);

  // Then: Only faces on the absolute edge of the grid should be boundaries
  expect(boundaryMap.size).toBe(7);

  // Center cell should have no boundary faces (surrounded by all neighbors)
  const centerCell = grid.getCell(0, 0);
  expect(centerCell).not.toBeNull();
  const centerBoundaries = boundaryMap.get(centerCell!.id);
  expect(centerBoundaries!.size).toBe(0);

  // Each edge cell should have 4 boundary faces (2 connected + 4 external)
  const neighbors = grid.getNeighborCoordinates(0, 0);
  neighbors.forEach((coord) => {
    const neighbor = grid.getCellByCoords(coord);
    expect(neighbor).not.toBeNull();
    const neighborBoundaries = boundaryMap.get(neighbor!.id);
    expect(neighborBoundaries!.size).toBe(4);
  });
});
```

## Important Test Implementation Notes

1. **Expected Test Failures:** These tests are expected to fail initially
   because the `findBoundaryFaces` method does not exist yet. However, they must
   fail due to missing implementation, not syntax or type errors.

2. **Test Integration:** Add the tests within the existing `HexGrid` describe
   block in `hexGrid.test.ts`. Use the shared `grid` variable and follow
   existing patterns.

3. **Dependencies:** Before implementing tests, ensure the `Direction` enum and
   `BoundaryMap` type are properly defined and imported.

4. **Assertion Strategy:** Follow existing test patterns:

   - Use `expect().toBe()` for exact matches
   - Use `expect().toHaveLength()` for array/set sizes
   - Use `expect().toBeDefined()` and `expect().not.toBeNull()` for existence
     checks
   - Follow the `test('description', () => {})` pattern used throughout the file

5. **Cell Creation:** Use the existing pattern of `grid.addCell()` with
   `customProps` following the `TestProps` interface.

6. **Performance Consideration:** The complex shape test provides adequate
   coverage for larger selections.

## Required Imports

Add these imports to the top of `hexGrid.test.ts`:

```typescript
import { Direction, BoundaryMap } from '../../src/core/types'; // Adjust path as needed
```

## Test Execution Expectations

After implementing these tests but before implementing the actual method:

- All tests should fail with messages indicating the method `findBoundaryFaces`
  does not exist
- No tests should fail due to TypeScript compilation errors
- No tests should fail due to missing imports or type definitions
- Test setup and teardown should execute without errors using existing
  `beforeEach` pattern
