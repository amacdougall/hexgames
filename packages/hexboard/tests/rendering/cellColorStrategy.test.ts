import { Cell } from '../../src/core/cell';
import { CellColorStrategy, DefaultCellColorStrategy, ElevationColorStrategy } from '../../src/rendering/cellColorStrategy';

describe('Cell Color Strategy System', () => {
  describe('CellColorStrategy interface', () => {
    it('should be implementable by custom strategies', () => {
      class TestStrategy implements CellColorStrategy {
        getCellColor(cell: Cell<Record<string, never>>): number {
          return 0x000000; // Black
        }
      }

      const strategy = new TestStrategy();
      const mockCell: Cell<Record<string, never>> = {
        q: 0,
        r: 0,
        s: 0,
        id: 'test',
        elevation: 1,
        isImpassable: false,
        movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(mockCell)).toBe(0x000000);
    });

    it('should support custom properties in strategy implementations', () => {
      interface GameProps extends Record<string, unknown> {
        faction: 'player' | 'enemy' | 'neutral';
        resource?: string;
      }

      class FactionStrategy implements CellColorStrategy<GameProps> {
        getCellColor(cell: Cell<GameProps>): number {
          switch (cell.customProps.faction) {
            case 'player': return 0x00ff00; // Green
            case 'enemy': return 0xff0000;  // Red
            default: return 0x808080;       // Gray
          }
        }
      }

      const strategy = new FactionStrategy();
      const playerCell: Cell<GameProps> = {
        q: 0, r: 0, s: 0, id: 'player-cell',
        elevation: 1, isImpassable: false, movementCost: 1,
        customProps: { faction: 'player' }
      };
      const enemyCell: Cell<GameProps> = {
        q: 1, r: 0, s: -1, id: 'enemy-cell',
        elevation: 1, isImpassable: false, movementCost: 1,
        customProps: { faction: 'enemy' }
      };
      const neutralCell: Cell<GameProps> = {
        q: 0, r: 1, s: -1, id: 'neutral-cell',
        elevation: 1, isImpassable: false, movementCost: 1,
        customProps: { faction: 'neutral' }
      };

      expect(strategy.getCellColor(playerCell)).toBe(0x00ff00);
      expect(strategy.getCellColor(enemyCell)).toBe(0xff0000);
      expect(strategy.getCellColor(neutralCell)).toBe(0x808080);
    });
  });

  describe('DefaultCellColorStrategy', () => {
    let strategy: DefaultCellColorStrategy;

    beforeEach(() => {
      strategy = new DefaultCellColorStrategy();
    });

    it('should render impassable cells as water (royal blue)', () => {
      const waterCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'water',
        elevation: 0.5, isImpassable: true, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(waterCell)).toBe(0x4169e1); // Royal blue
    });

    it('should render high elevation as mountains (saddle brown)', () => {
      const mountainCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'mountain',
        elevation: 3, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(mountainCell)).toBe(0x8b4513); // Saddle brown
    });

    it('should render medium-high elevation as hills (forest green)', () => {
      const hillCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'hill',
        elevation: 2, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(hillCell)).toBe(0x228b22); // Forest green
    });

    it('should render medium elevation as normal terrain (yellow green)', () => {
      const normalCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'normal',
        elevation: 1.2, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(normalCell)).toBe(0x9acd32); // Yellow green
    });

    it('should render low elevation as low terrain (sandy brown)', () => {
      const lowCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'low',
        elevation: 0.8, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(lowCell)).toBe(0xf4a460); // Sandy brown
    });

    it('should prioritize impassable over elevation', () => {
      const impassableHighCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'impassable-high',
        elevation: 5, isImpassable: true, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(impassableHighCell)).toBe(0x4169e1); // Royal blue (water)
    });

    it('should handle edge cases correctly', () => {
      // Exactly at thresholds
      const exactThresholdCells = [
        { elevation: 2.1, expected: 0x8b4513 }, // >2 -> mountains (saddle brown)
        { elevation: 2, expected: 0x228b22 }, // Exactly 2 -> hills (forest green)
        { elevation: 1.6, expected: 0x228b22 }, // >1.5 -> hills (forest green)
        { elevation: 1.5, expected: 0x9acd32 }, // Exactly 1.5 -> normal (yellow green)
        { elevation: 1.1, expected: 0x9acd32 }, // >1 -> normal (yellow green)
        { elevation: 1, expected: 0xf4a460 }, // Exactly 1 -> low (sandy brown)
        { elevation: 0, expected: 0xf4a460 }, // Zero elevation -> low (sandy brown)
        { elevation: -1, expected: 0xf4a460 } // Negative elevation -> low (sandy brown)
      ];

      exactThresholdCells.forEach(({ elevation, expected }) => {
        const cell: Cell<Record<string, never>> = {
          q: 0, r: 0, s: 0, id: `elevation-${elevation}`,
          elevation, isImpassable: false, movementCost: 1,
          customProps: {}
        };
        expect(strategy.getCellColor(cell)).toBe(expected);
      });
    });
  });

  describe('ElevationColorStrategy', () => {
    let strategy: ElevationColorStrategy;

    beforeEach(() => {
      strategy = new ElevationColorStrategy();
    });

    it('should render very high elevation as dark brown', () => {
      const veryHighCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'very-high',
        elevation: 4, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(veryHighCell)).toBe(0x654321); // Dark brown
    });

    it('should render high elevation as brown', () => {
      const highCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'high',
        elevation: 2.5, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(highCell)).toBe(0x8b4513); // Brown
    });

    it('should render medium elevation as green', () => {
      const mediumCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'medium',
        elevation: 1.5, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(mediumCell)).toBe(0x228b22); // Green
    });

    it('should render low elevation as blue', () => {
      const lowCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'low',
        elevation: 0.5, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(lowCell)).toBe(0x4169e1); // Blue
    });

    it('should ignore impassable property', () => {
      const impassableCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'impassable',
        elevation: 2.5, isImpassable: true, movementCost: 1,
        customProps: {}
      };

      // Should still use elevation-based coloring, not treat as water
      expect(strategy.getCellColor(impassableCell)).toBe(0x8b4513); // Brown for high elevation
    });

    it('should handle edge cases correctly', () => {
      const exactThresholdCells = [
        { elevation: 3.1, expected: 0x654321 }, // >3 -> dark brown
        { elevation: 3, expected: 0x8b4513 },   // Exactly 3 -> brown
        { elevation: 2.1, expected: 0x8b4513 }, // >2 -> brown  
        { elevation: 2, expected: 0x228b22 },   // Exactly 2 -> green
        { elevation: 1.1, expected: 0x228b22 }, // >1 -> green
        { elevation: 1, expected: 0x4169e1 },   // Exactly 1 -> blue
        { elevation: 0, expected: 0x4169e1 },   // Zero elevation -> blue
        { elevation: -1, expected: 0x4169e1 }   // Negative elevation -> blue
      ];

      exactThresholdCells.forEach(({ elevation, expected }) => {
        const cell: Cell<Record<string, never>> = {
          q: 0, r: 0, s: 0, id: `elevation-${elevation}`,
          elevation, isImpassable: false, movementCost: 1,
          customProps: {}
        };
        expect(strategy.getCellColor(cell)).toBe(expected);
      });
    });

    it('should handle extreme elevation values', () => {
      const extremeCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'extreme',
        elevation: 1000, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      expect(strategy.getCellColor(extremeCell)).toBe(0x654321); // Dark brown for very high
    });
  });

  describe('Strategy Integration', () => {
    it('should work with BoardRenderer type system', () => {
      interface CustomProps extends Record<string, unknown> {
        biome: string;
        temperature: number;
      }

      class BiomeStrategy implements CellColorStrategy<CustomProps> {
        getCellColor(cell: Cell<CustomProps>): number {
          const { biome, temperature } = cell.customProps;
          
          if (biome === 'desert') {
            return temperature > 30 ? 0xffd700 : 0xdaa520; // Gold or darker gold
          } else if (biome === 'forest') {
            return 0x228b22; // Forest green
          } else if (biome === 'tundra') {
            return 0xe0ffff; // Light cyan
          }
          
          return 0x808080; // Default gray
        }
      }

      const strategy = new BiomeStrategy();
      const desertCell: Cell<CustomProps> = {
        q: 0, r: 0, s: 0, id: 'desert',
        elevation: 1, isImpassable: false, movementCost: 1,
        customProps: { biome: 'desert', temperature: 35 }
      };

      expect(strategy.getCellColor(desertCell)).toBe(0xffd700);
    });

    it('should support runtime strategy switching patterns', () => {
      const defaultStrategy = new DefaultCellColorStrategy();
      const elevationStrategy = new ElevationColorStrategy();

      const testCell: Cell<Record<string, never>> = {
        q: 0, r: 0, s: 0, id: 'test',
        elevation: 2.5, isImpassable: false, movementCost: 1,
        customProps: {}
      };

      // Different strategies should give different results for the same cell
      const defaultColor = defaultStrategy.getCellColor(testCell);
      const elevationColor = elevationStrategy.getCellColor(testCell);

      expect(defaultColor).toBe(0x8b4513); // Saddle brown (mountains)
      expect(elevationColor).toBe(0x8b4513); // Brown (high elevation)
      
      // In this case they're the same, but let's test with impassable
      const impassableCell: Cell<Record<string, never>> = {
        ...testCell,
        isImpassable: true
      };

      expect(defaultStrategy.getCellColor(impassableCell)).toBe(0x4169e1); // Water
      expect(elevationStrategy.getCellColor(impassableCell)).toBe(0x8b4513); // Still elevation-based
    });
  });
});
