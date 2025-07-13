# Implementation Plan: Rendering Changes for Movement

**Date:** 2025-07-12

**Author:** GitHub Copilot (as Tech Lead)

**Objective:** Implement the visual feedback for movement mode in the `hexboard`
library. This will be done by introducing a flexible `HighlightStrategy` that
allows the application to define custom rendering effects for highlighting.

---

## TDD Implementation Process

Testing the visual output of a renderer can be complex. We will test the
renderer's internal logic to ensure it correctly uses the provided strategy, and
we will separately test the default strategy to ensure it functions as expected.

### Phase 1: Highlight Strategy and `BoardRenderer` Integration

#### Step 1.1: Write Test Cases (Natural Language)

Please update the existing test file at
`packages/hexboard/tests/rendering/boardRenderer.test.ts`. The tests should now
focus on the interaction with the strategy, not the direct visual effect.

- **`BoardRenderer` with `HighlightStrategy`:**
  - `it('should use the provided HighlightStrategy to apply highlights')`
  - `it('should use the provided HighlightStrategy to remove highlights')`
  - `it('should instantiate and use a DefaultHighlightStrategy if none is provided')`
- **`DefaultHighlightStrategy` (in a new test file):**
  - `it('should apply an emissive glow to an object's material')`
  - `it('should store the original material state and restore it on removal')`

#### Step 1.2: Implement Failing Unit Tests

Once the test cases are approved, implement them.

- For `boardRenderer.test.ts`, you will need to create a mock
  `HighlightStrategy` with spies on its `apply` and `remove` methods to verify
  that the `BoardRenderer` calls them correctly.
- Create a new test file for the `DefaultHighlightStrategy`. These tests will
  fail as the strategy does not yet exist.

#### Step 1.3: Implement Functionality

Now, implement the new architecture in your rendering code.

1.  **Define `HighlightStrategy` Interface:** Create the new `HighlightStrategy`
    interface in a suitable file, e.g.,
    `packages/hexboard/src/rendering/highlightStrategy.ts`.
    ```typescript
    export interface HighlightStrategy {
      apply(object: THREE.Object3D): void;
      remove(object: THREE.Object3D): void;
    }
    ```
2.  **Create `DefaultHighlightStrategy`:** In the same file, create a
    `DefaultHighlightStrategy` class that implements the interface. This class
    will contain the logic for applying and removing the emissive glow,
    including storing and restoring the original material properties.
3.  **Update `BoardRenderer`:**
    - Modify the `BoardRenderer`'s constructor to accept an optional
      `HighlightStrategy`. If one is not provided, it should instantiate
      `DefaultHighlightStrategy`.
    - The `BoardRenderer` will still need a reference to the `EntityManager` to
      know _which_ objects to highlight.
    - In the render loop, where you previously applied the visual effect
      directly, you will now call `this.highlightStrategy.apply(object)` and
      `this.highlightStrategy.remove(object)` on the appropriate meshes.

Your implementation is complete when all tests for both the `BoardRenderer` and
the `DefaultHighlightStrategy` pass.
