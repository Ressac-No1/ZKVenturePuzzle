// @ts-check

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from "@material-ui/core";
import React, { Component } from "react";
import {
  GAME_IDLE,
  GAME_OVER,
  GAME_PAUSED,
  GAME_STARTED,
} from "../lib/game-status";
import { isAdjacent, getTileCoords, invert } from "../lib/utils";
import Grid from "./Grid";
import Menu from "./Menu";
import VerificationKey from "./puzzle_verify_key";

class Game extends Component {
  constructor(props) {
    super(props);

    const { tileSize, gridColumns, gridRows, dirLimits, treasureTypes, treasureValueByType, currentTileIdx, moves = 0, moveLimit = 1, seconds = 0, score = 0 } = props;
    const { steps = [currentTileIdx] } = props;
    const tiles = this.generateTiles(dirLimits, treasureTypes, tileSize, gridColumns, gridRows);

    this.state = {
      walletAccount: "",
      tiles,
      currentTileIdx,
      gameState: GAME_IDLE,
      moves,
      steps,
      moveLimit,
      seconds,
      score,
      ZKProof: {},
      dialogOpen: false,
      snackbarOpen: false,
      snackbarText: "",
      ZKProofGenerated: false,
      ZKProofVerified: false
    };

    this.onConnectWallet = this.onConnectWallet.bind(this);
    this.UNSAFE_componentWillReceiveProps = this.UNSAFE_componentWillReceiveProps.bind(this);
    this.onGenerateZKProof = this.onGenerateZKProof.bind(this);
    this.onVerifyZKProof = this.onVerifyZKProof.bind(this);

    document.addEventListener("keydown", this.keyDownListener);
  }

  async onConnectWallet() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && Array.isArray(accounts)) {
        this.setState({
          walletAccount: accounts[0]
        });
      } else
        throw new Error('Unable to connect to an Ethereum wallet');
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    clearInterval(this.timerId);

    const { tileSize, currentTileIdx, gridColumns, gridRows } = this.props;
    const newTiles = this.generateTiles(nextProps.dirLimits, nextProps.treasureTypes, tileSize, gridColumns, gridRows);

    this.setState({
      gameState: GAME_IDLE,
      tiles: newTiles,
      currentTileIdx,
      steps: [currentTileIdx],
      moves: 0,
      score: 0,
      seconds: 0,
      ZKProof: {},
      ZKProofGenerated: false,
      ZKProofVerified: false
    });
  }

  // End game by pressing CTRL + ALT + F
  keyDownListener = (key) => {
    if (key.ctrlKey && key.altKey && key.code === "KeyF") {
      const { emptyDirLimits, emptyTreasureTypes, tileSize, gridColumns, gridRows } = this.props;
      const emptyTiles = this.generateTiles(emptyDirLimits, emptyTreasureTypes, tileSize, gridColumns, gridRows).map(
        (tile, idx) => {
          tile.dirLimit = 0;
          tile.treasureType = 0;
          return Object.assign({}, tile);
        }
      );

      clearInterval(this.timerId);

      this.setState({
        gameState: GAME_OVER,
        tiles: emptyTiles,
        dialogOpen: true,
        ZKProofGenerated: false,
        ZKProofVerified: false
      });
    }
  };

  handleDialogClose = () => {
    this.setState({
      dialogOpen: false,
    });
  };

  handleSnackbarClose = (reason) => {
    this.setState({
      snackbarOpen: false,
    });
  };

  generateTiles(dirLimits, treasureTypes, tileSize, gridColumns, gridRows) {
    const tiles = [];
    if (dirLimits.length !== gridColumns * gridRows || treasureTypes.length !== gridColumns * gridRows)
      return tiles;

    dirLimits.forEach((dirLimit, idx) => {
      tiles[idx] = {
        ...getTileCoords(idx, tileSize, gridColumns, gridRows),
        width: this.props.tileSize,
        height: this.props.tileSize,
        dirLimit,
        treasureType: treasureTypes[idx]
      };
    });

    return tiles;
  }

  addTimer() {
    this.setState((prevState) => {
      return { seconds: prevState.seconds + 1 };
    });
  }

  setTimer() {
    this.timerId = setInterval(() => {
      this.addTimer();
    }, 1000);
  }

  onResetEverythingClick = async () => {
    await this.props.onResetClick();
    clearInterval(this.timerId);
    this.setState({
      moves: 0,
      currentTileIdx: this.props.currentTileIdx || this.state.steps[0],
      steps: this.props.currentTileIdx ? [this.props.currentTileIdx] : this.state.steps.slice(0, 1),
      score: 0,
      seconds: 0,
      ZKProof: {},
      ZKProofGenerated: false,
      ZKProofVerified: false
    });
  }
