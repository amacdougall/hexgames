// HexGrid logic class
import { Cell, CellDefinition } from './cell';
import { HexCoordinates, axialToCubic } from './coordinates';

export class HexGrid<CustomProps extends object = {}> {
  private cells: Map<string, Cell<CustomProps>>;
  private defaultElevation: number;
  private defaultMovementCost: number;
  private defaultIsImpassable: boolean;

  constructor(
    defaultElevation = 1,
    defaultMovementCost = 1,
    defaultIsImpassable = false
  ) {
    this.cells = new Map();
    this.defaultElevation = defaultElevation;
    this.defaultMovementCost = defaultMovementCost;
    this.defaultIsImpassable = defaultIsImpassable;
  }

  /**
   * Creates a unique string identifier for a cell based on its hexagonal coordinates.
   *
   * <p>The identifier follows the format {@code "q,r,s"} where {@code q}, {@code r},
   * and {@code s} are the cubic coordinate components of the hexagonal cell. If the
   * {@code s} coordinate is not provided, it is computed automatically using the
   * cubic coordinate constraint {@code q + r + s = 0}.
   *
   * <p>This method is used internally to generate consistent keys for the cell storage
   * map and ensures that cells can be uniquely identified regardless of whether the
   * {@code s} coordinate was explicitly provided or computed.
   *
   * @param {number} q the q-axis coordinate of the hexagonal cell
   * @param {number} r the r-axis coordinate of the hexagonal cell
   * @param {number} [s] the s-axis coordinate of the hexagonal cell, or undefined to compute automatically
   * @returns {string} a string identifier in the format {@code "q,r,s"}
   * @since 1.0
   */
  private createCellId(q: number, r: number, s?: number): string {
    const actualS = s ?? (-q - r);
    return `${q},${r},${actualS}`;
  }

  /**
   * Converts a {@link CellDefinition} to a fully populated {@link Cell} with default
   * values applied to any unspecified properties.
   *
   * <p>This method validates the hexagonal coordinate system constraints and populates
   * the cell with an auto-generated identifier. When the optional {@code s} coordinate
   * is provided in the definition, it must satisfy the cubic coordinate constraint
   * {@code q + r + s = 0}, or an exception will be thrown.
   *
   * <p>Default values from the grid's constructor parameters are applied to any
   * properties not explicitly specified in the definition, ensuring that the
   * returned cell is fully populated and ready for use in game logic operations.
   *
   * @param {CellDefinition<CustomProps>} definition the cell definition containing partial cell data
   * @returns {Cell<CustomProps>} a complete Cell instance with all properties populated
   * @throws {Error} if the provided s coordinate violates the cubic coordinate constraint
   * @since 1.0
   */
  private processCellDefinition(definition: CellDefinition<CustomProps>): Cell<CustomProps> {
    const coords = axialToCubic(definition.q, definition.r);

    // If s is provided, validate it matches the cubic coordinate constraint
    if (definition.s !== undefined && definition.s !== coords.s) {
      throw new Error(`Invalid hex coordinates: q=${definition.q}, r=${definition.r}, s=${definition.s}. Must satisfy q + r + s = 0`);
    }

    const id = this.createCellId(coords.q, coords.r, coords.s);

    return {
      id,
      q: coords.q,
      r: coords.r,
      s: coords.s,
      elevation: definition.elevation ?? this.defaultElevation,
      movementCost: definition.movementCost ?? this.defaultMovementCost,
      isImpassable: definition.isImpassable ?? this.defaultIsImpassable,
      customProperties: definition.customProperties ?? ({} as CustomProps)
    };
  }

