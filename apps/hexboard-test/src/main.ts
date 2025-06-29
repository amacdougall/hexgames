// Test application main entry point
// This will demonstrate hexboard library usage

import {
  BoardRenderer,
  DefaultCellColorStrategy,
  ElevationColorStrategy,
  HexGrid,
} from 'hexboard';
import { BiomeColorStrategy, GameColorStrategy } from './gameColorStrategy.js';

console.log('Hexboard test application starting...');

// Create a hex grid and add some test cells
const hexGrid = new HexGrid();

// Create a basic hex ring pattern (center + 6 surrounding hexes)
const ringCells = hexGrid.createBasicHexRing(1);
console.log('Created hex ring with cells:', ringCells);

// Add some additional test cells with different properties
hexGrid.addCell({
  q: 2,
  r: 0,
  elevation: 2,
  customProperties: { id: 'mountain-cell', type: 'mountain', owner: 'player1' },
});

hexGrid.addCell({
  q: 0,
  r: 2,
  elevation: 0.5,
  isImpassable: true,
  customProperties: { id: 'water-cell', type: 'water' },
});

hexGrid.addCell({
  q: -2,
  r: 1,
  elevation: 1.5,
  movementCost: 2,
  customProperties: { id: 'forest-cell', type: 'forest', owner: 'player2' },
});

// Add a special cell with game state
hexGrid.addCell({
  q: 2,
  r: 1,
  elevation: 1.2,
  customProperties: { id: 'special-cell', type: 'plains', state: 'selected' },
});

// Add contested territory
hexGrid.addCell({
  q: -1,
  r: 2,
  elevation: 1.0,
  customProperties: {
    id: 'contested-cell',
    type: 'plains',
    state: 'contested',
  },
});

// Add a cluster of cells to demonstrate larger grids
for (let q = -1; q <= 1; q++) {
  for (let r = -1; r <= 1; r++) {
    if (q === 0 && r === 0) continue; // Skip center (already exists)
    if (Math.abs(q + r) <= 1) {
      // Only add cells within distance 1
      if (
        !hexGrid.hasCellAtCoords({ q: q + 3, r: r - 2, s: -(q + 3) - (r - 2) })
      ) {
        hexGrid.addCell({
          q: q + 3,
          r: r - 2,
          elevation: Math.random() * 1.5 + 0.5,
          customProperties: { id: `cluster-${q}-${r}`, type: 'plains' },
        });
      }
    }
  }
}

console.log('Total cells in grid:', hexGrid.getAllCells().length);

// Create different color strategies for demonstration
const gameStrategy = new GameColorStrategy();
const biomeStrategy = new BiomeColorStrategy();
const defaultStrategy = new DefaultCellColorStrategy();
const elevationStrategy = new ElevationColorStrategy();

// Create BoardRenderer with the game-specific color strategy
const renderer = new BoardRenderer(hexGrid, gameStrategy);
console.log('BoardRenderer created with GameColorStrategy');

// Set up the renderer in the DOM
const gameContainer = document.getElementById('app')!;
gameContainer.appendChild(renderer.getRenderer().domElement);

// Add strategy switching UI controls
const controlsDiv = document.createElement('div');
controlsDiv.style.position = 'absolute';
controlsDiv.style.top = '10px';
controlsDiv.style.left = '10px';
controlsDiv.style.zIndex = '1000';
controlsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
controlsDiv.style.color = 'white';
controlsDiv.style.padding = '10px';
controlsDiv.style.borderRadius = '5px';
controlsDiv.style.fontFamily = 'monospace';

const title = document.createElement('div');
title.textContent = 'Color Strategy:';
title.style.marginBottom = '10px';
title.style.fontWeight = 'bold';
controlsDiv.appendChild(title);

// Strategy buttons
const strategies = [
  {
    name: 'Game Strategy',
    strategy: gameStrategy,
    description: 'Owner/terrain/state based',
  },
  {
    name: 'Biome Strategy',
    strategy: biomeStrategy,
    description: 'Climate zones',
  },
  {
    name: 'Default Strategy',
    strategy: defaultStrategy,
    description: 'Original elevation',
  },
  {
    name: 'Elevation Strategy',
    strategy: elevationStrategy,
    description: 'Simple elevation',
  },
];

let currentStrategyIndex = 0;

strategies.forEach((strategyInfo, index) => {
  const button = document.createElement('button');
  button.textContent = strategyInfo.name;
  button.title = strategyInfo.description;
  button.style.display = 'block';
  button.style.margin = '2px 0';
  button.style.padding = '5px 10px';
  button.style.backgroundColor =
    index === currentStrategyIndex ? '#007acc' : '#333';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '3px';
  button.style.cursor = 'pointer';

  button.addEventListener('click', () => {
    // Update button states
    controlsDiv.querySelectorAll('button').forEach((btn, idx) => {
      btn.style.backgroundColor = idx === index ? '#007acc' : '#333';
    });

    // Switch strategy
    renderer.setColorStrategy(strategyInfo.strategy);
    renderer.renderHexGrid(); // Re-render with new colors
    currentStrategyIndex = index;

    console.log(
      `Switched to ${strategyInfo.name}: ${strategyInfo.description}`
    );
  });

  controlsDiv.appendChild(button);
});

gameContainer.appendChild(controlsDiv);

// Set renderer size to be responsive
const resizeRenderer = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
};
resizeRenderer();
window.addEventListener('resize', resizeRenderer);

// Test the rendering methods
console.log('Testing BoardRenderer methods:');

// Test ground plane rendering
renderer.renderGroundPlane(30, 0x228b22); // Forest green ground
console.log('- renderGroundPlane() called');

// Test hex grid rendering
renderer.renderHexGrid();
console.log('- renderHexGrid() called');

// Demonstrate different strategies with sample cells
console.log('\nColor Strategy Demonstration:');
const sampleCells = hexGrid.getAllCells().slice(0, 5);

sampleCells.forEach((cell) => {
  console.log(
    `\nCell at (${cell.q}, ${cell.r}) - elevation: ${cell.elevation}, properties:`,
    cell.customProperties
  );
  console.log(
    `  Game Strategy: #${gameStrategy.getCellColor(cell).toString(16).padStart(6, '0')}`
  );
  console.log(
    `  Biome Strategy: #${biomeStrategy.getCellColor(cell).toString(16).padStart(6, '0')}`
  );
  console.log(
    `  Default Strategy: #${defaultStrategy.getCellColor(cell).toString(16).padStart(6, '0')}`
  );
  console.log(
    `  Elevation Strategy: #${elevationStrategy.getCellColor(cell).toString(16).padStart(6, '0')}`
  );
});

// Test individual cell rendering (add a special cell)
renderer.renderHexCell({ q: 3, r: 0, s: -3 });
console.log('- renderHexCell() called');

// Test cell updating
renderer.updateHexCell({ q: 0, r: 0, s: 0 });
console.log('- updateHexCell() called');

// Start render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render();
}

animate();
console.log('Render loop started');

// Example of future full API usage:
/*
import { HexBoard, MapDefinition } from 'hexboard';

const mapDefinition: MapDefinition = {
  name: "Test Map",
  defaults: {
    elevation: 1,
    movementCost: 1,
    isImpassable: false,
    customProperties: { terrainType: "grassland" }
  },
  cells: [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 }
  ]
};

const gameContainer = document.getElementById('game-container')!;
const board = new HexBoard(gameContainer, mapDefinition);

board.onTileClick((cell) => {
  console.log('Clicked cell:', cell);
});

board.start();
*/
