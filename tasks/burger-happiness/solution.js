export { solve as solution };

function solve(burgerKings) {
  let maxBestHappiness = 0;
  const sorted = Array.from(burgerKings).sort(([x1], [x2]) => x1 - x2);
  const xToBitMap = sorted.map((burgerKing) => burgerKing[0]);
  const bs = sorted.map((burgerKing) => burgerKing[2]);
  const happinessTracker = new Array(burgerKings.length).fill(0);

  for (let i = burgerKings.length - 1; i >= 0; --i) {
    const [ x, a] = burgerKings[i];
    const index = xToBitMap.binSearchL(x);
    const bestHappiness = happinessTracker[index];
    const withBestHappiness = bestHappiness + a;
    const maxCurrentValue = Math.max(a, withBestHappiness);
    maxBestHappiness = Math.max(maxBestHappiness, maxCurrentValue);
    bs[index] = 0;

    let jHappiness = maxCurrentValue;
    for (let j = index; j >= 0 && (jHappiness - bs[j]) > 0; --j) {
      jHappiness -= bs[j];
      happinessTracker[j] = Math.max(happinessTracker[j], jHappiness);
    }

    jHappiness = maxCurrentValue;
    for (let j = index + 1; j < happinessTracker.length && (jHappiness - bs[j]) > 0; ++j) {
      jHappiness -= bs[j];
      happinessTracker[j] = Math.max(happinessTracker[j], jHappiness);
    }
  }

  return maxBestHappiness;
}

Array.prototype.binSearchL = function (value, firstIndex = 0, lastIndex = this.length - 1) {
  let low = firstIndex;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.ceil((low + high) / 2);

    if (this[mid] < value) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return low;
}

Array.prototype.sortNumbers = function () {
  return this.sort((x1, x2) => x1 - x2);
}