  /**
   * Adds a single cell to the grid based on the provided cell definition.
   *
   * <p>This method processes the definition by applying default values to any unspecified
   * properties and validates that the coordinates do not conflict with existing cells.
   * The cell definition is converted to a fully populated {@link Cell} instance using
   * the grid's default values for any omitted properties.
   *
   * <p>Coordinate validation ensures that if an explicit {@code s} coordinate is provided,
   * it satisfies the cubic coordinate constraint {@code q + r + s = 0}. If no {@code s}
   * coordinate is provided, it will be computed automatically.
   *
   * @param {CellDefinition<CustomProps>} definition the cell definition specifying coordinates and optional properties
   * @returns {Cell<CustomProps>} the newly created and added Cell instance
   * @throws {Error} if a cell already exists at the specified coordinates
   * @throws {Error} if the coordinates violate the cubic coordinate constraint
   * @since 1.0
   */
  addCell(definition: CellDefinition<CustomProps>): Cell<CustomProps> {
    const cell = this.processCellDefinition(definition);

    if (this.cells.has(cell.id)) {
      throw new Error(`Cell already exists at coordinates q=${cell.q}, r=${cell.r}, s=${cell.s}`);
    }

    this.cells.set(cell.id, cell);
    return cell;
  }

  /**
   * Adds multiple cells to the grid in a single operation. Each cell definition
   * is processed individually using the same validation and default application
   * logic as {@link addCell}.
   *
   * <p>This operation is transactional in nature - if any cell definition fails
   * validation or conflicts with existing cells, the entire operation fails and
   * no cells are added to the grid.
   *
   * @param {CellDefinition<CustomProps>[]} definitions an array of cell definitions to be added to the grid
   * @returns {Cell<CustomProps>[]} an array containing all newly created Cell instances in the same order
   * @throws {Error} if any cell definition violates coordinate constraints or conflicts with existing cells
   * @see addCell
   * @since 1.0
   */
  addCells(definitions: CellDefinition<CustomProps>[]): Cell<CustomProps>[] {
    const createdCells: Cell<CustomProps>[] = [];

    for (const definition of definitions) {
      createdCells.push(this.addCell(definition));
    }

    return createdCells;
  }

  /**
   * Retrieves a cell from the grid by its hexagonal coordinates.
   *
   * <p>If the {@code s} coordinate is not provided, it will be computed automatically
   * using the cubic coordinate constraint {@code q + r + s = 0}. This method performs
   * constant-time lookups using the internal coordinate-based identifier mapping.
   *
   * @param {number} q the q-axis coordinate of the hexagonal cell
   * @param {number} r the r-axis coordinate of the hexagonal cell
   * @param {number} [s] the s-axis coordinate of the hexagonal cell, or undefined to compute automatically
   * @returns {Cell<CustomProps> | null} the Cell at the specified coordinates, or null if no cell exists at those coordinates
   * @since 1.0
   */
  getCell(q: number, r: number, s?: number): Cell<CustomProps> | null {
    const id = this.createCellId(q, r, s);
    return this.cells.get(id) || null;
  }

  /**
   * Retrieves a cell from the grid using a HexCoordinates object.
   * This is a convenience method that delegates to {@link getCell}.
   *
   * @param {HexCoordinates} coords the hexagonal coordinates object containing q, r, and s values
   * @returns {Cell<CustomProps> | null} the Cell at the specified coordinates, or null if no cell exists at those coordinates
   * @see getCell
   * @since 1.0
   */
  getCellByCoords(coords: HexCoordinates): Cell<CustomProps> | null {
    return this.getCell(coords.q, coords.r, coords.s);
  }

  /**
   * Retrieves a cell from the grid by its unique string identifier.
   * The identifier must be in the format "q,r,s" as generated by {@link createCellId}.
   *
   * @param {string} id the unique string identifier of the cell
   * @returns {Cell<CustomProps> | null} the Cell with the specified identifier, or null if no such cell exists
   * @see createCellId
   * @since 1.0
   */
  getCellById(id: string): Cell<CustomProps> | null {
    return this.cells.get(id) || null;
  }

