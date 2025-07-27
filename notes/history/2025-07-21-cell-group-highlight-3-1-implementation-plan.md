# Implementation Plan: Core Logic (HexGrid.findBoundaryFaces)

**Section:** 3.1 - Core Logic  
**Method:** `HexGrid.findBoundaryFaces(cells: Cell[]): BoundaryMap`  
**Date:** 2025-07-21

## Overview

This implementation plan provides step-by-step instructions for implementing the
boundary detection algorithm as a public method on the `HexGrid` class. The
method will identify which edges of hexagonal cells lie on the exterior of a
given selection.

## Prerequisites

Before implementing, ensure that:

- DONE: All unit tests from the test plan have been written and are failing due
  to missing implementation
- DONE: The `Direction` enum exists and is properly imported
- DONE: The `BoundaryMap` type alias is defined and available
- You understand the existing `HexGrid` class structure and neighbor-finding
  methods

## Implementation Steps

### DONE: Step 1: Define Required Types (if not already present)

**Location:** `packages/hexboard/src/core/types.ts` or appropriate types file

```typescript
// Direction enum for the six faces of a hexagon
export enum Direction {
  North = 'north',
  Northeast = 'northeast',
  Southeast = 'southeast',
  South = 'south',
  Southwest = 'southwest',
  Northwest = 'northwest',
}

// Type alias for boundary detection output
export type BoundaryMap = Map<string, Set<Direction>>;
```

### Step 2: Add Method Signature to HexGrid Class

**Location:** `packages/hexboard/src/core/HexGrid.ts`

Add the public method signature to the `HexGrid` class:

```typescript
/**
 * Identifies boundary faces for a collection of cells.
 * A face is considered a boundary if the cell on one side is in the selection
 * and the cell on the other side is not in the selection or doesn't exist.
 *
 * @param cells - Array of cells to analyze for boundary detection
 * @returns Map where keys are cell IDs and values are sets of boundary directions
 */
public findBoundaryFaces(cells: Cell[]): BoundaryMap {
  // Implementation goes here
}
```

### Step 3: Implement Core Algorithm

**Implementation Details (Simplified using existing `getNeighborCoordinates`):**

```typescript
public findBoundaryFaces(cells: Cell[]): BoundaryMap {
  // Handle empty input
  if (cells.length === 0) {
    return new Map();
  }

  // Convert input to Set for O(1) lookup performance
  const selectedCellIds = new Set<string>(cells.map((cell) => cell.id));
  const boundaryMap: BoundaryMap = new Map();

  for (const cell of cells) {
    // Get all six neighbor coordinates using existing method
    const neighborCoords = this.getNeighborCoordinates(cell.q, cell.r);
    const boundaryDirections = new Set<Direction>();

    // Check each neighbor in order (matches Direction enum order)
    neighborCoords.forEach((coords, index) => {
      const neighbor = this.getCellByCoords(coords);

      // Face is a boundary if neighbor doesn't exist or isn't selected
      if (!neighbor || !selectedCellIds.has(neighbor.id)) {
        boundaryDirections.add(index as Direction); // Direction enum is 0-indexed
      }
    });

    // Only add to map if cell has boundary faces
    if (boundaryDirections.size > 0) {
      boundaryMap.set(cell.id, boundaryDirections);
    }
  }

  return boundaryMap;
}
```

### Step 4: Import Required Dependencies

**At the top of HexGrid.ts:**

```typescript
import { Direction, BoundaryMap } from './types'; // Adjust path as needed
```

## Implementation Notes

### Algorithm Complexity

- **Time Complexity:** O(n × 6) = O(n) where n is the number of input cells
- **Space Complexity:** O(n) for the selection set and result map

### Integration Points

- Method integrates cleanly with existing `HexGrid` public API
- Leverages existing `getNeighborCoordinates()` and `getCellByCoords()` methods
- Must not break existing functionality

### Critical Assumption

- **Direction enum order must match `getNeighborCoordinates()` order:** The
  implementation assumes that `Direction.North` (0) corresponds to the first
  neighbor returned by `getNeighborCoordinates()`, etc. This needs verification
  during implementation.

### Testing Integration

- After implementation, all previously written unit tests should pass
- Run the full test suite to ensure no regressions
- Verify performance with larger test cases

## Post-Implementation Checklist

1. All unit tests pass
2. No TypeScript compilation errors
3. Method integrates properly with existing `HexGrid` API
4. Performance is acceptable for expected use cases (test with 100+ cells)
5. Code follows existing project style and conventions
6. Documentation is clear and complete
7. No memory leaks or resource management issues
