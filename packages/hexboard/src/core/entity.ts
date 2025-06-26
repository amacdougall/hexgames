// Entity definitions and interfaces
// Implementation will go here

import * as THREE from 'three';
import { Cell } from './cell';

/**
 * An Entity represents a game object that occupies a cell on the hexagonal grid.
 * It can be a player character, an NPC, or any other object that interacts with the grid.
 * Each entity has a unique ID, a position on the grid, and a 3D model representation.
 */
export interface Entity<CustomProps extends Record<string, any> = {}> {
  id: string;
  cellPosition: Cell<CustomProps>;
  model: THREE.Object3D;
  movementSpeed?: number;
}
