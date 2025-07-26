import * as THREE from 'three';
import { Cell } from '../core/cell';
import { HexGrid } from '../core/hexGrid';

/**
 * Strategy interface for creating visual effects based on a logical group of cells.
 * Unlike ModelHighlightStrategy, this operates on Cell data to create new THREE.Object3D effects.
 */
export interface CellGroupHighlightStrategy {
  /**
   * Creates a new visual effect for the given group of cells.
   * @param cells - Array of cells to create an effect for
   * @param grid - HexGrid containing the cells, used for spatial calculations
   * @returns A THREE.Object3D representing the visual effect
   */
  apply<T extends Record<string, unknown>>(
    cells: Cell<T>[],
    grid: HexGrid<T>
  ): THREE.Object3D;

  /**
   * Removes and properly disposes of a visual effect created by apply().
   * @param effect - The THREE.Object3D returned by apply()
   * @param scene - The THREE.Scene to remove the effect from
   */
  remove(effect: THREE.Object3D, scene: THREE.Scene): void;
}
