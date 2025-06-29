# Hexboard Test Rendering Fix - Implementation Plan

**Date:** June 29, 2025
**Author:** Technical Lead
**Recipient:** Junior Developer

## 1. Overview

The `hexboard-test` application currently displays a black screen after a recent refactoring that introduced the `HexBoard` class. This refactoring replaced the explicit rendering and grid setup in `main.ts` with a more abstract, high-level API.

Our investigation has identified two primary causes for this failure:
1.  **Missing Render Loop:** The application prepares the scene but likely only renders a single frame, or none at all, because the continuous `requestAnimationFrame` loop was lost in the refactoring.
2.  **Data Property Mismatch:** There is a naming inconsistency between the cell data loaded from JSON (`customProperties`) and the property expected by the core `Cell` class and its consumers (`customProps`).

This document outlines the steps to resolve these issues and restore rendering.

## 2. Issue 1: Implementing a Continuous Render Loop

The `HexBoard` class must manage its own render loop to ensure the scene is drawn continuously. The previous implementation had this logic in `main.ts`, and we need to reintegrate it into the `HexBoard` class itself.

### Implementation Steps

1.  **Locate `HexBoard.ts`**
    *   Open the file at `packages/hexboard/src/hexBoard.ts`. This is where we will add the rendering logic.

2.  **Add State and Control Methods**
    *   Introduce a private boolean flag, `this.isRunning = false;`, to control the state of the render loop.
    *   Create a public `start()` method. This method will set `this.isRunning = true;` and make the initial call to a new `animate()` method.
    *   Create a public `stop()` method that sets `this.isRunning = false;`.

3.  **Create the `animate` Method**
    *   Implement a private `animate()` method.
    *   Inside `animate()`, check if `this.isRunning` is `true`. If not, exit the function.
    *   Call `this.boardRenderer.render()`. This is the existing Three.js render call.
    *   Use `requestAnimationFrame(() => this.animate());` to schedule the next frame, creating the loop.

4.  **Update `main.ts`**
    *   Open `apps/hexboard-test/src/main.ts`.
    *   Remove the call to `hexBoard.renderAll()`. This method is for one-time renders and is not suitable for a dynamic scene. The `start()` method will now handle rendering.
    *   Add a call to `hexBoard.start()` after the cells have been loaded and added to the board. This will kick off the continuous render loop.

## 3. Issue 2: Aligning Data Properties

We need to standardize the custom data property to `customProps` across the application to fix data-related rendering bugs.

### Implementation Steps

1.  **Update `starter-valley.json`**
    *   Open the map data file at `apps/hexboard-test/assets/starter-valley.json`.
    *   Search and replace all instances of the key `"customProperties"` with `"customProps"`. This ensures our data source conforms to the new standard.

2.  **Update Data Loading in `main.ts`**
    *   Open `apps/hexboard-test/src/main.ts`.
    *   In the `initializeApp` function, find the type definition for `mapData`.
    *   Change `customProperties?: { terrainType?: string };` to `customProps?: { terrainType?: string };` in both the `cells` array and `defaults` object types.
    *   Update the logic that extracts `cellProps` to read from `cellData.customProps` and `mapData.defaults.customProps`.

3.  **Verify `HexBoard.ts` and `cell.ts`**
    *   Briefly inspect `packages/hexboard/src/core/cell.ts` to confirm that the `Cell` class constructor and its properties are indeed using `customProps`.
    *   Check the `setCellAtCoords` method in `packages/hexboard/src/hexBoard.ts` to ensure it correctly receives and passes the `customProps` to the underlying `hexGrid.addCell` method. No changes should be needed here if the previous steps are done correctly, but verification is important.

By completing these two sets of tasks, the rendering should be fully restored. Please proceed with Issue 1 first, as that is the primary blocker for seeing any output.
