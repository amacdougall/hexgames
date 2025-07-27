# Cell Group Highlight Test Plan - Section 3.3 Rendering Strategy

**Date:** 2025-07-22  
**Section:** 3.3 Rendering Strategy  
**TDD Phase:** Test Plan

## Overview

This test plan covers the implementation of the new rendering strategy system
for cell group highlighting as described in section 3.3 of the proposal. The
tests are designed to fail initially due to missing implementation, not syntax
or type errors.

## Prerequisites

Ensure that sections 3.1 (Core Logic) and 3.2 (Layout and Coordinate Conversion)
are fully implemented before beginning this test phase, as the rendering
strategy depends on:

- `HexGrid.findBoundaryFaces()` method
- `layout.getHexFaceVertices()` function

## Test File Structure

Create the following test files in `packages/hexboard/src/rendering/`:

- `modelHighlightStrategy.test.ts`
- `cellGroupHighlightStrategy.test.ts`
- `boundaryLineStrategy.test.ts`

## 1. ModelHighlightStrategy Tests

**File:** `packages/hexboard/src/rendering/modelHighlightStrategy.test.ts`

### Test 1.1: Interface Rename Verification

```typescript
describe('ModelHighlightStrategy', () => {
  it('should be available as renamed interface from HighlightStrategy', () => {
    // Test that ModelHighlightStrategy interface exists
    // Test that it has the same method signatures as current HighlightStrategy
  });
});
```

### Test 1.2: DefaultModelHighlightStrategy Rename

```typescript
describe('DefaultModelHighlightStrategy', () => {
  it('should be available as renamed class from DefaultHighlightStrategy', () => {
    // Test that DefaultModelHighlightStrategy class exists
    // Test that it maintains the same behavior as current DefaultHighlightStrategy
  });

  it('should apply highlighting to THREE.Object3D models', () => {
    // Test the apply() method with a mock THREE.Object3D
    // Verify material changes are applied correctly
  });

  it('should remove highlighting from THREE.Object3D models', () => {
    // Test the remove() method restores original materials
  });
});
```

## 2. CellGroupHighlightStrategy Interface Tests

**File:** `packages/hexboard/src/rendering/cellGroupHighlightStrategy.test.ts`

### Test 2.1: Interface Definition

```typescript
describe('CellGroupHighlightStrategy interface', () => {
  it('should define apply method with correct signature', () => {
    // Test that CellGroupHighlightStrategy interface exists
    // Verify apply(cells: Cell[], grid: HexGrid): THREE.Object3D signature
  });

  it('should define remove method with correct signature', () => {
    // Verify remove(effect: THREE.Object3D, scene: THREE.Scene): void signature
  });
});
```

### Test 2.2: Type Checking

```typescript
describe('CellGroupHighlightStrategy type checking', () => {
  it('should accept implementations that follow the interface', () => {
    // Create a mock implementation and verify it satisfies the interface
  });

  it('should reject implementations missing required methods', () => {
    // Compile-time test to ensure interface enforcement
  });
});
```

## 3. BoundaryLineStrategy Tests

**File:** `packages/hexboard/src/rendering/boundaryLineStrategy.test.ts`

### Test 3.1: Class Structure

```typescript
describe('BoundaryLineStrategy', () => {
  it('should implement CellGroupHighlightStrategy interface', () => {
    // Test that BoundaryLineStrategy implements the interface
  });

  it('should be instantiable', () => {
    // Test constructor works without errors
  });
});
```

### Test 3.2: Apply Method Functionality

```typescript
describe('BoundaryLineStrategy.apply()', () => {
  let strategy: BoundaryLineStrategy;
  let mockGrid: HexGrid<any>;
  let mockCells: Cell[];

  beforeEach(() => {
    // Setup mock grid with findBoundaryFaces method
    // Setup mock cells array
    strategy = new BoundaryLineStrategy();
  });

  it('should call HexGrid.findBoundaryFaces with provided cells', () => {
    // Mock HexGrid.findBoundaryFaces to return empty BoundaryMap
    // Call strategy.apply(mockCells, mockGrid)
    // Verify findBoundaryFaces was called with mockCells
  });

  it('should return a THREE.Group object', () => {
    // Call strategy.apply(mockCells, mockGrid)
    // Verify return value is instanceof THREE.Group
  });

  it('should create THREE.Line objects for boundary faces', () => {
    // Setup mockGrid.findBoundaryFaces to return test BoundaryMap
    // Mock layout.getHexFaceVertices to return test vertices
    // Call strategy.apply(mockCells, mockGrid)
    // Verify returned group contains THREE.Line objects
  });

  it('should use white color for boundary lines', () => {
    // Setup test data
    // Call strategy.apply(mockCells, mockGrid)
    // Verify line materials have white color
  });

  it('should handle empty cell array', () => {
    // Call strategy.apply([], mockGrid)
    // Verify returns empty THREE.Group without errors
  });

  it('should handle cells with no boundary faces', () => {
    // Setup findBoundaryFaces to return empty sets
    // Call strategy.apply(mockCells, mockGrid)
    // Verify returns empty THREE.Group without errors
  });
});
```

### Test 3.3: Remove Method Functionality

```typescript
describe('BoundaryLineStrategy.remove()', () => {
  let strategy: BoundaryLineStrategy;
  let mockScene: THREE.Scene;
  let mockEffect: THREE.Object3D;

  beforeEach(() => {
    strategy = new BoundaryLineStrategy();
    mockScene = new THREE.Scene();
    mockEffect = new THREE.Group();
  });

  it('should remove effect from scene', () => {
    // Add mockEffect to mockScene
    // Call strategy.remove(mockEffect, mockScene)
    // Verify mockEffect is no longer in scene.children
  });

  it('should dispose of geometries in the effect', () => {
    // Create effect with mock geometries
    // Spy on geometry.dispose() methods
    // Call strategy.remove(mockEffect, mockScene)
    // Verify dispose() was called on all geometries
  });

  it('should dispose of materials in the effect', () => {
    // Create effect with mock materials
    // Spy on material.dispose() methods
    // Call strategy.remove(mockEffect, mockScene)
    // Verify dispose() was called on all materials
  });

  it('should handle null or undefined effect gracefully', () => {
    // Call strategy.remove(null, mockScene)
    // Call strategy.remove(undefined, mockScene)
    // Verify no errors are thrown
  });
});
```

### Test 3.4: Integration Tests

```typescript
describe('BoundaryLineStrategy integration', () => {
  it('should work with real Cell and HexGrid objects', () => {
    // Create real HexGrid with test cells
    // Add cells that form a boundary
    // Call strategy.apply() with real data
    // Verify boundary lines are created correctly
  });

  it('should handle complex boundary shapes', () => {
    // Test L-shaped selection
    // Test disconnected cell groups
    // Test single cell selection
    // Verify boundary detection and line creation
  });
});
```

## Expected Test Failures

All tests should fail initially with clear error messages indicating missing:

- `ModelHighlightStrategy` interface (renamed from `HighlightStrategy`)
- `DefaultModelHighlightStrategy` class (renamed from
  `DefaultHighlightStrategy`)
- `CellGroupHighlightStrategy` interface
- `BoundaryLineStrategy` class

Tests should NOT fail due to:

- Syntax errors
- Type definition errors (except for missing types)
- Import errors for existing dependencies
- Setup/configuration issues

## Success Criteria

- All test files compile without syntax errors
- Tests fail with "not implemented" type errors, not syntax/import errors
- Test structure clearly demonstrates expected behavior
- Mocking strategy allows testing without full implementation dependencies
- Tests cover both happy path and edge cases
