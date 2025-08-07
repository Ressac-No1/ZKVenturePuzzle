import { randomArray } from "./utils";

/**
 * Generate a level of a given size
 * @param {Number} size The total size of the level
 * @returns {Object} The direction limit and treasure type of each tile in the grid, representing the level data
 */
export const levelFactory = (size: number) => {
  if (!size || !Number.isInteger(size) || size < 1 || size > 100) {
    throw new Error(`Cannot generate level of size: <${size}>`);
  }

  return {
    dirLimits: randomArray(size, 14),
    treasureTypes: randomArray(size, 3)
  };
};

export const startingIdx = (gridColumns: number, gridRows: number, dirLimits: Array<number>, treasureTypes: Array<number>) => {
  const size = gridColumns * gridRows;
  if (size >= 1 && size <= 100 && dirLimits.length === size && treasureTypes.length === size) {
    let idx, column, row, movable;
    while (true) {
      idx = Math.floor(Math.random() * size);
      if (treasureTypes[idx] === 0) {
        column = idx % gridColumns;
        row = (idx / gridColumns) << 0;
	movable = (
          (dirLimits[idx] <= 0) ||
          (dirLimits[idx] >= 15) ||
	  ((dirLimits[idx] & 8) > 0 && row > 0) ||
	  ((dirLimits[idx] & 4) > 0 && column + 1 < gridColumns) ||
	  ((dirLimits[idx] & 2) > 0 && row + 1 < gridRows) ||
	  ((dirLimits[idx] & 1) > 0 && column > 0)
	);
	if (movable)
          return idx;
      }
    }
  } else if (size < 1 || size > 100) {
    throw new Error(`Cannot generate a starting point for level of size: <${size}>`);
  } else { 
    throw new Error ('Cannot generate a starting point, the level data is broken');
  }
}

export const recalcStartingIdx = async (gridColumns: number, gridRows: number, dirLimits: Array<number>, treasureTypes: Array<number>) => {
  try {
    return startingIdx(gridColumns, gridRows, dirLimits, treasureTypes);
  } catch (err: any) {
    throw err;
  }
}

