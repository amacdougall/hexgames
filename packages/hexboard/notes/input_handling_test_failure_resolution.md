# Resolution Strategy for `hexBoardInput.test.ts` Failures

## 1. Diagnosis Summary

Tests in `tests/integration/hexBoardInput.test.ts` are failing because the mock
`onCellClick` and `onCellHover` spy functions are not being called. The root
cause is a breakdown in the test's event simulation and mocking infrastructure.
The `InputHandler` instance under test is not receiving or processing the
simulated mouse events correctly.

The problem lies within the test environment's simulation of DOM events and
Three.js raycasting, not in the `InputHandler`'s implementation itself.

## 2. Debugging and Resolution Steps

The core of the problem is that the dispatched `MouseEvent` is not correctly
triggering the internal `handleClick` and `handleMouseMove` methods of the
`InputHandler`. Follow these steps to diagnose and fix the mock infrastructure.

### Step 1: Verify Event Listener Attachment and Dispatch

The `HexBoard.init()` method creates the `InputHandler` and attaches its event
listeners to the mock canvas. We need to verify this connection.

1.  **Confirm Listener Registration**: In `hexBoardInput.test.ts`, after
    `hexBoard.init()` is called, inspect the mock `canvas.addEventListener`.
    Jest's `jest.fn()` provides a `.mock` property that tracks calls.

    ```typescript
    // In your test's beforeEach/it block, after hexBoard.init()
    console.log(mockCanvas.addEventListener.mock.calls);
    ```

    This will show if `addEventListener` was called with `'click'` and
    `'mousemove'`. If not, the `InputHandler.initialize()` method was not called
    correctly from within `HexBoard.init()`.

2.  **Ensure Correct Event Target**: The `MouseEvent` must be dispatched on the
    _exact same object_ that the listeners were attached to. In the test, ensure
    `mockCanvas.dispatchEvent(event)` is being called, as `mockCanvas` is the
    `domElement` used by the `InputHandler`.

### Step 2: Trace the Internal Event Path

If the listeners are attached, the next step is to see if the handler methods
are being invoked.

1.  **Add Temporary Logging**: Add `console.log` statements at the top of the
    `handleClick` and `handleMouseMove` methods in the actual
    `src/rendering/inputHandler.ts` file.

    ```typescript
    // src/rendering/inputHandler.ts
    private handleClick(event: MouseEvent): void {
      console.log('handleClick triggered in test'); // <-- Add this
      // ...
    }
    ```

2.  **Run the Test**: Run `npm run test` again.
    - If you **do not** see the log messages, the problem is confirmed to be in
      the event dispatch/listener chain (Step 1).
    - If you **do** see the messages, the event handlers are being called, and
      the problem is deeper inside the methods.

### Step 3: Inspect Raycaster Mock and `userData`

If the internal handlers are firing but the spies are not, then either the
`raycaster.intersectObjects` mock is not being called, or it's returning data in
a format the `InputHandler` doesn't expect.

1.  **Verify Raycaster Mock Execution**: The test correctly replaces
    `intersectObjects` with a mock. Add a log inside this mock to ensure it's
    being executed.

    ```typescript
    // In hexBoardInput.test.ts, where you mock the raycaster
    mockRaycaster.intersectObjects.mockImplementation(() => {
      console.log('intersectObjects mock was called'); // <-- Add this
      // ... return mock intersection
    });
    ```

    If this log does not appear when you run the test, it confirms the execution
    isn't reaching this point, pointing back to an issue in Step 2.

2.  **Crucially, Verify `userData` Structure**: The `InputHandler` specifically
    looks for `intersection.object.userData.coordinates`. The mock intersection
    returned by `intersectObjects` **must** match this structure precisely.

    Ensure your mock mesh and intersection are set up like this:

    ```typescript
    // In hexBoardInput.test.ts
    const mockMesh = {
      userData: {
        coordinates: { q: 1, r: -1, s: 0 }, // The object MUST have userData.coordinates
      },
      // ... other mesh properties
    };

    const mockIntersection = {
      object: mockMesh,
      // ... other intersection properties
    };

    mockRaycaster.intersectObjects.mockReturnValue([mockIntersection]);
    ```

    If the `mockMesh` object in your test does not have a `userData` property
    containing a `coordinates` object, `getIntersectedHexCoordinates()` will
    correctly return `null`, and the test will fail as observed. This is a very
    likely point of failure.

By following these steps, you will isolate the point of failure in the test's
mock infrastructure and be able to correct it.
