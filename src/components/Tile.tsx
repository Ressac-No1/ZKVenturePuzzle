import { makeStyles } from "@material-ui/styles";
import React from "react";

const useStyles = makeStyles({
  root: ({ width, height, left, top, isCurrent }: Props) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    border: "1px solid #FFD1AA",
    width,
    height,
    left,
    top,
    cursor: "pointer",
    backgroundColor: isCurrent ? "#226666" : "#D4726A",
    color: '#FFD1AA',
    transitionProperty: "top, left, background-color",
    transitionDuration: ".300s",
    transitionTimingFunction: "ease-in",
  }),

  tileIcon: {
    color: "#FFD1AA",
    fontSize: "1.8em",
    userSelect: "none",
  },
});

type Props = {
  tileId: number;
  isCurrent: boolean;
  onClick: (props: Props) => void;
  width: number;
  height: number;
  left: number;
  top: number;
  dirLimit: number;
  treasureType: number;
};

const arrowsByDirLimit = (dirLimit: number) => {
  if (dirLimit <= 0 || dirLimit >= 15)
    return "";
  else
    return (
      ((dirLimit & 8) ? '⇧' : '') +
      ((dirLimit & 4) ? '⇨' : '') +
      ((dirLimit & 2) ? '⇩' : '') +
      ((dirLimit & 1) ? '⇦' : '')
    );
}

const treasureIcon = (treasureType: number) => {
  switch (treasureType) {
    case 1:
      return '🪙';
    case 2:
      return '💰';
    case 3:
      return '💎';
    default:
      return '';
  }
}

const Tile = (props: Props) => {
  const { dirLimit = 0, treasureType = 0, onClick } = props;
  const styles = useStyles(props);

  return (
    <div className={styles.root} onClick={() => onClick(props)}>
      {arrowsByDirLimit(dirLimit)}
      <span className={styles.tileIcon}>{treasureIcon(treasureType)}</span>
    </div>
  );
};

export default Tile;
