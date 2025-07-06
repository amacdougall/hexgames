# Hexagonal Strategy Game Design Document

## Game Architecture Overview

### Project Structure

```
apps/hex-strategy/
├── src/
│   ├── game/
│   │   ├── GameManager.ts          # Main game controller
│   │   ├── TurnManager.ts          # Turn-based logic
│   │   ├── Player.ts               # Player state
│   │   └── GameState.ts            # Overall game state
│   ├── pieces/
│   │   ├── Piece.ts                # Base piece class
│   │   ├── PieceTypes.ts           # Specific piece definitions
│   │   ├── MovementRules.ts        # Movement logic
│   │   └── PieceRegistry.ts        # Available pieces catalog
│   ├── rules/
│   │   ├── PlacementRules.ts       # Piece placement validation
│   │   ├── MovementValidator.ts    # Move validation
│   │   └── VictoryConditions.ts    # Win condition checking
│   ├── ui/
│   │   ├── PiecePalette.ts         # 3D piece tray
│   │   ├── InteractionManager.ts   # Click/hover handling
│   │   ├── HighlightSystem.ts      # Valid move highlighting
│   │   └── UIState.ts              # UI mode management
│   ├── rendering/
│   │   ├── GameRenderer.ts         # Extended BoardRenderer
│   │   ├── PieceRenderer.ts        # 3D piece models
│   │   └── AnimationManager.ts     # Movement animations
│   └── main.ts                     # Entry point
```

## Required Changes to Hexboard Package

### 1. **Complete HexBoard Class** (`packages/hexboard/src/hexBoard.ts`)

```typescript
export class HexBoard<CustomProps extends object = {}> {
  private hexGrid: HexGrid<CustomProps>;
  private renderer: BoardRenderer<CustomProps>;
  private inputHandler: InputHandler;
  private entityManager: EntityManager;

  constructor(container: HTMLElement) {
    // Initialize all systems
  }

  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;

  // Entity management
  addEntity(entity: Entity): void;
  removeEntity(entityId: string): void;
  moveEntity(entityId: string, to: HexCoordinate): void;

  // Board management
  expandBoard(center: HexCoordinate, radius: number): void;

  // Rendering
  render(): void;
  dispose(): void;
}
```

### 2. **Implement Entity System** (`packages/hexboard/src/core/entity.ts`)

```typescript
export interface Entity {
  id: string;
  type: string;
  position: HexCoordinate;
  player: 'white' | 'black';
  model?: THREE.Object3D;
  customData?: any;
}

export class EntityManager {
  private entities: Map<string, Entity>;
  private cellEntities: Map<string, Set<string>>; // coordinate -> entity IDs

  addEntity(entity: Entity): void;
  removeEntity(id: string): void;
  moveEntity(id: string, to: HexCoordinate): void;
  getEntityAt(coord: HexCoordinate): Entity | null;
  getEntitiesByPlayer(player: string): Entity[];
}
```

### 3. **Implement Input System** (`packages/hexboard/src/rendering/inputHandler.ts`)

```typescript
export class InputHandler extends EventEmitter {
  constructor(
    private renderer: BoardRenderer,
    private hexGrid: HexGrid
  ) {
    this.setupRaycasting();
  }

  onCellClick(coord: HexCoordinate): void;
  onCellHover(coord: HexCoordinate): void;
  onEntityClick(entity: Entity): void;

  private setupRaycasting(): void;
  private screenToHex(x: number, y: number): HexCoordinate | null;
}
```

### 4. **Add Dynamic Board Expansion**

```typescript
// In HexGrid class
expandRadius(center: HexCoordinate, radius: number): void {
  const ring = this.getRing(center, radius);
  ring.forEach(coord => {
    if (!this.getCell(coord)) {
      this.addCell(coord, { terrain: 'empty' });
    }
  });
}
```

## Game Implementation Design

### Game Loop and Turn Management

