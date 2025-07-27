# Hexboard Entity Management Refactor Test Plan

**Date:** 2025-07-19

Original design improvement proposal:
notes/2025-07-19-hexboard-design-improvement-proposal.md

Following up on the design proposal, this document outlines the test plan for
integrating entity management into the `HexBoard` class. Please use this as a
guide for your Test-Driven Development (TDD) process.

The goal is to ensure that `HexBoard` correctly encapsulates `EntityManager` and
`EntityRenderer` and that all new public methods delegate their logic correctly.
We need to verify the wiring, the data flow, and the lifecycle management of
these new internal components.

## Testing Strategy

For unit tests, we will heavily mock the `EntityManager` and `EntityRenderer`
classes. This allows us to test the `HexBoard` class in isolation, verifying
that it calls the correct methods on its internal dependencies with the correct
arguments.

For integration tests, we will use real instances of all classes to ensure they
are instantiated and connected correctly during the `HexBoard.init()` process.

## Test Cases

Here are the behaviors we need to test. Please create test files that mirror
this structure.

### 1. `HexBoard` Initialization and Lifecycle

We need to ensure that the `EntityManager` and `EntityRenderer` are created and
destroyed correctly along with the `HexBoard`.

**`describe('HexBoard Lifecycle')`**

- **`it('should not have an EntityManager or EntityRenderer before init is called')`**
  - Assert that the internal `entityManager` and `entityRenderer` properties are
    undefined after the `HexBoard` constructor is called.

- **`it('should create an EntityManager when init is called')`**
  - After calling `init()`, assert that the internal `entityManager` is an
    instance of `EntityManager`.

- **`it('should create an EntityRenderer when init is called with a ModelRegistry')`**
  - Call `init()` with a mock `ModelRegistry`.
  - Assert that the internal `entityRenderer` is an instance of
    `EntityRenderer`.
  - Verify that the `EntityRenderer` constructor was called with the
    `EntityManager`, the `ModelRegistry`, and the `THREE.Scene` from the
    `BoardRenderer`.

- **`it('should NOT create an EntityRenderer when init is called without a ModelRegistry')`**
  - Call `init()` without a `ModelRegistry`.
  - Assert that the internal `entityRenderer` property remains undefined.

- **`it('should call dispose on the EntityRenderer when HexBoard is disposed')`**
  - Initialize a `HexBoard` with a `ModelRegistry`.
  - Create a spy on the `entityRenderer.dispose` method.
  - Call `hexBoard.dispose()`.
  - Assert that the `dispose` method on the `entityRenderer` was called.

### 2. `HexBoard` Public API for Entity Management

This suite tests the new public methods on `HexBoard` that wrap the
`EntityManager`'s core functionality. Use a mocked `EntityManager` for these
tests.

**`describe('HexBoard Entity Management API')`**

- **`describe('addEntity')`**
  - **`it('should call addEntity on the internal EntityManager with the correct definition')`**
  - **`it('should return the entity created by the EntityManager')`**

- **`describe('removeEntity')`**
  - **`it('should call removeEntity on the internal EntityManager with the correct ID')`**
  - **`it('should return the result from the EntityManager call')`**

- **`describe('moveEntity')`**
  - **`it('should call moveEntity on the internal EntityManager with the correct ID and cell')`**

- **`describe('getEntityById')`**
  - **`it('should call getEntityById on the internal EntityManager and return the result')`**

- **`describe('getEntitiesAt')`**
  - **`it('should call getEntitiesAt on the internal EntityManager and return the result')`**

- **`describe('getAllEntities')`**
  - **`it('should call getAllEntities on the internal EntityManager and return the result')`**

### 3. `HexBoard` Public API for Entity Movement

This suite tests the new methods related to the entity movement state machine.

**`describe('HexBoard Entity Movement API')`**

- **`describe('startEntityMovement')`**
  - **`it('should call startMovement on the internal EntityManager with the correct entity ID and hexes')`**

- **`describe('cancelEntityMovement')`**
  - **`it('should call cancelMovement on the internal EntityManager with the correct entity ID')`**

- **`describe('getEntityMovementDestinations')`**
  - **`it('should call getMovementDestinations on the internal EntityManager and return the result')`**
