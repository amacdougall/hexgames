# Phase 1 Test Plan: Enhanced Utility Functions

**Date:** 2025-07-27  
**Phase:** 1 of 5 - Enhanced Utility Functions  
**Audience:** Junior developer implementing TDD for boundary line improvements  
**Author:** Technical Lead

## 1. Overview

This document provides detailed test specifications for Phase 1 of the boundary
line improvement project. These tests serve a dual purpose:

1. **TDD Guide**: They define the exact behavior expected from the new utility
   functions
2. **Living Documentation**: They document the intended API and behavior for
   future developers

**Critical Expectation**: All tests in this plan are expected to FAIL initially
due to missing implementation. However, they MUST NOT fail due to syntax errors,
import issues, or TypeScript compilation problems. If a test fails for any
reason other than "function is not defined" or "function does not exist", you
must fix the test before proceeding.

**Design Intent**: The offset functions implement **minimal displacement** to
prevent rendering conflicts while maintaining the visual appearance that the
boundary traces the exact hex tile perimeter. Users should perceive the boundary
as sitting "on" the tile edges, not floating above or outside them.

## 2. Test File Updates

Update the existing `packages/hexboard/tests/rendering/layout.test.ts` file to
add the new tests for enhanced layout utilities.

### 2.1. Import Updates

Add these imports to the existing imports in `layout.test.ts`:

```typescript
import {
  getHexFaceEdge,
  applyElevationOffset,
  applyNormalOffset,
} from '../../src/rendering/layout';
import { HexGrid } from '../../src/core/hexGrid';
```

### 2.2. Additional Test Helper Functions

Add these helper functions after the existing `expectCloseTo` helper in
`layout.test.ts`:

```typescript
// Helper to create a standard test cell (can reuse existing cell creation pattern)
const createTestCell = (q: number, r: number, elevation = 0): Cell => ({
  q,
  r,
  s: -q - r,
  id: `${q},${r}`,
  elevation,
  movementCost: 1,
  isImpassable: false,
  customProps: {},
});

// Helper to create Vector3 objects for testing
const createVector3 = (x: number, y: number, z: number) => new Vector3(x, y, z);
```

## 3. Test Specifications

### 3.1. getHexFaceEdge() Tests

Add this test suite to the existing `layout.test.ts` file after the current
`getHexFaceVertices` describe block:

```typescript
describe('getHexFaceEdge', () => {
  test('should return object with start and end Vector3 properties', () => {
    const cell = createTestCell(0, 0);
    const result = getHexFaceEdge(cell, Direction.North);

    expect(result).toHaveProperty('start');
    expect(result).toHaveProperty('end');
    expect(result.start).toBeInstanceOf(THREE.Vector3);
    expect(result.end).toBeInstanceOf(THREE.Vector3);
  });

  test('should match getHexFaceVertices output for all directions', () => {
    const cell = createTestCell(0, 0, 5);

    // Test all six directions
    [
      Direction.North,
      Direction.Northeast,
      Direction.Southeast,
      Direction.South,
      Direction.Southwest,
      Direction.Northwest,
    ].forEach((direction) => {
      const edgeResult = getHexFaceEdge(cell, direction);
      const verticesResult = getHexFaceVertices(cell, direction);

      // Edge start should match first vertex
      expect(edgeResult.start.x).toBe(verticesResult[0].x);
      expect(edgeResult.start.y).toBe(verticesResult[0].y);
      expect(edgeResult.start.z).toBe(verticesResult[0].z);

      // Edge end should match second vertex
      expect(edgeResult.end.x).toBe(verticesResult[1].x);
      expect(edgeResult.end.y).toBe(verticesResult[1].y);
      expect(edgeResult.end.z).toBe(verticesResult[1].z);
    });
  });

  test('should handle elevation correctly', () => {
    const cellLow = createTestCell(1, 1, 0);
    const cellHigh = createTestCell(1, 1, 10);

    const edgeLow = getHexFaceEdge(cellLow, Direction.North);
    const edgeHigh = getHexFaceEdge(cellHigh, Direction.North);

    // Y coordinates should reflect elevation
    expect(edgeLow.start.y).toBe(0);
    expect(edgeLow.end.y).toBe(0);
    expect(edgeHigh.start.y).toBe(10);
    expect(edgeHigh.end.y).toBe(10);

    // X and Z should be the same regardless of elevation
    expect(edgeLow.start.x).toBe(edgeHigh.start.x);
    expect(edgeLow.start.z).toBe(edgeHigh.start.z);
    expect(edgeLow.end.x).toBe(edgeHigh.end.x);
    expect(edgeLow.end.z).toBe(edgeHigh.end.z);
  });

  test('should handle various cell positions', () => {
    const positions = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: -1, r: 1 },
      { q: 2, r: -1 },
    ];

    positions.forEach(({ q, r }) => {
      const cell = createTestCell(q, r);

      // Should not throw for any position
      expect(() => {
        getHexFaceEdge(cell, Direction.North);
      }).not.toThrow();

      // Result should always have proper structure
      const result = getHexFaceEdge(cell, Direction.North);
      expect(result.start).toBeInstanceOf(THREE.Vector3);
      expect(result.end).toBeInstanceOf(THREE.Vector3);
    });
  });
});
```