/*
  onNewGameClick = async () => {
    await this.props.onNewClick(); 
    clearInterval(this.timerId);
    this.setState({
      moves: 0,
      currentTileIdx: this.props.currentTileIdx || this.state.steps[0],
      steps: this.props.currentTileIdx ? [this.props.currentTileIdx] : this.state.steps.slice(0, 1),
      score: 0,
      seconds: 0,
      ZKProof: {},
      ZKProofGenerated: false,
      ZKProofVerified: false
    });
  }
*/
  onPauseClick = () => {
    this.setState((prevState) => {
      let newGameState = null;
      let newSnackbarText = null;

      if (prevState.gameState === GAME_STARTED) {
        clearInterval(this.timerId);
        newGameState = GAME_PAUSED;
        newSnackbarText = "Game paused!";
      } else {
        this.setTimer();
        newGameState = GAME_STARTED;
        newSnackbarText = "Game on!";
      }

      return {
        gameState: newGameState,
        snackbarOpen: true,
        snackbarText: newSnackbarText,
      };
    });
  };

  onTileClick = (tile) => {
    if (
      this.state.gameState === GAME_OVER ||
      this.state.gameState === GAME_PAUSED
    ) {
      return;
    }

    // Set Timer in case of first click
    if (this.state.moves === 0) {
      this.setTimer();
    }

    const { gridColumns, gridRows } = this.props;
    // Find the tile's index
    const tileIdx = this.state.tiles.findIndex(
      (t) => t.tileId === tile.tileId
    );

    const currentTile = this.state.tiles[this.state.currentTileIdx];
    // Is this tile neighbouring the current tile?
    const adj = isAdjacent(currentTile, tile);

    if (adj.adjacent) {
      const isAllowedDirection =
        currentTile.dirLimit <= 0 ||
	currentTile.dirLimit >= 15 ||
	adj.direction == 0 ||
	(currentTile.dirLimit & (1 << (adj.direction - 1))) > 0;

      // If the direction of move is allowed, make a move
      if (isAllowedDirection) {
        let newMoves = this.state.moves + 1;
        let newSteps = this.state.steps;
        newSteps.push(tileIdx);
        let newScore = this.state.score;
        // If treasure exists at the destination of move, collect it
        if (tile.treasureType > 0 && tile.treasureType <= this.props.treasureValueByType.length) {
          newScore += this.props.treasureValueByType[tile.treasureType - 1];
        }
        let newTiles = Array.from(this.state.tiles).map((t) => ({ ...t }));
        newTiles[tileIdx].treasureType = 0;
	
        // If number of moves reaches the limit, end the game
        const isGameOver = newMoves >= this.state.moveLimit;
        if (isGameOver)
          clearInterval(this.timerId);

        this.setState({
          gameState: isGameOver ? GAME_OVER : GAME_STARTED,
          tiles: newTiles,
          currentTileIdx: tileIdx,
          moves: newMoves,
          steps: newSteps,
          score: newScore,
          dialogOpen: isGameOver ? true : false,
        });
      }
    }
  };

  onGenerateZKProof = async () => {
    const gameplayRawData = {
      walletAccount: this.state.walletAccount,
      gridC: this.props.gridColumns,
      gridR: this.props.gridRows,
      maxMove: this.props.moveLimit,
      dirLimits: this.props.dirLimits,
      treasureTypes: this.props.treasureTypes,
      treasureValueByType: this.props.treasureValueByType,
      steps: this.state.steps,
    };

    try {
      const res = await fetch("/api/generateProof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameplayRawData),
      });

      const resData = await res.json();
      const { proof, publicSignals } = resData;

      this.setState({
        ZKProof: { proof, publicSignals },
        ZKProofGenerated: true,
        snackbarOpen: true,
        snackbarText: `Generated ZK proof for this gameplay, with total score: ${publicSignals[0]}`
      });
    } catch (err) {
      // Proof generation error handling
      throw err;
    }
  }

  onVerifyZKProof = async () => {
    try {
      let vkRegistered = false;
      // TODO: Not available to register vKey on relayer at this moment
      /*
      const vkRegRes = await fetch("/api/registerVk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofType: "groth16",
          proofOptions: {
            library: "snarkjs",
            curve: "bn128"
          },
        }),
      });

      const vkRegResData = await vkRegRes.json();
      if (vkRegResData.vKey) {
        vkRegistered = true;
      */
        const { proof, publicSignals } = this.state.ZKProof;
        const submissionRes = await fetch("api/submitProof", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proofType: "groth16",
            vkRegistered,
            proofOptions: {
              library: "snarkjs",
              curve: "bn128"
            },
            proofData: {
              proof,
              publicSignals,
              //vk: vkRegResData.vKey
              vk: VerificationKey
            },
          }),
        });

        const submissionResData = await submissionRes.json();
        if (submissionResData.verified) {
          this.setState({
            ZKProofVerified: true,
            snackbarOpen: true,
            snackbarText: `Proof verified on chain! Transaction hash: ${submissionResData.txHash}`
          });
        }
      /*} else {
         console.log('Unable to verify proof, no registered vKey');
      }*/
    } catch (err) {
      // Proof verification error handling
      throw err;
    }
  }

  render() {
    const { tileSize, gridColumns, gridRows, onNewClick } = this.props;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <Menu
          walletAccount={this.state.walletAccount}
          seconds={this.state.seconds}
          moves={this.state.moves}
          moveLimit={this.state.moveLimit}
          score={this.state.score}
          onResetClick={this.onResetEverythingClick}
          onPauseClick={this.onPauseClick}
          onNewClick={onNewClick}
          onGenerateZKProof={this.onGenerateZKProof}
          onVerifyZKProof={this.onVerifyZKProof}
          gameState={this.state.gameState}
          ZKProofGenerated={this.state.ZKProofGenerated}
          ZKProofVerified={this.state.ZKProofVerified}
        />
        <Grid
          tileSize={tileSize}
          gridColumns={gridColumns}
          gridRows={gridRows}
          tiles={this.state.tiles}
          currentTileIdx={this.state.currentTileIdx}
          onTileClick={this.onTileClick}
        />
        <Button onClick={this.onConnectWallet} disabled={this.state.walletAccount}>
          <Typography component="span" variant="button">
	    {this.state.walletAccount ? `Connected to ${this.state.walletAccount}` : 'Connect wallet'}
          </Typography>
        </Button>
        <Dialog open={this.state.dialogOpen} onClose={this.handleDialogClose}>
          <DialogTitle>Congratulations!</DialogTitle>
          <DialogContent>
            You reach the maximum limit of moves, game over.
	    You've collect treasure with a total value of {this.state.score} in{" "}
            {this.state.seconds} seconds!
          </DialogContent>
          <DialogActions>
            <Button variant="text" onClick={this.handleDialogClose}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={this.state.snackbarOpen}
          message={this.state.snackbarText}
          onClose={this.handleSnackbarClose}
        />
      </div>
    );
  }
}

export default Game;
