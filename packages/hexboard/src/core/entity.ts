import * as THREE from 'three';
import { Cell } from './cell';
import { HexCoordinates } from './coordinates';

/**
 * Definition for creating an entity.
 * This represents the data needed to create an entity in the game world.
 */
export interface EntityDefinition<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  id: string;
  type: string;
  cellPosition: Cell<CustomProps>;
  movementSpeed?: number;
  customProps?: CustomProps;
  modelKey?: string; // Optional reference to a 3D model in the ModelRegistry
}

/**
 * An Entity represents a game object that occupies a cell on the hexagonal grid.
 * It can be a player character, an NPC, or any other object that interacts with the grid.
 * Each entity has a unique ID, a position on the grid, and optional model key for 3D rendering.
 */
export interface Entity<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  id: string;
  cellPosition: Cell<CustomProps>;
  model: THREE.Object3D; // TODO: This will be removed in a future update in favor of modelKey
  movementSpeed?: number;
  modelKey?: string; // Optional reference to a 3D model in the ModelRegistry
  isInMovementMode: boolean; // Indicates if the entity is in movement mode
}

/**
 * Manager for entity lifecycle
 */
export class EntityManager<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  private entities: Map<string, Entity<CustomProps>> = new Map();
  private entityPositions: Map<string, string[]> = new Map(); // cellId -> entityId[]
  private movementSessions: Map<string, HexCoordinates[]> = new Map(); // entityId -> available destinations

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
      model: {} as THREE.Object3D, // Placeholder for 3D model (deprecated)
      movementSpeed: entityDef.movementSpeed ?? 1, // Default movement speed is 1
      modelKey: entityDef.modelKey, // Copy model key for rendering layer
      isInMovementMode: false, // Initialize movement mode to false
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

      // Clear any movement session
      this.movementSessions.delete(entityId);

      // Remove entity from map
      this.entities.delete(entityId);
    }
    // Handle removing non-existent entity gracefully (no error thrown)
  }

  getEntity(entityId: string): Entity<CustomProps> | undefined {
    return this.entities.get(entityId);
  }

  getAllEntities(): Entity<CustomProps>[] {
    return Array.from(this.entities.values());
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

  /**
   * Starts a movement session for an entity, allowing it to move to specified destinations.
   * Sets the entity's isInMovementMode to true and stores the available destinations.
   *
   * @param entityId The ID of the entity to start movement for
   * @param availableDestinations Array of coordinates the entity can move to
   * @throws Error if the entity is not found
   */
  startMovement(
    entityId: string,
    availableDestinations: HexCoordinates[]
  ): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity with ID ${entityId} not found`);
    }

    // Set entity to movement mode
    entity.isInMovementMode = true;

    // Store available destinations
    this.movementSessions.set(entityId, availableDestinations);
  }

  /**
   * Cancels the movement session for an entity, setting its isInMovementMode to false
   * and clearing any stored destination coordinates.
   *
   * @param entityId The ID of the entity to cancel movement for
   */
  cancelMovement(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.isInMovementMode = false;
      this.movementSessions.delete(entityId);
    }
    // Gracefully handle non-existent entities (no error thrown)
  }

  moveEntity(entityId: string, newCell: Cell<CustomProps>): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity with ID ${entityId} not found`);
    }

    // Check if entity is in movement mode
    if (!entity.isInMovementMode) {
      throw new Error(`Entity ${entityId} is not in movement mode`);
    }

    // Get available destinations for this entity
    const destinations = this.movementSessions.get(entityId);
    if (!destinations) {
      throw new Error(`No movement session found for entity ${entityId}`);
    }

    // Check if destination is valid
    const isValidDestination = destinations.some(
      (dest) =>
        dest.q === newCell.q && dest.r === newCell.r && dest.s === newCell.s
    );

    if (!isValidDestination) {
      throw new Error(
        'Destination cell is not in the list of available destinations'
      );
    }

    // Clear old position tracking
    const oldCellId = this.getCellId(entity.cellPosition);
    this.removeEntityFromPosition(oldCellId, entityId);

    // Update entity position
    entity.cellPosition = newCell;

    // Track new position
    const newCellId = this.getCellId(newCell);
    this.addEntityToPosition(newCellId, entityId);

    // Exit movement mode
    entity.isInMovementMode = false;
    this.movementSessions.delete(entityId);
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
