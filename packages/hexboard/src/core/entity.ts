// Entity definitions and interfaces
// Implementation will go here

import * as THREE from 'three';
import { Cell } from './cell';

/**
 * Definition for creating an entity
 */
export interface EntityDefinition<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  id: string;
  type: string;
  cellPosition: Cell<CustomProps>;
  movementSpeed?: number;
  customProps?: CustomProps;
}

/**
 * An Entity represents a game object that occupies a cell on the hexagonal grid.
 * It can be a player character, an NPC, or any other object that interacts with the grid.
 * Each entity has a unique ID, a position on the grid, and a 3D model representation.
 */
export interface Entity<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  id: string;
  cellPosition: Cell<CustomProps>;
  model: THREE.Object3D;
  movementSpeed?: number;
}

/**
 * Manager for entity lifecycle
 */
export class EntityManager<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  private entities: Map<string, Entity<CustomProps>> = new Map();
  private entityPositions: Map<string, string[]> = new Map(); // cellId -> entityId[]

  constructor() {}

  addEntity(entityDef: EntityDefinition<CustomProps>): Entity<CustomProps> {
    // Check for duplicate entity ID
    if (this.entities.has(entityDef.id)) {
      throw new Error(`Entity with ID ${entityDef.id} already exists`);
    }

    // Convert EntityDefinition to Entity
    const entity: Entity<CustomProps> = {
      id: entityDef.id,
      cellPosition: entityDef.cellPosition,
      model: {} as THREE.Object3D, // Placeholder for 3D model
      movementSpeed: entityDef.movementSpeed ?? 1, // Default movement speed is 1
    };

    // Store entity in map
    this.entities.set(entityDef.id, entity);

    // Track entity position
    const cellId = this.getCellId(entityDef.cellPosition);
    this.addEntityToPosition(cellId, entityDef.id);

    return entity;
  }

  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      // Clear entity position tracking
      const cellId = this.getCellId(entity.cellPosition);
      this.removeEntityFromPosition(cellId, entityId);

      // Remove entity from map
      this.entities.delete(entityId);
    }
    // Handle removing non-existent entity gracefully (no error thrown)
  }

  getEntity(entityId: string): Entity<CustomProps> | undefined {
    return this.entities.get(entityId);
  }

  getEntitiesAt(cellId: string): Entity<CustomProps>[] {
    const entityIds = this.entityPositions.get(cellId) || [];
    const entities: Entity<CustomProps>[] = [];

    for (const entityId of entityIds) {
      const entity = this.entities.get(entityId);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  moveEntity(entityId: string, newCell: Cell<CustomProps>): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity with ID ${entityId} not found`);
    }

    // Clear old position tracking
    const oldCellId = this.getCellId(entity.cellPosition);
    this.removeEntityFromPosition(oldCellId, entityId);

    // Update entity position
    entity.cellPosition = newCell;

    // Track new position
    const newCellId = this.getCellId(newCell);
    this.addEntityToPosition(newCellId, entityId);
  }

  private getCellId(cell: Cell<CustomProps>): string {
    return `${cell.q},${cell.r}`;
  }

  private addEntityToPosition(cellId: string, entityId: string): void {
    if (!this.entityPositions.has(cellId)) {
      this.entityPositions.set(cellId, []);
    }
    this.entityPositions.get(cellId)!.push(entityId);
  }

  private removeEntityFromPosition(cellId: string, entityId: string): void {
    const entityIds = this.entityPositions.get(cellId);
    if (entityIds) {
      const index = entityIds.indexOf(entityId);
      if (index !== -1) {
        entityIds.splice(index, 1);
      }
      if (entityIds.length === 0) {
        this.entityPositions.delete(cellId);
      }
    }
  }
}
