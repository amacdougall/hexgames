import { HexGrid } from './core/hexGrid';
import { Cell, CellDefinition } from './core/cell';
import { HexCoordinates } from './core/coordinates';
import { BoardRenderer } from './rendering/boardRenderer';
import { InputHandler } from './rendering/inputHandler';
import {
  CellColorStrategy,
  DefaultCellColorStrategy,
} from './rendering/cellColorStrategy';

export class HexBoard<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  private hexGrid: HexGrid<CustomProps>;
  private renderer?: BoardRenderer<CustomProps>;
  private inputHandler?: InputHandler<CustomProps>;
  private container?: HTMLElement;
  private isInitialized = false;
  private colorStrategy?: CellColorStrategy<CustomProps>;

  constructor(colorStrategy?: CellColorStrategy<CustomProps>) {
    this.hexGrid = new HexGrid<CustomProps>();
    this.colorStrategy = colorStrategy;
  }

  public async init(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container with id '${containerId}' not found`);
      return;
    }

    this.container = container;

    // Create renderer with provided color strategy or default
    const colorStrategy =
      this.colorStrategy || new DefaultCellColorStrategy<CustomProps>();
    this.renderer = new BoardRenderer(this.hexGrid, colorStrategy);

    // Set up renderer size
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.renderer.setSize(width, height);

    // Add renderer to DOM
    container.appendChild(this.renderer.getRenderer().domElement);

    // Create and initialize input handler
    this.inputHandler = new InputHandler<CustomProps>(
      this.renderer.getRenderer(),
      this.renderer.getCamera(),
      this.renderer.getScene()
    );

    // Connect input events to game logic
    this.inputHandler.onCellClick = this.handleCellClick.bind(this);
    this.inputHandler.onCellHover = this.handleCellHover.bind(this);

    // Initialize input handling
    this.inputHandler.initialize();

    // Start render loop
    this.startRenderLoop();

    this.isInitialized = true;
  }

  public dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    // Clean up input handler
    if (this.inputHandler) {
      this.inputHandler.dispose();
      this.inputHandler = undefined;
    }

    // Clean up renderer
    if (this.renderer) {
      this.renderer.dispose();

      // Remove canvas from DOM
      if (this.container && this.renderer.getRenderer().domElement.parentNode) {
        this.container.removeChild(this.renderer.getRenderer().domElement);
      }

      this.renderer = undefined;
    }

    this.container = undefined;
    this.isInitialized = false;
  }

  // Core hex grid methods
  public setCellAtCoords(coords: HexCoordinates, cellProps: CustomProps): void {
    const cellDefinition: CellDefinition<CustomProps> = {
      q: coords.q,
      r: coords.r,
      s: coords.s,
      customProps: cellProps,
    };

    // Remove existing cell if present
    if (this.hexGrid.hasCellAtCoords(coords)) {
      this.hexGrid.removeCellByCoords(coords);
    }

    this.hexGrid.addCell(cellDefinition);

    // Re-render the specific cell if renderer is available
    if (this.renderer) {
      this.renderer.renderHexCell(coords);
    }
  }

  public getCellAtCoords(
    coords: HexCoordinates
  ): Cell<CustomProps> | undefined {
    const cell = this.hexGrid.getCellByCoords(coords);
    return cell || undefined;
  }

  public hasCellAtCoords(coords: HexCoordinates): boolean {
    return this.hexGrid.hasCellAtCoords(coords);
  }

  public getAllCells(): Cell<CustomProps>[] {
    return this.hexGrid.getAllCells();
  }

  // Rendering methods
  public renderAll(): void {
    if (this.renderer) {
      this.renderer.renderHexGrid();
    } else {
      console.log("HexBoard.renderAll(): no renderer!")
    }
  }

  // Input event handlers
  private handleCellClick(coords: HexCoordinates): void {
    // Basic click handling - log for now, can be extended
    console.log('Cell clicked:', coords);

    // Get the cell data for potential game logic
    const cell = this.getCellAtCoords(coords);
    if (cell) {
      console.log('Cell data:', {
        elevation: cell.elevation,
        movementCost: cell.movementCost,
        isImpassable: cell.isImpassable,
        customProps: cell.customProps,
      });
    } else {
      console.log('No cell found at coordinates');
    }
  }

  private handleCellHover(coords: HexCoordinates | null): void {
    // Basic hover handling - log for now, can be extended for visual feedback
    if (coords) {
      console.log('Cell hovered:', coords);
    } else {
      console.log('Hover exited');
    }
  }

  // Render loop
  private startRenderLoop(): void {
    if (!this.renderer) return;

    const animate = (): void => {
      if (this.renderer && this.isInitialized) {
        this.renderer.render();
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Getters for accessing internal components (mainly for testing)
  public getHexGrid(): HexGrid<CustomProps> {
    return this.hexGrid;
  }

  public getRenderer(): BoardRenderer<CustomProps> | undefined {
    return this.renderer;
  }

  public getInputHandler(): InputHandler<CustomProps> | undefined {
    return this.inputHandler;
  }
}
