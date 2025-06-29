/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Test setup for browser-based game testing
// jsdom environment provides most browser globals, but we add some enhancements

// Type declarations for Node.js globals in test environment
declare global {
  var global: typeof globalThis;
}

// Enhanced performance timing for jsdom
if (!globalThis.performance) {
  globalThis.performance = {
    now: (): number => Date.now(),
    mark: (): void => {},
    measure: (): void => {},
    getEntriesByName: (): PerformanceEntryList => [],
    getEntriesByType: (): PerformanceEntryList => [],
    clearMarks: (): void => {},
    clearMeasures: (): void => {},
    timeOrigin: Date.now(),
    toJSON: (): string => '{}',
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
    dispatchEvent: (): boolean => true,
  } as unknown as Performance;
}

// Mock requestAnimationFrame for Three.js compatibility
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (
    callback: FrameRequestCallback
  ): number => {
    return setTimeout(callback, 16);
  };
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };
}

export {};
