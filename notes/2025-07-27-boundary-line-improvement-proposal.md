# Boundary Line Improvement Proposal

**Date:** 2025-07-27  
**Audience:** Technical leads implementing hexboard library enhancements  
**Author:** Software Architect  
**Prerequisites:** This proposal assumes completion of the layout module
refactoring outlined in `2025-07-27-layout-refactor-plan.md`

## 1. Executive Summary

The current `BoundaryLineStrategy` implementation uses `THREE.LineBasicMaterial`
which suffers from WebGL limitations (1-pixel line width) and produces visually
inconsistent joints between boundary segments. This proposal outlines a phased
approach to replace the current implementation with `THREE.TubeGeometry`,
providing thick, visually consistent boundary lines with smooth joints and
proper visual separation from tile surfaces.

## 2. Current System Analysis

### 2.1. Current Implementation

The existing `BoundaryLineStrategy` operates as follows:

1. Uses `HexGrid.findBoundaryFaces()` to identify boundary faces as a
   `BoundaryMap`
2. For each boundary face, calls `getHexFaceVertices()` (from `hexGeometry.ts`)
   to get edge endpoints
3. Creates individual `THREE.Line` objects with `LineBasicMaterial`
4. Groups all lines in a `THREE.Group` returned by `apply()`

### 2.2. Current Limitations

1. **Line thickness**: `LineBasicMaterial.linewidth` ignored on most platforms
   due to WebGL Core Profile limitations
2. **Visual separation**: Lines sit exactly at tile elevation, causing
   z-fighting
3. **Joint inconsistency**: Each boundary face creates a separate `THREE.Line`,
   resulting in disconnected joints
4. **Interior placement**: Vertical boundary faces may appear "inside" tiles

### 2.3. Integration Points

- `BoardRenderer.addHighlightGroup()` calls `cellGroupHighlightStrategy.apply()`
- `BoardRenderer.removeHighlightGroup()` calls
  `cellGroupHighlightStrategy.remove()`
- Used in practice by test application for movement highlighting (lines 62-82 in
  `main.ts`)

## 3. Proposed Solution

Replace individual `THREE.Line` objects with continuous `THREE.TubeGeometry`
paths that provide:

- Configurable thickness in world coordinates
- Smooth joints between connected boundary segments
- Elevation offset to prevent z-fighting
- Normal offset to push lines outward from selection

## 4. Implementation Phases

### Phase 1: Enhanced Utility Functions

**Objective**: Enhance existing utility functions in refactored modules while
maintaining backward compatibility.

**TDD Requirements**: Write comprehensive tests before implementation.

#### 4.1.1. Test Requirements

**Note**: Following the layout module refactoring plan, tests will be added to
existing test files:

1. **`getHexFaceEdge()` tests** in `tests/rendering/hexGeometry.test.ts`:
   - Verify edge endpoints match `getHexFaceVertices()` output (from
     `hexGeometry.ts`)
   - Test all six directions with various cell positions
   - Validate elevation handling

2. **`applyElevationOffset()` tests** in `tests/rendering/vertexUtils.test.ts`:
   - Verify Y-coordinate adjustment for vertex arrays
   - Test with positive, negative, and zero offsets
   - Ensure X and Z coordinates remain unchanged

3. **`applyNormalOffset()` tests** in `tests/rendering/vertexUtils.test.ts`:
   - Mock grid neighbor detection
   - Verify outward normal calculation
   - Test offset application to vertices

#### 4.1.2. Implementation Requirements

**Note**: Following the layout module refactoring plan, functions will be
implemented in dedicated modules:

**In `src/rendering/hexGeometry.ts`** (function already exists, enhance if
needed):

```typescript
/**
 * Converts a boundary face to a 3D edge segment.
 * @param cell - The hexagonal cell
 * @param direction - The face direction
 * @returns Object with start and end Vector3 points
 */
export function getHexFaceEdge<T extends Record<string, unknown>>(
  cell: Cell<T>,
  direction: Direction
): { start: THREE.Vector3; end: THREE.Vector3 };
```

