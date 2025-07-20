import * as THREE from 'three';
import { EntityManager } from '../core/entity';
import { ModelRegistry } from './modelRegistry';
import { hexToWorld } from './layout';

/**
 * Manages the 3D rendering of entities in the hexagonal grid.
 * This class bridges the gap between the core entity system and the 3D rendering layer.
 * It observes entities from the EntityManager and manages their corresponding 3D models in the scene.
 */
export class EntityRenderer<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  private entityManager: EntityManager<CustomProps>;
  private scene: THREE.Scene;
  private modelRegistry: ModelRegistry;
  private entityModels = new Map<string, THREE.Object3D>();

  /**
   * Creates a new EntityRenderer.
   * @param entityManager - The entity manager to observe for entity changes
   * @param scene - The THREE.js scene to add/remove models from
   * @param modelRegistry - Registry for creating 3D model instances
   */
  constructor(
    entityManager: EntityManager<CustomProps>,
    scene: THREE.Scene,
    modelRegistry: ModelRegistry
  ) {
    this.entityManager = entityManager;
    this.scene = scene;
    this.modelRegistry = modelRegistry;
  }

  /**
   * Updates the 3D representation of all entities.
   * This method should be called in the main render loop.
   * It handles:
   * - Creating models for new entities with modelKey
   * - Updating positions of existing entity models
   * - Removing models for entities that no longer exist
   */
  async update(): Promise<void> {
    const allEntities = this.entityManager.getAllEntities();
    const renderedEntityIds = new Set(this.entityModels.keys());

    // Process each entity
    for (const entity of allEntities) {
      if (this.entityModels.has(entity.id) && entity.modelKey) {
        // Entity already has a model, update its position
        const model = this.entityModels.get(entity.id)!;
        this.setEntityPosition(model, entity.cellPosition, entity.modelKey);
      } else if (entity.modelKey) {
        // New entity with a model key, create and add its model
        try {
          const model = await this.modelRegistry.createModelInstance(
            entity.modelKey
          );
          this.entityModels.set(entity.id, model);
          this.scene.add(model);

          // Position the model so its bottom sits on the tile's top surface
          this.setEntityPosition(model, entity.cellPosition, entity.modelKey);
        } catch (error) {
          // Handle model creation errors gracefully
          console.warn(
            `Failed to create model for entity ${entity.id}:`,
            error
          );
        }
      }

      // Mark this entity as processed
      renderedEntityIds.delete(entity.id);
    }

    // Remove models for entities that no longer exist
    renderedEntityIds.forEach((entityId) => {
      const model = this.entityModels.get(entityId)!;
      this.scene.remove(model);
      this.entityModels.delete(entityId);
    });
  }

  /**
   * Positions an entity model so its bottom sits on the top surface of the tile.
   * This ensures entities appear to be standing on the hex tiles rather than floating
   * or being buried in them.
   * @param model - The THREE.Object3D representing the entity
   * @param cellPosition - The hex coordinates and elevation of the cell
   * @param modelKey - The model key to look up cached metadata
   */
  private setEntityPosition(
    model: THREE.Object3D,
    cellPosition: { q: number; r: number; s: number; elevation: number },
    modelKey: string
  ): void {
    const worldPos = hexToWorld(cellPosition);

    // Calculate the tile's top surface height
    // Tiles are cylinders positioned at elevation/2 with height=elevation
    // So top surface is at: (elevation/2) + (elevation/2) = elevation
    const tileTopHeight = cellPosition.elevation;

    // Get cached model metadata to avoid expensive bounding box calculation
    const metadata = this.modelRegistry.getModelMetadata(modelKey);
    const modelBottomOffset = metadata?.bottomOffset ?? 0;

    // Position the model so its bottom sits on the tile's top surface
    // We subtract the model's bottom offset because it might be negative
    const entityY = tileTopHeight - modelBottomOffset;

    model.position.set(worldPos.x, entityY, worldPos.z);
  }

  /**
   * Gets the 3D model for a specific entity.
   * @param entityId - The ID of the entity
   * @returns The THREE.Object3D representing the entity, or undefined if not found
   */
  getEntityModel(entityId: string): THREE.Object3D | undefined {
    return this.entityModels.get(entityId);
  }

  /**
   * Disposes of the EntityRenderer, cleaning up all entity models from the scene.
   * Should be called when the EntityRenderer is no longer needed.
   */
  dispose(): void {
    // Remove all entity models from the scene
    this.entityModels.forEach((model) => {
      this.scene.remove(model);
    });

    // Clear the entity models map
    this.entityModels.clear();
  }
}