  /**
   * Updates an existing cell's properties by merging the provided updates with
   * the current cell data. This operation replaces the existing cell entirely
   * with a new cell containing the updated properties.
   *
   * <p>The method performs a merge operation where any properties specified in the
   * {@code updates} parameter will replace the corresponding properties in the
   * existing cell. Properties not included in the {@code updates} will retain
   * their current values from the existing cell.
   *
   * @param {number} q the q-axis coordinate of the cell to update
   * @param {number} r the r-axis coordinate of the cell to update
   * @param {Partial<CellDefinition<CustomProps>>} updates a partial cell definition containing the properties to update
   * @param {number} [s] the s-axis coordinate of the cell, or undefined to compute automatically
   * @returns {Cell<CustomProps> | null} the newly created Cell with updated properties, or null if no cell exists at the specified coordinates
   * @since 1.0
   */
  updateCell(q: number, r: number, updates: Partial<CellDefinition<CustomProps>>, s?: number): Cell<CustomProps> | null {
    const currentCell = this.getCell(q, r, s);
    if (!currentCell) {
      return null;
    }

    // Create updated definition based on current cell and updates
    const updatedDefinition: CellDefinition<CustomProps> = {
      q: currentCell.q,
      r: currentCell.r,
      s: currentCell.s,
      elevation: updates.elevation ?? currentCell.elevation,
      movementCost: updates.movementCost ?? currentCell.movementCost,
      isImpassable: updates.isImpassable ?? currentCell.isImpassable,
      customProperties: updates.customProperties ?? currentCell.customProperties
    };

    // Remove old cell and add updated one
    this.removeCell(q, r, s);
    return this.addCell(updatedDefinition);
  }

  /**
   * Removes a cell from the grid at the specified hexagonal coordinates.
   *
   * <p>If the {@code s} coordinate is not provided, it will be computed automatically
   * using the cubic coordinate constraint {@code q + r + s = 0}. The removal
   * operation performs an immediate deletion from the internal storage without
   * any side effects on other cells.
   *
   * @param {number} q the q-axis coordinate of the cell to remove
   * @param {number} r the r-axis coordinate of the cell to remove
   * @param {number} [s] the s-axis coordinate of the cell, or undefined to compute automatically
   * @returns {boolean} true if a cell was removed, false if no cell existed at the specified coordinates
   * @since 1.0
   */
  removeCell(q: number, r: number, s?: number): boolean {
    const id = this.createCellId(q, r, s);
    return this.cells.delete(id);
  }

  /**
   * Removes a cell from the grid using a HexCoordinates object.
   * This is a convenience method that delegates to {@link removeCell}.
   *
   * @param {HexCoordinates} coords the hexagonal coordinates object containing q, r, and s values
   * @returns {boolean} true if a cell was removed, false if no cell existed at the specified coordinates
   * @see removeCell
   * @since 1.0
   */
  removeCellByCoords(coords: HexCoordinates): boolean {
    return this.removeCell(coords.q, coords.r, coords.s);
  }

  /**
   * Tests whether a cell exists at the specified hexagonal coordinates.
   *
   * <p>If the {@code s} coordinate is not provided, it will be computed automatically
   * using the cubic coordinate constraint {@code q + r + s = 0}. This method
   * performs a constant-time lookup operation against the internal storage.
   *
   * @param {number} q the q-axis coordinate of the hexagonal cell
   * @param {number} r the r-axis coordinate of the hexagonal cell
   * @param {number} [s] the s-axis coordinate of the hexagonal cell, or undefined to compute automatically
   * @returns {boolean} true if a cell exists at the specified coordinates, false otherwise
   * @since 1.0
   */
  hasCell(q: number, r: number, s?: number): boolean {
    const id = this.createCellId(q, r, s);
    return this.cells.has(id);
  }

