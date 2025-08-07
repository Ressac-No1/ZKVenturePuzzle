pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

template IsZeroMultK() {
  signal input in;
  signal input k;
  signal output out;

  signal inv;

  inv <-- in != 0 ? k / in : 0;
  out <== -in * inv + k;

  in * out === 0;
}

template VenturePuzzle(gridC, gridR, maxMove) {
  // ASSERTIONS
  assert(gridC >= 2);
  assert(gridC <= 15);
  assert(gridR >= 2);
  assert(gridR <= 15);
  assert(maxMove >= 1);
  assert(maxMove <= gridC * gridR);

  // PUBLIC INPUT SIGNALS
  signal input account;
  signal input puzzleChecksum;

  // PRIVATE INPUT SIGNALS
  signal input dirLimits[gridC * gridR];
  signal input treasureValues[gridC * gridR];
  signal input stepList[maxMove + 1];

  // INTERMEDIATE SIGNALS
  signal rowOfStepList[maxMove + 1];
  signal columnOfStepList[maxMove + 1];
  signal tempProdOfPuzzleChecksum[gridC * gridR - 1];
  signal tempProdOfStepMatches[gridC * gridR * maxMove];

  // OUTPUT SIGNAL
  signal output score;

  // VERIFY THE PUZZLE CHECKSUM
  tempProdOfPuzzleChecksum[0] <== account * (dirLimits[0] * maxMove + treasureValues[0]) + (dirLimits[1] * maxMove + treasureValues[1]);
  for (var i = 1; i < gridC * gridR - 1; i++)
    tempProdOfPuzzleChecksum[i] <== account * tempProdOfPuzzleChecksum[i - 1] + (dirLimits[i + 1] * maxMove + treasureValues[i + 1]);
  puzzleChecksum === tempProdOfPuzzleChecksum[gridC * gridR - 2];

  // PROVE EVERY MOVE WITHIN THE GRID
  component isValidTileIdx[maxMove + 1];
  for (var i = 0; i <= maxMove; i++) {
    isValidTileIdx[i] = LessThan(8);
    isValidTileIdx[i].in[0] <== stepList[i];
    isValidTileIdx[i].in[1] <== gridC * gridR;
    rowOfStepList[i] <-- stepList[i] \ gridC;
    columnOfStepList[i] <-- stepList[i] % gridC;

    isValidTileIdx[i].out === 1;
    rowOfStepList[i] * gridC + columnOfStepList[i] === stepList[i];
  }

  // PROVE EVERY MOVE IS ONE OF (UP, RIGHT, DOWN, LEFT, STAY)
  component moveUp[maxMove];
  component moveRight[maxMove];
  component moveDown[maxMove];
  component moveLeft[maxMove];
  component stay[maxMove];
  for (var i = 0; i < maxMove; i++) {
    moveUp[i] = IsZero();
    moveUp[i].in <== stepList[i] - stepList[i + 1] - gridC;
    moveRight[i] = IsZero();
    moveRight[i].in <== stepList[i] + 1 - stepList[i + 1] + rowOfStepList[i] - rowOfStepList[i + 1];
    moveDown[i] = IsZero();
    moveDown[i].in <== stepList[i] + gridC - stepList[i + 1];
    moveLeft[i] = IsZero();
    moveLeft[i].in <== stepList[i] - stepList[i + 1] - 1 + rowOfStepList[i] - rowOfStepList[i + 1];
    stay[i] = IsZero();
    stay[i].in <== stepList[i] - stepList[i + 1];

    moveUp[i].out + moveRight[i].out + moveDown[i].out + moveLeft[i].out + stay[i].out === 1;
  }

  // PROVE EVERY MOVE FOLLOWS THE DIRECTION LIMIT
  component stepMatches[maxMove * gridC * gridR];
  component noDirLimit0[maxMove];
  component noDirLimit1[maxMove];
  component dirLimitToBits[maxMove];
  component moveUpAllowed[maxMove];
  component moveRightAllowed[maxMove];
  component moveDownAllowed[maxMove];
  component moveLeftAllowed[maxMove];
  component moveAllowed[maxMove];
  for (var i = 0; i < maxMove; i++) {
    var dirLimit = 0;
    for (var j = 0; j < gridC * gridR; j++) {
      stepMatches[i * gridC * gridR + j] = IsZeroMultK();
      stepMatches[i * gridC * gridR + j].in <== stepList[i] - j;
      stepMatches[i * gridC * gridR + j].k <== dirLimits[j];
      dirLimit += stepMatches[i * gridC * gridR + j].out;
    }
    noDirLimit0[i] = IsZero();
    noDirLimit0[i].in <== dirLimit;
    noDirLimit1[i] = GreaterThan(5);
    noDirLimit1[i].in[0] <== dirLimit;
    noDirLimit1[i].in[1] <== 14;
    dirLimitToBits[i] = Num2Bits(5);
    dirLimitToBits[i].in <== dirLimit;

    moveUpAllowed[i] = IsZeroMultK();
    moveUpAllowed[i].in <== 1 - dirLimitToBits[i].out[3];
    moveUpAllowed[i].k <== moveUp[i].out;
    moveRightAllowed[i] = IsZeroMultK();
    moveRightAllowed[i].in <== 1 - dirLimitToBits[i].out[2];
    moveRightAllowed[i].k <== moveRight[i].out;
    moveDownAllowed[i] = IsZeroMultK();
    moveDownAllowed[i].in <== 1 - dirLimitToBits[i].out[1];
    moveDownAllowed[i].k <== moveDown[i].out;
    moveLeftAllowed[i] = IsZeroMultK();
    moveLeftAllowed[i].in <== 1 - dirLimitToBits[i].out[0];
    moveLeftAllowed[i].k <== moveLeft[i].out;

    moveAllowed[i] = GreaterThan(3);
    moveAllowed[i].in[0] <==
      noDirLimit0[i].out +
      noDirLimit1[i].out +
      moveUpAllowed[i].out +
      moveRightAllowed[i].out +
      moveDownAllowed[i].out +
      moveLeftAllowed[i].out +
      stay[i].out;
    moveAllowed[i].in[1] <== 0;

    moveAllowed[i].out === 1;
  }

  // CALCULATE THE SCORE (TOTAL TREASURE VALUE COLLECTED)
  var totalScore = 0;
  component scoreByTile[gridC * gridR];
  for (var i = 0; i < gridC * gridR; i++) {
    tempProdOfStepMatches[i * maxMove] <== stepList[1] - i;
    for (var j = 1; j < maxMove; j++) 
      tempProdOfStepMatches[i * maxMove + j] <== tempProdOfStepMatches[i * maxMove + j - 1] * (stepList[j + 1] - i);
    scoreByTile[i] = IsZeroMultK();
    scoreByTile[i].in <== tempProdOfStepMatches[(i + 1) * maxMove - 1];
    scoreByTile[i].k <== treasureValues[i];
    totalScore += scoreByTile[i].out;
  }

  score <== totalScore;
}

component main {public [account, puzzleChecksum]} = VenturePuzzle(6, 4, 15);
