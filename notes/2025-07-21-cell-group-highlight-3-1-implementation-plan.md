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

- All unit tests from the test plan have been written and are failing due to
  missing implementation
- The `Direction` enum exists and is properly imported
- The `BoundaryMap` type alias is defined and available
- You understand the existing `HexGrid` class structure and neighbor-finding
  methods

## Implementation Steps

### Step 1: Define Required Types (if not already present)

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

**Implementation Details:**

1. **Input Validation:**

   ```typescript
   // Handle empty input
   if (cells.length === 0) {
     return new Map();
   }
   ```

2. **Create Selection Set:**

   ```typescript
   // Convert input to Set for O(1) lookup performance
   const selectedCellIds = new Set<string>(cells.map((cell) => cell.id));
   ```

3. **Initialize Result Map:**

   ```typescript
   const boundaryMap: BoundaryMap = new Map();
   ```

4. **Main Algorithm Loop:**

   ```typescript
   for (const cell of cells) {
     const boundaryDirections = new Set<Direction>();

     // Check each of the six possible neighbor directions
     for (const direction of Object.values(Direction)) {
       const neighbor = this.getNeighbor(cell, direction);

       // Face is a boundary if neighbor doesn't exist or isn't selected
       if (!neighbor || !selectedCellIds.has(neighbor.id)) {
         boundaryDirections.add(direction);
       }
     }

     // Only add to map if cell has boundary faces
     if (boundaryDirections.size > 0) {
       boundaryMap.set(cell.id, boundaryDirections);
     }
   }
   ```

5. **Return Result:**
   ```typescript
   return boundaryMap;
   ```

### Step 4: Implement Helper Method (if needed)

**If `getNeighbor(cell: Cell, direction: Direction)` doesn't exist:**

Add a helper method to get a neighbor in a specific direction:

```typescript
private getNeighbor(cell: Cell, direction: Direction): Cell | null {
  // Use existing neighbor-finding logic based on hex coordinate system
  // This should leverage existing grid navigation methods
  // Implementation depends on current HexGrid neighbor-finding approach

  // Example structure (adapt to existing coordinate system):
  const neighborCoords = this.getNeighborCoordinates(cell.q, cell.r, direction);
  return this.getCell(neighborCoords.q, neighborCoords.r) || null;
}
```

### Step 5: Update Existing Neighbor Logic (if necessary)

**If existing neighbor methods don't support direction-based lookup:**

- Review current neighbor-finding implementation in `HexGrid`
- Extend or adapt existing methods to support direction-based neighbor lookup
- Ensure consistency with existing coordinate system (axial, offset, etc.)

### Step 6: Handle Edge Cases

**Additional considerations to implement:**

1. **Grid Boundaries:** Ensure cells at grid edges properly identify
   non-existent neighbors as boundaries
2. **Performance:** Verify the algorithm performs well with larger selections
3. **Memory:** Consider if Sets should be reused or if any cleanup is needed

### Step 7: Import Required Dependencies

**At the top of HexGrid.ts:**

```typescript
import { Direction, BoundaryMap } from './types'; // Adjust path as needed
```

## Implementation Notes

### Algorithm Complexity

- **Time Complexity:** O(n × 6) = O(n) where n is the number of input cells
- **Space Complexity:** O(n) for the selection set and result map

### Integration Points

- Method should integrate cleanly with existing `HexGrid` public API
- Should leverage existing neighbor-finding logic where possible
- Must not break existing functionality

### Error Handling

- Input validation for empty arrays
- Graceful handling of cells that don't exist in the grid
- Consider logging warnings for invalid input cells

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

## Future Considerations

This implementation provides the foundation for:

- Section 3.2: Layout and coordinate conversion helpers
- Section 3.3: Rendering strategies that consume the BoundaryMap
- Section 3.4: BoardRenderer integration with group highlighting

The clean separation between boundary detection logic and rendering ensures this
method can be reused across different visualization approaches.
