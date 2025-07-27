import * as THREE from 'three';
import { CellGroupHighlightStrategy } from './cellGroupHighlightStrategy';
import { Cell } from '../core/cell';
import { HexGrid } from '../core/hexGrid';
import { getHexFaceVertices } from './hexGeometry';
// Direction is used via BoundaryMap in grid.findBoundaryFaces
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Direction } from '../core/types';

/**
 * Default implementation of CellGroupHighlightStrategy that draws white boundary lines
 * around the exterior edges of a cell group selection.
 */
export class BoundaryLineStrategy implements CellGroupHighlightStrategy {
  private readonly lineColor: THREE.Color;
  private readonly lineWidth: number;

  constructor(
    lineColor: THREE.Color = new THREE.Color(0xffffff),
    lineWidth: number = 2
  ) {
    this.lineColor = lineColor;
    this.lineWidth = lineWidth;
  }

  apply<T extends Record<string, unknown>>(
    cells: Cell<T>[],
    grid: HexGrid<T>
  ): THREE.Object3D {
    const group = new THREE.Group();

    // Handle empty input
    if (cells.length === 0) {
      return group;
    }

    // Get boundary faces for the cell group
    const boundaryMap = grid.findBoundaryFaces(cells);

    // Create line geometry for each boundary face
    boundaryMap.forEach((directions, cellId) => {
      const cell = grid.getCellById(cellId);
      if (!cell) return;

      directions.forEach((direction) => {
        const vertices = getHexFaceVertices(cell, direction);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(vertices);

        const lineMaterial = new THREE.LineBasicMaterial({
          color: this.lineColor,
          linewidth: this.lineWidth,
        });

        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      });
    });

    return group;
  }

  remove(effect: THREE.Object3D, scene: THREE.Scene): void {
    if (!effect) return;

    // Remove from scene
    scene.remove(effect);

    // Dispose of all geometries and materials in the effect
    effect.traverse((child) => {
      // Use duck typing instead of instanceof for better test compatibility
      const hasGeometry =
        child && typeof child === 'object' && 'geometry' in child;
      const hasMaterial =
        child && typeof child === 'object' && 'material' in child;

      if (hasGeometry || hasMaterial) {
        // Dispose geometry
        if (hasGeometry) {
          const childWithGeometry = child as {
            geometry?: { dispose?: () => void };
          };
          if (childWithGeometry.geometry?.dispose) {
            childWithGeometry.geometry.dispose();
          }
        }

        // Dispose material(s)
        if (hasMaterial) {
          const childWithMaterial = child as { material?: unknown };
          const material = childWithMaterial.material;
          if (Array.isArray(material)) {
            material.forEach((mat: { dispose?: () => void }) =>
              mat.dispose?.()
            );
          } else if (
            material &&
            typeof material === 'object' &&
            'dispose' in material
          ) {
            const materialWithDispose = material as { dispose: () => void };
            materialWithDispose.dispose();
          }
        }
      }
    });

    // Clear the group
    if (
      effect &&
      typeof effect === 'object' &&
      'clear' in effect &&
      typeof (effect as { clear?: unknown }).clear === 'function'
    ) {
      const effectWithClear = effect as { clear: () => void };
      effectWithClear.clear();
    }
  }
}
