// Cell definitions and interfaces
// Implementation will go here

import { HexCoordinates } from './coordinates';

export interface CellDefinition<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  q: number;
  r: number;
  s?: number;
  elevation?: number;
  movementCost?: number;
  isImpassable?: boolean;
  customProps?: CustomProps;
}

export interface Cell<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> extends HexCoordinates {
  id: string;
  elevation: number;
  movementCost: number;
  isImpassable: boolean;
  customProps: CustomProps;
}
