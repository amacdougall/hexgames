# Input Handling Strategy for Hex Grid Games

## Problem Statement

Game implementation requires converting mouse input on a 3D rendered scene into
logical hex grid coordinates while maintaining the architectural separation
between game logic (core) and rendering (3D visualization).

## Current Architecture Context

The codebase uses a clean layered architecture:

- **Core Layer** (`src/core/`): Pure game logic with HexGrid, coordinates, and cells
- **Rendering Layer** (`src/rendering/`): Three.js 3D visualization with BoardRenderer
- **Conversion Layer** (`src/rendering/layout.ts`): Bridges hex coordinates ↔ world coordinates

Key existing components:

- `BoardRenderer` manages 3D meshes for each hex cell with coordinate tracking
- `InputHandler` class exists but is not yet implemented

## Proposed Strategy

### 1. Input Event Flow Architecture

```
Mouse Click → Ray Casting → 3D Object → Hex Coordinates → Game Logic Event
```

### 2. Implementation Approach

#### A. Extend InputHandler Class (`src/rendering/inputHandler.ts`)

```typescript
export class InputHandler<T extends object> {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // Event callbacks that emit hex coordinates
  private onCellClick?: (coords: HexCoordinates) => void;
  private onCellHover?: (coords: HexCoordinates | null) => void;
}
```

#### B. Ray Casting for Object Selection

Use Three.js Raycaster to:

1. Cast ray from camera through mouse position into 3D scene
2. Find intersected hex cell mesh
3. Extract hex coordinates from mesh userData or coordinate mapping

#### C. Coordinate Extraction

- Store hex coordinates in `mesh.userData.coordinates` when creating meshes in `BoardRenderer.renderHexCell()`
- Direct lookup from intersected mesh

#### D. Event Interface Design

```typescript
interface HexInputEvents {
  onCellClick: (coords: HexCoordinates) => void;
  onCellHover: (coords: HexCoordinates | null) => void;
  onCellRightClick?: (coords: HexCoordinates) => void;
}
```

### 3. Integration Points

#### A. BoardRenderer Enhancement (`src/rendering/boardRenderer.ts`)

Modify `renderHexCell()` method around line 147:

```typescript
// Store coordinates in mesh for input handling
mesh.userData.coordinates = coordinates;
```

#### B. HexBoard Integration (`src/hexBoard.ts`)

```typescript
export class HexBoard<T> {
  private inputHandler: InputHandler<T>;

  constructor() {
    this.inputHandler = new InputHandler(
      this.renderer.getRenderer(),
      this.renderer.getCamera(),
      this.renderer.getScene()
    );

    // Connect input events to game logic
    this.inputHandler.onCellClick = (coords) => {
      this.handleCellClick(coords);
    };
  }

  private handleCellClick(coords: HexCoordinates): void {
    // Game logic using pure hex coordinates
    const cell = this.hexGrid.getCellByCoords(coords);
    // ... game logic here
  }
}
```

### 4. Architectural Benefits

1. **Separation of Concerns**: Game logic receives clean hex coordinates, no 3D dependencies
2. **Reusable Pattern**: InputHandler can be used by any game using the hex grid system
3. **Type Safety**: Full TypeScript support with proper coordinate interfaces
4. **Performance**: Direct mesh lookup via userData avoids coordinate conversion overhead
5. **Extensible**: Easy to add new input events (drag, multi-select, etc.)

### 5. Implementation Priority

1. **Phase 1**: Basic cell click detection with userData approach
2. **Phase 2**: Add hover events and visual feedback
3. **Phase 3**: Advanced interactions (drag, multi-select, keyboard modifiers)

### 6. Testing Strategy

- Unit tests for coordinate conversion accuracy
- Integration tests for end-to-end click → game logic flow
- Visual tests for hover feedback and click responsiveness

## Conclusion

This strategy maintains architectural purity while providing robust input
handling. The InputHandler acts as a clean interface layer, translating 3D scene
interactions into pure hex grid events that game logic can consume without any
rendering dependencies.
