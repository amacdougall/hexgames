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
  private isRunning = false;

  constructor(colorStrategy?: CellColorStrategy<CustomProps>) {
    this.hexGrid = new HexGrid<CustomProps>();
    this.colorStrategy = colorStrategy;
  }

  public async init(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      // TODO: Implement proper error handling/reporting system
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

    this.isInitialized = true;
  }

  public dispose(): void {
    if (!this.isInitialized) {
      return;
    }

    // Stop render loop
    this.stop();

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
  public setCellAtCoords(
    coords: HexCoordinates,
    cellData: Partial<CellDefinition<CustomProps>>
  ): void {
    const cellDefinition: CellDefinition<CustomProps> = {
      q: coords.q,
      r: coords.r,
      s: coords.s,
      elevation: cellData.elevation,
      movementCost: cellData.movementCost,
      isImpassable: cellData.isImpassable,
      customProps: cellData.customProps,
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
      // TODO: Implement proper error handling/reporting system
      console.warn('HexBoard.renderAll(): no renderer available');
    }
  }

  // Input event handlers
  private handleCellClick(coords: HexCoordinates): void {
    // TODO: Implement game-specific click logic here
    // Basic click handling - can be extended for game mechanics

    // Get the cell data for potential game logic
    const cell = this.getCellAtCoords(coords);
    if (cell) {
      // TODO: Implement game-specific cell interaction logic
      // Example: select unit, move piece, show cell info, etc.
    } else {
      // TODO: Handle clicks on empty cells (e.g., move unit, place building)
    }
  }

  private handleCellHover(coords: HexCoordinates | null): void {
    // TODO: Implement visual feedback for hover events
    // Example: highlight cell, show tooltip, preview movement range, etc.
    if (coords) {
      // TODO: Show hover feedback for occupied cell
    } else {
      // TODO: Clear hover feedback
    }
  }

  // Render control methods
  public start(): void {
    if (!this.isInitialized) {
      // TODO: Implement proper error handling/reporting system
      console.warn('HexBoard must be initialized before starting');
      return;
    }
    this.isRunning = true;
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private animate(): void {
    if (!this.isRunning || !this.renderer) {
      return;
    }

    this.renderer.render();
    requestAnimationFrame(() => this.animate());
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