  /**
   * Tests whether a cell exists at the specified HexCoordinates.
   * This is a convenience method that delegates to {@link hasCell}.
   *
   * @param {HexCoordinates} coords the hexagonal coordinates object containing q, r, and s values
   * @returns {boolean} true if a cell exists at the specified coordinates, false otherwise
   * @see hasCell
   * @since 1.0
   */
  hasCellAtCoords(coords: HexCoordinates): boolean {
    return this.hasCell(coords.q, coords.r, coords.s);
  }

  /**
   * Returns an array containing all cells currently stored in the grid.
   *
   * <p>The returned array is a snapshot of the current state and modifications
   * to it will not affect the grid. The order of cells in the array is not
   * guaranteed and may vary between calls.
   *
   * @returns {Cell<CustomProps>[]} an array containing all Cell instances in the grid
   * @since 1.0
   */
  getAllCells(): Cell<CustomProps>[] {
    return Array.from(this.cells.values());
  }

  /**
   * Returns an array containing all cell identifiers currently stored in the grid.
   *
   * <p>The identifiers are in the format {@code "q,r,s"} as generated by {@link createCellId}.
   * The returned array is a snapshot of the current state and modifications to it
   * will not affect the grid. The order of identifiers in the array is not guaranteed.
   *
   * @returns {string[]} an array containing all cell identifier strings in the grid
   * @see createCellId
   * @since 1.0
   */
  getAllCellIds(): string[] {
    return Array.from(this.cells.keys());
  }

  /**
   * Returns an array containing all cells that satisfy the specified predicate function.
   *
   * <p>The predicate function is applied to each cell in the grid, and only those cells
   * for which the predicate returns {@code true} are included in the result. The returned
   * array is a snapshot of the current state and modifications to it will not affect the grid.
   *
   * @param {function(Cell<CustomProps>): boolean} predicate a function that accepts a Cell and returns true for cells to include
   * @returns {Cell<CustomProps>[]} an array containing all cells that satisfy the predicate
   * @since 1.0
   */
  getCellsWhere(predicate: (cell: Cell<CustomProps>) => boolean): Cell<CustomProps>[] {
    return this.getAllCells().filter(predicate);
  }

  /**
   * Removes all cells from the grid, leaving it empty.
   *
   * <p>After this method completes, {@link size} will return {@code 0} and
   * {@link isEmpty} will return {@code true}. This operation cannot be undone.
   *
   * @since 1.0
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * Returns the number of cells currently stored in the grid.
   *
   * <p>This method provides a constant-time operation to determine the grid's size.
   *
   * @returns {number} the number of cells in the grid
   * @since 1.0
   */
  size(): number {
    return this.cells.size;
  }

  /**
   * Tests whether the grid contains no cells.
   *
   * <p>This method returns {@code true} if and only if the grid contains zero cells.
   * It is equivalent to checking whether {@code size() === 0}.
   *
   * @returns {boolean} true if the grid contains no cells, false otherwise
   * @see size
   * @since 1.0
   */
  isEmpty(): boolean {
    return this.cells.size === 0;
  }

  /**
   * Calculates and returns the bounding box containing all cells in the grid.
   *
   * <p>The bounds are expressed as minimum and maximum values for each of the three
   * cubic coordinate axes (q, r, s). This information can be useful for rendering
   * operations, spatial queries, or determining the overall extent of the grid.
   *
   * <p>If the grid is empty, this method returns {@code null} to indicate that
   * no valid bounds can be calculated.
   *
   * @returns {{ minQ: number; maxQ: number; minR: number; maxR: number; minS: number; maxS: number } | null}
   *          an object containing the minimum and maximum coordinate values for each axis, or null if the grid is empty
   * @see isEmpty
   * @since 1.0
   */
  getBounds(): { minQ: number; maxQ: number; minR: number; maxR: number; minS: number; maxS: number } | null {
    if (this.isEmpty()) {
      return null;
    }

    const cells = this.getAllCells();
    let minQ = Infinity, maxQ = -Infinity;
    let minR = Infinity, maxR = -Infinity;
    let minS = Infinity, maxS = -Infinity;

    for (const cell of cells) {
      minQ = Math.min(minQ, cell.q);
      maxQ = Math.max(maxQ, cell.q);
      minR = Math.min(minR, cell.r);
      maxR = Math.max(maxR, cell.r);
      minS = Math.min(minS, cell.s);
      maxS = Math.max(maxS, cell.s);
    }

    return { minQ, maxQ, minR, maxR, minS, maxS };
  }