```typescript
class GameManager {
  private turnManager: TurnManager;
  private hexBoard: HexBoard<GameCellProps>;
  private players: [Player, Player];
  private gameState: GameState;

  startGame(): void {
    this.gameState = 'placing-first-piece';
    this.turnManager.startTurn(this.players[0]);
  }

  handleAction(action: GameAction): void {
    switch (action.type) {
      case 'place-piece':
        this.handlePlacement(action);
        break;
      case 'move-piece':
        this.handleMovement(action);
        break;
    }

    if (this.checkVictory()) {
      this.endGame();
    } else {
      this.turnManager.nextTurn();
    }
  }
}
```

### Piece Placement System

```typescript
class PlacementManager {
  private palette: PiecePalette;
  private placementMode: boolean = false;
  private selectedPieceType: string | null = null;

  enterPlacementMode(pieceType: string): void {
    this.placementMode = true;
    this.selectedPieceType = pieceType;
    this.highlightValidPlacements();
  }

  private getValidPlacements(): HexCoordinate[] {
    if (this.gameState === 'placing-first-piece') {
      return [{ q: 0, r: 0, s: 0 }]; // Center only
    }

    // Get all friendly pieces and their neighbors
    const friendly = this.entityManager.getEntitiesByPlayer(currentPlayer);
    const validCells = new Set<string>();

    friendly.forEach((entity) => {
      const neighbors = this.hexGrid.getNeighbors(entity.position);
      neighbors.forEach((coord) => {
        if (this.isValidPlacement(coord)) {
          validCells.add(coordinateToKey(coord));
        }
      });
    });

    return Array.from(validCells).map(keyToCoordinate);
  }
}
```

### Piece Movement System

```typescript
class MovementManager {
  private movementMode: boolean = false;
  private selectedEntity: Entity | null = null;

  enterMovementMode(entity: Entity): void {
    this.movementMode = true;
    this.selectedEntity = entity;
    this.highlightValidMoves(entity);
  }

  private getValidMoves(entity: Entity): HexCoordinate[] {
    const piece = this.pieceRegistry.get(entity.type);
    const baseRules = piece.movementRules;

    // Apply global movement rules
    let validMoves = this.applyGlobalRules(entity.position, baseRules);

    // Apply piece-specific modifiers
    if (piece.specialRules) {
      validMoves = piece.specialRules(validMoves, entity, this.gameState);
    }

    return validMoves;
  }
}
```

### 3D Piece Palette

```typescript
class PiecePalette {
  private container: THREE.Group;
  private pieces: Map<string, THREE.Object3D>;
  private remainingCounts: Map<string, number>;

  constructor(player: Player) {
    this.setupPalette(player.availablePieces);
    this.positionAboveBoard();
  }

  private setupPalette(pieces: PieceDefinition[]): void {
    pieces.forEach((piece, index) => {
      const model = this.loadPieceModel(piece.type);
      model.position.set(index * 2, 0, 0);
      this.container.add(model);
    });
  }

  onPieceClick(pieceType: string): void {
    this.emit('piece-selected', pieceType);
  }
}
```

## Design Considerations

### 1. **State Management**

- Use a centralized GameState that tracks board state, entities, and turn info
- Implement undo/redo capability by storing state snapshots
- Use event-driven architecture for loose coupling

### 2. **Performance**

- Implement frustum culling for large boards
- Use instanced rendering for similar pieces
- Cache valid move calculations

### 3. **User Experience**

- Clear visual feedback for all interactions
- Smooth animations for piece movements
- Intuitive highlighting system for valid actions

### 4. **Extensibility**

- Plugin system for custom piece types
- Configurable rule sets
- Support for different board shapes/sizes

### 5. **Testing Strategy**

- Unit tests for all game rules
- Integration tests for turn sequences
- Visual regression tests for rendering

## Summary

This design provides a clean separation between the game logic and the hexboard
library. The key architectural decisions:

1. **Hexboard Package Changes**: Minimal but essential - complete the HexBoard
   API, implement the Entity system, and add input handling. These are
   foundational features that any hex-based game would need.

2. **Game Architecture**: Clear separation of concerns with dedicated modules
   for game logic, rules, UI, and rendering. This keeps the game-specific code
   out of the library.

3. **Extensibility**: The design supports adding new piece types, movement
   rules, and victory conditions without modifying core systems.

4. **Performance**: Considerations for large boards and smooth animations are
   built into the design.

The game can be implemented incrementally, starting with basic placement and
movement, then adding special rules and victory conditions.
