// Entity definitions and interfaces
// Implementation will go here

import * as THREE from 'three';
import { Cell } from './cell';

export interface Entity<
  CustomProps extends Record<string, unknown> = Record<string, never>,
> {
  id: string;
  cellPosition: Cell<CustomProps>;
  model: THREE.Object3D;
  movementSpeed?: number;
}
