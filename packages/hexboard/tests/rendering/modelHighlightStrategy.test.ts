/// <reference lib="dom" />

import {
  DefaultModelHighlightStrategy,
  ModelHighlightStrategy,
} from '../../src/rendering/highlightStrategy';

describe('ModelHighlightStrategy', () => {
  it('should be available as renamed interface from HighlightStrategy', () => {
    // Test that ModelHighlightStrategy interface exists
    const strategy: ModelHighlightStrategy =
      new DefaultModelHighlightStrategy();

    // Test that it has the same method signatures as current HighlightStrategy
    expect(typeof strategy.apply).toBe('function');
    expect(typeof strategy.remove).toBe('function');

    // Verify method signatures match expected interface
    expect(strategy.apply).toHaveProperty('length', 1); // single parameter
    expect(strategy.remove).toHaveProperty('length', 1); // single parameter
  });
});

describe('DefaultModelHighlightStrategy', () => {
  let strategy: DefaultModelHighlightStrategy;

  beforeEach(() => {
    strategy = new DefaultModelHighlightStrategy();
  });

  it('should be available as renamed class from DefaultHighlightStrategy', () => {
    // Test that DefaultModelHighlightStrategy class exists
    expect(strategy).toBeInstanceOf(DefaultModelHighlightStrategy);

    // Test that it maintains the same behavior as current DefaultHighlightStrategy
    expect(strategy).toHaveProperty('apply');
    expect(strategy).toHaveProperty('remove');
  });

  it('should apply highlighting to THREE.Object3D models', () => {
    const mockObject = {
      traverse: jest.fn(),
    } as any;

    // Test the apply() method with a mock THREE.Object3D
    expect(() => strategy.apply(mockObject)).not.toThrow();

    // Verify traverse was called (based on existing DefaultHighlightStrategy behavior)
    expect(mockObject.traverse).toHaveBeenCalled();
  });

  it('should remove highlighting from THREE.Object3D models', () => {
    const mockObject = {
      traverse: jest.fn(),
    } as any;

    // Apply highlighting first
    strategy.apply(mockObject);

    // Test the remove() method restores original materials
    expect(() => strategy.remove(mockObject)).not.toThrow();

    // Verify traverse was called for removal
    expect(mockObject.traverse).toHaveBeenCalledTimes(2); // Once for apply, once for remove
  });

  it('should handle null or undefined objects gracefully', () => {
    // Test edge cases
    expect(() => strategy.apply(null as any)).not.toThrow();
    expect(() => strategy.remove(null as any)).not.toThrow();
    expect(() => strategy.apply(undefined as any)).not.toThrow();
    expect(() => strategy.remove(undefined as any)).not.toThrow();
  });

  it('should be able to apply and remove multiple times', () => {
    const mockObject = {
      traverse: jest.fn(),
    } as any;

    // Test idempotent behavior
    expect(() => {
      strategy.apply(mockObject);
      strategy.apply(mockObject); // Apply twice
      strategy.remove(mockObject);
      strategy.remove(mockObject); // Remove twice
    }).not.toThrow();

    // Should have called traverse 4 times
    expect(mockObject.traverse).toHaveBeenCalledTimes(4);
  });
});
