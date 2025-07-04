import { Cell, CellDefinition } from '../../src/core/cell';

interface TestProps extends Record<string, unknown> {
  type?: string;
  resources?: string[];
  owner?: string;
}

describe('Cell System', () => {
  describe('CellDefinition interface', () => {
    test('creates basic cell definition', () => {
      const definition: CellDefinition = {
        q: 1,
        r: 2,
      };

      expect(definition.q).toBe(1);
      expect(definition.r).toBe(2);
      expect(definition.s).toBeUndefined();
      expect(definition.elevation).toBeUndefined();
      expect(definition.movementCost).toBeUndefined();
      expect(definition.isImpassable).toBeUndefined();
      expect(definition.customProps).toBeUndefined();
    });

    test('supports custom properties', () => {
      const definition: CellDefinition<TestProps> = {
        q: 0,
        r: 0,
        customProps: {
          type: 'forest',
          resources: ['wood', 'berries'],
          owner: 'player1',
        },
      };

      expect(definition.customProps?.type).toBe('forest');
      expect(definition.customProps?.resources).toEqual(['wood', 'berries']);
      expect(definition.customProps?.owner).toBe('player1');
    });

    test('handles optional properties correctly', () => {
      // Test with minimal properties
      const minimalDef: CellDefinition = { q: 0, r: 0 };
      expect(minimalDef.q).toBe(0);
      expect(minimalDef.r).toBe(0);

      // Test with all properties
      const fullDef: CellDefinition<TestProps> = {
        q: 1,
        r: -1,
        s: 0,
        elevation: 2.5,
        movementCost: 3,
        isImpassable: true,
        customProps: {
          type: 'mountain',
          resources: ['stone'],
          owner: 'neutral',
        },
      };

      expect(fullDef.q).toBe(1);
      expect(fullDef.r).toBe(-1);
      expect(fullDef.s).toBe(0);
      expect(fullDef.elevation).toBe(2.5);
      expect(fullDef.movementCost).toBe(3);
      expect(fullDef.isImpassable).toBe(true);
      expect(fullDef.customProps?.type).toBe('mountain');
    });
  });

  describe('Cell interface', () => {
    test('extends HexCoordinates correctly', () => {
      const cell: Cell<TestProps> = {
        id: '1,0,-1',
        q: 1,
        r: 0,
        s: -1,
        elevation: 1.5,
        movementCost: 2,
        isImpassable: false,
        customProps: {
          type: 'grassland',
        },
      };

      // Test HexCoordinates properties
      expect(cell.q).toBe(1);
      expect(cell.r).toBe(0);
      expect(cell.s).toBe(-1);

      // Verify cubic coordinate constraint
      expect(cell.q + cell.r + cell.s).toBe(0);
    });

    test('includes required properties', () => {
      const cell: Cell = {
        id: '0,0,0',
        q: 0,
        r: 0,
        s: 0,
        elevation: 1,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      // Test all required Cell properties exist
      expect(typeof cell.id).toBe('string');
      expect(typeof cell.elevation).toBe('number');
      expect(typeof cell.movementCost).toBe('number');
      expect(typeof cell.isImpassable).toBe('boolean');
      expect(typeof cell.customProps).toBe('object');

      // Test specific values
      expect(cell.id).toBe('0,0,0');
      expect(cell.elevation).toBe(1);
      expect(cell.movementCost).toBe(1);
      expect(cell.isImpassable).toBe(false);
    });

    test('maintains type safety with custom properties', () => {
      interface GameProps extends Record<string, unknown> {
        terrain: string;
        buildable: boolean;
        resources?: string[];
      }

      const cell: Cell<GameProps> = {
        id: '2,-1,-1',
        q: 2,
        r: -1,
        s: -1,
        elevation: 3,
        movementCost: 4,
        isImpassable: true,
        customProps: {
          terrain: 'mountain',
          buildable: false,
          resources: ['iron', 'coal'],
        },
      };

      expect(cell.customProps.terrain).toBe('mountain');
      expect(cell.customProps.buildable).toBe(false);
      expect(cell.customProps.resources).toEqual(['iron', 'coal']);

      // TypeScript should enforce that customProps matches GameProps
      // This is validated at compile time, not runtime
    });
  });

  describe('type constraints', () => {
    test('enforces object constraint on CustomProps', () => {
      // Test that CustomProps must extend object (compile-time constraint)

      // Valid: object types
      const cellWithObject: Cell<{ name: string }> = {
        id: '0,0,0',
        q: 0,
        r: 0,
        s: 0,
        elevation: 1,
        movementCost: 1,
        isImpassable: false,
        customProps: { name: 'test' },
      };

      const cellWithInterface: Cell<TestProps> = {
        id: '1,0,-1',
        q: 1,
        r: 0,
        s: -1,
        elevation: 1,
        movementCost: 1,
        isImpassable: false,
        customProps: { type: 'forest' },
      };

      expect(cellWithObject.customProps.name).toBe('test');
      expect(cellWithInterface.customProps.type).toBe('forest');

      // The constraint CustomProps extends object is enforced by TypeScript
      // at compile time. Primitive types like string, number, boolean would
      // cause compilation errors but can't be tested at runtime.
    });

    test('allows complex custom property types', () => {
      interface ComplexProps extends Record<string, unknown> {
        metadata: {
          discovered: boolean;
          lastVisited?: Date;
          notes: string[];
        };
        gameplay: {
          spawnPoint: boolean;
          defensiveBonus: number;
          specialRules?: {
            name: string;
            description: string;
            effects: Record<string, unknown>;
          }[];
        };
        visuals: {
          texturePath: string;
          animations?: string[];
          effects?: {
            type: 'particle' | 'glow' | 'shimmer';
            intensity: number;
          }[];
        };
      }

      const complexCell: Cell<ComplexProps> = {
        id: '3,1,-4',
        q: 3,
        r: 1,
        s: -4,
        elevation: 2,
        movementCost: 3,
        isImpassable: false,
        customProps: {
          metadata: {
            discovered: true,
            lastVisited: new Date('2023-01-01'),
            notes: ['Ancient ruins found here', 'Rich in magical energy'],
          },
          gameplay: {
            spawnPoint: true,
            defensiveBonus: 2,
            specialRules: [
              {
                name: 'Magical Sanctuary',
                description: 'Units heal faster in this location',
                effects: {
                  healingRate: 1.5,
                  manaRegeneration: 2.0,
                },
              },
            ],
          },
          visuals: {
            texturePath: '/textures/ancient_ruins.png',
            animations: ['glow_pulse', 'mist_swirl'],
            effects: [
              {
                type: 'glow',
                intensity: 0.7,
              },
            ],
          },
        },
      };

      // Test nested properties
      expect(complexCell.customProps.metadata.discovered).toBe(true);
      expect(complexCell.customProps.metadata.notes).toHaveLength(2);
      expect(complexCell.customProps.gameplay.spawnPoint).toBe(true);
      expect(complexCell.customProps.gameplay.specialRules?.[0].name).toBe(
        'Magical Sanctuary'
      );
      expect(complexCell.customProps.visuals.texturePath).toBe(
        '/textures/ancient_ruins.png'
      );
      expect(complexCell.customProps.visuals.effects?.[0].type).toBe('glow');

      // Test optional properties
      expect(complexCell.customProps.metadata.lastVisited).toBeInstanceOf(Date);
      expect(complexCell.customProps.gameplay.specialRules).toHaveLength(1);
      expect(complexCell.customProps.visuals.animations).toContain(
        'glow_pulse'
      );
    });
  });
});
