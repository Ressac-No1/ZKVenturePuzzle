// @ts-check

import PropTypes from "prop-types";
import React, { Component } from "react";
import { levelFactory, startingIdx, recalcStartingIdx } from "./../lib/levels-factory";
import Footer from "./Footer";
import Game from "./Game";

class App extends Component {
  constructor(props) {
    super(props);

    const level = props.level ? props.level : levelFactory(props.gridColumns * props.gridRows);
    const starting = startingIdx(props.gridColumns, props.gridRows, level.dirLimits, level.treasureTypes);
    const originalLevel = Object.assign({}, level);

    this.state = {
      original: originalLevel,
      level,
      starting
    };
  }

  onResetClick = async () => {
    this.setState({
      level: {
        dirLimits: this.state.original.dirLimits,
        treasureTypes: this.state.original.treasureTypes
      },
    });
  };

  onNewClick = async () => {
    const newLevel = levelFactory(this.props.gridColumns * this.props.gridRows);
    const newStarting = await recalcStartingIdx(this.props.gridColumns, this.props.gridRows, newLevel.dirLimits, newLevel.treasureTypes);
    const newOriginalLevel = Object.assign({}, newLevel);

    this.setState({
      level: newLevel,
      original: newOriginalLevel,
      starting: newStarting
    });
  };

  render() {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Game
          tileSize={90}
          gridColumns={this.props.gridColumns}
          gridRows={this.props.gridRows}
          dirLimits={this.state.level.dirLimits}
          treasureTypes={this.state.level.treasureTypes}
          treasureValueByType={[5, 10, 20]}
          moveLimit={this.props.moveLimit}
          currentTileIdx={this.state.starting}
          steps={[this.state.starting]}
          emptyDirLimits={Array(this.props.gridColumns * this.props.gridRows).fill(0)}
          emptyTreasureTypes={Array(this.props.gridColumns * this.props.gridRows).fill(0)}
          onResetClick={this.onResetClick}
          onNewClick={this.onNewClick}
        />
        <Footer />
      </main>
    );
  }
}

App.propTypes = {
  gridColumns: PropTypes.number.isRequired,
  gridRows: PropTypes.number.isRequired,
  moveLimit: PropTypes.number.isRequired,
  level: PropTypes.shape({
    dirLimits: PropTypes.arrayOf(PropTypes.number).isRequired,
    treasureTypes: PropTypes.arrayOf(PropTypes.number).isRequired,
  }),
};

export default App;
