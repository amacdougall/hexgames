// Shared type definitions for the test application

// Define the custom properties interface for our game
export interface GameCellProps extends Record<string, unknown> {
  type?: string;
  owner?: string;
  state?: string;
  id?: string;
}
