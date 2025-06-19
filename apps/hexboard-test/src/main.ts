// Test application main entry point
// This will demonstrate hexboard library usage

import { HexGrid, BoardRenderer } from 'hexboard';

console.log('Hexboard test application starting...');

// Create a hex grid and add some test cells
const hexGrid = new HexGrid();

// Create a basic hex ring pattern (center + 6 surrounding hexes)
const ringCells = hexGrid.createBasicHexRing(1);
console.log('Created hex ring with cells:', ringCells);

// Add some additional test cells with different properties
hexGrid.addCell({ 
  q: 2, r: 0, 
  elevation: 2, 
  customProperties: { id: 'mountain-cell', type: 'mountain' } 
});

hexGrid.addCell({ 
  q: 0, r: 2, 
  elevation: 0.5, 
  isImpassable: true,
  customProperties: { id: 'water-cell', type: 'water' } 
});

hexGrid.addCell({ 
  q: -2, r: 1, 
  elevation: 1.5, 
  movementCost: 2,
  customProperties: { id: 'forest-cell', type: 'forest' } 
});

// Add a cluster of cells to demonstrate larger grids
for (let q = -1; q <= 1; q++) {
  for (let r = -1; r <= 1; r++) {
    if (q === 0 && r === 0) continue; // Skip center (already exists)
    if (Math.abs(q + r) <= 1) { // Only add cells within distance 1
      if (!hexGrid.hasCellAtCoords({ q: q + 3, r: r - 2, s: -(q + 3) - (r - 2) })) {
        hexGrid.addCell({ 
          q: q + 3, 
          r: r - 2, 
          elevation: Math.random() * 1.5 + 0.5,
          customProperties: { id: `cluster-${q}-${r}`, type: 'plains' } 
        });
      }
    }
  }
}

console.log('Total cells in grid:', hexGrid.getAllCells().length);

// Create BoardRenderer with the hex grid
const renderer = new BoardRenderer(hexGrid);
console.log('BoardRenderer created successfully');

// Set up the renderer in the DOM
const gameContainer = document.getElementById('app')!;
gameContainer.appendChild(renderer.getRenderer().domElement);

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
renderer.renderGroundPlane(30, 0x228B22); // Forest green ground
console.log('- renderGroundPlane() called');

// Test hex grid rendering
renderer.renderHexGrid();
console.log('- renderHexGrid() called');

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
