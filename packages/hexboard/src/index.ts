// Main entry point for the hexboard library
// This file will export all public APIs

export { HexBoard } from './hexBoard';
export { HexGrid } from './core/hexGrid';
export { BoardRenderer } from './rendering/boardRenderer';
export { Cell, CellDefinition } from './core/cell';
export { Entity, EntityDefinition, EntityManager } from './core/entity';
export { EntityRenderer } from './rendering/entityRenderer';
export { ModelRegistry } from './rendering/modelRegistry';
export * from './core/coordinates';
export {
  CellColorStrategy,
  DefaultCellColorStrategy,
  ElevationColorStrategy,
} from './rendering/cellColorStrategy';
// Export new cell group highlighting interfaces and classes
export { CellGroupHighlightStrategy } from './rendering/cellGroupHighlightStrategy';
export { BoundaryLineStrategy } from './rendering/boundaryLineStrategy';

// Export updated model highlighting interfaces and classes
export {
  ModelHighlightStrategy,
  DefaultModelHighlightStrategy,
} from './rendering/highlightStrategy';

// Keep backward compatibility exports
export {
  ModelHighlightStrategy as HighlightStrategy,
  DefaultModelHighlightStrategy as DefaultHighlightStrategy,
} from './rendering/highlightStrategy';
