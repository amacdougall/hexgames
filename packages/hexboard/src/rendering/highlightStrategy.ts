import * as THREE from 'three';

/**
 * Interface for strategies that apply visual highlights to 3D objects.
 * This allows applications to define custom highlighting behavior.
 */
export interface HighlightStrategy {
  /**
   * Apply a highlight effect to the given 3D object.
   * @param object The THREE.Object3D to highlight
   */
  apply(object: THREE.Object3D): void;

  /**
   * Remove the highlight effect from the given 3D object.
   * @param object The THREE.Object3D to remove highlighting from
   */
  remove(object: THREE.Object3D): void;
}

/**
 * Default implementation of HighlightStrategy that applies a yellow emissive glow.
 * This strategy traverses the object hierarchy and modifies the emissive property
 * of all materials found, storing the original state for restoration.
 */
export class DefaultHighlightStrategy implements HighlightStrategy {
  private originalStates = new WeakMap<THREE.Material, { emissive: number }>();

  /**
   * Apply a yellow emissive glow to all materials in the object hierarchy.
   * @param object The THREE.Object3D to highlight
   */
  apply(object: THREE.Object3D): void {
    object.traverse((child) => {
      // Check if the child has a material property (could be Mesh or similar)
      const meshLike = child as THREE.Object3D & { material?: unknown };
      if (meshLike.material) {
        const material = meshLike.material as THREE.Material & {
          emissive?: { setHex: (color: number) => void; getHex?: () => number };
        };

        if (material.emissive) {
          // Store original emissive color if not already stored
          if (!this.originalStates.has(material)) {
            const originalColor = material.emissive.getHex
              ? material.emissive.getHex()
              : 0x000000;
            this.originalStates.set(material, { emissive: originalColor });
          }

          // Apply yellow highlight
          material.emissive.setHex(0xffff00);
        }
      }
    });
  }

  /**
   * Remove the highlight effect and restore original material properties.
   * @param object The THREE.Object3D to remove highlighting from
   */
  remove(object: THREE.Object3D): void {
    object.traverse((child) => {
      // Check if the child has a material property (could be Mesh or similar)
      const meshLike = child as THREE.Object3D & { material?: unknown };
      if (meshLike.material) {
        const material = meshLike.material as THREE.Material & {
          emissive?: { setHex: (color: number) => void };
        };

        if (material.emissive) {
          // Restore original emissive color
          const originalState = this.originalStates.get(material);
          const originalColor = originalState
            ? originalState.emissive
            : 0x000000;
          material.emissive.setHex(originalColor);
        }
      }
    });
  }
}
