# Layout Module Refactoring Plan

**Date:** 2025-07-27  
**Audience:** Development team implementing hexboard library refactoring  
**Author:** Software Architect

## 1. Executive Summary

This plan outlines the refactoring of the monolithic `src/rendering/layout.ts`
module into four focused modules organized by functionality. This refactoring
supports the upcoming boundary line improvement implementation while
establishing better code organization and maintainability.

**Development Approach**: This refactoring follows a **Test-Driven Development
(TDD)** strategy where tests are updated first to establish the new module
structure, then implementation is moved to match.

## 2. Current State Analysis

### 2.1. Current Implementation

- **File**: `src/rendering/layout.ts` (180 lines)
- **Test**: `tests/rendering/layout.test.ts` (486 lines)
- **Functions**: 6 exported functions covering diverse responsibilities
- **Dependencies**: Used by `boundaryLineStrategy.ts`, `boardRenderer.ts`,
  `entityRenderer.ts`

### 2.2. Problems with Current Structure

1. **Mixed responsibilities**: Coordinate conversion, geometry extraction,
   vertex manipulation
2. **Large test file**: 486 lines becoming unwieldy
3. **Future growth**: Boundary line improvements will add significant complexity
4. **Poor cohesion**: Functions serve different rendering subsystems

## 3. Proposed Module Structure

### 3.1. Core Layout Module

**File**: `src/rendering/hexLayout.ts`

**Purpose**: Fundamental hex coordinate system utilities

**Functions**:

```typescript
/**
 * Converts hex coordinates to world position using flat-top hexagon layout.
 */
export function hexToWorld({ q, r }: HexCoordinates): THREE.Vector3;

/**
 * Converts world position back to hex coordinates using flat-top layout.
 */
export function worldToHex(worldPos: THREE.Vector3): HexCoordinates;

/**
 * Rounds fractional hex coordinates to the nearest valid integer coordinates.
 * Exposed for testing and advanced use cases.
 */
export function roundHexCoordinates({
  q,
  r,
  s,
}: HexCoordinates): HexCoordinates;
```

**Constants**:

- Size constants and layout parameters
- Mathematical constants for flat-top layout

**Dependencies**:

- `../core/coordinates` (HexCoordinates)
- `three` (Vector3)

**Size Estimate**: ~60 lines

### 3.2. Hex Geometry Module

**File**: `src/rendering/hexGeometry.ts`

**Purpose**: Hex cell geometric properties and face/edge extraction

**Functions**:

```typescript
/**
 * Gets the world-space vertices for a specific face of a hexagonal cell.
 */
export function getHexFaceVertices<T extends Record<string, unknown>>(
  cell: Cell<T>,
  direction: Direction
): [THREE.Vector3, THREE.Vector3];

/**
 * Gets the world-space edge endpoints for a specific face of a hexagonal cell.
 */
export function getHexFaceEdge<T extends Record<string, unknown>>(
  cell: Cell<T>,
  direction: Direction
): { start: THREE.Vector3; end: THREE.Vector3 };

/**
 * Gets all six corner positions of a hex cell in world space.
 */
export function getHexCorners<T extends Record<string, unknown>>(
  cell: Cell<T>
): THREE.Vector3[];
```

**Constants**:

```typescript
/**
 * Local corner positions for flat-top hexagon.
 * Order corresponds to Direction enum: North, Northeast, Southeast, South, Southwest, Northwest
 */
export const HEX_CORNERS: readonly THREE.Vector3[];
```

**Dependencies**:

- `../core/cell` (Cell)
- `../core/types` (Direction)
- `./hexLayout` (hexToWorld)
- `three` (Vector3)

**Size Estimate**: ~80 lines

### 3.3. Boundary Path Module

**File**: `src/rendering/boundaryPath.ts`

**Purpose**: Boundary detection and continuous path building for cell groups

**Interfaces**:

```typescript
export interface BoundaryPath {
  points: THREE.Vector3[];
  closed: boolean;
}

export interface EdgeSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  cellId: string;
  direction: Direction;
}
```

**Functions**:

```typescript
/**
 * Converts boundary faces into continuous paths suitable for tube geometry.
 */
export function buildBoundaryPaths<T extends Record<string, unknown>>(
  boundaryMap: BoundaryMap,
  grid: HexGrid<T>
): BoundaryPath[];

/**
 * Converts boundary faces to edge segments with metadata.
 */
export function boundaryFacesToEdges<T extends Record<string, unknown>>(
  boundaryMap: BoundaryMap,
  grid: HexGrid<T>
): EdgeSegment[];

/**
 * Connects edge segments into continuous paths.
 */
export function connectEdgeSegments(edges: EdgeSegment[]): BoundaryPath[];
```

**Dependencies**:

- `../core/hexGrid` (HexGrid, BoundaryMap)
- `../core/types` (Direction)
- `./hexGeometry` (getHexFaceEdge)
- `three` (Vector3)

**Size Estimate**: ~120 lines

### 3.4. Vertex Utilities Module

**File**: `src/rendering/vertexUtils.ts`

**Purpose**: Generic vertex transformation utilities

**Functions**:

```typescript
/**
 * Applies an elevation offset to an array of vertices by modifying their Y coordinates.
 */
export function applyElevationOffset(
  vertices: THREE.Vector3[],
  offset: number
): void;

/**
 * Applies a normal offset to vertices by pushing them outward from their centroid.
 */
export function applyNormalOffset<T extends Record<string, unknown>>(
  vertices: THREE.Vector3[],
  grid: HexGrid<T>,
  selectedCells: Set<string>,
  offset: number
): void;

/**
 * Calculates the centroid of an array of vertices.
 */
export function calculateCentroid(vertices: THREE.Vector3[]): THREE.Vector3;

/**
 * Applies uniform scaling to vertices around a center point.
 */
export function scaleVertices(
  vertices: THREE.Vector3[],
  scale: number,
  center?: THREE.Vector3
): void;
```

**Dependencies**:

- `../core/hexGrid` (HexGrid)
- `three` (Vector3)

**Size Estimate**: ~70 lines

## 4. Test Structure

### 4.1. Core Layout Tests

**File**: `tests/rendering/hexLayout.test.ts`

**Test Suites**:

- `hexToWorld()` coordinate conversion tests (existing)
- `worldToHex()` reverse conversion tests (existing)
- `roundHexCoordinates()` rounding algorithm tests (new, extracted from
  integration tests)

**Size Estimate**: ~120 lines

### 4.2. Hex Geometry Tests

**File**: `tests/rendering/hexGeometry.test.ts`

**Test Suites**:

- `getHexFaceVertices()` tests (existing, extracted)
- `getHexFaceEdge()` tests (existing, extracted)
- `getHexCorners()` tests (new)
- `HEX_CORNERS` constant validation tests (new)

**Size Estimate**: ~180 lines

### 4.3. Boundary Path Tests

**File**: `tests/rendering/boundaryPath.test.ts`

**Test Suites**:

- `buildBoundaryPaths()` comprehensive path building tests
- `boundaryFacesToEdges()` edge conversion tests
- `connectEdgeSegments()` path connection tests
- Complex boundary scenarios (holes, multiple regions)

**Size Estimate**: ~200 lines

### 4.4. Vertex Utilities Tests

**File**: `tests/rendering/vertexUtils.test.ts`

**Test Suites**:

- `applyElevationOffset()` tests (existing, extracted)
- `applyNormalOffset()` tests (existing, extracted)
- `calculateCentroid()` tests (new)
- `scaleVertices()` tests (new)

**Size Estimate**: ~150 lines

## 5. Guiding Principles for Refactoring

To ensure a smooth and successful migration, the following principles must be strictly followed:

- **No Functional Changes**: This refactoring is purely structural. The implementation logic of any function must not be altered. The goal is to move code, not change it.
- **No Test Behavior Changes**: All existing tests should pass with their original assertions intact. Test logic should not be modified, only reorganized.
- **Refactoring Errors vs. Bugs**: If a test fails after the refactoring, it must be assumed that the error is in the refactoring process (e.g., incorrect module imports, missing mocks) and not a pre-existing bug in the implementation. The refactoring itself is the variable under scrutiny.

## 6. Migration Implementation Plan

**TDD Strategy**: Tests are updated first to define the new module structure,
ensuring no functionality is lost during refactoring.

### Phase 1: Create New Test Files and Shared Helpers (TDD)

**Duration**: 1 day

**Objective**: Establish the new module structure through tests first, ensuring
all existing functionality is preserved. This includes centralizing shared test utilities.

1.  **Create `tests/rendering/test-helpers.ts`**:
    - Create a new file for shared test utilities to avoid code duplication.
    - Move helper functions like `createTestCell`, `createVector3`, and `expectCloseTo` into this file and export them.

2.  **Create `tests/rendering/hexLayout.test.ts`**:
    - Extract coordinate conversion tests from `layout.test.ts`.
    - Add tests for newly exposed `roundHexCoordinates()`.
    - Update imports to target the new module structure and use the shared `test-helpers.ts`.
    - **Verify tests fail** initially (no implementation yet).

3.  **Create `tests/rendering/hexGeometry.test.ts`**:
    - Extract face/edge geometry tests from `layout.test.ts`.
    - Add tests for new `getHexCorners()` utility and `HEX_CORNERS` constant.
    - Update imports to use `test-helpers.ts`. The `hexToWorld` import will need to point to the new `hexLayout` module.
    - **Verify tests fail** initially.

4.  **Create `tests/rendering/vertexUtils.test.ts`**:
    - Extract vertex manipulation tests from `layout.test.ts`.
    - Add tests for new `calculateCentroid()` and `scaleVertices()` utilities.
    - **Crucially, move the `HexGrid` mock and `beforeEach` setup for `applyNormalOffset` tests into this file.**
    - Update imports to use `test-helpers.ts`.
    - **Verify tests fail** initially.

