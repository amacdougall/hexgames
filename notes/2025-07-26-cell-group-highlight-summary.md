This document proposes a new system for highlighting groups of cells on a
hexagonal grid. The current system can only highlight individual cells, but the
new system will be able to highlight groups of cells and draw boundaries around
them.

The core of the proposal is a new findBoundaryFaces method on the HexGrid class.
This method will take a list of cells as input and return a BoundaryMap that
describes the boundary of the group. The BoundaryMap will be a map from cell IDs
to a set of directions, where each direction represents a face of the cell that
is on the boundary of the group.

The new system will also include a new CellGroupHighlightStrategy interface and
a concrete implementation called BoundaryLineStrategy. The BoundaryLineStrategy
will use the BoundaryMap to create a THREE.Group of THREE.Line objects that
outline the selected cells. The BoardRenderer will be updated to use the new
strategy and manage the lifecycle of the highlight effects.
