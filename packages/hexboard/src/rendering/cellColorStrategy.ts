// Cell color strategy interfaces and implementations
// Provides flexible cell coloring through Strategy pattern

import { Cell } from '../core/cell';

/**
 * Strategy interface for determining cell colors in the hex grid renderer.
 *
 * This interface allows applications to define custom coloring logic based on
 * cell properties, game state, or any other criteria. Implementations should
 * return Three.js-compatible hexadecimal color values.
 *
 * @example
 * ```typescript
 * class FactionColorStrategy implements CellColorStrategy<GameProps> {
 *   getCellColor(cell: Cell<GameProps>): number {
 *     switch (cell.customProps.faction) {
 *       case 'player': return 0x00ff00;  // Green
 *       case 'enemy': return 0xff0000;   // Red
 *       default: return 0x808080;        // Gray
 *     }
 *   }
 * }
 * ```
 *
 * @template CustomProps - The type of custom properties stored in cells
 */
export interface CellColorStrategy<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  /**
   * Determines the color for a given cell.
   *
   * @param _cell - The cell to determine color for
   * @returns A hexadecimal color value (e.g., 0xff0000 for red)
   */
  getCellColor(_cell: Cell<CustomProps>): number;
}

/**
 * Default cell color strategy that mimics the original BoardRenderer behavior.
 *
 * Uses elevation-based terrain coloring with special handling for impassable cells
 * (rendered as water). This strategy maintains backward compatibility with the
 * original hard-coded coloring logic.
 *
 * Color scheme:
 * - Impassable cells: Royal blue (water)
 * - High elevation (>2): Saddle brown (mountains)
 * - Medium-high elevation (>1.5): Forest green (hills)
 * - Medium elevation (>1): Yellow green (normal terrain)
 * - Low elevation (<=1): Sandy brown (low terrain)
 */
export class DefaultCellColorStrategy<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> implements CellColorStrategy<CustomProps>
{
  getCellColor(cell: Cell<CustomProps>): number {
    if (cell.isImpassable) {
      return 0x4169e1; // Royal blue for impassable (water)
    }

    // Color based on elevation
    if (cell.elevation > 2) {
      return 0x8b4513; // Saddle brown for mountains
    } else if (cell.elevation > 1.5) {
      return 0x228b22; // Forest green for hills
    } else if (cell.elevation > 1) {
      return 0x9acd32; // Yellow green for normal terrain
    } else {
      return 0xf4a460; // Sandy brown for low terrain
    }
  }
}

/**
 * Simple elevation-based color strategy without impassable cell assumptions.
 *
 * This strategy demonstrates a simpler approach that only considers elevation
 * values, making it useful for applications that don't use the impassable
 * property or want different visual representation.
 *
 * Color scheme uses a smooth gradient from blue (low) to brown (high):
 * - Very high elevation (>3): Dark brown
 * - High elevation (>2): Brown
 * - Medium elevation (>1): Green
 * - Low elevation (<=1): Blue
 *
 * @example
 * ```typescript
 * const renderer = new BoardRenderer(grid, new ElevationColorStrategy());
 * ```
 */
export class ElevationColorStrategy<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> implements CellColorStrategy<CustomProps>
{
  getCellColor(cell: Cell<CustomProps>): number {
    if (cell.elevation > 3) {
      return 0x654321; // Dark brown for very high terrain
    } else if (cell.elevation > 2) {
      return 0x8b4513; // Brown for high terrain
    } else if (cell.elevation > 1) {
      return 0x228b22; // Green for medium terrain
    } else {
      return 0x4169e1; // Blue for low terrain
    }
  }
}
