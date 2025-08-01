// BoardRenderer class for Three.js rendering
// Implementation will go here

import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { HexGrid } from '../core/hexGrid';
import { HexCoordinates } from '../core/coordinates';
import { Cell } from '../core/cell';
import { hexToWorld } from './hexLayout';
import {
  CellColorStrategy,
  DefaultCellColorStrategy,
} from './cellColorStrategy';
import {
  DefaultModelHighlightStrategy,
  ModelHighlightStrategy,
} from './highlightStrategy';
import { CellGroupHighlightStrategy } from './cellGroupHighlightStrategy';
import { BoundaryLineStrategy } from './boundaryLineStrategy';
import { EntityRenderer } from './entityRenderer';

export class BoardRenderer<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  private hexGrid: HexGrid<CustomProps>;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private groundPlane: THREE.Mesh | null = null;
  private hexMeshes: Map<string, THREE.Mesh> = new Map();
  private colorStrategy: CellColorStrategy<CustomProps>;
  private modelHighlightStrategy: ModelHighlightStrategy;
  private cellGroupHighlightStrategy: CellGroupHighlightStrategy;
  private activeGroupHighlights: Map<string, THREE.Object3D> = new Map();
  private entityRenderer?: EntityRenderer<CustomProps>;

  /**
   * Creates a new BoardRenderer for rendering hex grids in 3D.
   *
   * @param hexGrid - The hex grid to render
   * @param colorStrategy - Optional color strategy for cell coloring. Defaults to DefaultCellColorStrategy
   * @param modelHighlightStrategy - Optional model highlight strategy for visual effects. Defaults to DefaultModelHighlightStrategy
   * @param cellGroupHighlightStrategy - Optional cell group highlight strategy. Defaults to BoundaryLineStrategy
   */
  constructor(
    hexGrid: HexGrid<CustomProps>,
    colorStrategy?: CellColorStrategy<CustomProps>,
    modelHighlightStrategy?: ModelHighlightStrategy,
    cellGroupHighlightStrategy?: CellGroupHighlightStrategy
  ) {
    this.hexGrid = hexGrid;
    this.colorStrategy = colorStrategy || new DefaultCellColorStrategy();
    this.modelHighlightStrategy =
      modelHighlightStrategy || new DefaultModelHighlightStrategy();
    this.cellGroupHighlightStrategy =
      cellGroupHighlightStrategy || new BoundaryLineStrategy();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();

    // Initialize the 3D scene with default settings
    this.initializeScene();

    // Initialize orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.configureControls();
  }

  /**
   * Initializes the Three.js scene with default camera, lighting, and settings.
   */
  private initializeScene(): void {
    // Set up camera position and properties
    this.camera.fov = 75;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    // Add default lighting to the scene
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft white light
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Configure renderer settings
    this.renderer.setSize(800, 600);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x87ceeb, 1); // Sky blue background
  }

  /**
   * Configures OrbitControls after they are initialized.
   */
  private configureControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  /**
   * Creates and renders a ground plane for the hex board.
   *
   * @param size - The size of the ground plane (default: 20)
   * @param color - The color of the ground plane (default: 0x808080)
   */
  renderGroundPlane(size: number = 20, color: number = 0x808080): void {
    // Remove existing ground plane if it exists
    if (this.groundPlane) {
      this.scene.remove(this.groundPlane);
      this.groundPlane.geometry.dispose();
      (this.groundPlane.material as THREE.Material).dispose();
    }

    // Create ground plane geometry and material
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshLambertMaterial({ color });

    // Create mesh and position the ground plane appropriately
    this.groundPlane = new THREE.Mesh(geometry, material);
    this.groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.groundPlane.position.y = -0.1; // Slightly below the hex cells
    this.groundPlane.receiveShadow = true;

    // Add ground plane to the scene
    this.scene.add(this.groundPlane);
  }

  /**
   * Gets the color for a hex cell using the configured color strategy.
   *
   * @param cell - The cell to get color for
   * @returns The color as a hexadecimal number
   */
  private getCellColor(cell: Cell<CustomProps>): number {
    return this.colorStrategy.getCellColor(cell);
  }

  /**
   * Renders all hexagonal cells from the HexGrid as 3D objects in the scene.
   */
  renderHexGrid(): void {
    this.hexGrid.getAllCells().forEach((cell) => this.renderHexCell(cell));
  }

  /**
   * Renders a specific hexagonal cell at the given coordinates.
   *
   * @param coordinates - The hex coordinates of the cell to render
   */
  renderHexCell(coordinates: HexCoordinates): void {
    // Get cell data from hex grid
    const cell = this.hexGrid.getCellByCoords(coordinates);
    if (!cell) {
      console.warn(
        `No cell found at coordinates q=${coordinates.q}, r=${coordinates.r}, s=${coordinates.s}`
      );
      return;
    }

    // Create 3D mesh for the cell
    const geometry = new THREE.CylinderGeometry(1.0, 1.0, cell.elevation, 6);
    const material = new THREE.MeshLambertMaterial({
      color: this.getCellColor(cell),
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Store coordinates in mesh for input handling
    mesh.userData.coordinates = coordinates;

    // Position mesh using hexToWorld coordinate conversion
    const worldPos = hexToWorld(coordinates);
    mesh.position.set(worldPos.x, cell.elevation / 2, worldPos.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add mesh to scene and track in hexMeshes map
    const key = this.createCoordinateKey(coordinates);

    // Remove existing mesh if present
    const existingMesh = this.hexMeshes.get(key);
    if (existingMesh) {
      this.scene.remove(existingMesh);
      existingMesh.geometry.dispose();
      (existingMesh.material as THREE.Material).dispose();
    }

    this.hexMeshes.set(key, mesh);
    this.scene.add(mesh);
  }

  /**
   * Removes the rendered mesh for a specific hex cell.
   *
   * @param coordinates - The hex coordinates of the cell to remove
   */
  removeHexCell(coordinates: HexCoordinates): void {
    // Get mesh from hexMeshes map using coordinate key
    const key = this.createCoordinateKey(coordinates);
    const mesh = this.hexMeshes.get(key);

    if (mesh) {
      // Remove mesh from scene
      this.scene.remove(mesh);

      // Clean up mesh geometry and materials
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();

      // Remove from hexMeshes map
      this.hexMeshes.delete(key);
    }
  }

  /**
   * Updates the rendered mesh for a specific hex cell.
   *
   * @param coordinates - The hex coordinates of the cell to update
   */
  updateHexCell(coordinates: HexCoordinates): void {
    // Remove existing mesh if it exists
    this.removeHexCell(coordinates);

    // Render new mesh with updated cell data
    this.renderHexCell(coordinates);
  }

  /**
   * Gets the Three.js renderer instance for mounting in DOM.
   *
   * @returns The WebGL renderer instance
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Gets the Three.js scene instance.
   *
   * @returns The scene instance
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Gets the Three.js camera instance.
   *
   * @returns The camera instance
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Gets the OrbitControls instance.
   *
   * @returns The controls instance
   */
  getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Sets the color strategy used for rendering cell colors.
   *
   * @param strategy - The new color strategy to use
   */
  setColorStrategy(strategy: CellColorStrategy<CustomProps>): void {
    this.colorStrategy = strategy;
  }

  /**
   * Gets the current color strategy being used for cell coloring.
   *
   * @returns The current color strategy instance
   */
  getColorStrategy(): CellColorStrategy<CustomProps> {
    return this.colorStrategy;
  }

  /**
   * Sets the model highlight strategy used for visual effects.
   *
   * @param strategy - The new model highlight strategy to use
   */
  setModelHighlightStrategy(strategy: ModelHighlightStrategy): void {
    this.modelHighlightStrategy = strategy;
  }

  /**
   * Gets the current model highlight strategy being used for visual effects.
   *
   * @returns The current model highlight strategy instance
   */
  getModelHighlightStrategy(): ModelHighlightStrategy {
    return this.modelHighlightStrategy;
  }

  /**
   * Gets the current cell group highlight strategy.
   */
  getCellGroupHighlightStrategy(): CellGroupHighlightStrategy {
    return this.cellGroupHighlightStrategy;
  }

  /**
   * Sets a new cell group highlight strategy.
   */
  setCellGroupHighlightStrategy(strategy: CellGroupHighlightStrategy): void {
    // Clean up existing highlights with old strategy
    this.removeAllHighlightGroups();
    this.cellGroupHighlightStrategy = strategy;
  }

  /**
   * Applies highlight effect to a specific hex cell.
   *
   * @param coordinates - The hex coordinates of the cell to highlight
   */
  highlightHexCell(coordinates: HexCoordinates): void {
    const key = this.createCoordinateKey(coordinates);
    const mesh = this.hexMeshes.get(key);
    if (mesh) {
      this.modelHighlightStrategy.apply(mesh);
    }
  }

  /**
   * Removes highlight effect from a specific hex cell.
   *
   * @param coordinates - The hex coordinates of the cell to remove highlighting from
   */
  removeHighlightFromHexCell(coordinates: HexCoordinates): void {
    const key = this.createCoordinateKey(coordinates);
    const mesh = this.hexMeshes.get(key);
    if (mesh) {
      this.modelHighlightStrategy.remove(mesh);
    }
  }

  /**
   * Highlights multiple hex cells (e.g., for movement destinations).
   *
   * @param coordinatesList - Array of hex coordinates to highlight
   */
  highlightHexCells(coordinatesList: HexCoordinates[]): void {
    coordinatesList.forEach((coordinates) =>
      this.highlightHexCell(coordinates)
    );
  }

  /**
   * Removes highlight effects from multiple hex cells.
   *
   * @param coordinatesList - Array of hex coordinates to remove highlighting from
   */
  removeHighlightFromHexCells(coordinatesList: HexCoordinates[]): void {
    coordinatesList.forEach((coordinates) =>
      this.removeHighlightFromHexCell(coordinates)
    );
  }

  /**
   * Applies highlight effect to an entity model.
   *
   * @param entityModel - The THREE.Object3D representing the entity
   */
  highlightEntity(entityModel: THREE.Object3D): void {
    this.modelHighlightStrategy.apply(entityModel);
  }

  /**
   * Removes highlight effect from an entity model.
   *
   * @param entityModel - The THREE.Object3D representing the entity
   */
  removeHighlightFromEntity(entityModel: THREE.Object3D): void {
    this.modelHighlightStrategy.remove(entityModel);
  }

  /**
   * Creates a group highlight effect for the specified cells.
   * @param groupId - Unique identifier for this highlight group
   * @param cells - Array of cells to highlight as a group
   */
  addHighlightGroup(groupId: string, cells: Cell<CustomProps>[]): void {
    // Remove existing group with same ID if it exists
    this.removeHighlightGroup(groupId);

    // Create new group highlight effect
    const effect = this.cellGroupHighlightStrategy.apply(cells, this.hexGrid);

    // Add to scene and track
    this.scene.add(effect);
    this.activeGroupHighlights.set(groupId, effect);
  }

  /**
   * Removes a group highlight effect.
   * @param groupId - Unique identifier of the highlight group to remove
   */
  removeHighlightGroup(groupId: string): void {
    const effect = this.activeGroupHighlights.get(groupId);
    if (effect) {
      this.cellGroupHighlightStrategy.remove(effect, this.scene);
      this.activeGroupHighlights.delete(groupId);
    }
  }

  /**
   * Removes all active group highlights.
   */
  removeAllHighlightGroups(): void {
    this.activeGroupHighlights.forEach((effect, _groupId) => {
      this.cellGroupHighlightStrategy.remove(effect, this.scene);
    });
    this.activeGroupHighlights.clear();
  }

  /**
   * Sets the EntityRenderer for updating entity models during render.
   *
   * @param entityRenderer - The EntityRenderer instance to use
   */
  setEntityRenderer(entityRenderer: EntityRenderer<CustomProps>): void {
    this.entityRenderer = entityRenderer;
  }

  /**
   * Renders the current frame.
   */
  async render(): Promise<void> {
    this.controls.update();

    // Update entity models if EntityRenderer is available
    if (this.entityRenderer) {
      await this.entityRenderer.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Sets the size of the renderer and updates camera aspect ratio.
   *
   * @param width - The width of the renderer
   * @param height - The height of the renderer
   */
  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Cleans up resources and removes all meshes from the scene.
   */
  dispose(): void {
    // Remove all hex meshes from scene and dispose geometries/materials
    for (const [, mesh] of this.hexMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.hexMeshes.clear();

    // Remove ground plane if it exists
    if (this.groundPlane) {
      this.scene.remove(this.groundPlane);
      this.groundPlane.geometry.dispose();
      (this.groundPlane.material as THREE.Material).dispose();
      this.groundPlane = null;
    }

    // Dispose controls
    this.controls.dispose();

    // Dispose renderer resources
    this.renderer.dispose();
  }

  /**
   * Creates a coordinate key string for use in the hexMeshes map.
   *
   * @param coordinates - The hex coordinates
   * @returns A string key in format "q,r"
   */
  private createCoordinateKey(coordinates: HexCoordinates): string {
    return `${coordinates.q},${coordinates.r}`;
  }
}
