// Map definition interfaces
// Implementation will go here

import { CellDefinition } from '../core/cell';

export interface MapDefaultSettings<
  CustomProps extends Record<string, any> = {},
> {
  elevation: number;
  movementCost: number;
  isImpassable: boolean;
  customProperties: CustomProps;
}

export interface MapDefinition<CustomProps extends Record<string, any> = {}> {
  name: string;
  defaults: MapDefaultSettings<CustomProps>;
  cells: CellDefinition<CustomProps>[];
}
