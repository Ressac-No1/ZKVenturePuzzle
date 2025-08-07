import { Direction, TileAdjacency, TileDescriptor } from "./common-types";

/**
 * Return an array of number, in which every number is 0 with probability of 1/2 or a random integer within [1..M) with total probability of 1/2
 * @param {Number} size Array size
 * @param {Number} valRange The M in the description above
 * @returns {Array} Resulting random array
 */
export const randomArray = (size: number, valRange: number) => {
  let arr = Array(size).fill(0);
  return arr.map(x => Math.floor(Math.random() * 2) * (Math.floor(Math.random() * valRange) + 1));
}

/**
 * Returns an Object containing grid coordinates based on the index
 * in an Array.
 * @param {Number} index Position of an item in an Array
 * @param {Number} tileSize Size of a Tile, in pixels, to calculate the absolute
 * positioning within the Grid
 * @param {Number} gridColumns Number of columns of the Grid
 * @param {Number} gridRows Number of rows of the Grid
 * @return {TileDescriptor} Object containing coordinates
 */
export const getTileCoords = (
  index: number,
  tileSize: number,
  gridColumns: number,
  gridRows: number
): TileDescriptor => {
  if (!Number.isInteger(tileSize) || tileSize < 1) {
    throw new Error(`Cannot get coords from tile with tileSize: <${tileSize}>`);
  }

  if (!Number.isInteger(gridColumns) || gridColumns < 1) {
    throw new Error(`Cannot get coords from tile with gridColumns: <${gridColumns}>`);
  }

  if (!Number.isInteger(gridRows) || gridRows < 1) {
    throw new Error(`Cannot get coords from tile with gridRows: <${gridRows}>`);
  }

  if (!Number.isInteger(index) || index < 0 || index >= gridColumns * gridRows) {
    throw new Error(`Cannot get coords from tile at this index: <${index}>, not an integer or out of range in the grid`);
  }

  const column = index % gridColumns;
  const row = (index / gridColumns) << 0;

  return {
    column,
    row,
    left: column * tileSize,
    top: row * tileSize,
    tileId: index,
  };
};

/**
 * Determine whether two tiles are adjacent and their relative direction
 *
 * @param  {TileDescriptor} tileACoords Coordinates of Tile A
 * @param  {TileDescriptor} tileBCoords Coordinates of Tile B
 * @returns {TileAdjacency} Result
 */
export const isAdjacent = (
  tileACoords: TileDescriptor,
  tileBCoords: TileDescriptor
): TileAdjacency => {
  const sameRow = tileACoords.row === tileBCoords.row;
  const sameColumn = tileACoords.column === tileBCoords.column;
  const columnDiff = tileACoords.column - tileBCoords.column;
  const rowDiff = tileACoords.row - tileBCoords.row;
  const adjacentColumn = Math.abs(columnDiff) === 1;
  const adjacentRow = Math.abs(rowDiff) === 1;
  const sameRowAdjacentColumn = sameRow && adjacentColumn;
  const sameColumnAdjacentRow = sameColumn && adjacentRow;
  const BLeftOfA = tileBCoords.column < tileACoords.column;
  const BDownOfA = tileBCoords.row > tileACoords.row;
  const BRightOfA = tileBCoords.column > tileACoords.column;
  const BUpOfA = tileBCoords.row < tileACoords.row;

  return {
    adjacent: sameRowAdjacentColumn || sameColumnAdjacentRow,
    direction: (
      (BLeftOfA && Direction.Left) ||
      (BDownOfA && Direction.Down) ||
      (BRightOfA && Direction.Right) ||
      (BUpOfA && Direction.Up) ||
      Direction.Same
    )
  };
};

/**
 * Swap values of given field(s) from an array of objects given two indexes.
 * @param arr
 * @param indexA
 * @param indexB
 * @param fields
 */
export const invert = (
  arr: { [x: number]: { [x: string]: unknown } },
  indexA: number,
  indexB: number,
  fields: string[]
) => {
  fields.forEach((field) => {
    const sw = arr[indexA][field];
    arr[indexA][field] = arr[indexB][field];
    arr[indexB][field] = sw;
  });
};
