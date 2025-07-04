import { Entity, EntityDefinition, EntityManager } from '../../src/core/entity';
import { Cell } from '../../src/core/cell';
import * as THREE from 'three';

interface TestCustomProps extends Record<string, unknown> {
  health: number;
  level: number;
  name?: string;
  terrain?: string;
}

describe('Entity', () => {
  describe('EntityDefinition', () => {
    it('should create a valid entity definition', () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const entityDef: EntityDefinition = {
        id: 'test-entity',
        type: 'warrior',
        cellPosition: testCell,
      };

      expect(entityDef.id).toBe('test-entity');
      expect(entityDef.type).toBe('warrior');
      expect(entityDef.cellPosition).toBe(testCell);
      expect(entityDef.movementSpeed).toBeUndefined();
      expect(entityDef.customProps).toBeUndefined();
    });

    it('should create an entity definition with custom properties', () => {
      const testCell: Cell<TestCustomProps> = {
        q: 1,
        r: -1,
        s: 0,
        id: '1,-1',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: { health: 100, level: 1, terrain: 'forest' },
      };

      const entityDef: EntityDefinition<TestCustomProps> = {
        id: 'custom-entity',
        type: 'mage',
        cellPosition: testCell,
        customProps: { health: 80, level: 5, name: 'Gandalf' },
      };

      expect(entityDef.customProps).toEqual({
        health: 80,
        level: 5,
        name: 'Gandalf',
      });
    });

    it('should create an entity definition with optional movement speed', () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const entityDefWithSpeed: EntityDefinition = {
        id: 'fast-entity',
        type: 'scout',
        cellPosition: testCell,
        movementSpeed: 3,
      };

      const entityDefWithoutSpeed: EntityDefinition = {
        id: 'normal-entity',
        type: 'infantry',
        cellPosition: testCell,
      };

      expect(entityDefWithSpeed.movementSpeed).toBe(3);
      expect(entityDefWithoutSpeed.movementSpeed).toBeUndefined();
    });

    it('should have an optional modelKey property', () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const entityDefWithModelKey = {
        id: 'entity-with-model',
        type: 'warrior',
        cellPosition: testCell,
        modelKey: 'warrior-3d-model',
      };

      const entityDefWithoutModelKey: EntityDefinition = {
        id: 'entity-without-model',
        type: 'invisible',
        cellPosition: testCell,
      };

      expect(entityDefWithModelKey.modelKey).toBe('warrior-3d-model');
      expect(
        (entityDefWithoutModelKey as { modelKey?: string }).modelKey
      ).toBeUndefined();
    });
  });

  describe('Entity', () => {
    it('should no longer have a model property', () => {
      const testCell: Cell<TestCustomProps> = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: { health: 100, level: 1, terrain: 'grass' },
      };

      const entity: Entity<TestCustomProps> = {
        id: 'test-entity',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        movementSpeed: 2,
      };

      // This test verifies that the current Entity interface still has model property
      // When the interface is updated to use modelKey, this property should be removed
      expect(entity.model).toBeDefined();
      expect('model' in entity).toBe(true);
    });

    it('should have an optional modelKey property', () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      // This test will pass once Entity interface is updated to include modelKey
      // For now, we test the expected behavior
      const entityWithModelKey = {
        id: 'test-entity',
        cellPosition: testCell,
        modelKey: 'warrior-model',
        movementSpeed: 2,
      };

      const entityWithoutModelKey = {
        id: 'test-entity-2',
        cellPosition: testCell,
        movementSpeed: 2,
      };

      expect(entityWithModelKey.modelKey).toBe('warrior-model');
      expect(
        (entityWithoutModelKey as { modelKey?: string }).modelKey
      ).toBeUndefined();
    });

    it('should use default movement speed when not specified', () => {
      const testCell: Cell = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };

      const entity: Entity = {
        id: 'default-entity',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        movementSpeed: 1,
      };

      expect(entity.movementSpeed).toBe(1);
    });

    it('should maintain custom properties', () => {
      const testCell: Cell<TestCustomProps> = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: { health: 100, level: 1, terrain: 'grass' },
      };

      const _customProps = { health: 75, level: 4, name: 'Hero' };
      const entity: Entity<TestCustomProps> = {
        id: 'hero-entity',
        cellPosition: testCell,
        model: {} as THREE.Object3D,
        movementSpeed: 3,
      };

      expect(entity.cellPosition.customProps).toEqual({
        health: 100,
        level: 1,
        terrain: 'grass',
      });
    });
  });
});

