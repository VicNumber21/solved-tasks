export { solve as solution };

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
    const happiness = new Happiness(index, maxCurrentValue, b, bCounter, i + 1, bestHappiness);
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
  }

  addB(index, b) {
    if (!this.rBs) {
      this.rBs = new BTreeCounter();
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

class BTreeCounter {
  fromPastToFuture(pastIndex, futureIndex) {
    let b = 0;

    if (pastIndex !== futureIndex) {
      const pastCount = pastIndex < futureIndex ? this.forIndex(pastIndex - 1) : this.forIndex(pastIndex);
      const futureCount = pastIndex < futureIndex ? this.forIndex(futureIndex - 1) : this.forIndex(futureIndex);
      b = Math.abs(futureCount - pastCount);
    }

    return b;
  }

  forIndex(index) {
    return this._forKey(index, this.root);
  }

  _forKey(key, node) {
    let bCount = 0;

    if (node) {
      if (key < node.key) {
        bCount += this._forKey(key, node.left);
      }
      else if (key > node.key) {
        bCount += node.leftSum() + node.value() + this._forKey(key, node.right);
      }
      else {
        bCount += node.leftSum() + node.value();
      }
    }

    return bCount;
  }

  add(key, value) {
    const node = new BTreeCounterNode(key, value);
    this.root = this._insert(this.root, node);
  }

  _insert(treeNode, newNode) {
    let node = newNode;

    if (treeNode) {
      if (newNode.key < treeNode.key) {
        const absChildBalance = treeNode.left ? Math.abs(treeNode.left.balance) : -1;
        treeNode.data.leftSum += newNode.data.value;
        treeNode.left = this._insert(treeNode.left, newNode);
        treeNode.balance -= absChildBalance < Math.abs(treeNode.left.balance) ? 1 : 0;
      }
      else {
        const absChildBalance = treeNode.right ? Math.abs(treeNode.right.balance) : -1;
        treeNode.data.rightSum += newNode.data.value;
        treeNode.right = this._insert(treeNode.right, newNode);
        treeNode.balance += absChildBalance < Math.abs(treeNode.right.balance) ? 1 : 0;
      }

      node = this._balance(treeNode);
    }

    return node;
  }

  _balance(node) {
    if (!node.isBalanced()) {
      const [ LeftLeftCase, LeftRightCase, RightLeftCase, RightRightCase ] = [ -3, -1 , 1, 3 ];

      // noinspection FallThroughInSwitchStatementJS
      switch (node.imbalanceCase()) {
        case LeftRightCase:
          node.left = this._rotateLeft(node.left);
        case LeftLeftCase:
          node = this._rotateRight(node);
          break;

        case RightLeftCase:
          node.right = this._rotateRight(node.right);
        case RightRightCase:
          node = this._rotateLeft(node);
          break;
      }
    }

    return node;
  }

  _rotateLeft(node) {
    const [ leftNode, rightNode ] = [ node, node.right ];
    const leftOfRightNode = rightNode.left;
    [ rightNode.left, leftNode.right ] = [ leftNode, leftOfRightNode ];

    leftNode.data.rightSum = leftOfRightNode ? leftOfRightNode.fullSum() : 0;
    rightNode.data.leftSum = leftNode.fullSum();

    leftNode.balance = leftNode.balance - 1 - Math.max(rightNode.balance, 0);
    rightNode.balance = rightNode.balance - 1 + Math.min(leftNode.balance, 0);

    return rightNode;
  }

  _rotateRight(node) {
    const [ rightNode, leftNode ] = [ node, node.left ];
    const rightOfLeftNode = leftNode.right;
    [ leftNode.right, rightNode.left ] = [ rightNode, rightOfLeftNode ];

    rightNode.data.leftSum = rightOfLeftNode ? rightOfLeftNode.fullSum() : 0;
    leftNode.data.rightSum = rightNode.fullSum();

    rightNode.balance = rightNode.balance + 1 - Math.min(leftNode.balance, 0);
    leftNode.balance = leftNode.balance + 1 + Math.max(rightNode.balance, 0);

    return leftNode;
  }
}

class BTreeCounterNode {
  constructor(key, value) {
    [ this.key, this.data, this.balance ] = [ key, { value, leftSum: 0, rightSum: 0 },  0 ];
  }

  fullSum() {
    return this.data.leftSum + this.data.value + this.data.rightSum;
  }

  leftSum() {
    return this.data.leftSum;
  }

  value() {
    return this.data.value;
  }

  isBalanced() {
    return Math.abs(this.balance) < 2;
  }

  imbalanceCase() {
    let ret = this.balance;
    ret += this.balance < 0 ? this.left.balance : this.right.balance;

    return ret;
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