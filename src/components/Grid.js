// @ts-check

import { makeStyles } from "@material-ui/core";
import React from "react";
import Tile from "./Tile";

const useStyles = makeStyles({
  root: (props) => {
    return {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "500px",
    };
  },
  tile: (props) => {
    return {
      width: `${props.tileSize * props.gridColumns}px`,
      height: `${props.tileSize * props.gridRows}px`,
      position: "relative",
      textAlign: "center",
    };
  },
});

const Grid = (props) => {
  const { tiles, onTileClick, gridColumns, gridRows, currentTileIdx } = props;
  const styles = useStyles(props);

  return (
    <div className={styles.root}>
      <div className={styles.tile}>
        {tiles.map((tile, idx) => {
          return (
            <Tile
              {...tile}
              key={`tile-${idx}`}
              isCurrent={idx === currentTileIdx}
              onClick={onTileClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Grid;