### 3.2. applyElevationOffset() Tests

Add this test suite to the existing `layout.test.ts` file after the
`getHexFaceEdge` describe block:

```typescript
describe('applyElevationOffset', () => {
  test('should modify Y coordinates of vertices by offset amount', () => {
    const vertices = [
      createVector3(1, 0, 1),
      createVector3(2, 5, 2),
      createVector3(3, -2, 3),
    ];
    const offset = 0.5;

    applyElevationOffset(vertices, offset);

    expect(vertices[0].y).toBe(0.5);
    expect(vertices[1].y).toBe(5.5);
    expect(vertices[2].y).toBe(-1.5);
  });

  test('should not modify X and Z coordinates', () => {
    const vertices = [createVector3(1.5, 0, 2.7), createVector3(-3.2, 10, 4.8)];
    const originalX = [vertices[0].x, vertices[1].x];
    const originalZ = [vertices[0].z, vertices[1].z];

    applyElevationOffset(vertices, 1.25);

    expect(vertices[0].x).toBe(originalX[0]);
    expect(vertices[1].x).toBe(originalX[1]);
    expect(vertices[0].z).toBe(originalZ[0]);
    expect(vertices[1].z).toBe(originalZ[1]);
  });

  test('should handle positive, negative, and zero offsets', () => {
    const createVerticesSet = () => [
      createVector3(0, 1, 0),
      createVector3(0, 2, 0),
    ];

    // Positive offset
    const positiveVertices = createVerticesSet();
    applyElevationOffset(positiveVertices, 0.5);
    expect(positiveVertices[0].y).toBe(1.5);
    expect(positiveVertices[1].y).toBe(2.5);

    // Negative offset
    const negativeVertices = createVerticesSet();
    applyElevationOffset(negativeVertices, -0.3);
    expect(negativeVertices[0].y).toBe(0.7);
    expect(negativeVertices[1].y).toBe(1.7);

    // Zero offset
    const zeroVertices = createVerticesSet();
    applyElevationOffset(zeroVertices, 0);
    expect(zeroVertices[0].y).toBe(1);
    expect(zeroVertices[1].y).toBe(2);
  });

  test('should handle empty vertex array without error', () => {
    const vertices: THREE.Vector3[] = [];

    expect(() => {
      applyElevationOffset(vertices, 1.0);
    }).not.toThrow();

    expect(vertices).toHaveLength(0);
  });

  test('should modify vertices in place', () => {
    const vertices = [createVector3(0, 1, 0)];
    const originalVertex = vertices[0];

    applyElevationOffset(vertices, 0.5);

    // Should be the same object reference, modified in place
    expect(vertices[0]).toBe(originalVertex);
    expect(vertices[0].y).toBe(1.5);
  });
});
```

### 3.3. applyNormalOffset() Tests

Add these test suites to the existing `layout.test.ts` file after the current
`getHexFaceVertices` describe block:

```typescript
describe('applyNormalOffset', () => {
  let mockGrid: jest.Mocked<HexGrid>;
  let selectedCells: Set<string>;

  beforeEach(() => {
    // Create mock grid with necessary methods
    mockGrid = {
      getCellById: jest.fn(),
      getCellByCoords: jest.fn(),
      getNeighborCoordinates: jest.fn(),
    } as any;

    selectedCells = new Set(['0,0', '1,0']);
  });

  test('should apply minimal outward offset to avoid rendering conflicts', () => {
    // Mock a simple 2-cell horizontal selection
    const cell1 = createTestCell(0, 0);
    const cell2 = createTestCell(1, 0);

    mockGrid.getCellById.mockImplementation((id: string) => {
      if (id === '0,0') return cell1;
      if (id === '1,0') return cell2;
      return undefined;
    });

    // Mock neighbor detection to simulate boundary detection
    mockGrid.getNeighborCoordinates.mockReturnValue([
      { q: -1, r: 0, s: 1 }, // Southwest neighbor (outside selection)
      { q: 0, r: -1, s: 1 }, // Northwest neighbor (outside selection)
      { q: 1, r: -1, s: 0 }, // North neighbor (outside selection)
      { q: 2, r: 0, s: -2 }, // Northeast neighbor (outside selection)
      { q: 1, r: 1, s: -2 }, // Southeast neighbor (outside selection)
      { q: 0, r: 1, s: -1 }, // South neighbor (outside selection)
    ]);

    // Vertices representing a face on the boundary
    const originalVertices = [
      createVector3(0, 0, -0.5), // North face of cell (0,0)
      createVector3(0.5, 0, -Math.sqrt(3) / 2),
    ];
    const vertices = originalVertices.map((v) => createVector3(v.x, v.y, v.z));

    // Apply minimal offset (typical values: 0.001-0.005)
    applyNormalOffset(vertices, mockGrid, selectedCells, 0.002);

    // Vertices should be pushed outward but minimally
    // Should be moved but very close to original position
    expect(vertices[0].z).toBeLessThan(-0.5);
    expect(vertices[0].z).toBeCloseTo(-0.5, 2); // Within 0.01 of original
    expect(vertices[1].z).toBeLessThan(-Math.sqrt(3) / 2);
    expect(vertices[1].z).toBeCloseTo(-Math.sqrt(3) / 2, 2);

    // X coordinates should also be minimally adjusted outward
    expect(vertices[0].x).toBeCloseTo(0, 2); // Should stay very close to 0
    expect(vertices[1].x).toBeGreaterThan(0.5);
    expect(vertices[1].x).toBeCloseTo(0.5, 2); // Should stay very close to 0.5
  });

  test('should not modify vertices with zero offset', () => {
    const vertices = [createVector3(1, 2, 3), createVector3(4, 5, 6)];
    const originalCoords = vertices.map((v) => ({ x: v.x, y: v.y, z: v.z }));

    applyNormalOffset(vertices, mockGrid, selectedCells, 0);

    vertices.forEach((vertex, index) => {
      expect(vertex.x).toBe(originalCoords[index].x);
      expect(vertex.y).toBe(originalCoords[index].y);
      expect(vertex.z).toBe(originalCoords[index].z);
    });
  });

  test('should handle empty vertex array without error', () => {
    const vertices: THREE.Vector3[] = [];

    expect(() => {
      applyNormalOffset(vertices, mockGrid, selectedCells, 0.1);
    }).not.toThrow();

    expect(vertices).toHaveLength(0);
  });

  test('should modify vertices in place', () => {
    const vertices = [createVector3(0, 0, 0)];
    const originalVertex = vertices[0];

    // Mock minimal grid behavior for this test
    mockGrid.getCellById.mockReturnValue(createTestCell(0, 0));
    mockGrid.getNeighborCoordinates.mockReturnValue([]);

    applyNormalOffset(vertices, mockGrid, selectedCells, 0.1);

    // Should be the same object reference
    expect(vertices[0]).toBe(originalVertex);
  });

  test('should handle various offset magnitudes proportionally', () => {
    const createTestVertices = () => [createVector3(1, 0, 0)];

    // Mock simple boundary scenario
    mockGrid.getCellById.mockReturnValue(createTestCell(0, 0));
    mockGrid.getNeighborCoordinates.mockReturnValue([]);

    const smallOffset = createTestVertices();
    const largeOffset = createTestVertices();

    applyNormalOffset(smallOffset, mockGrid, selectedCells, 0.001);
    applyNormalOffset(largeOffset, mockGrid, selectedCells, 0.01);

    // Larger offset should move vertices further from original position
    // but both should still be very close to original (minimal offset principle)
    const smallDistance = Math.abs(smallOffset[0].x - 1);
    const largeDistance = Math.abs(largeOffset[0].x - 1);

    expect(largeDistance).toBeGreaterThan(smallDistance);
    expect(smallDistance).toBeLessThan(0.01); // Small offset stays very close
    expect(largeDistance).toBeLessThan(0.1); // Even large offset is minimal
  });
});
```

## 4. Running the Tests

### 4.1. Initial Test Run

Before implementing any functions, run the test suite:

```bash
cd packages/hexboard
npm test -- --testPathPattern=layout.test.ts
```

**Expected Result**: All tests should FAIL with messages like:

- "getHexFaceEdge is not a function"
- "applyElevationOffset is not a function"
- "applyNormalOffset is not a function"

### 4.2. Success Criteria

The tests are properly written if:

- ✅ TypeScript compiles without errors
- ✅ Tests fail only due to missing function implementations
- ✅ No syntax errors or import issues
- ✅ Mock setup works correctly
- ❌ Functions don't exist yet (expected failure)

## 5. Implementation Guidance

Once these tests are written and failing correctly:

1. **DO NOT implement the functions yet** - this is TDD, tests come first
2. **Verify test quality** - ensure tests clearly document expected behavior
3. **Review with technical lead** - confirm test specifications match
   requirements
4. **Proceed to implementation** - only after tests are approved

### 5.1. Recommended Offset Values

Based on typical 3D rendering requirements:

- **Elevation offset**: `0.001` to `0.01` world units
  - Purpose: Prevent z-fighting with tile surfaces
  - Should be just large enough to ensure depth buffer priority
  - Too small: may still cause z-fighting
  - Too large: boundary appears to "float" above tiles

- **Normal offset**: `0.001` to `0.005` world units
  - Purpose: Ensure boundary doesn't render "inside" tile edges
  - Should be barely perceptible to maintain visual fidelity
  - Too small: may still have edge rendering conflicts
  - Too large: boundary appears separated from tile perimeter

## 6. Test Quality Checklist

Before submitting, verify:

- [ ] All imports resolve correctly
- [ ] THREE.js mocking works as expected
- [ ] Helper functions are well-documented
- [ ] Each test has a clear, descriptive name
- [ ] Test assertions are specific and meaningful
- [ ] Edge cases are covered (empty arrays, zero values, etc.)
- [ ] Tests fail with appropriate error messages
- [ ] No implementation details are assumed beyond the function signatures

These tests will serve as both specification and validation for the utility
functions. They should be clear enough that another developer could implement
the functions based solely on reading these tests.
