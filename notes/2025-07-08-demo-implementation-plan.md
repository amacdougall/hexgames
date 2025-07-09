# Implementation Plan: Demo in `hexboard-test`

**Date:** 2025-07-08

**Author:** GitHub Copilot (as Tech Lead)

**Objective:** Use the new `hexboard` features to implement a complete movement
flow in the `hexboard-test` application. This will serve as a validation of the
library changes and a clear example for future users.

---

## TDD Implementation Process

For this demo, our "tests" will be the acceptance criteria for the user-facing
behavior. We will not write automated unit tests for the demo application
itself, but will instead use this plan as a checklist for manual testing.

### Phase 1: Application Logic for Movement

#### Step 1.1: Define Acceptance Criteria (Natural Language)

I will review these criteria with you. Once approved, you will use them to guide
your implementation.

1.  **Initial State:** When the application loads, a single entity (the
    dodecahedron) is visible on a random cell. No hexes are highlighted.
2.  **Entering Movement Mode:**
    - When the user clicks the hex containing the entity, the application should
      call `EntityManager.startMovement`.
    - The entity's available destinations are all hexes within a 2-step range,
      excluding any marked as `isImpassable`.
    - Visually, the entity itself and all its valid destination hexes should
      become highlighted.
3.  **Moving the Entity:**
    - While in movement mode, if the user clicks on one of the highlighted valid
      destination hexes, the application should call `EntityManager.moveEntity`.
    - Visually, the entity should disappear from its old cell and reappear on
      the new cell.
    - All highlights should be removed.
4.  **Cancelling Movement:**
    - While in movement mode, if the user clicks on any hex that is _not_ a
      valid destination (including the entity's own hex), the application should
      call `EntityManager.cancelMovement`.
    - Visually, all highlights should be removed, and the entity should remain
      in its original position.

#### Step 1.2: Implement Functionality

Modify the `main.ts` file in `apps/hexboard-test/src`.

1.  **State Tracking:** The application needs to know if it's currently in
    "movement mode". A simple boolean flag, `isMovementModeActive`, will
    suffice.
2.  **Update Input Handler Logic:** The `onClick` handler for the `InputHandler`
    is the central point for our changes.
    - If `isMovementModeActive` is `false`, check if the clicked cell contains
      an entity. If it does, calculate its reachable hexes (using
      `HexGrid.getReachableHexes`) and call `EntityManager.startMovement`. Then
      set `isMovementModeActive` to `true`.
    - If `isMovementModeActive` is `true`, check if the clicked cell is a valid
      destination. You will need to get the list of available destinations from
      the `EntityManager`.
      - If it **is** a valid destination, call `EntityManager.moveEntity`.
      - If it **is not** a valid destination, call
        `EntityManager.cancelMovement`.
      - In both cases, set `isMovementModeActive` to `false`.
3.  **Connect Renderer:** Remember to call the new methods on the
    `BoardRenderer` (`onStartMovement` and `onEndMovement`) from your input
    handling logic to trigger the highlighting effects.

Your implementation is complete when all the acceptance criteria from the
previous step are met through manual testing.
