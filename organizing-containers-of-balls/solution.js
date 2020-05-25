export function organizingContainers(container) {
  let n = container.length;
  let colorsSum = new Map();
  let boxesSum = new Map();

  for(let i = 0; i < n; ++i) {
    let iColorSum = 0;
    let iBoxSum = 0;

    for(let j = 0; j < n; ++j) {
      iColorSum += container[j][i];
      iBoxSum += container[i][j];
    }

    countSum(colorsSum, iColorSum);
    countSum(boxesSum, iBoxSum);
  }

  for(let [sum, colorCount] of colorsSum) {
    let boxCount = boxesSum.get(sum) || 0;

    if (boxCount === colorCount) {
      boxesSum.delete(sum);
    }
  }

  return boxesSum.size === 0 ? 'Possible' : 'Impossible' ;
}

// Internals
function countSum(map, sum) {
  let count = map.get(sum) || 0;
  map.set(sum, count + 1);
}

