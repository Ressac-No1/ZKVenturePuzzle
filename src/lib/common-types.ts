export type TileDescriptor = {
  row: number;
  column: number;
  left: number;
  top: number;
  tileId: number;
};

export enum Direction {
  Same = 0,
  Left,
  Down,
  Right,
  Up
};

export type TileAdjacency = {
  adjacent: boolean;
  direction: Direction;
};
