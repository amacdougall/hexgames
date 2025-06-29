import * as THREE from 'three';
import { EntityManager } from '../core/entity';
import { ModelRegistry } from './modelRegistry';
import { hexToWorld } from './layout';

/**
 * Manages the 3D rendering of entities in the hexagonal grid.
 * This class bridges the gap between the core entity system and the 3D rendering layer.
 * It observes entities from the EntityManager and manages their corresponding 3D models in the scene.
 */
export class EntityRenderer {
  private entityManager: EntityManager;
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
    entityManager: EntityManager,
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
      if (this.entityModels.has(entity.id)) {
        // Entity already has a model, update its position
        const model = this.entityModels.get(entity.id)!;
        const worldPos = hexToWorld(entity.cellPosition);
        model.position.set(
          worldPos.x,
          entity.cellPosition.elevation,
          worldPos.z
        );
      } else if (entity.modelKey) {
        // New entity with a model key, create and add its model
        try {
          const model = await this.modelRegistry.createModelInstance(
            entity.modelKey
          );
          this.entityModels.set(entity.id, model);
          this.scene.add(model);

          // Position the model at the entity's location
          const worldPos = hexToWorld(entity.cellPosition);
          model.position.set(
            worldPos.x,
            entity.cellPosition.elevation,
            worldPos.z
          );
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
}
