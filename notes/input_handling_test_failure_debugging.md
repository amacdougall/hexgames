# Troubleshooting `hexBoardInput.test.ts`

This document outlines a plan to diagnose and fix the failing integration test
`packages/hexboard/tests/integration/hexBoardInput.test.ts`.

The primary symptom is that `InputHandler.handleClick()` is not being triggered
when a click event is dispatched on the canvas element during the test. This is
confirmed by the absence of debug log output.

## Debugging Plan

1.  **Analyze the Failing Test (`hexBoardInput.test.ts`):**

    - Examine how the `HexBoard` instance is created and configured for the
      test. The test correctly uses `await hexBoard.init(...)`.
    - Inspect the `simulateCanvasClick` helper function. Is it dispatching the
      `MouseEvent` on the correct DOM element? Is the event configured correctly
      (e.g., bubbles, cancelable)?
    - Review the test assertions. What is the expected outcome of the click?

2.  **Review `HexBoard` and `InputHandler` Integration (`hexBoard.ts`):**

    - The lifecycle of the `InputHandler` within `HexBoard` has been verified.
      `HexBoard.init()` correctly creates and initializes the `InputHandler`.

3.  **Compare with Working Unit Test (`inputHandler.test.ts`):**
    - Identify the key differences in setup between the integration test and the
      unit test.
    - The unit test likely instantiates `InputHandler` directly and has a more
      controlled environment. This comparison can highlight incorrect
      assumptions made in the integration test's setup.

## Hypotheses

1.  **Primary Hypothesis: Event Dispatching Issue.** The `simulateCanvasClick`
    function in the test might be dispatching the event on the wrong element, or
    JSDOM's event handling for canvas elements might have quirks that are not
    accounted for.

2.  **Secondary Hypothesis: Scene/Camera Configuration.** If the click handler
    _is_ being called but no intersection is found, it could be due to the
    test's scene setup. The camera might not be positioned correctly to see the
    hex grid, or the grid itself might not be added to the scene properly. The
    existing debug logs in `getIntersectedHexCoordinates` would help confirm or
    deny this if the click handler were being invoked.
