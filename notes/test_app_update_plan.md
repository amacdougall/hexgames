# Test Application Update Plan

This document outlines the steps to update the `hexboard-test` application to use the `HexBoard` class, enabling interactive features like click handling.

## Todo List

### 1. Allow Custom Color Strategies in `HexBoard`

The `HexBoard` class currently hardcodes the `DefaultCellColorStrategy`. We need to modify it to allow injecting a custom color strategy.

- **File to edit:** `packages/hexboard/src/hexBoard.ts`
- **Task:**
  - Import the `CellColorStrategy` interface.
  - Update the `HexBoard` constructor to accept an optional `colorStrategy` of type `CellColorStrategy<CustomProps>`.
  - In the `init` method, use the provided `colorStrategy` when creating the `BoardRenderer`. If no strategy is provided, you can fall back to the `DefaultCellColorStrategy`.

### 2. Update the Test Application (`main.ts`)

Rewrite the main entry point of the test application to use `HexBoard`.

- **File to edit:** `apps/hexboard-test/src/main.ts`
- **Task:**
  - Remove the existing manual setup for `HexGrid`, `BoardRenderer`, and the animation loop.
  - Import `HexBoard` from `@hexgames/hexboard`.
  - Import `GameColorStrategy` from `./gameColorStrategy`.
  - Instantiate `GameColorStrategy`.
  - Instantiate `HexBoard`, passing the new color strategy to the constructor.
  - Call the `hexBoard.init('app')` method to initialize the board.
  - Load the map data from `/assets/starter-valley.json`.
  - Iterate through the cells from the map data and use `hexBoard.setCellAtCoords()` to add them to the board.
  - After adding all cells, call `hexBoard.renderAll()` to draw the initial state of the board.

### 3. Clean up `index.html`

The `HexBoard` class handles creating and appending the canvas element to the container.

- **File to edit:** `apps/hexboard-test/index.html`
- **Task:**
  - Ensure you have a container element, for example `<div id="app" style="width: 100vw; height: 100vh;"></div>`.
  - Remove any `<canvas>` elements from the HTML body if they exist, as `HexBoard` will manage this.

### 4. Verify the Implementation

After making the changes, run the test application and verify that:

1. The hex grid renders correctly with the custom colors.
2. Clicking on a hex cell logs a message to the browser's developer console.
