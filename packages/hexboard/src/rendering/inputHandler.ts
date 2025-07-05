import * as THREE from 'three';
import { HexCoordinates } from '../core/coordinates';

export class InputHandler<_T extends object> {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isInitialized = false;

  // Event callbacks that emit hex coordinates
  public onCellClick?: (coords: HexCoordinates) => void;
  public onCellHover?: (coords: HexCoordinates | null) => void;

  // Phase 2: Hover state tracking
  private hoveredHex: HexCoordinates | null = null;

  // Event handler references for cleanup
  private boundClickHandler?: (event: MouseEvent) => void;
  private boundMouseMoveHandler?: (event: MouseEvent) => void;

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public initialize(): void {
    if (this.isInitialized) {
      return; // Prevent duplicate listeners
    }

    const canvas = this.renderer.domElement;

    // Create bound handlers for proper cleanup
    this.boundClickHandler = this.handleClick.bind(this);
    this.boundMouseMoveHandler = this.handleMouseMove.bind(this);

    canvas.addEventListener('click', this.boundClickHandler);
    canvas.addEventListener('mousemove', this.boundMouseMoveHandler);

    this.isInitialized = true;
  }

  public dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    const canvas = this.renderer.domElement;

    if (this.boundClickHandler) {
      canvas.removeEventListener('click', this.boundClickHandler);
    }

    if (this.boundMouseMoveHandler) {
      canvas.removeEventListener('mousemove', this.boundMouseMoveHandler);
    }

    this.boundClickHandler = undefined;
    this.boundMouseMoveHandler = undefined;
    this.isInitialized = false;
  }

  private handleClick(event: MouseEvent): void {
    console.log('InputHandler.handleCellClick()');
    try {
      this.updateMousePosition(event);
      const coordinates = this.getIntersectedHexCoordinates();

      if (coordinates && this.onCellClick) {
        this.onCellClick(coordinates);
      }
    } catch (error) {
      // Silently handle raycasting errors to prevent crashes
      console.warn('InputHandler: Error during click handling:', error);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    try {
      this.updateMousePosition(event);
      const coordinates = this.getIntersectedHexCoordinates();

      // Check if hover state has changed
      if (!this.areCoordinatesEqual(coordinates, this.hoveredHex)) {
        this.hoveredHex = coordinates;

        if (this.onCellHover) {
          this.onCellHover(coordinates);
        }
      }
    } catch (error) {
      // Silently handle raycasting errors to prevent crashes
      console.warn('InputHandler: Error during mouse move handling:', error);
    }
  }

  private updateMousePosition(event: MouseEvent): void {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    // Handle zero-dimension canvas gracefully
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;

    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    this.mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

    // Clamp values to prevent extreme coordinates that could cause raycaster issues
    this.mouse.x = Math.max(-1, Math.min(1, this.mouse.x));
    this.mouse.y = Math.max(-1, Math.min(1, this.mouse.y));
  }

  private getIntersectedHexCoordinates(): HexCoordinates | null {
    // Configure raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Find intersected objects
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );

    if (intersects.length === 0) {
      return null;
    }

    // Get the first (closest) intersection
    const intersection = intersects[0];
    const mesh = intersection.object;

    // Check if the mesh has coordinate data
    if (
      mesh.userData &&
      this.isValidHexCoordinates(mesh.userData.coordinates)
    ) {
      return mesh.userData.coordinates as HexCoordinates;
    }

    return null;
  }

  private isValidHexCoordinates(coords: unknown): coords is HexCoordinates {
    return Boolean(
      coords &&
        typeof coords === 'object' &&
        coords !== null &&
        'q' in coords &&
        'r' in coords &&
        's' in coords &&
        typeof (coords as HexCoordinates).q === 'number' &&
        typeof (coords as HexCoordinates).r === 'number' &&
        typeof (coords as HexCoordinates).s === 'number'
    );
  }

  private areCoordinatesEqual(
    a: HexCoordinates | null,
    b: HexCoordinates | null
  ): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.q === b.q && a.r === b.r && a.s === b.s;
  }

  // For testing: expose raycaster
  public getRaycaster(): THREE.Raycaster {
    return this.raycaster;
  }
}
