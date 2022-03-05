export { solve as solution };

function solve(burgerKings) {
  // TODO plan
  // 1. brut force solution with best happiness path
  // 2. add logs to get path from this one
  // 3. find small test with the bug (probably)

  let maxBestHappiness = 0;

  const xToBitMap = burgerKings.map((burgerKing) => burgerKing[0]);
  xToBitMap.push(-1); // fake x to move non-negative xs to index 1
  xToBitMap.sortNumbers();

  // TODO debug
  const debug = { prevIndex: new Array(xToBitMap.length), pathVariation: [] };
  // const bestPath = [2427, 2470, 2555, 2567, 2791, 3085, 3054, 2926, 2941, 2933, 2934, 2935, 2936];
  const bestPath =[4, 1];
  let bestPathIndex = 0;
  let bestPathHappiness = 0;
  // TODO debug

  const bs = new BTracker(xToBitMap.length);

  for (const [x, a, b] of burgerKings) {
    // TODO debug
    if (bestPath[bestPathIndex] === x) {
      const bestPathPrevIndex = bestPathIndex - 1;
      const bestPathPrevX = bestPathPrevIndex < 0 ? undefined : bestPath[bestPathPrevIndex];
      const baseB = bestPathPrevIndex < 0 ? 0 :
                    bestPathPrevX < x ? bs.fromLeft(xToBitMap.binSearchL(bestPathPrevX) - 1) :
                                        bs.fromRight(xToBitMap.binSearchL(bestPathPrevX) + 1);
      const B = bestPathPrevIndex < 0 ? 0 :
                bestPathPrevX < x ? bs.fromLeft(xToBitMap.binSearchL(x)) :
                                    bs.fromRight(xToBitMap.binSearchL(x));
      const adjustment = B - baseB;
      bestPathHappiness += a - adjustment;
      ++bestPathIndex;
    }
    // TODO debug

    bs.add(xToBitMap.binSearchL(x), b);
  }

  const happiness = new Happiness(xToBitMap.length, bs);

  for (let i = burgerKings.length - 1; i >= 0; --i) {
    const [ x, a, b] = burgerKings[i];
    const index = xToBitMap.binSearchL(x);

    const bestRight = happiness.fromRight(index);
    let withBestRight = a;

    if (bestRight) {
      withBestRight = a + bestRight.bestHappiness;
      debug.bestRightIndex = bestRight.index; // TODO debug
    }

    const bestLeft = happiness.fromLeft(index);
    let withBestLeft = a;

    if (bestLeft) {
      withBestLeft = a + bestLeft.bestHappiness;
      debug.bestLeftIndex = bestLeft.index; // TODO debug
    }

    const bestHappiness = Math.max(a, withBestLeft, withBestRight);

    // TODO debug
    if ((Number.isInteger(withBestLeft) || Number.isInteger(withBestRight)) &&
        (a === withBestLeft || a === withBestRight || withBestLeft === withBestRight))
    {
      debug.pathVariation.push(index);
    }

    if (bestHappiness === a) {
      debug.prevIndex[index] = -1;
    }
    else if (bestHappiness === withBestLeft) {
      debug.prevIndex[index] = debug.bestLeftIndex;
    }
    else if (bestHappiness === withBestRight) {
      debug.prevIndex[index] = debug.bestRightIndex;
    }
    else {
      debug.prevIndex[index] = -5;
    }

    if (bestHappiness > maxBestHappiness) {
      debug.maxBestIndex = index;
    }
    // TODO debug

    maxBestHappiness = Math.max(maxBestHappiness, bestHappiness);

    bs.remove(index, b);
    happiness.set(index, bestHappiness);
  }

  // TODO debug
  debug.bestPath = [];
  let index = debug.maxBestIndex;
  while(index > 0) {
    debug.bestPath.push(xToBitMap[index]);
    index = debug.prevIndex[index];
  }
  console.log('last index is ', index);
  console.log('bestPath = ', debug.bestPath);
  debug.pathVariation.sortNumbers();

  for (let l = 0; l < debug.pathVariation.length; l += 100) {
    console.log('path variation', debug.pathVariation.slice(l, l + 100));
  }
  // TODO debug

  return maxBestHappiness;
}