  /**
   * Creates a basic hexagonal ring pattern consisting of a center cell surrounded by six adjacent cells.
   *
   * <p>This convenience method generates a standard hex pattern that is commonly used for
   * testing, tutorials, or as a starting point for hex-based games. The pattern consists
   * of seven cells total: one at the origin (0,0,0) and six neighbors positioned at the
   * standard flat-top hexagonal adjacency coordinates (North, Northeast, Southeast, 
   * South, Southwest, Northwest).
   *
   * <p>All cells in the ring will be created with the same elevation if specified, or
   * will use the grid's default elevation if the parameter is omitted. Other cell
   * properties (movement cost, passability, custom properties) will use the grid's defaults.
   *
   * @param {number} [centerElevation] the elevation to assign to all cells in the ring, or undefined to use grid defaults
   * @returns {Cell<CustomProps>[]} an array containing the seven created cells (center first, then neighbors)
   * @throws {Error} if any of the seven coordinates already contain cells
   * @since 1.0
   */
  createBasicHexRing(centerElevation?: number): Cell<CustomProps>[] {
    const cells: Cell<CustomProps>[] = [];

    // Add center cell
    cells.push(this.addCell({
      q: 0,
      r: 0,
      elevation: centerElevation
    }));

    // Add six surrounding cells (flat-top hex neighbors)
    const neighbors = [
      { q: 1, r: 0 },   // Southeast
      { q: 0, r: -1 },  // Northeast
      { q: -1, r: -1 }, // North
      { q: -1, r: 0 },  // Northwest
      { q: 0, r: 1 },   // Southwest
      { q: 1, r: 1 }    // South
    ];

    for (const neighbor of neighbors) {
      cells.push(this.addCell({
        q: neighbor.q,
        r: neighbor.r,
        elevation: centerElevation
      }));
    }

    return cells;
  }

  /**
   * Returns the six neighboring coordinates for a flat-top hexagonal layout.
   *
   * <p>In a flat-top layout, each hex has neighbors in these directions:
   * North, Northeast, Southeast, South, Southwest, and Northwest.
   *
   * @param {number} q the q-axis coordinate of the center hex
   * @param {number} r the r-axis coordinate of the center hex
   * @returns {HexCoordinates[]} an array of six neighboring coordinates
   * @since 1.0
   */
  getNeighborCoordinates(q: number, r: number): HexCoordinates[] {
    const neighbors = [
      { q: q + 1, r: r },     // Southeast
      { q: q, r: r - 1 },     // Northeast
      { q: q - 1, r: r - 1 }, // North
      { q: q - 1, r: r },     // Northwest
      { q: q, r: r + 1 },     // Southwest
      { q: q + 1, r: r + 1 }  // South
    ];

    return neighbors.map(neighbor => ({
      q: neighbor.q,
      r: neighbor.r,
      s: -neighbor.q - neighbor.r
    }));
  }

  /**
   * Returns the six neighboring coordinates for a given HexCoordinates object.
   * This is a convenience method that delegates to {@link getNeighborCoordinates}.
   *
   * @param {HexCoordinates} coords the hexagonal coordinates object
   * @returns {HexCoordinates[]} an array of six neighboring coordinates
   * @see getNeighborCoordinates
   * @since 1.0
   */
  getNeighborCoordinatesFromCoords(coords: HexCoordinates): HexCoordinates[] {
    return this.getNeighborCoordinates(coords.q, coords.r);
  }
}
