// Core types for hexagonal grid operations

/**
 * Direction enum to represent the six faces of a hexagon.
 * Used for boundary detection and neighbor relationships.
 */
export enum Direction {
  North,
  Northeast,
  Southeast,
  South,
  Southwest,
  Northwest,
}

/**
 * A map where the key is the string ID of a cell in the selection,
 * and the value is a set of directions representing its boundary faces.
 */
export type BoundaryMap = Map<string, Set<Direction>>;
