# Test Plan: Entity Model Rendering

## 1. Introduction

This document outlines the test cases required to validate the implementation of the entity rendering feature, as described in the `entity_model_rendering_proposal.md`. The goal is to ensure that each new component and every change is thoroughly tested, guaranteeing the stability and correctness of the new architecture.

As the developer implementing these tests, you should follow the existing `context/behavior` pattern found in the project's Jest test suites. This document will provide the "what" and "why" for each test case.

## 2. Testing Strategy for Three.js Interaction

A significant challenge in this implementation is testing code that interacts with the Three.js library. Our unit tests run in a Node.js environment, which lacks the browser's DOM and WebGL context that Three.js often relies on.

**Recommended Approach: Mocking**

We will mock the `three` library and its components (like `GLTFLoader`) using `jest.mock`.

**Rationale:**
-   **Focus:** Our goal is to test our application's logic, not the internal workings of Three.js. We trust that Three.js functions correctly.
-   **Isolation:** Mocking isolates our code from the rendering engine, ensuring that a test fails because of a flaw in our logic, not because of an issue with the environment or the library.
-   **Speed & Simplicity:** This approach avoids the need for complex and slow test setups (like headless browsers or WebGL emulators) and keeps our unit tests fast.

**Example Mock Setup:**

At the top of your test file (e.g., `entityRenderer.test.ts`), you would set up a mock like this:

```typescript
// Mock the entire 'three' library
jest.mock('three', () => ({
  // We can mock specific classes we interact with
  Object3D: jest.fn().mockImplementation(() => ({
    clone: jest.fn().mockReturnThis(), // Return the same mock instance
    position: { set: jest.fn() },
  })),
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
}));

// You might also need to mock loaders from three-stdlib
jest.mock('three-stdlib', () => ({
    GLTFLoader: jest.fn().mockImplementation(() => ({
        loadAsync: jest.fn().mockResolvedValue({ scene: new THREE.Object3D() })
    }))
}));
```

This setup gives you full control over the Three.js objects, allowing you to spy on method calls (e.g., `scene.add`) and assert that your code is interacting with the library as expected.

## 3. Test Cases

### 3.1. Core Logic (`packages/hexboard/src/core/entity.ts`)

These tests ensure the core game logic remains pure and correct after being decoupled from the rendering engine.

#### `context('Entity and EntityDefinition interfaces')`

-   **`it('should no longer have a model property')`**: Verify that creating an `Entity` object with a `model` property results in a TypeScript error or that the property is undefined. This confirms the decoupling was successful.
-   **`it('should have an optional modelKey property')`**: Create an `EntityDefinition` with a `modelKey` and verify it is correctly assigned. Create another without a `modelKey` and verify the property is `undefined`.

#### `context('EntityManager')`

-   **`it('should assign modelKey when adding an entity')`**: In the `addEntity` method, provide an `EntityDefinition` with a `modelKey`. Call `getEntity` and assert that the returned `Entity` has the correct `modelKey`.
-   **`it('should handle a missing modelKey gracefully')`**: Call `addEntity` with a definition that omits `modelKey`. Assert that the resulting `Entity` has an `undefined` `modelKey`.
-   **`it('should return all entities with getAllEntities')`**: Add several entities to the manager. Call the new `getAllEntities` method and assert that the returned array contains the correct number of entities and that they are the same objects that were added.
-   **`it('should return an empty array from getAllEntities when no entities exist')`**: On a newly created `EntityManager`, call `getAllEntities` and assert that it returns an empty array.

### 3.2. Rendering Infrastructure

These tests validate the new rendering components. They will rely heavily on the mocking strategy described above.

#### 3.2.1. `ModelRegistry` (`packages/hexboard/src/rendering/modelRegistry.ts`)

**Setup**: For these tests, you will mock the `three` library.

-   **`context('registerModel')`**
    -   **`it('should store a pre-loaded THREE.Object3D asset')`**: Register a mocked `Object3D` with a key. Internally, check that the registry's private map now contains this key and asset.
    -   **`it('should store a string path for an asset to be loaded')`**: Register a string URL with a key and verify it's stored correctly.

-   **`context('createModelInstance')`**
    -   **`it('should clone and return a pre-registered Object3D')`**: Register a mocked `Object3D`. Call `createModelInstance` with its key. Assert that the `clone` method on the original `Object3D` was called and that the returned value is the result of that clone.
    -   **`it('should throw an error for an unregistered model key')`**: Call `createModelInstance` with a key that has not been registered. Assert that it throws an informative error.
    -   **`it('should handle asset loading from a URL')`**: **TODO**: This test depends on the final asset loading strategy. A child document, `asset_loading_plan.md`, should be created to detail this. Once the strategy is defined, this test should verify that the correct loader is instantiated and its `loadAsync` method is called with the registered URL.

#### 3.2.2. `EntityRenderer` (`packages/hexboard/src/rendering/entityRenderer.ts`)

**Setup**: For these tests, you will need to mock `EntityManager`, `ModelRegistry`, and `THREE.Scene`. Create mock instances of these classes to pass into the `EntityRenderer`'s constructor.

-   **`context('constructor')`**
    -   **`it('should initialize correctly with dependencies')`**: Simply check that the constructor runs without errors and that the internal properties are assigned.

-   **`context('update method')`**
    -   **`it('should create and add a model for a new entity with a modelKey')`**:
        1.  Configure the mock `EntityManager`'s `getAllEntities` to return one new entity with a `modelKey`.
        2.  Configure the mock `ModelRegistry`'s `createModelInstance` to return a mock `Object3D`.
        3.  Call `entityRenderer.update()`.
        4.  Assert that `modelRegistry.createModelInstance` was called with the entity's `modelKey`.
        5.  Assert that `scene.add` was called with the new mock `Object3D`.
        6.  Assert that the model's `position.set` method was called with the correct world coordinates.
    -   **`it('should not add a model for a new entity without a modelKey')`**: Configure `getAllEntities` to return an entity without a `modelKey`. Call `update()` and assert that `createModelInstance` and `scene.add` were **not** called.
    -   **`it('should remove a model when an entity is no longer present')`**:
        1.  First, run an `update()` to add an entity's model to the scene.
        2.  Next, configure `getAllEntities` to return an empty array.
        3.  Call `entityRenderer.update()` again.
        4.  Assert that `scene.remove` was called with the model that was previously added.
    -   **`it('should update the position of an existing entity's model')`**:
        1.  Run an `update()` to add an entity.
        2.  Change the `cellPosition` of that entity in the mock `EntityManager`.
        3.  Call `entityRenderer.update()` again.
        4.  Assert that the model's `position.set` method was called a second time with the new, updated coordinates. Assert that `scene.add` was **not** called again for this entity.

#### 3.2.3. `BoardRenderer` (`packages/hexboard/src/rendering/boardRenderer.ts`)

**Setup**: Mock `EntityRenderer`, `EntityManager`, and `ModelRegistry`.

-   **`context('constructor')`**
    -   **`it('should instantiate EntityRenderer with the correct dependencies')`**: When creating a `BoardRenderer`, assert that the `EntityRenderer` constructor was called and passed the `EntityManager`, `ModelRegistry`, and the `BoardRenderer`'s scene instance.

-   **`context('render method')`**
    -   **`it('should call entityRenderer.update before rendering the scene')`**: Call `boardRenderer.render()`. Using a mock `EntityRenderer`, assert that its `update` method was called. You can also use `mock.invocationCallOrder` in Jest to ensure it was called *before* `renderer.render`.
