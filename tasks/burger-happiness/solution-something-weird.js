export { solve as solution };

function solve(burgerKings) {
  let maxBestHappiness = 0;

  const xToBitMap = burgerKings.map((burgerKing) => burgerKing[0]);
  xToBitMap.push(-1); // fake x to move non-negative xs to index 1
  xToBitMap.sortNumbers();

  const bs = new BTracker(xToBitMap.length);
  const happiness = new Happiness(xToBitMap.length, bs);

  for (const [ x, a, b ] of burgerKings) {
    const index = xToBitMap.binSearchL(x);

    const bestRight = happiness.fromRight(index);
    let withBestRight = a;

    if (bestRight) {
      withBestRight = a + bestRight.bestHappiness;
    }

    const bestLeft = happiness.fromLeft(index);
    let withBestLeft = a;

    if (bestLeft) {
      withBestLeft = a + bestLeft.bestHappiness;
    }

    const bestHappiness = Math.max(a, withBestLeft, withBestRight);
    maxBestHappiness = Math.max(maxBestHappiness, bestHappiness);

    bs.add(index, b);
    happiness.set(index, bestHappiness);
  }

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
    this.bestRight[index] = this.bestRight[index] || {};
    this.bestRight[index].ownHappiness = happiness;
    let bestRight = { index: index, ownHappiness: happiness, baseB: this.bs.fromRight(index + 1) };

    for (const i of Bit.leftIncIndexes(index, this.bestRight.length)) {
      const b = this.bs.fromRight(i);
      bestRight.bestHappiness = bestRight.ownHappiness - b + bestRight.baseB;
      const foundRight = this._fromRight(i);
      const currentIndex = foundRight ? foundRight.index : undefined;

      if (currentIndex !== undefined) {
        const currentRight = currentIndex === undefined ? undefined :
          { index: currentIndex, ownHappiness: this.bestRight[currentIndex].ownHappiness, baseB: this.bs.fromRight(currentIndex + 1) };
        currentRight.bestHappiness = currentRight.ownHappiness - b + currentRight.baseB;

        if (bestRight.bestHappiness < currentRight.bestHappiness ||
          bestRight.bestHappiness === currentRight.bestHappiness && currentRight.index < bestRight.index)
        {
          bestRight = currentRight;
        }

        if (foundRight.foundIndex !== i) {
          // TODO how to update it?
        }
      }

      this.bestRight[i] = this.bestRight[i] || {};
      this.bestRight[i].index = bestRight.index;
      this.bestRight[i].bestHappiness = bestRight.bestHappiness;
    }

    this.bestLeft[index] = this.bestLeft[index] || {};
    this.bestLeft[index].ownHappiness = happiness;
    let bestLeft = { index: index, ownHappiness: happiness, baseB: this.bs.fromLeft(index - 1) };

    for (const i of Bit.incIndexes(index, this.bestLeft.length)) {
      const b = this.bs.fromLeft(i);
      bestLeft.bestHappiness = bestLeft.ownHappiness - b + bestLeft.baseB;
      const foundLeft = this._fromLeft(i);
      const currentIndex = foundLeft ? foundLeft.index : undefined;

      if (currentIndex !== undefined) {
        const currentLeft = currentIndex === undefined ? undefined :
          { index: currentIndex, ownHappiness: this.bestLeft[currentIndex].ownHappiness, baseB: this.bs.fromLeft(currentIndex - 1) };
        currentLeft.bestHappiness = currentLeft.ownHappiness - b + currentLeft.baseB;

        if (bestLeft.bestHappiness < currentLeft.bestHappiness ||
          bestLeft.bestHappiness === currentLeft.bestHappiness && currentLeft.index < bestLeft.index)
        {
          bestLeft = currentLeft;
        }

        if (foundLeft.foundIndex !== i) {
          // TODO how to update it?
        }
      }

      this.bestLeft[i] = this.bestLeft[i] || {};
      this.bestLeft[i].index = bestLeft.index;
      this.bestLeft[i].bestHappiness = bestLeft.bestHappiness;
    }
  }

  _fromRight (index) {
    let best;

    for (const i of Bit.leftDecIndexes(index, this.bestRight.length)) {
      if (this.bestRight[i]) {
        const { index, bestHappiness } = this.bestRight[i];
        best = { index, bestHappiness, foundIndex: i};
        break;
      }
    }

    return best;
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
          break; // TODO remove whole if except best =
        }
      }
    }

    return best;
  }

  _fromLeft (index) {
    let best;

    for (const i of Bit.decIndexes(index, this.bestLeft.length)) {
      if (this.bestLeft[i]) {
        const { index, bestHappiness } = this.bestLeft[i];
        best = { index, bestHappiness, foundIndex: i};
        break;
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
          break; // TODO remove whole if except best =
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