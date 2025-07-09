# Implementation Plan: Core Movement Mechanics

**Date:** 2025-07-08

**Author:** GitHub Copilot (as Tech Lead)

**Objective:** Implement the core, non-rendering logic for entity movement in
the `hexboard` library. This involves adding pathfinding capabilities to
`HexGrid` and state management for movement sessions to `EntityManager`.

---

## TDD Implementation Process

We will follow a strict Test-Driven Development approach. For each piece of
functionality, you will first write tests that fail, and then write the
implementation code to make those tests pass.

### Phase 1: Pathfinding Utility (`getReachableHexes`)

#### Step 1.1: Write Test Cases (Natural Language)

First, please add the following test case descriptions to a new test file at
`packages/hexboard/tests/core/hexGrid.test.ts`. I will review them before you
proceed to implementation. Write stubs, with natural language comments
describing the test setup and expectations.

- **`getReachableHexes`:**
  - `it('should return only the start cell for range 0')`
  - `it('should return the center cell and its 6 neighbors for range 1')`
  - `it('should return 19 cells for range 2')`
  - `it('should not include impassable cells in the results when respectImpassable is true')`
  - `it('should include impassable cells in the results when respectImpassable is false')`
  - `it('should return an empty array if the start coordinate does not exist on the grid')`
  - `it('should handle pathfinding correctly from an edge or corner of the grid')`

#### Step 1.2: Implement Failing Unit Tests

Once the natural language test cases are approved, implement them in
`packages/hexboard/tests/core/hexGrid.test.ts`, replacing the comments. Use a
setup block to create a standard `HexGrid` instance with a predictable layout,
including some cells marked as impassable.

Run the tests. They are all expected to fail, as the `getReachableHexes` method
does not exist yet.

#### Step 1.3: Implement Functionality

Now, implement the `getReachableHexes` method in
`packages/hexboard/src/core/hexGrid.ts`. Use a Breadth-First Search (BFS)
algorithm. The implementation is complete when all the tests you wrote in the
previous step pass.

### Phase 2: Entity Movement State Management

#### Step 2.1: Write Test Cases (Natural Language)

Next, create a new test file at
`packages/hexboard/tests/core/entityManager.test.ts`. Add the following test
cases for my review. Follow the same procedure as before.

- **`isInMovementMode` property:**
  - `it('should add an isInMovementMode=false property to a new entity')`
- **`startMovement` method:**
  - `it('should set the specified entity's isInMovementMode property to true')`
  - `it('should throw an error if an invalid entity ID is provided')`
  - `it('should store the provided destination coordinates for the movement session')`
- **`cancelMovement` method:**
  - `it('should set the specified entity's isInMovementMode property to false')`
  - `it('should clear any stored destination coordinates for the session')`
  - `it('should not throw an error if the entity was not in movement mode')`
- **`moveEntity` method:**
  - `it('should throw an error if the entity is not in movement mode')`
  - `it('should throw an error if the destination cell is not in the list of available destinations')`
  - `it('should update the entity's cell property to the new cell upon a valid move')`
  - `it('should update the internal entityPositions map correctly upon a valid move')`
  - `it('should set the entity's isInMovementMode property to false after a valid move')`
  - `it('should clear the stored destination coordinates after a valid move')`

#### Step 2.2: Implement Failing Unit Tests

After approval, implement these tests. You will need to add the
`isInMovementMode` property to the `Entity` and `EntityDefinition` interfaces in
`packages/hexboard/src/core/entity.ts` first, which may cause some existing
tests to break. Please fix them. Then, write the new tests for the
`EntityManager`. They are all expected to fail.

#### Step 2.3: Implement Functionality

Finally, implement the new properties and methods in
`packages/hexboard/src/core/entity.ts` and
`packages/hexboard/src/core/entityManager.ts`. Your implementation is complete
when all `entityManager.test.ts` tests pass.