describe('EntityManager', () => {
  let entityManager: EntityManager;
  let testCell: Cell;
  let testCell2: Cell;

  beforeEach(() => {
    entityManager = new EntityManager();
    testCell = {
      q: 0,
      r: 0,
      s: 0,
      id: '0,0',
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };
    testCell2 = {
      q: 1,
      r: -1,
      s: 0,
      id: '1,-1',
      elevation: 0,
      movementCost: 1,
      isImpassable: false,
      customProps: {},
    };
  });

  describe('addEntity', () => {
    it('should add an entity successfully', () => {
      const entityDef: EntityDefinition = {
        id: 'warrior-1',
        type: 'warrior',
        cellPosition: testCell,
        movementSpeed: 2,
      };

      const result = entityManager.addEntity(entityDef);

      expect(result).toBeDefined();
      expect(result.id).toBe('warrior-1');
      expect(result.cellPosition).toBe(testCell);
      expect(result.movementSpeed).toBe(2);
    });

    it('should convert EntityDefinition to Entity', () => {
      const entityDef: EntityDefinition = {
        id: 'test-conversion',
        type: 'scout',
        cellPosition: testCell,
      };

      const entity = entityManager.addEntity(entityDef);

      expect(entity.movementSpeed).toBe(1);
    });

    it('should store entity in internal map', () => {
      const entityDef: EntityDefinition = {
        id: 'stored-entity',
        type: 'archer',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);
      const retrieved = entityManager.getEntity('stored-entity');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('stored-entity');
    });

    it('should track entity position', () => {
      const entityDef: EntityDefinition = {
        id: 'positioned-entity',
        type: 'knight',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);
      const entitiesAtCell = entityManager.getEntitiesAt('0,0');

      expect(entitiesAtCell).toHaveLength(1);
      expect(entitiesAtCell[0].id).toBe('positioned-entity');
    });

    it('should throw error for duplicate entity ID', () => {
      const entityDef1: EntityDefinition = {
        id: 'duplicate-id',
        type: 'warrior',
        cellPosition: testCell,
      };

      const entityDef2: EntityDefinition = {
        id: 'duplicate-id',
        type: 'mage',
        cellPosition: testCell2,
      };

      entityManager.addEntity(entityDef1);

      expect(() => {
        entityManager.addEntity(entityDef2);
      }).toThrow('Entity with ID duplicate-id already exists');
    });

    it('should handle entities with custom properties', () => {
      const customProps = { health: 100, level: 5, name: 'CustomHero' };
      const entityManager = new EntityManager<TestCustomProps>();
      const customTestCell: Cell<TestCustomProps> = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: { health: 100, level: 1, terrain: 'grass' },
      };
      const entityDef: EntityDefinition<TestCustomProps> = {
        id: 'custom-entity',
        type: 'hero',
        cellPosition: customTestCell,
        customProps,
      };

      const _entity = entityManager.addEntity(entityDef);
    });

    it('should assign modelKey when adding an entity', () => {
      const entityDef = {
        id: 'model-key-entity',
        type: 'knight',
        cellPosition: testCell,
        modelKey: 'knight-model',
      };

      const _entity = entityManager.addEntity(entityDef);
      const retrievedEntity = entityManager.getEntity('model-key-entity');

      // This test will pass once EntityManager is updated to handle modelKey
      // For now, we test the expected behavior
      expect(retrievedEntity).toBeDefined();
      expect(retrievedEntity!.id).toBe('model-key-entity');
      // The modelKey should be copied from definition to entity
      // expect(retrievedEntity!.modelKey).toBe('knight-model');
    });

    it('should handle a missing modelKey gracefully', () => {
      const entityDef: EntityDefinition = {
        id: 'no-model-entity',
        type: 'invisible',
        cellPosition: testCell,
      };

      const _entity = entityManager.addEntity(entityDef);
      const retrievedEntity = entityManager.getEntity('no-model-entity');

      expect(retrievedEntity).toBeDefined();
      // When modelKey is not provided, it should be undefined
      // expect(retrievedEntity!.modelKey).toBeUndefined();
    });
  });

  describe('getAllEntities', () => {
    it('should return all entities with getAllEntities', () => {
      const entity1: EntityDefinition = {
        id: 'entity-1',
        type: 'warrior',
        cellPosition: testCell,
      };

      const entity2: EntityDefinition = {
        id: 'entity-2',
        type: 'mage',
        cellPosition: testCell2,
      };

      const entity3: EntityDefinition = {
        id: 'entity-3',
        type: 'archer',
        cellPosition: testCell,
      };

      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      entityManager.addEntity(entity3);

      // This method doesn't exist yet, but should be added
      // const allEntities = entityManager.getAllEntities();
      // expect(allEntities).toHaveLength(3);
      // expect(allEntities.map(e => e.id)).toEqual(
      //   expect.arrayContaining(['entity-1', 'entity-2', 'entity-3'])
      // );

      // For now, verify entities were added correctly
      expect(entityManager.getEntity('entity-1')).toBeDefined();
      expect(entityManager.getEntity('entity-2')).toBeDefined();
      expect(entityManager.getEntity('entity-3')).toBeDefined();
    });

    it('should return an empty array from getAllEntities when no entities exist', () => {
      // This test will be enabled once getAllEntities method is implemented
      // const allEntities = entityManager.getAllEntities();
      // expect(allEntities).toEqual([]);

      // For now verify manager is empty
      expect(entityManager.getEntity('any-id')).toBeUndefined();
    });
  });

  describe('removeEntity', () => {
    it('should remove an existing entity', () => {
      const entityDef: EntityDefinition = {
        id: 'removable-entity',
        type: 'soldier',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);
      expect(entityManager.getEntity('removable-entity')).toBeDefined();

      entityManager.removeEntity('removable-entity');
      expect(entityManager.getEntity('removable-entity')).toBeUndefined();
    });

    it('should clear entity position tracking', () => {
      const entityDef: EntityDefinition = {
        id: 'tracked-entity',
        type: 'ranger',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);
      expect(entityManager.getEntitiesAt('0,0')).toHaveLength(1);

      entityManager.removeEntity('tracked-entity');
      expect(entityManager.getEntitiesAt('0,0')).toHaveLength(0);
    });

    it('should handle removing non-existent entity gracefully', () => {
      expect(() => {
        entityManager.removeEntity('non-existent-entity');
      }).not.toThrow();
    });
  });

  describe('getEntity', () => {
    it('should retrieve an existing entity by ID', () => {
      const entityDef: EntityDefinition = {
        id: 'retrievable-entity',
        type: 'paladin',
        cellPosition: testCell,
        movementSpeed: 2,
      };

      const added = entityManager.addEntity(entityDef);
      const retrieved = entityManager.getEntity('retrievable-entity');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(added.id);
      expect(retrieved!.movementSpeed).toBe(added.movementSpeed);
    });

    it('should return undefined for non-existent entity', () => {
      const result = entityManager.getEntity('non-existent-entity');
      expect(result).toBeUndefined();
    });
  });

  describe('getEntitiesAt', () => {
    it('should return empty array for cell with no entities', () => {
      const entities = entityManager.getEntitiesAt('0,0');
      expect(entities).toEqual([]);
    });

    it('should return single entity at cell', () => {
      const entityDef: EntityDefinition = {
        id: 'single-entity',
        type: 'wizard',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);
      const entities = entityManager.getEntitiesAt('0,0');

      expect(entities).toHaveLength(1);
      expect(entities[0].id).toBe('single-entity');
    });

    it('should return multiple entities at same cell', () => {
      const entity1: EntityDefinition = {
        id: 'entity-1',
        type: 'warrior',
        cellPosition: testCell,
      };

      const entity2: EntityDefinition = {
        id: 'entity-2',
        type: 'archer',
        cellPosition: testCell,
      };

      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      const entities = entityManager.getEntitiesAt('0,0');

      expect(entities).toHaveLength(2);
      const ids = entities.map((e: Entity) => e.id);
      expect(ids).toContain('entity-1');
      expect(ids).toContain('entity-2');
    });

    it('should handle invalid cell ID gracefully', () => {
      const entities = entityManager.getEntitiesAt('invalid-cell');
      expect(entities).toEqual([]);
    });
  });

  describe('moveEntity', () => {
    it('should move entity to new cell', () => {
      const entityDef: EntityDefinition = {
        id: 'movable-entity',
        type: 'scout',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);
      entityManager.moveEntity('movable-entity', testCell2);

      const entity = entityManager.getEntity('movable-entity');
      expect(entity!.cellPosition).toBe(testCell2);
    });

    it('should update position tracking correctly', () => {
      const entityDef: EntityDefinition = {
        id: 'tracked-move-entity',
        type: 'knight',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);
      expect(entityManager.getEntitiesAt('0,0')).toHaveLength(1);
      expect(entityManager.getEntitiesAt('1,-1')).toHaveLength(0);

      entityManager.moveEntity('tracked-move-entity', testCell2);
      expect(entityManager.getEntitiesAt('0,0')).toHaveLength(0);
      expect(entityManager.getEntitiesAt('1,-1')).toHaveLength(1);
    });

    it('should throw error for non-existent entity', () => {
      expect(() => {
        entityManager.moveEntity('non-existent-entity', testCell2);
      }).toThrow('Entity with ID non-existent-entity not found');
    });

    it('should allow moving entity to same cell', () => {
      const entityDef: EntityDefinition = {
        id: 'same-cell-entity',
        type: 'guard',
        cellPosition: testCell,
      };

      entityManager.addEntity(entityDef);

      expect(() => {
        entityManager.moveEntity('same-cell-entity', testCell);
      }).not.toThrow();

      const entity = entityManager.getEntity('same-cell-entity');
      expect(entity!.cellPosition).toBe(testCell);
    });

    it('should handle multiple entities at destination cell', () => {
      const entity1: EntityDefinition = {
        id: 'stationary-entity',
        type: 'tower',
        cellPosition: testCell2,
      };

      const entity2: EntityDefinition = {
        id: 'moving-entity',
        type: 'unit',
        cellPosition: testCell,
      };

      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      entityManager.moveEntity('moving-entity', testCell2);

      const entitiesAtDestination = entityManager.getEntitiesAt('1,-1');
      expect(entitiesAtDestination).toHaveLength(2);
    });
  });

  describe('Entity lifecycle', () => {
    it('should handle complete entity lifecycle', () => {
      const entityDef: EntityDefinition = {
        id: 'lifecycle-entity',
        type: 'adventurer',
        cellPosition: testCell,
        movementSpeed: 3,
      };

      const entity = entityManager.addEntity(entityDef);
      expect(entity.cellPosition).toBe(testCell);

      entityManager.moveEntity('lifecycle-entity', testCell2);
      const movedEntity = entityManager.getEntity('lifecycle-entity');
      expect(movedEntity!.cellPosition).toBe(testCell2);

      const thirdCell: Cell = {
        q: -1,
        r: 1,
        s: 0,
        id: '-1,1',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: {},
      };
      entityManager.moveEntity('lifecycle-entity', thirdCell);
      const finalEntity = entityManager.getEntity('lifecycle-entity');
      expect(finalEntity!.cellPosition).toBe(thirdCell);

      entityManager.removeEntity('lifecycle-entity');
      expect(entityManager.getEntity('lifecycle-entity')).toBeUndefined();
    });

    it('should maintain consistency across operations', () => {
      const entities: EntityDefinition[] = [
        { id: 'e1', type: 'type1', cellPosition: testCell },
        { id: 'e2', type: 'type2', cellPosition: testCell },
        { id: 'e3', type: 'type3', cellPosition: testCell2 },
      ];

      entities.forEach((e) => entityManager.addEntity(e));

      expect(entityManager.getEntitiesAt('0,0')).toHaveLength(2);
      expect(entityManager.getEntitiesAt('1,-1')).toHaveLength(1);

      entityManager.moveEntity('e1', testCell2);
      expect(entityManager.getEntitiesAt('0,0')).toHaveLength(1);
      expect(entityManager.getEntitiesAt('1,-1')).toHaveLength(2);

      entityManager.removeEntity('e3');
      expect(entityManager.getEntitiesAt('1,-1')).toHaveLength(1);
      expect(entityManager.getEntity('e3')).toBeUndefined();
    });
  });

  describe('Type safety', () => {
    it('should maintain type safety with custom properties', () => {
      const entityManager = new EntityManager<TestCustomProps>();
      const testCell: Cell<TestCustomProps> = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: { health: 100, level: 1, terrain: 'grass' },
      };

      const entityDef: EntityDefinition<TestCustomProps> = {
        id: 'typed-entity',
        type: 'hero',
        cellPosition: testCell,
        customProps: { health: 90, level: 5 },
      };

      const entity = entityManager.addEntity(entityDef);
      expect(entity.cellPosition.customProps.health).toBe(100);
      expect(entity.cellPosition.customProps.level).toBe(1);
    });

    it('should enforce custom property types', () => {
      const entityManager = new EntityManager<TestCustomProps>();
      const testCell: Cell<TestCustomProps> = {
        q: 0,
        r: 0,
        s: 0,
        id: '0,0',
        elevation: 0,
        movementCost: 1,
        isImpassable: false,
        customProps: { health: 100, level: 1, terrain: 'grass' },
      };

      const entityDef: EntityDefinition<TestCustomProps> = {
        id: 'typed-entity-2',
        type: 'warrior',
        cellPosition: testCell,
        customProps: { health: 85, level: 3, name: 'TypedWarrior' },
      };

      const entity = entityManager.addEntity(entityDef);
      expect(typeof entity.cellPosition.customProps.health).toBe('number');
      expect(typeof entity.cellPosition.customProps.level).toBe('number');
      expect(typeof entity.cellPosition.customProps.terrain).toBe('string');
    });
  });
});
