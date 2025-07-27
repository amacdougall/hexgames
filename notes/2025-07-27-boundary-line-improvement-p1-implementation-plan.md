# Phase 1 Implementation Plan: Enhanced Utility Functions

**Date:** 2025-07-27  
**Phase:** 1 of 5 - Enhanced Utility Functions  
**Audience:** Junior Developer  
**Author:** Technical Lead

## Overview

You've successfully implemented comprehensive tests for the three enhanced
utility functions. Now it's time to implement the actual functions to make those
tests pass. This phase focuses on adding utility functions to
`src/rendering/layout.ts` while maintaining backward compatibility.

### Note on testing

When running `npm test -- -t "pattern"`, ensure that the cwd is
`packages/hexboard`.

## Implementation Tasks

### Task 1: Implement `getHexFaceEdge()`

**Location:** `packages/hexboard/src/rendering/layout.ts`

**Function Signature:**

```typescript
export function getHexFaceEdge<T extends Record<string, unknown>>(
  cell: Cell<T>,
  direction: Direction
): { start: THREE.Vector3; end: THREE.Vector3 };
```

**Implementation Requirements:**

1. **Leverage existing code**: Use `getHexFaceVertices()` internally
2. **Return structure**: Create an object with `start` and `end` properties
3. **Vector3 creation**: Use `new THREE.Vector3()` to create return values
4. **Maintain consistency**: Results must exactly match `getHexFaceVertices()`
   output

**Implementation Strategy:**

```typescript
export function getHexFaceEdge<T extends Record<string, unknown>>(
  cell: Cell<T>,
  direction: Direction
): { start: THREE.Vector3; end: THREE.Vector3 } {
  // 1. Call existing getHexFaceVertices to get the edge endpoints
  // 2. Extract first vertex as 'start', second vertex as 'end'
  // 3. Return object with named properties
}
```

**Test Validation:**

- Run: `npm test -- -t "getHexFaceEdge"`
- All 4 test cases should pass
- Verify output matches `getHexFaceVertices()` exactly

### Task 2: Implement `applyElevationOffset()`

**Location:** `packages/hexboard/src/rendering/layout.ts`

**Function Signature:**

```typescript
export function applyElevationOffset(
  vertices: THREE.Vector3[],
  offset: number
): void;
```

**Implementation Requirements:**

1. **In-place modification**: Modify the input array directly (don't create new
   objects)
2. **Y-coordinate only**: Only modify the `y` property of each vertex
3. **Additive offset**: Add the offset value to existing Y coordinates
4. **Handle edge cases**: Empty arrays should not cause errors

**Implementation Strategy:**

```typescript
export function applyElevationOffset(
  vertices: THREE.Vector3[],
  offset: number
): void {
  // 1. Iterate through vertices array
  // 2. For each vertex, add offset to vertex.y
  // 3. Leave x and z coordinates unchanged
}
```

**Test Validation:**

- Run: `npm test -- -t "applyElevationOffset"`
- All 5 test cases should pass
- Verify vertices are modified in-place
- Verify only Y coordinates change

### Task 3: Implement `applyNormalOffset()`

**Location:** `packages/hexboard/src/rendering/layout.ts`

**Function Signature:**

```typescript
export function applyNormalOffset<T extends Record<string, unknown>>(
  vertices: THREE.Vector3[],
  grid: HexGrid<T>,
  selectedCells: Set<string>,
  offset: number
): void;
```

**Implementation Requirements:**

1. **In-place modification**: Modify the input array directly
2. **Minimal displacement**: Apply very small outward movement
3. **Edge case handling**: Zero offset should result in no changes
4. **Boundary detection**: Use grid context to determine outward direction

**Implementation Strategy:**

This is the most complex function. Here's the recommended approach:

```typescript
export function applyNormalOffset<T extends Record<string, unknown>>(
  vertices: THREE.Vector3[],
  grid: HexGrid<T>,
  selectedCells: Set<string>,
  offset: number
): void {
  // Early exit for zero offset or empty vertices
  if (offset === 0 || vertices.length === 0) {
    return;
  }

  // For Phase 1, implement a simplified version:
  // 1. Calculate the centroid of the vertices
  // 2. For each vertex, calculate a vector from centroid to vertex
  // 3. Normalize this vector and scale by offset
  // 4. Add the scaled vector to the vertex position

  // This creates a simple "push outward" effect that will satisfy
  // the test requirements for minimal displacement
}
```

**Simplified Algorithm:**

1. Calculate centroid (average position) of all vertices
2. For each vertex:
   - Calculate direction vector from centroid to vertex
   - Normalize the direction vector
   - Scale by offset amount
   - Add to vertex position

**Test Validation:**

- Run: `npm test -- -t "applyNormalOffset"`
- All 5 test cases should pass
- Verify minimal outward movement occurs
- Verify proportional scaling with different offset values

### Task 4: Add Required Imports

**Location:** `packages/hexboard/src/rendering/layout.ts`

Ensure these imports are available:

```typescript
import * as THREE from 'three';
import { Cell } from '../core/cell';
import { Direction } from '../core/types';
import { HexGrid } from '../core/hexGrid';
```

## Implementation Order

1. **Start with `getHexFaceEdge()`** - simplest function, builds confidence
2. **Then `applyElevationOffset()`** - straightforward Y-coordinate modification
3. **Finally `applyNormalOffset()`** - most complex, requires geometric
   calculations

## Testing Strategy

### Individual Function Testing

```bash
# Test each function individually as you implement
cd packages/hexboard

# Test getHexFaceEdge only
npm test -- -t "getHexFaceEdge"

# Test applyElevationOffset only
npm test -- -t "applyElevationOffset"

# Test applyNormalOffset only
npm test -- -t "applyNormalOffset"
```

### Full Test Suite

```bash
# Run all layout tests
npm test -- --testPathPattern=layout.test.ts

# Run entire test suite to ensure no regressions
npm test
```

## Success Criteria

✅ **All tests pass** - Every test case should succeed  
✅ **No regressions** - Existing `getHexFaceVertices` tests still pass  
✅ **Type safety** - No TypeScript compilation errors  
✅ **Performance** - Functions should be efficient for typical usage  
✅ **Code quality** - Follow existing code style and patterns

## Implementation Tips

### For `getHexFaceEdge()`:

- Look at how `getHexFaceVertices()` is already implemented
- The return format is just a restructuring of existing data
- No complex calculations needed

### For `applyElevationOffset()`:

- Use a simple `for` loop or `forEach`
- Direct property assignment: `vertex.y += offset`
- Very straightforward implementation

### For `applyNormalOffset()`:

- Focus on the test requirements rather than perfect boundary detection
- A simple "push outward from centroid" approach will satisfy Phase 1 tests
- More sophisticated boundary analysis can be added in later phases

### Code Style Guidelines:

- Match the existing function style in `layout.ts`
- Use descriptive variable names
- Add JSDoc comments for each function
- Follow the existing import organization

## Phase 1 Completion

Once all three functions are implemented and tests pass:

1. **Verify test coverage**: `npm run test:coverage`
2. **Run linting**: `npm run lint`
3. **Check formatting**: `npm run format`
4. **Test build process**: `npm run build`

## Next Steps

After Phase 1 completion, you'll move to **Phase 2: Path Building Algorithm**,
which will use these utility functions to build continuous boundary paths for
tube geometry creation.

The foundation you're building here with proper elevation and normal offsets
will be crucial for the visual quality of the final boundary line
implementation.