**In `src/rendering/vertexUtils.ts`** (functions already exist, enhance if
needed):

```typescript
/**
 * Applies elevation offset to an array of vertices.
 * @param vertices - Array of Vector3 objects to modify
 * @param offset - Y-axis offset to apply
 */
export function applyElevationOffset(
  vertices: THREE.Vector3[],
  offset: number
): void;

/**
 * Applies outward normal offset to vertices based on grid context.
 * @param vertices - Array of Vector3 objects to modify
 * @param grid - HexGrid for neighbor detection
 * @param selectedCells - Set of selected cell IDs
 * @param offset - Distance to push outward
 */
export function applyNormalOffset<T extends Record<string, unknown>>(
  vertices: THREE.Vector3[],
  grid: HexGrid<T>,
  selectedCells: Set<string>,
  offset: number
): void;
```

#### 4.1.3. Acceptance Criteria

- All tests pass
- Functions work with existing `getHexFaceVertices()` output (from
  `hexGeometry.ts`)
- No breaking changes to existing API
- Performance acceptable for typical game board sizes

### Phase 2: Path Building Algorithm

**Objective**: Convert boundary faces into continuous paths for tube creation.

#### 4.2.1. Test Requirements

Create `tests/rendering/boundaryPath.test.ts`:

1. **Edge connection tests**:
   - Single cell (closed loop)
   - Linear selection (open path)
   - L-shaped selection (single path with corner)
   - Multiple disconnected regions
   - Complex shapes with holes

2. **Path ordering tests**:
   - Verify path direction consistency
   - Test clockwise/counterclockwise ordering
   - Validate start/end point connections

#### 4.2.2. Implementation Requirements

Add to `src/rendering/boundaryPath.ts`:

```typescript
export interface BoundaryPath {
  points: THREE.Vector3[];
  closed: boolean;
}

/**
 * Converts boundary faces into continuous paths suitable for tube geometry.
 * @param boundaryMap - Output from HexGrid.findBoundaryFaces()
 * @param grid - HexGrid containing the cells
 * @returns Array of continuous boundary paths
 */
export function buildBoundaryPaths<T extends Record<string, unknown>>(
  boundaryMap: BoundaryMap,
  grid: HexGrid<T>
): BoundaryPath[];
```

#### 4.2.3. Algorithm Overview

1. Convert each boundary face to edge segments using `getHexFaceEdge()` (from
   `hexGeometry.ts`)
2. Build connectivity map of edge endpoints
3. Trace connected sequences to form continuous paths
4. Detect closed loops vs open paths
5. Return ordered path arrays ready for tube generation

### Phase 3: Enhanced BoundaryLineStrategy

**Objective**: Replace LINE-based implementation with TubeGeometry while
maintaining interface compatibility.

#### 4.3.1. Test Requirements

Create `tests/rendering/enhancedBoundaryLineStrategy.test.ts`:

1. **Constructor tests**:
   - Validate new configuration parameters
   - Test backward compatibility with existing parameters
   - Verify default value behavior

2. **Rendering tests**:
   - Mock `THREE.TubeGeometry` and `THREE.MeshBasicMaterial`
   - Verify tube creation for various cell selections
   - Test elevation and normal offset application
   - Validate proper material assignment

3. **Disposal tests**:
   - Verify `THREE.Mesh` cleanup instead of `THREE.Line`
   - Test geometry and material disposal
   - Ensure scene removal

#### 4.3.2. Implementation Requirements

Replace `BoundaryLineStrategy` implementation with updated imports:

```typescript
import { buildBoundaryPaths, BoundaryPath } from './boundaryPath';
import { applyElevationOffset, applyNormalOffset } from './vertexUtils';

export class BoundaryLineStrategy implements CellGroupHighlightStrategy {
  constructor(
    private lineColor: THREE.Color = new THREE.Color(0xffffff),
    private tubeRadius: number = 0.02,
    private elevationOffset: number = 0.01,
    private normalOffset: number = 0.05,
    private tubularSegments: number = 8
  ) {}

  apply<T extends Record<string, unknown>>(
    cells: Cell<T>[],
    grid: HexGrid<T>
  ): THREE.Object3D {
    // 1. Get boundary faces
    // 2. Build continuous paths using buildBoundaryPaths() (from boundaryPath.ts)
    // 3. Apply elevation and normal offsets (from vertexUtils.ts)
    // 4. Create TubeGeometry for each path
    // 5. Return THREE.Group containing tube meshes
  }

  remove(effect: THREE.Object3D, scene: THREE.Scene): void {
    // Handle THREE.Mesh disposal instead of THREE.Line
  }
}
```

#### 4.3.3. Acceptance Criteria

- Maintains `CellGroupHighlightStrategy` interface
- Produces thick, consistent boundary lines
- Smooth joints at path connections
- Proper elevation separation from tiles
- Backward compatible constructor (where possible)

### Phase 4: BoardRenderer Integration

**Objective**: Ensure seamless integration with existing highlight system.

#### 4.4.1. Test Requirements

Create `tests/rendering/boardRendererIntegration.test.ts`:

1. **Highlight lifecycle tests**:
   - Test `addHighlightGroup()` with enhanced strategy
   - Verify `removeHighlightGroup()` cleanup
   - Test multiple concurrent highlight groups

2. **Strategy replacement tests**:
   - Test `setCellGroupHighlightStrategy()` with new implementation
   - Verify cleanup of existing highlights during strategy change

#### 4.4.2. Implementation Requirements

No changes required to `BoardRenderer` interface, but thorough testing needed:

- Verify enhanced `BoundaryLineStrategy` works with existing
  `addHighlightGroup()`
- Test proper cleanup in `removeHighlightGroup()`
- Validate scene management with `THREE.Mesh` objects

### Phase 5: Application Integration

**Objective**: Update test applications and validate real-world usage.

#### 4.5.1. Integration Testing

1. **Test application validation**:
   - Update `apps/hexboard-test/src/main.ts` to use enhanced strategy
   - Visual validation of improved boundary lines
   - Performance testing with large selections

2. **Documentation updates**:
   - Update system brief section 2.4
   - Add configuration examples
   - Document breaking changes (if any)

## 5. Risk Assessment

### 5.1. Technical Risks

- **Refactoring dependency**: This proposal depends on successful completion of
  layout module refactoring
- **Performance impact**: TubeGeometry more vertex-heavy than LineBasicMaterial
- **Path complexity**: Algorithm complexity for non-trivial selections
- **Breaking changes**: Constructor parameter changes may affect existing users

### 5.2. Mitigation Strategies

- Complete layout module refactoring before beginning boundary line improvements
- Implement performance benchmarks in Phase 1
- Provide fallback to original implementation if needed
- Use semantic versioning for breaking changes
- Comprehensive testing at each phase

## 6. Success Criteria

1. **Visual improvements**: Thick, consistent boundary lines with smooth joints
2. **No z-fighting**: Proper elevation separation from tile surfaces
3. **Performance**: No significant performance degradation for typical usage
4. **Compatibility**: Maintains existing `CellGroupHighlightStrategy` interface
5. **Test coverage**: >90% test coverage for all new functionality

## 7. Timeline Estimate

**Prerequisites**: Layout module refactoring (3 development days)

- **Phase 1**: 1-2 days (enhance existing utility functions in refactored
  modules)
- **Phase 2**: 3-4 days (path building algorithm)
- **Phase 3**: 3-4 days (strategy implementation)
- **Phase 4**: 1-2 days (integration testing)
- **Phase 5**: 1-2 days (application integration)

**Total**: 9-14 development days (plus 3 days for prerequisite refactoring)

## 8. Future Enhancements

This foundation enables future enhancements:

- Animated boundary effects
- Gradient coloring along boundaries
- Custom boundary styles (dashed, dotted)
- Performance optimizations for large selections
