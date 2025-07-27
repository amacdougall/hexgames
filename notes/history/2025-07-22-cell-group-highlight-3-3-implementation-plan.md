# Cell Group Highlight Implementation Plan - Section 3.3 Rendering Strategy

**Date:** 2025-07-22  
**Section:** 3.3 Rendering Strategy  
**TDD Phase:** Implementation Plan

## Overview

This implementation plan follows the test plan and implements the new rendering
strategy system for cell group highlighting as described in section 3.3 of the
proposal. All tests should pass after following this implementation.

## Prerequisites

Before starting implementation, ensure:

- All tests from the test plan are written and currently failing
- Sections 3.1 (Core Logic) and 3.2 (Layout and Coordinate Conversion) are
  implemented
- `HexGrid.findBoundaryFaces()` method is available
- `layout.getHexFaceVertices()` function is available

## Implementation Steps

### Step 1: Rename Existing HighlightStrategy

**File:** `packages/hexboard/src/rendering/highlightStrategy.ts`

#### 1.1 Rename Interface

```typescript
// Change interface name from HighlightStrategy to ModelHighlightStrategy
export interface ModelHighlightStrategy {
  apply(object: THREE.Object3D): void;
  remove(object: THREE.Object3D): void;
}
```

#### 1.2 Rename Implementation Class

```typescript
// Change class name from DefaultHighlightStrategy to DefaultModelHighlightStrategy
export class DefaultModelHighlightStrategy implements ModelHighlightStrategy {
  // Keep existing implementation unchanged
  // Methods: apply() and remove() remain the same
}
```

#### 1.3 Update Exports

```typescript
// Add export alias for backward compatibility during transition
export { ModelHighlightStrategy as HighlightStrategy };
export { DefaultModelHighlightStrategy as DefaultHighlightStrategy };
```

### Step 2: Create CellGroupHighlightStrategy Interface

**File:** `packages/hexboard/src/rendering/cellGroupHighlightStrategy.ts`

#### 2.1 Create New Interface File

```typescript
import * as THREE from 'three';
import { Cell } from '../core/cell.ts';
import { HexGrid } from '../core/hexGrid.ts';

/**
 * Strategy interface for creating visual effects based on a logical group of cells.
 * Unlike ModelHighlightStrategy, this operates on Cell data to create new THREE.Object3D effects.
 */
export interface CellGroupHighlightStrategy {
  /**
   * Creates a new visual effect for the given group of cells.
   * @param cells - Array of cells to create an effect for
   * @param grid - HexGrid containing the cells, used for spatial calculations
   * @returns A THREE.Object3D representing the visual effect
   */
  apply(cells: Cell[], grid: HexGrid<any>): THREE.Object3D;

  /**
   * Removes and properly disposes of a visual effect created by apply().
   * @param effect - The THREE.Object3D returned by apply()
   * @param scene - The THREE.Scene to remove the effect from
   */
  remove(effect: THREE.Object3D, scene: THREE.Scene): void;
}
```

### Step 3: Implement BoundaryLineStrategy

**File:** `packages/hexboard/src/rendering/boundaryLineStrategy.ts`

#### 3.1 Create Implementation Class

```typescript
import * as THREE from 'three';
import { CellGroupHighlightStrategy } from './cellGroupHighlightStrategy.ts';
import { Cell } from '../core/cell.ts';
import { HexGrid } from '../core/hexGrid.ts';
import { getHexFaceVertices } from './layout.ts';
import { Direction } from '../core/types.ts';

/**
 * Default implementation of CellGroupHighlightStrategy that draws white boundary lines
 * around the exterior edges of a cell group selection.
 */
export class BoundaryLineStrategy implements CellGroupHighlightStrategy {
  private readonly lineColor: THREE.Color;
  private readonly lineWidth: number;

  constructor(
    lineColor: THREE.Color = new THREE.Color(0xffffff),
    lineWidth: number = 2
  ) {
    this.lineColor = lineColor;
    this.lineWidth = lineWidth;
  }

  apply(cells: Cell[], grid: HexGrid<any>): THREE.Object3D {
    const group = new THREE.Group();

    // Handle empty input
    if (cells.length === 0) {
      return group;
    }

    // Get boundary faces for the cell group
    const boundaryMap = grid.findBoundaryFaces(cells);

    // Create line geometry for each boundary face
    boundaryMap.forEach((directions, cellId) => {
      const cell = grid.getCell(cellId);
      if (!cell) return;

      directions.forEach((direction) => {
        const vertices = getHexFaceVertices(cell, direction);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(vertices);

        const lineMaterial = new THREE.LineBasicMaterial({
          color: this.lineColor,
          linewidth: this.lineWidth,
        });

        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      });
    });

    return group;
  }

  remove(effect: THREE.Object3D, scene: THREE.Scene): void {
    if (!effect) return;

    // Remove from scene
    scene.remove(effect);

    // Dispose of all geometries and materials in the effect
    effect.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        // Dispose geometry
        if (child.geometry) {
          child.geometry.dispose();
        }

        // Dispose material(s)
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    // Clear the group
    if (effect instanceof THREE.Group) {
      effect.clear();
    }
  }
}
```

### Step 4: Update BoardRenderer Integration

**File:** `packages/hexboard/src/rendering/boardRenderer.ts`

#### 4.1 Add Imports

```typescript
import { CellGroupHighlightStrategy } from './cellGroupHighlightStrategy.ts';
import { BoundaryLineStrategy } from './boundaryLineStrategy.ts';
import {
  ModelHighlightStrategy,
  DefaultModelHighlightStrategy,
} from './highlightStrategy.ts';
```

