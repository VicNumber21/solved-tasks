export function queensAttack(n, k, queenRow, queenCol, obstacles) {
  let obstacleRowIndex = 0;
  let obstacleColIndex = 1;

  let sum = queenCol + queenRow;
  let diff = queenCol - queenRow;
  let topRow = n + 1;
  let bottomRow = 0;
  let leftCol = 0;
  let rightCol = n + 1;
  let topLeftCol = sum <= n + 1 ? 0 : sum - n - 1;
  let bottomRightCol = sum <= n + 1 ? sum : n + 1;
  let bottomLeftCol = diff >= 0 ? diff : 0;
  let topRightCol = diff >= 0 ? n + 1 : n + diff + 1;

  obstacles.forEach((obstackle) => {
    let obstacleCol = obstackle[obstacleColIndex];
    let obstacleRow = obstackle[obstacleRowIndex];

    if (queenCol === obstacleCol) {
      if (bottomRow < obstacleRow && obstacleRow < queenRow) {
        bottomRow = obstacleRow;
      }
      else if (queenRow < obstacleRow && obstacleRow < topRow) {
        topRow = obstacleRow;
      }
    }
    else if (queenRow === obstacleRow) {
      if (leftCol < obstacleCol && obstacleCol < queenCol) {
        leftCol = obstacleCol;
      }
      else if (queenCol < obstacleCol && obstacleCol < rightCol) {
        rightCol = obstacleCol;
      }
    }
    else if (obstacleCol + obstacleRow === sum) {
      if (topLeftCol < obstacleCol && obstacleCol < queenCol) {
        topLeftCol = obstacleCol;
      }
      else if (queenCol < obstacleCol && obstacleCol < bottomRightCol) {
        bottomRightCol = obstacleCol;
      }
    }
    else if (obstacleCol - obstacleRow === diff) {
      if (bottomLeftCol < obstacleCol && obstacleCol < queenCol) {
        bottomLeftCol = obstacleCol;
      }
      else if (queenCol < obstacleCol && obstacleCol < topRightCol) {
        topRightCol = obstacleCol;
      }
    }
  });

  return (topRow - bottomRow - 2) +
          (rightCol - leftCol - 2) +
          (topRightCol - bottomLeftCol - 2) +
          (bottomRightCol - topLeftCol - 2);
}
