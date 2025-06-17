// Cell definitions and interfaces
// Implementation will go here

import { HexCoordinates } from './coordinates';

export interface CellDefinition<CustomProps extends Record<string, any> = {}> {
  q: number;
  r: number;
  s?: number;
  elevation?: number;
  movementCost?: number;
  isImpassable?: boolean;
  customProperties?: CustomProps;
}

export interface Cell<CustomProps extends Record<string, any> = {}> extends HexCoordinates {
  id: string;
  elevation: number;
  movementCost: number;
  isImpassable: boolean;
  customProperties: CustomProps;
}

export { HexCoordinates };