#### 4.2 Update Constructor Parameters

```typescript
export class BoardRenderer<T extends Record<string, any> = {}> {
  // Update existing property name
  private modelHighlightStrategy: ModelHighlightStrategy;

  // Add new property
  private cellGroupHighlightStrategy: CellGroupHighlightStrategy;

  // Add tracking for group highlights
  private activeGroupHighlights: Map<string, THREE.Object3D> = new Map();

  constructor(
    scene: THREE.Scene,
    grid: HexGrid<T>,
    modelHighlightStrategy?: ModelHighlightStrategy,
    cellGroupHighlightStrategy?: CellGroupHighlightStrategy
  ) {
    // ... existing constructor code ...

    this.modelHighlightStrategy =
      modelHighlightStrategy ?? new DefaultModelHighlightStrategy();
    this.cellGroupHighlightStrategy =
      cellGroupHighlightStrategy ?? new BoundaryLineStrategy();
  }
}
```

#### 4.3 Update Existing Highlight Methods

```typescript
// Update method to use renamed strategy
highlightHexCell(cellId: string): void {
  const cell = this.grid.getCell(cellId);
  if (!cell) return;

  const object = this.objects.get(cellId);
  if (object) {
    this.modelHighlightStrategy.apply(object);
  }
}

// Update method to use renamed strategy
removeHighlightFromHexCell(cellId: string): void {
  const object = this.objects.get(cellId);
  if (object) {
    this.modelHighlightStrategy.remove(object);
  }
}

// Update bulk methods similarly...
```

#### 4.4 Add Group Highlight Methods

```typescript
/**
 * Creates a group highlight effect for the specified cells.
 * @param groupId - Unique identifier for this highlight group
 * @param cells - Array of cells to highlight as a group
 */
addHighlightGroup(groupId: string, cells: Cell[]): void {
  // Remove existing group with same ID if it exists
  this.removeHighlightGroup(groupId);

  // Create new group highlight effect
  const effect = this.cellGroupHighlightStrategy.apply(cells, this.grid);

  // Add to scene and track
  this.scene.add(effect);
  this.activeGroupHighlights.set(groupId, effect);
}

/**
 * Removes a group highlight effect.
 * @param groupId - Unique identifier of the highlight group to remove
 */
removeHighlightGroup(groupId: string): void {
  const effect = this.activeGroupHighlights.get(groupId);
  if (effect) {
    this.cellGroupHighlightStrategy.remove(effect, this.scene);
    this.activeGroupHighlights.delete(groupId);
  }
}

/**
 * Removes all active group highlights.
 */
removeAllHighlightGroups(): void {
  this.activeGroupHighlights.forEach((effect, groupId) => {
    this.cellGroupHighlightStrategy.remove(effect, this.scene);
  });
  this.activeGroupHighlights.clear();
}

/**
 * Gets the current cell group highlight strategy.
 */
getCellGroupHighlightStrategy(): CellGroupHighlightStrategy {
  return this.cellGroupHighlightStrategy;
}

/**
 * Sets a new cell group highlight strategy.
 */
setCellGroupHighlightStrategy(strategy: CellGroupHighlightStrategy): void {
  // Clean up existing highlights with old strategy
  this.removeAllHighlightGroups();
  this.cellGroupHighlightStrategy = strategy;
}
```

### Step 5: Update Module Exports

#### 5.1 Update Main Index File

**File:** `packages/hexboard/src/index.ts`

```typescript
// Add exports for new interfaces and classes
export { CellGroupHighlightStrategy } from './rendering/cellGroupHighlightStrategy.ts';
export { BoundaryLineStrategy } from './rendering/boundaryLineStrategy.ts';

// Update existing exports to use new names
export {
  ModelHighlightStrategy,
  DefaultModelHighlightStrategy,
} from './rendering/highlightStrategy.ts';

// Keep backward compatibility exports
export {
  ModelHighlightStrategy as HighlightStrategy,
  DefaultModelHighlightStrategy as DefaultHighlightStrategy,
} from './rendering/highlightStrategy.ts';
```

### Step 6: Update Type Definitions

#### 6.1 Ensure Direction Enum is Available

**File:** `packages/hexboard/src/core/types.ts`

Verify the Direction enum exists and is exported:

```typescript
export enum Direction {
  North,
  Northeast,
  Southeast,
  South,
  Southwest,
  Northwest,
}

export type BoundaryMap = Map<string, Set<Direction>>;
```

### Step 7: Documentation and Comments

#### 7.1 Add JSDoc Comments

Ensure all new interfaces and classes have comprehensive JSDoc comments
explaining:

- Purpose and use cases
- Parameter descriptions
- Return value explanations
- Usage examples where helpful

#### 7.2 Update README (if applicable)

Update any existing documentation to reflect the new rendering strategy system.

## Testing Strategy

After implementation:

1. **Run existing tests** - Ensure backward compatibility with renamed classes
2. **Run new tests** - All tests from the test plan should now pass
3. **Integration testing** - Test with real BoardRenderer instances
4. **Visual testing** - Verify boundary lines render correctly in test
   applications

## Success Criteria

✅ All tests pass  
✅ Backward compatibility maintained through export aliases  
✅ New group highlighting functionality works as specified  
✅ Memory management (dispose) works correctly  
✅ Integration with BoardRenderer is seamless  
✅ Code follows existing project conventions and patterns

## Migration Notes for Existing Code

- Existing `HighlightStrategy` usage continues to work via export alias
- `DefaultHighlightStrategy` continues to work via export alias
- BoardRenderer constructor accepts new optional parameters
- New group highlighting methods are additive, not breaking changes
