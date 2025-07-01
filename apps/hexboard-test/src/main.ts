// Test application main entry point
// This will demonstrate hexboard library usage

import { HexBoard } from 'hexboard';
import { GameColorStrategy } from './gameColorStrategy.js';
import { GameCellProps } from './types.js';

console.log('Hexboard test application starting...');

async function initializeApp(): Promise<void> {
  // Create game color strategy
  const gameStrategy = new GameColorStrategy();

  // Create HexBoard with the game-specific color strategy
  const hexBoard = new HexBoard<GameCellProps>(gameStrategy);

  // Initialize the board
  await hexBoard.init('app');

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

    // Render all cells after adding them
    hexBoard.start();
    console.log('Map loaded and rendered successfully');
  } catch (error) {
    console.error('Failed to load map data:', error);
  }
}

// Start the application
initializeApp();
