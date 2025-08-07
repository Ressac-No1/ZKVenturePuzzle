// @ts-check

import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import GitHubIcon from "./GitHubIcon";

const useStyles = makeStyles({
  root: {
    backgroundColor: "rgb(232, 232, 232)",
    paddingTop: "10px",
    textAlign: "center",
  },
  heart: {
    color: "#d4726a",
  },
  link: {
    textDecoration: "none",
    color: "#226666",
  },
});

const Footer = () => {
  const styles = useStyles();

  return (
    <footer className={styles.root}>
      <a
        href="https://github.com/Ressac-No1/ZKVenturePuzzle/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon />
      </a>
      <p>
        Made with <span className={styles.heart}>♥</span> for ZkVerify by{" "} 
        <a
          className={styles.link}
          href="https://github.com/Ressac-No1"
          rel="noopener noreferrer"
          target="_blank"
        >
          {" "}
          RSSCNo1
        </a>
      </p>
    </footer>
  );
};

export default Footer;
