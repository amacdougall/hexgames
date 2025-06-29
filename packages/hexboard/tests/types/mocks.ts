/// <reference lib="dom" />

// TypeScript interfaces for test mocks to avoid using 'any'

export interface MockWebGLRenderer {
  setSize: jest.Mock;
  render: jest.Mock;
  dispose: jest.Mock;
  setClearColor: jest.Mock;
  domElement: HTMLCanvasElement;
  shadowMap: {
    enabled: boolean;
    type: number;
  };
}

export interface MockScene {
  add: jest.Mock;
  remove: jest.Mock;
}

export interface MockCamera {
  position: { set: jest.Mock };
  lookAt: jest.Mock;
}

export interface MockOrbitControls {
  update: jest.Mock;
  dispose: jest.Mock;
}

export interface MockObject3D {
  clone: jest.Mock;
  position: { set: jest.Mock };
  rotation?: { set: jest.Mock };
}

export interface MockEntityManager {
  getAllEntities: jest.Mock;
}

export interface MockModelRegistry {
  registerModel: jest.Mock;
  createModelInstance: jest.Mock;
}

export interface MockColorStrategy {
  getCellColor: jest.Mock;
}

// Helper function to create typed mock objects
export function createMockObject3D(): MockObject3D {
  return {
    clone: jest.fn().mockReturnThis(),
    position: { set: jest.fn() },
    rotation: { set: jest.fn() },
  };
}

export function createMockScene(): MockScene {
  return {
    add: jest.fn(),
    remove: jest.fn(),
  };
}

export function createMockRenderer(): MockWebGLRenderer {
  return {
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    setClearColor: jest.fn(),
    domElement: document.createElement('canvas') as HTMLCanvasElement,
    shadowMap: {
      enabled: false,
      type: 2,
    },
  };
}
