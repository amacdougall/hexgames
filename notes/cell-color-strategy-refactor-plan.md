# Cell Color Strategy Refactor Plan

**Date**: June 24, 2025  
**Objective**: Refactor BoardRenderer to use Strategy pattern for cell coloring instead of hard-coded implementation

## Overview

Replace the hard-coded `getCellColor` method in BoardRenderer with a flexible Strategy pattern that allows applications to define custom cell coloring logic while maintaining a sensible default.

## Implementation Plan

### Phase 1: Create Strategy Interface and Default Implementation

#### TODO: Create CellColorStrategy interface
- **File**: `src/rendering/cellColorStrategy.ts`
- **Contents**:
  - Define `CellColorStrategy<CustomProps>` interface with `getCellColor(cell: Cell<CustomProps>): number` method
  - Add JSDoc documentation explaining the strategy pattern usage
  - Include examples in documentation

#### TODO: Implement DefaultCellColorStrategy
- **File**: `src/rendering/cellColorStrategy.ts` (same file)
- **Contents**:
  - Create `DefaultCellColorStrategy` class implementing the interface
  - Move current hard-coded color logic from BoardRenderer to this default strategy
  - Keep the existing elevation-based coloring for backward compatibility
  - Add JSDoc with color scheme explanation

#### TODO: Create ElevationColorStrategy example
- **File**: `src/rendering/cellColorStrategy.ts` (same file)
- **Contents**:
  - Create `ElevationColorStrategy` as an alternative implementation
  - Use simpler elevation-only coloring (no impassable water assumption)
  - Document as example for library users

### Phase 2: Refactor BoardRenderer

#### TODO: Update BoardRenderer constructor
- **File**: `src/rendering/boardRenderer.ts`
- **Changes**:
  - Add optional `colorStrategy?: CellColorStrategy<CustomProps>` parameter
  - Store strategy as private field: `private colorStrategy: CellColorStrategy<CustomProps>`
  - Default to `new DefaultCellColorStrategy()` if no strategy provided
  - Update JSDoc documentation

#### TODO: Replace getCellColor method
- **File**: `src/rendering/boardRenderer.ts`
- **Changes**:
  - Remove hard-coded color logic from `getCellColor`
  - Replace with delegation: `return this.colorStrategy.getCellColor(cell)`
  - Update method signature to use `Cell<CustomProps>` instead of `Cell<unknown>`

#### TODO: Add strategy management methods
- **File**: `src/rendering/boardRenderer.ts`
- **Changes**:
  - Add `setColorStrategy(strategy: CellColorStrategy<CustomProps>): void` method
  - Add `getColorStrategy(): CellColorStrategy<CustomProps>` method
  - Include JSDoc documentation for runtime strategy switching

#### TODO: Update imports
- **File**: `src/rendering/boardRenderer.ts`
- **Changes**:
  - Add import for `CellColorStrategy, DefaultCellColorStrategy`

### Phase 3: Update Library Exports

#### TODO: Export new strategy types
- **File**: `src/index.ts`
- **Changes**:
  - Add exports for `CellColorStrategy`, `DefaultCellColorStrategy`, `ElevationColorStrategy`
  - Ensure proper re-export structure

#### TODO: Update rendering module exports
- **File**: `src/rendering/index.ts` (create if doesn't exist)
- **Changes**:
  - Export all rendering-related types and classes
  - Include strategy classes and interfaces

### Phase 4: Update Unit Tests

#### TODO: Create CellColorStrategy tests
- **File**: `tests/rendering/cellColorStrategy.test.ts`
- **Contents**:
  - Test `DefaultCellColorStrategy` with various cell configurations
  - Test `ElevationColorStrategy` behavior
  - Test edge cases (undefined properties, extreme values)
  - Test custom strategy implementation example

### Phase 5: Update hexboard-test Application

#### TODO: Create custom strategy for test app
- **File**: `apps/hexboard-test/src/gameColorStrategy.ts`
- **Contents**:
  - Create game-specific color strategy
  - Use custom properties from test data
  - Demonstrate advanced coloring logic (biome-based, owner-based, etc.)

#### TODO: Update main.ts to use custom strategy
- **File**: `apps/hexboard-test/src/main.ts`
- **Changes**:
  - Import custom strategy
  - Pass strategy to BoardRenderer constructor
  - Add UI controls for switching between strategies (optional)
  - Update any hard-coded color expectations

### Phase 7: Validation and Testing

#### TODO: Lint and format check
- **Commands**: 
  - `npm run lint`
  - `npm run format:check`
- **Verify**: No style or lint violations

#### TODO: Run full test suite
- **Command**: `npm test`
- **Verify**:
  - All existing tests still pass
  - New tests pass
  - No regression in functionality

#### TODO: Build verification
- **Command**: `npm run build`
- **Verify**: Clean build with proper TypeScript compilation
