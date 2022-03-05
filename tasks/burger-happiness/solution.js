export { solve as solution };

// TODO remove
const debug = {};

function solve(burgerKings) {
  let maxBestHappiness = 0;

  const xToBitMap = burgerKings.map((burgerKing) => burgerKing[0]);
  xToBitMap.push(-1); // fake x to move non-negative xs to index 1
  xToBitMap.sortNumbers();

  const bCounter = new BCounter(xToBitMap.length);
  const happinessTracker = new HappinessTracker(xToBitMap.length);

  for (const [x,, b] of burgerKings) {
    bCounter.add(xToBitMap.binSearchL(x), b);
  }

  for (let i = burgerKings.length - 1; i >= 0; --i) {
    const [ x, a, b] = burgerKings[i];
    const index = xToBitMap.binSearchL(x);
    const bestHappiness = happinessTracker.get(index);
    const withBestHappiness = bestHappiness ? a + bestHappiness.valueAt(index) : a;
    const maxCurrentValue = Math.max(a, withBestHappiness);
    maxBestHappiness = Math.max(maxBestHappiness, maxCurrentValue);
    const happiness = new Happiness(index, maxCurrentValue, b, bCounter);
    happinessTracker.set(happiness);
    bCounter.remove(index, b);
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

class HappinessTracker {
  constructor(length) {
    this.bitsFromLeft = { bests: new Array(length), incIndexes: Bit.incIndexes, decIndexes: Bit.decIndexes };
    this.bitsFromRight = { bests: new Array(length), incIndexes: Bit.leftIncIndexes, decIndexes: Bit.leftDecIndexes };
  }

  _set(bits, happiness) {
    for (const i of bits.incIndexes(happiness.index, bits.bests.length)) {
      const bestHappiness = bits.bests[i];

      if (!bestHappiness && happiness.valueAt(i) > 0 || bestHappiness && bestHappiness.valueAt(i) < happiness.valueAt(i)) {
        bits.bests[i] = happiness;
      }
    }

    if (bits.cached) {
      bits.cached.addB(happiness.index, happiness.b);
    }
  }

  set(happiness) {
    this._set(this.bitsFromLeft, happiness);
    this._set(this.bitsFromRight, happiness);
  }

  _get(bits, index) {
    let best;
    let bestI;

    for(const i of bits.decIndexes(index, bits.bests.length)) {
      const current = bits.bests[i];

      if (!best && current || best && current && best !== current && best.valueAt(bestI) < current.valueAt(bestI)) {
        bestI = i;
        best = current;
      }
    }

    return best;
  }

  get(index) {
    this.bitsFromLeft.cached = this._get(this.bitsFromLeft, index);
    this.bitsFromRight.cached = this._get(this.bitsFromRight, index);

    let best = !this.bitsFromLeft.cached ? this.bitsFromRight.cached :
               !this.bitsFromRight.cached ? this.bitsFromLeft.cached :
               this.bitsFromLeft.cached.valueAt(index) > this.bitsFromRight.cached.valueAt(index) ?
                                            this.bitsFromLeft.cached : this.bitsFromRight.cached;

    return best;
  }
}

class Happiness {
  constructor(index, value, b, bCounter) {
    this.bCounter = bCounter;
    this.cache = new Map();
    this.index = index;
    this.b = b;
    this.value = value;

    // TODO remove
    if (!debug.ownHappiness) {
      debug.ownHappiness = new Array(this.bCounter.length);
    }

    debug.ownHappiness[index] = value;
    // TODO remove
  }

  addB(index, b) {
    if (!this.rBs) {
      this.rBs = new BCounter(this.bCounter.length);
    }

    this.rBs.add(index, b);
  }

  valueAt(pastIndex) {
    let value = pastIndex === this.index ? this.value : this.cache.get(pastIndex);

    if (value === undefined) {
      const currentB = this.bCounter.fromPastToFuture(pastIndex, this.index);
      const deltaB = this.rBs ? this.rBs.fromPastToFuture(pastIndex, this.index) : 0;
      value = this.value - currentB - deltaB;
      this.cache.set(pastIndex, value);
    }

    return value;
  }
}

class BCounter {
  constructor(length) {
    this.bs = new Array(length);
  }

  get length() {
    return this.bs.length;
  }

  add(index, b) {
    for (const i of Bit.incIndexes(index, this.bs.length)) {
      const current = this.bs[i] || 0;
      this.bs[i] = current + b;
    }
  }

  remove(index, b) {
    for (const i of Bit.incIndexes(index, this.bs.length)) {
      this.bs[i] -= b;
    }
  }

  forIndex(index) {
    let bCount = 0;

    for (const i of Bit.decIndexes(index, this.bs.length)) {
      bCount += this.bs[i] || 0;
    }

    return bCount;
  }

  fromPastToFuture(pastIndex, futureIndex) {
    let b = 0;

    if (pastIndex !== futureIndex) {
      const pastCount = pastIndex < futureIndex ? this.forIndex(pastIndex - 1) : this.forIndex(pastIndex);
      const futureCount = pastIndex < futureIndex ? this.forIndex(futureIndex - 1) : this.forIndex(futureIndex);
      b = Math.abs(futureCount - pastCount);
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