// Test application main entry point
// This will demonstrate hexboard library usage

import { HexBoard, HexCoordinates, ModelRegistry } from 'hexboard';
import { GameColorStrategy } from './gameColorStrategy.js';
import { GameCellProps } from './types.js';
import * as THREE from 'three';

console.log('Hexboard test application starting...');

// Global state for movement mode
let isMovementModeActive = false;
let hexBoard: HexBoard<GameCellProps>;

// Create a metallic dodecahedron geometry for the entity
function createDodecahedronModel(): THREE.Object3D {
  const geometry = new THREE.DodecahedronGeometry(0.5);
  const material = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Handle cell click for movement
function handleCellClick(coords: HexCoordinates): void {
  const cell = hexBoard.getCellAtCoords(coords);
  if (!cell) return;

  if (!isMovementModeActive) {
    // Check if the clicked cell contains an entity
    const entitiesAtCell = hexBoard.getEntitiesAt(cell.id);
    if (entitiesAtCell.length > 0) {
      const entity = entitiesAtCell[0];

      // Calculate reachable hexes (2-step range, respecting impassable)
      const reachableHexes = hexBoard.getHexGrid().getReachableHexes(
        {
          q: entity.cellPosition.q,
          r: entity.cellPosition.r,
          s: entity.cellPosition.s,
        },
        2,
        { respectImpassable: true }
      );

      // Start movement mode
      hexBoard.startEntityMovement(entity.id, reachableHexes);
      isMovementModeActive = true;

      // Highlight the entity and destination cells
      const renderer = hexBoard.getRenderer();
      if (renderer) {
        // Note: EntityRenderer.getEntityModel is not exposed through HexBoard API
        // This is intentional to maintain encapsulation
        renderer.highlightHexCells(reachableHexes);
      }

      console.log(
        `Started movement mode for entity ${entity.id} with ${reachableHexes.length} destinations`
      );
    }
  } else {
    // Already in movement mode, check if clicked destination is valid
    const entitiesInMovement = hexBoard
      .getAllEntities()
      .filter((e) => e.isInMovementMode);
    if (entitiesInMovement.length > 0) {
      const entity = entitiesInMovement[0];
      const destinations = hexBoard.getEntityMovementDestinations(entity.id);

      const isValidDestination = destinations.some(
        (dest) =>
          dest.q === coords.q && dest.r === coords.r && dest.s === coords.s
      );

      const renderer = hexBoard.getRenderer();
      if (isValidDestination) {
        // Move entity to the destination
        hexBoard.moveEntity(entity.id, cell);
        console.log(
          `Moved entity ${entity.id} to ${coords.q},${coords.r},${coords.s}`
        );
      } else {
        // Cancel movement
        hexBoard.cancelEntityMovement(entity.id);
        console.log(`Cancelled movement for entity ${entity.id}`);
      }

      // Clear highlights
      if (renderer) {
        renderer.removeHighlightFromHexCells(destinations);
      }

      isMovementModeActive = false;
    }
  }
}

async function initializeApp(): Promise<void> {
  // Create game color strategy
  const gameStrategy = new GameColorStrategy();

  // Create HexBoard with the game-specific color strategy
  hexBoard = new HexBoard<GameCellProps>(gameStrategy);

  // Setup model registry
  const modelRegistry = new ModelRegistry();
  modelRegistry.registerModel('dodecahedron', createDodecahedronModel());

  // Initialize the board with entity management
  await hexBoard.init('app', modelRegistry);

  // Load map data from assets
  try {
    const response = await fetch('/assets/starter-valley.json');
    const mapData: {
      cells: Array<{
        q: number;
        r: number;
        s: number;
        elevation?: number;
        movementCost?: number;
        isImpassable?: boolean;
        customProps?: { terrainType?: string };
      }>;
      defaults: {
        elevation?: number;
        movementCost?: number;
        isImpassable?: boolean;
        customProps?: { terrainType?: string };
      };
    } = await response.json();
    console.log('Loaded map:', mapData);

    // Add cells from the map data
    mapData.cells.forEach((cellData) => {
      const coords = { q: cellData.q, r: cellData.r, s: cellData.s };
      const cellDefinition = {
        elevation: cellData.elevation,
        movementCost: cellData.movementCost,
        isImpassable: cellData.isImpassable,
        customProps: {
          type:
            cellData.customProps?.terrainType ||
            mapData.defaults.customProps?.terrainType,
        } as GameCellProps,
      };

      hexBoard.setCellAtCoords(coords, cellDefinition);
    });

    // After loading the map, create a dodecahedron entity on a random passable cell
    const allCells = hexBoard.getAllCells();
    const passableCells = allCells.filter((cell) => !cell.isImpassable);

    if (passableCells.length > 0) {
      const randomCell =
        passableCells[Math.floor(Math.random() * passableCells.length)];

      hexBoard.addEntity({
        id: 'dodecahedron-1',
        type: 'unit',
        cellPosition: randomCell,
        modelKey: 'dodecahedron',
        movementSpeed: 1,
      });

      console.log(
        `Created dodecahedron entity at ${randomCell.q}, ${randomCell.r}, ${randomCell.s}`
      );
    }

    // Connect click handler to input system
    const inputHandler = hexBoard.getInputHandler();
    if (inputHandler) {
      inputHandler.onCellClick = handleCellClick;
    }

    // Start the render loop
    hexBoard.start();

    console.log('Map loaded and rendered successfully');
  } catch (error) {
    console.error('Failed to load map data:', error);
  }
}

// Start the application
initializeApp();