5.  **Create `tests/rendering/boundaryPath.test.ts`**:
    - Create placeholder test structure for future boundary path functionality.
    - Define test cases for `buildBoundaryPaths()` and related functions.
    - **Tests should be skipped initially** (functionality doesn't exist yet).

### Phase 2: Create New Implementation Modules

**Duration**: 1 day

**Objective**: Implement the new modules to make the reorganized tests pass.

1.  **Create `src/rendering/hexLayout.ts`**:
    - Extract coordinate conversion functions from `layout.ts`.
    - Move mathematical constants.
    - Expose `roundHexCoordinates()` for testing.
    - Add comprehensive JSDoc.
    - **Verify `hexLayout.test.ts` tests pass**.

2.  **Create `src/rendering/hexGeometry.ts`**:
    - Extract face/edge functions from `layout.ts`.
    - Move `HEX_CORNERS` constant.
    - Implement `getHexCorners()` utility.
    - **Verify `hexGeometry.test.ts` tests pass**.

3.  **Create `src/rendering/vertexUtils.ts`**:
    - Extract vertex manipulation functions from `layout.ts`.
    - Implement `calculateCentroid()` and `scaleVertices()` utilities.
    - Improve normal offset algorithm if needed.
    - **Verify `vertexUtils.test.ts` tests pass**.

4.  **Create `src/rendering/boundaryPath.ts`**:
    - Create placeholder module structure.
    - Define interfaces (`BoundaryPath`, `EdgeSegment`).
    - Implement stub functions to satisfy TypeScript.
    - **Keep tests skipped** (full implementation in boundary line improvement).

### Phase 3: Update Import Dependencies

**Duration**: 0.5 days

**Objective**: Update all dependent files to use the new module structure.

1.  **Update dependent files**:
    - `boundaryLineStrategy.ts`
    - `boardRenderer.ts`
    - `entityRenderer.ts`
    - Any other files importing from `layout.ts`.
    - **Run full test suite** to verify no regressions.

2.  **Update rendering index**:
    - Add re-exports for backward compatibility.
    - Maintain existing public API.
    - **Verify external API unchanged**.

### Phase 4: Remove Original Files

**Duration**: 0.5 days

**Objective**: Clean up original files and finalize the refactoring.

1.  **Remove original files**:
    - Delete `src/rendering/layout.ts`.
    - Delete `tests/rendering/layout.test.ts`.
    - **Verify all tests still pass**.

2.  **Remove backward compatibility**:
    - Update imports to remove re-export layer.
    - Direct imports to new modules.
    - **Final test suite run**.

3.  **Documentation cleanup**:
    - Update any documentation referencing old structure.
    - Verify JSDoc accuracy.

## 7. Acceptance Criteria

### 6.1. Functional Requirements

- [ ] All existing functionality preserved
- [ ] No breaking changes to public API
- [ ] All tests pass without modification
- [ ] Import paths updated correctly

### 6.2. Code Quality Requirements

- [ ] Each module has single, clear responsibility
- [ ] Module size under 120 lines
- [ ] Test file size under 200 lines
- [ ] Comprehensive JSDoc for all public functions

### 6.3. Test Coverage Requirements

- [ ] Maintain 100% test coverage for extracted functions
- [ ] Add tests for newly exposed utilities (`roundHexCoordinates`,
      `getHexCorners`)
- [ ] Integration tests verify module interactions
- [ ] **TDD validation**: All tests pass after each implementation phase
- [ ] **Red-Green-Refactor**: Tests fail initially, then pass after
      implementation

### 6.4. Documentation Requirements

- [ ] Update system brief to reflect new module structure
- [ ] Add module-level documentation explaining purpose
- [ ] Update rendering index documentation

## 7. Risk Assessment

### 7.1. Technical Risks

- **Import dependency conflicts**: Multiple files importing same utilities
- **Circular dependencies**: Modules depending on each other
- **Test migration errors**: Lost test coverage during file splits
- **Implementation drift**: New modules not matching test expectations

### 7.2. Mitigation Strategies

- **TDD approach**: Tests written first ensure no functionality loss
- Use dependency analysis tools to verify import structure
- Implement modules in dependency order (layout → geometry → utils → boundary)
- Migrate tests incrementally with validation at each step
- Maintain comprehensive integration tests
- **Fail-fast validation**: Tests must fail initially, then pass after
  implementation

## 8. Future Benefits

### 8.1. Immediate Benefits

- **Clearer code organization**: Each module has focused responsibility
- **Manageable test files**: No test file exceeds 200 lines
- **Better maintainability**: Changes isolated to relevant modules

### 8.2. Long-term Benefits

- **Easier feature additions**: New geometry or path algorithms have clear homes
- **Reusable utilities**: Vertex utils can support other rendering features
- **Better testing**: Focused test files enable faster feedback loops
- **Documentation clarity**: Module purpose immediately apparent
- **TDD foundation**: Established test-first approach for future development

## 9. Timeline

- **Phase 1**: Create new test files - TDD (1 day)
- **Phase 2**: Create new implementation modules (1 day)
- **Phase 3**: Update dependencies (0.5 days)
- **Phase 4**: Remove original files (0.5 days)

**Total**: 3 development days

**TDD Benefits**: By creating tests first, we ensure:

- No functionality is lost during refactoring
- New module boundaries are well-defined
- Implementation can be verified incrementally
- Confidence in the refactoring process

This refactoring establishes the foundation for the boundary line improvement
implementation while significantly improving code organization and
maintainability.
