# Implementation Plan: Core Logic Changes for Movement

**Date:** 2025-07-12

**Author:** GitHub Copilot (as Tech Lead)

**Objective:** Implement the core logic for entity movement in the `hexboard`
library. This includes managing movement state in the `EntityManager` and adding
pathfinding utilities to the `HexGrid`.

---

## TDD Implementation Process

We will follow a strict Test-Driven Development process. The first step is to
define the tests in natural language, which will serve as our specification.

### Phase 1: `EntityManager` Movement State

#### Step 1.1: Write Test Cases (Natural Language)

Please update the existing test file at
`packages/hexboard/tests/core/entityManager.test.ts` with the following tests
inside a new `describe('Movement Mode', () => { ... })` block:

- `it('should start movement mode for an entity, storing available destinations and setting isInMovementMode to true')`
- `it('should throw an error if startMovement is called for an entity that does not exist')`
- `it('should throw an error if startMovement is called for an entity already in movement mode')`
- `it('should allow moving an entity to a valid destination cell, updating its position and exiting movement mode')`
- `it('should throw an error if moveEntity is called for an entity not in movement mode')`
- `it('should throw an error if trying to move to a cell not in the available destinations')`
- `it('should cancel movement mode, clearing destinations and resetting the entity state')`
- `it('should not move the entity if an invalid destination is clicked and movement is subsequently cancelled')`
- `it('should throw an error if cancelMovement is called for an entity not in movement mode')`

### Phase 2: `HexGrid` Pathfinding Utility

#### Step 2.1: Write Test Cases (Natural Language)

Please update the existing test file at
`packages/hexboard/tests/core/hexGrid.test.ts` with the following tests inside a
new `describe('getReachableHexes', () => { ... })` block:

- `it('should return all hexes within a given range')`
- `it('should return only the start hex for a range of 0')`
- `it('should correctly handle hexes at the edge of the grid')`
- `it('should respect impassable hexes when the option is enabled')`
- `it('should ignore impassable hexes when the option is disabled by default')`
- `it('should return an empty array for a negative range')`
- `it('should throw an error if the starting hex is out of bounds')`

### Next Steps

Once these test cases are approved, the next step will be to write the failing
unit tests in the specified files. After that, we will implement the
functionality to make the tests pass.
