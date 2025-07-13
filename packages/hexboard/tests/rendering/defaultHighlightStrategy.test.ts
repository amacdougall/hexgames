/// <reference lib="dom" />

// Mock THREE.js materials and objects
jest.mock('three', () => ({
  Object3D: jest.fn().mockImplementation(() => ({
    traverse: jest.fn(),
  })),
  Mesh: jest.fn().mockImplementation(() => ({
    material: {
      emissive: { setHex: jest.fn() },
      clone: jest.fn().mockReturnThis(),
    },
    traverse: jest.fn(),
  })),
  MeshStandardMaterial: jest.fn().mockImplementation(() => ({
    emissive: { setHex: jest.fn() },
    clone: jest.fn().mockReturnThis(),
  })),
}));

import * as THREE from 'three';
import { DefaultHighlightStrategy } from '../../src/rendering/highlightStrategy';

// Mock material for testing
class MockMaterial {
  emissive = { setHex: jest.fn() };
  clone = jest.fn().mockReturnThis();
}

// Mock mesh for testing
class MockMesh {
  material = new MockMaterial();
  traverse = jest.fn((callback: (obj: any) => void) => {
    callback(this);
  });
}

describe('DefaultHighlightStrategy', () => {
  let strategy: DefaultHighlightStrategy;
  let mockObject: THREE.Object3D;
  let mockMesh: MockMesh;

  beforeEach(() => {
    strategy = new DefaultHighlightStrategy();
    mockMesh = new MockMesh();
    mockObject = {
      traverse: jest.fn((callback: (obj: any) => void) => {
        callback(mockMesh);
      }),
    } as unknown as THREE.Object3D;
    jest.clearAllMocks();
  });

  describe('apply', () => {
    it("should apply an emissive glow to an object's material", () => {
      strategy.apply(mockObject);

      expect(mockObject.traverse).toHaveBeenCalled();
      expect(mockMesh.material.emissive.setHex).toHaveBeenCalledWith(0xffff00); // Yellow glow
    });

    it('should store the original material state for later restoration', () => {
      strategy.apply(mockObject);

      // Apply highlighting again to test that original state is preserved
      strategy.apply(mockObject);

      // The material should still have the highlight color
      expect(mockMesh.material.emissive.setHex).toHaveBeenCalledWith(0xffff00);
    });

    it('should handle objects without materials gracefully', () => {
      const mockObjectWithoutMaterial = {
        traverse: jest.fn((callback: (obj: any) => void) => {
          callback({ material: undefined });
        }),
      } as unknown as THREE.Object3D;

      expect(() => {
        strategy.apply(mockObjectWithoutMaterial);
      }).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should store the original material state and restore it on removal', () => {
      // Apply highlight first
      strategy.apply(mockObject);

      // Reset the mock to track removal calls
      jest.clearAllMocks();

      // Remove highlight
      strategy.remove(mockObject);

      expect(mockObject.traverse).toHaveBeenCalled();
      // Should restore to original color (0x000000 - black/no emissive)
      expect(mockMesh.material.emissive.setHex).toHaveBeenCalledWith(0x000000);
    });

    it('should handle removal without prior application gracefully', () => {
      expect(() => {
        strategy.remove(mockObject);
      }).not.toThrow();

      expect(mockObject.traverse).toHaveBeenCalled();
    });

    it('should handle objects without materials gracefully during removal', () => {
      const mockObjectWithoutMaterial = {
        traverse: jest.fn((callback: (obj: any) => void) => {
          callback({ material: undefined });
        }),
      } as unknown as THREE.Object3D;

      expect(() => {
        strategy.remove(mockObjectWithoutMaterial);
      }).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should support multiple apply/remove cycles', () => {
      // Apply and remove multiple times
      strategy.apply(mockObject);
      strategy.remove(mockObject);
      strategy.apply(mockObject);
      strategy.remove(mockObject);

      // Should not throw and should work correctly
      expect(mockObject.traverse).toHaveBeenCalledTimes(4);
    });

    it('should handle multiple objects independently', () => {
      const mockMesh2 = new MockMesh();
      const mockObject2 = {
        traverse: jest.fn((callback: (obj: any) => void) => {
          callback(mockMesh2);
        }),
      } as unknown as THREE.Object3D;

      // Apply to both objects
      strategy.apply(mockObject);
      strategy.apply(mockObject2);

      // Both should be highlighted
      expect(mockMesh.material.emissive.setHex).toHaveBeenCalledWith(0xffff00);
      expect(mockMesh2.material.emissive.setHex).toHaveBeenCalledWith(0xffff00);

      // Remove from first object only
      strategy.remove(mockObject);

      // First should be restored, second should remain highlighted
      expect(mockMesh.material.emissive.setHex).toHaveBeenLastCalledWith(
        0x000000
      );
      expect(mockMesh2.material.emissive.setHex).toHaveBeenLastCalledWith(
        0xffff00
      );
    });
  });
});
