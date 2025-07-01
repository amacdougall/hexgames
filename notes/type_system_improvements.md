# Proposal: Type System Improvements

**Date:** June 30, 2025
**Status:** Proposal

## 1. Overview

This document proposes a refactoring of the type definitions within the `hexboard-test` application. The goal is to align with TypeScript best practices, reduce code repetition, and improve the overall maintainability and scalability of the type system.

The current implementation defines the data structure for map files using a verbose, inline anonymous type, which duplicates type information already present in the core `hexboard` package. This proposal outlines a plan to eliminate this repetition by establishing a single source of truth for our data structures.

## 2. The Problem: Repetitive and Brittle Types

In `apps/hexboard-test/src/main.ts`, the type for the loaded map data is defined as follows:

```typescript
const mapData: {
  cells: Array<{
    q: number;
    r: number;
    s: number;
    elevation?: number;
    movementCost?: number;
    isImpassable?: boolean;
    customProps?: { terrainType?: string };
  }>;
  defaults: {
    // ... similar properties
  };
} = await response.json();
```

This approach has several significant disadvantages:

- **Violates DRY Principle:** The anonymous type for the `cells` array is a manual re-implementation of the `CellDefinition` interface, which is already defined in `packages/hexboard/src/core/cell.ts`. This "Don't Repeat Yourself" violation is a key code smell.
- **Maintenance Burden:** If the core `CellDefinition` interface in the `hexboard` package is ever updated (e.g., a new property is added or an existing one is changed), the type in `main.ts` will become outdated. Because it's just a structural type, TypeScript may not catch all inconsistencies, leading to subtle runtime bugs.
- **Reduced Readability:** Large, inline type definitions make code harder to read and understand. A named type, such as `MapData`, is more descriptive and keeps the focus on the application logic.

## 3. The Proposed Solution: A Single Source of Truth

The recommended best practice is to have a single, authoritative source for each type definition and derive other types from it as needed. The `hexboard` package should own the core model definitions, and `hexboard-test` should import and use them.

### Step 1: Create a Centralized Map Definition Type

I propose creating a new, named type in `apps/hexboard-test/src/types.ts` to represent the structure of the `starter-valley.json` file. This type will import `CellDefinition` from the `hexboard` package, ensuring that our map data structure is always in sync with the core library.

**File: `apps/hexboard-test/src/types.ts`**

```typescript
import { CellDefinition } from 'hexboard';
import { GameCellProps } from './types.js';

// Defines the structure of the entire map JSON file
export interface MapData {
  name: string;
  defaults: Partial<CellDefinition<GameCellProps>>;
  cells: Array<Partial<CellDefinition<GameCellProps>>>;
}
```

_Note: We use `Partial<CellDefinition<GameCellProps>>` because most properties are optional in the JSON file and rely on the `defaults` section._

### Step 2: Refactor `main.ts` to Use the New Type

With the `MapData` type defined, we can significantly simplify the code in `main.ts`.

**File: `apps/hexboard-test/src/main.ts`**

```typescript
// ... imports
import { MapData } from './types.js'; // Import the new type

// ... inside initializeApp()
try {
  const response = await fetch('/assets/starter-valley.json');
  // Replace the verbose inline type with our new, clean MapData type
  const mapData: MapData = await response.json();
  console.log('Loaded map:', mapData);

  // ... rest of the logic
}
```

## 4. Benefits of this Approach

Adopting this strategy will yield several key benefits:

- **Maintainability:** The type system becomes robust. If `CellDefinition` is changed in the core library, the TypeScript compiler will immediately flag any inconsistencies in `hexboard-test`, preventing bugs before they happen.
- **Readability:** The code in `main.ts` becomes cleaner, more declarative, and easier to understand at a glance.
- **Single Source of Truth:** We establish the `hexboard` package as the definitive source for core data structures, which is critical for a well-architected monorepo.

## 5. Next Steps

Upon approval, I will proceed with the implementation as outlined in "The Proposed Solution" above. The changes will be limited to `apps/hexboard-test/src/types.ts` and `apps/hexboard-test/src/main.ts` and will not affect runtime behavior, only development-time type safety and code quality.
