# Implementation Plan: Rendering Changes for Movement

**Date:** 2025-07-08

**Author:** GitHub Copilot (as Tech Lead)

**Objective:** Implement the visual feedback for movement mode in the `hexboard`
library. This involves extending the `BoardRenderer` to highlight the active
entity and its available destination hexes.

---

## TDD Implementation Process

Testing the visual output of a renderer can be complex. For our purposes, we
will test the renderer's internal state and logic, not the final pixels on the
screen. We will trust that if the logic is correct, the rendering output will be
correct.

### Phase 1: Highlighting Logic (`BoardRenderer`)

#### Step 1.1: Write Test Cases (Natural Language)

Please update the existing test file at
`packages/hexboard/tests/rendering/boardRenderer.test.ts`. Add a new `describe`
block for "Movement Highlighting" with the following test cases for my review.

- **`startMovement` effects:**
  - `it('should add the entity's mesh to a set of highlighted objects when its movement starts')`
  - `it('should add the meshes of all available destination cells to the set of highlighted objects')`
- **`cancelMovement` effects:**
  - `it('should remove the entity's mesh from the highlighted set when movement is cancelled')`
  - `it('should remove the destination cell meshes from the highlighted set when movement is cancelled')`
- **`moveEntity` effects:**
  - `it('should clear all movement-related highlights after an entity moves')`
- **Rendering loop:**
  - `it('should apply a visual effect (e.g., emissive color) to all meshes in the highlighted set during the render call')`
  - `it('should remove the visual effect from meshes that are no longer in the highlighted set')`

#### Step 1.2: Implement Failing Unit Tests

Once the test cases are approved, implement them. You will need to mock the
`EntityManager` to control when entities enter and exit movement mode. You will
also need to spy on the `THREE.Mesh` objects to verify that their material
properties are being changed as expected.

These tests will fail because the `BoardRenderer` is not yet connected to the
`EntityManager` and has no highlighting logic.

#### Step 1.3: Implement Functionality

Now, modify the `BoardRenderer` in
`packages/hexboard/src/rendering/boardRenderer.ts`.

1.  **Connect to EntityManager:** The `BoardRenderer` will need a reference to
    the `EntityManager` instance to know which entity is in movement mode and
    what its destinations are. You can pass this in the constructor.
2.  **Track Highlights:** Create a `private` `Set` within the `BoardRenderer` to
    store the `THREE.Object3D` instances that should be highlighted.
3.  **Update Highlights:** The renderer needs to be aware of state changes in
    the `EntityManager`. For now, we can add public methods to the renderer like
    `onStartMovement(entity, destinations)` and `onEndMovement()`. The
    application will be responsible for calling these. In a future iteration, we
    may implement a more robust event-driven system.
4.  **Apply Effects:** In the main render loop, iterate over the set of
    highlighted objects and apply a visual effect. A simple and effective
    approach is to set the `emissive` color on the material (e.g., to yellow)
    and set `emissiveIntensity`. Remember to store the original emissive color
    so you can restore it when the highlight is removed.

Your implementation is complete when all the tests pass.