const Bit = {
  last: (v) => v & -v,
  inc: (v) => v + Bit.last(v),
  dec: (v) => v - Bit.last(v),
  _indexes: function* (next, modifier, v, length, last) {
    const inRange = (i) => i > 0 && i < length;

    if (inRange(v)) {
      let lastI = v;
      yield lastI;

      for(let i = next(modifier(v)); inRange(i); i = next(i)) {
        lastI = modifier(i);
        yield lastI;
      }

      if (Number.isInteger(last) && lastI !== last) {
        yield last;
      }
    }
  },
  incIndexes: function* (v, length, needLast = false) {
    yield* Bit._indexes(Bit.inc, (i) => i, v, length, needLast ? length - 1 : undefined);
  },
  decIndexes: function* (v, length, needLast = false) {
    yield* Bit._indexes(Bit.dec, (i) => i, v, length, needLast ? 1 : undefined);
  },
  leftIncIndexes: function* (v, length, needLast = false) {
    yield* Bit._indexes(Bit.inc, (i) => length - i, v, length, needLast ? 1 : undefined);
  },
  leftDecIndexes: function* (v, length, needLast = false) {
    yield* Bit._indexes(Bit.dec, (i) => length - i, v, length, needLast ? length - 1 : undefined);
  }
};

class Happiness {
  constructor(length, bs) {
    this.bestRight = new Array(length);
    this.bestLeft = new Array(length);
    this.bs = bs;
  }

  set(index, happiness) {
    const baseBRight = this.bs.fromRight(index + 1);

    for (const i of Bit.leftIncIndexes(index, this.bestRight.length)) {
      let adjustedHappiness = happiness;

      if (i !== index) {
        const b = this.bs.fromRight(i);
        adjustedHappiness = happiness - b + baseBRight;
      }

      if (!this.bestRight[i] || this.bestRight[i].bestHappiness <= adjustedHappiness) {
        this.bestRight[i] = this.bestRight[i] || {};
        this.bestRight[i].index = index;
        this.bestRight[i].bestHappiness = adjustedHappiness;
      }

      if (i === index) {
        this.bestRight[i].ownHappiness = adjustedHappiness;
      }
    }

    const baseBLeft = this.bs.fromLeft(index - 1);

    for (const i of Bit.incIndexes(index, this.bestLeft.length)) {
      let adjustedHappiness = happiness;

      if (i !== index) {
        const b = this.bs.fromLeft(i);
        adjustedHappiness = happiness - b + baseBLeft;
      }

      if (!this.bestLeft[i] || this.bestLeft[i].bestHappiness <= adjustedHappiness) {
        this.bestLeft[i] = this.bestLeft[i] || {};
        this.bestLeft[i].index = index;
        this.bestLeft[i].bestHappiness = adjustedHappiness;
      }

      if (i === index) {
        this.bestLeft[i].ownHappiness = adjustedHappiness;
      }
    }
  }

  fromRight (index) {
    let best;
    const baseBLeft = this.bs.fromLeft(index - 1);

    for (const i of Bit.leftDecIndexes(index, this.bestRight.length)) {
      if (this.bestRight[i]) {
        const bestRightIndex = this.bestRight[i].index;
        const bestRightHappiness = this.bestRight[bestRightIndex].ownHappiness;
        const bLeft = this.bs.fromLeft(bestRightIndex);
        const bestRightAdjustedHappiness = bestRightHappiness - bLeft + baseBLeft;

        if (!best || best.bestHappiness < bestRightAdjustedHappiness) {
          best = {index: bestRightIndex, bestHappiness: bestRightAdjustedHappiness};
        }
      }
    }

    return best;
  }

  fromLeft (index) {
    let best;
    const baseBRight = this.bs.fromRight(index + 1);

    for (const i of Bit.decIndexes(index, this.bestLeft.length)) {
      if (this.bestLeft[i]) {
        const bestLeftIndex = this.bestLeft[i].index;
        const bestLeftHappiness = this.bestLeft[bestLeftIndex].ownHappiness;
        const bRight = this.bs.fromRight(bestLeftIndex);
        const bestLeftAdjustedHappiness = bestLeftHappiness - bRight + baseBRight;

        if (!best || best.bestHappiness < bestLeftAdjustedHappiness) {
          best = {index: bestLeftIndex, bestHappiness: bestLeftAdjustedHappiness};
        }
      }
    }

    return best;
  }
}

class BTracker {
  constructor(length) {
    this.bRight = new Array(length).fill(0);
    this.bLeft = new Array(length).fill(0);
  }

  add(index, b) {
    for (const i of Bit.leftIncIndexes(index, this.bRight.length)) {
      this.bRight[i] += b;
    }

    for (const i of Bit.incIndexes(index, this.bLeft.length)) {
      this.bLeft[i] += b;
    }
  }

  remove(index, b) {
    for (const i of Bit.leftIncIndexes(index, this.bRight.length)) {
      this.bRight[i] -= b;
    }

    for (const i of Bit.incIndexes(index, this.bLeft.length)) {
      this.bLeft[i] -= b;
    }
  }

  fromRight (index) {
    let b = 0;

    for (const i of Bit.leftDecIndexes(index, this.bRight.length)) {
      b += this.bRight[i];
    }

    return b;
  }

  fromLeft (index) {
    let b = 0;

    for (const i of Bit.decIndexes(index, this.bLeft.length)) {
      b += this.bLeft[i];
    }

    return b;
  }
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