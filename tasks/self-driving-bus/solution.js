export { solve as solution };

const maxInt = Number.MAX_SAFE_INTEGER;

function solve(roads) {
  const treeLand = new Graph(roads);
  let segmentCount = 0;
  const cityCount = treeLand.order();
  const intervalTracker = new Interval(1, cityCount);
  const crossQueue = Array.from(treeLand.crosses()).sort(
    (city1, city2) => treeLand.neighbours(city2).size - treeLand.neighbours(city1).size);

  for (const cross of crossQueue) {
    if (treeLand.isCross(cross)) {
      segmentCount += countForCity(treeLand, cross, intervalTracker);
    }
  }

  const leaves = Array.from(treeLand.leaves());

  while (leaves.length > 0) {
    const leaf = leaves.pop();

    if (treeLand.isLeaf(leaf)) {
      const route = [];
      treeLand.dfs({ start: leaf, visit: (visitingCity) => route.push(visitingCity) });

      const queue = binSearchSplit(route);

      for (const city of queue) {
        segmentCount += countForCity(treeLand, city, intervalTracker);
      }
    }
  }

  return segmentCount + treeLand.singles().size;
}

function binSearchSplit(array) {
  const result = [];
  let queue = [{ left: 0, right: array.length - 1}];

  while (queue.length > 0) {
    const currentQueue = queue;
    queue = [];

    for (const { left, right} of currentQueue) {
      let middle = (left + right) >> 1;
      middle = middle % 2 === 0 ? middle + 1 : middle;
      result.push(array[middle]);

      if (middle - left > 1) {
        queue.push({ left, right: middle - 1});
      }

      if (right - middle > 1) {
        queue.push({ left: middle + 1, right});
      }
    }
  }

  return result;
}

function countForCity(treeLand, city, intervalTracker) {
  const interval = intervalTracker.findInterval(city);
  const map = explore(treeLand, city, interval);
  treeLand.removeVertex(city);
  intervalTracker.addPoint(city);

  return countByMapOnInterval(map, city, interval);
}

function countByMapOnInterval(map, city, interval) {
  let count = 0;
  const leftMap = new Map();
  const counted = new Map();
  let prevSegment = {};
  let segment = { left: city, right: city };
  let lastSolution = { left: city, right: city };
  const lastSegment = { left: interval.left + 1, right: interval.right -1 };

  while (segment.left !== prevSegment.left || segment.right !== prevSegment.right) {
    const leftCounts = new Map();
    prevSegment = segment;
    let prevLeftSegment = { left: segment.left, right: segment.right };
    let chainCount = 0;
    let cityNeighbourCount = 0;

    for (let left = segment.left; left > interval.left; --left) {
      const leftValue = map.get(left);
      if (!leftValue) break;
      const leftSegment = {
        left: Math.min(leftValue.min, prevLeftSegment.left),
        right: Math.max(leftValue.max, prevLeftSegment.right)
      };
      if (leftSegment.right > segment.right) break;
      if (chainCount > 2 && leftValue.prevCity === city) break;
      const leftCount = leftSegment.left === left && leftSegment.right === segment.right ? 1 : 0;
      cityNeighbourCount += leftValue.prevCity === city ? 1 : 0;
      const chainFactor = cityNeighbourCount > 1 ? 0 : 1;
      chainCount = chainFactor * (chainCount * leftCount + leftCount);
      leftMap.set(left, {count: leftCount, segment: leftSegment});
      prevLeftSegment = leftSegment;
    }

    for (let leftCount = 0, left = prevLeftSegment.left; left <= lastSolution.left; ++left) {
      const current = leftMap.get(left);
      leftCount += current.count;
      leftCounts.set(left, leftCount);
    }

    let lastRightLeft = prevLeftSegment.left;
    let prevRightSegment = lastSolution;
    chainCount = 0;
    cityNeighbourCount = 0;

    for (let right = segment.right; right < interval.right; ++right) {
      const leftCounted = counted.get(right);

      if (leftCounted !== undefined && prevLeftSegment.left === leftCounted) {
        continue;
      }

      const rightValue = map.get(right);
      if (!rightValue) break;
      const leftValue = leftMap.get(rightValue.min);
      if (!leftValue) break;
      const rightSegment = {
        left: Math.min(prevRightSegment.left, leftValue.segment.left, rightValue.min),
        right: Math.max(prevRightSegment.right, leftValue.segment.right, rightValue.max)
      }
      if ((rightSegment.left < segment.left) || (chainCount > 2 && rightValue.prevCity === city)) {
        lastRightLeft = rightSegment.left;
        break;
      }
      if (chainCount > 2 && rightValue.prevCity === city) break;
      const countedMin = leftCounted === undefined ? maxInt : leftCounted - 1;
      rightSegment.left = Math.min(rightSegment.left, countedMin);
      const leftSolution = leftMap.get(rightSegment.left);
      if (!leftSolution) break;
      const rightCount = rightSegment.left === leftSolution.segment.left && rightSegment.right === right ? 1 : 0;
      cityNeighbourCount += rightValue.prevCity === city ? 1 : 0;
      const chainFactor = cityNeighbourCount > 1 ? 0 : 1;
      chainCount = chainFactor * (chainCount * rightCount + rightCount);
      const tmpLeftCount = leftCounts.get(rightSegment.left);
      const leftCount = rightCount > 0 && tmpLeftCount === 0 ? 1 : tmpLeftCount;
      count += leftCount * rightCount;
      counted.set(right, prevLeftSegment.left);
      prevRightSegment.right = rightSegment.right;
    }

    let mostLeft = prevLeftSegment.left;
    let mostRight = prevRightSegment.right;
    let newSegment = { left: mostLeft, right: mostRight };
    lastSolution = newSegment;

    do {
      segment =  { left: newSegment.left, right: newSegment.right };

      for (let left = segment.left; left >= mostLeft; --left) {
        const leftValue = map.get(left);
        if (leftValue === undefined) break;
        mostLeft = Math.min(mostLeft, leftValue.min);
        mostRight = Math.max(mostRight, leftValue.max);
      }

      for (let right = segment.right; right <= mostRight; ++right) {
        const rightValue = map.get(right);
        if (rightValue === undefined) break;
        mostLeft = Math.min(mostLeft, rightValue.min);
        mostRight = Math.max(mostRight, rightValue.max);
      }

      newSegment = { left: mostLeft, right: mostRight };
    }
    while (segment.left !== newSegment.left || segment.right !== newSegment.right)

    // TODO so ugly! rework everything!
    if (segment.left === lastSegment.left && segment.right === lastSegment.right) {
      break;
    }

    if (segment.left === prevLeftSegment.left && segment.right === prevRightSegment.right) {
      lastSolution.left = lastRightLeft;
    }
  }

  return count;
}

function explore(land, city, interval) {
  const map = new Map();
  map.set(city, { min: city, max: city});

  for (const neighbour of land.neighbours(city)) {
    land.dfs({
      start: neighbour,
      filter: (neighbours) => Array.from(neighbours).filter((neighbour) => {
        return neighbour !== city && isInInterval(neighbour, interval)
      }),
      visit: (visitingCity, prevCity = city) => {
        const { min, max } = map.get(prevCity);

        map.set(visitingCity, {
          prevCity: prevCity,
          min: Math.min(min, visitingCity),
          max: Math.max(max, visitingCity)
        });
      }
    });
  }

  return map;
}

class Graph {
  constructor(roads) {
    this._adjLists = new Map();
    this._singles = new Set();
    this._leaves = new Set();
    this._throughs = new Set();
    this._crosses = new Set();
    this.addVertex(1);

    for (const [u, v] of roads) {
      this.addEdge(u, v);
      this.addEdge(v, u);
    }
  }

  order() {
    return this._adjLists.size;
  }

  neighbours(v) {
    return  this._adjLists.get(v);
  }

  addVertex(v) {
    if (!this._adjLists.has(v)) {
      this._adjLists.set(v, new Set());
      this._singles.add(v);
    }
  }

  removeVertex(v) {
    const vNeighbours = this.neighbours(v);

    for (const neighbour of vNeighbours) {
      this.removeEdge(neighbour, v);
    }

    for (const registrar of [this._adjLists, this._singles, this._leaves, this._throughs, this._crosses]) {
      registrar.delete(v);
    }
  }

  addEdge(u, v) {
    this.addVertex(u);
    const uNeighbours = this.neighbours(u);
    uNeighbours.add(v);

    if (uNeighbours.size === 1) {
      this._singles.delete(u);
      this._leaves.add(u);
    }
    else if (uNeighbours.size === 2) {
      this._leaves.delete(u);
      this._throughs.add(u);
    }
    else if (uNeighbours.size > 2) {
      this._throughs.delete(u);
      this._crosses.add(u);
    }
  }

  removeEdge(u, v) {
    const uNeighbours = this.neighbours(u);
    uNeighbours.delete(v);

    if (uNeighbours.size === 2) {
      this._crosses.delete(u);
      this._throughs.add(u);
    }
    else if (uNeighbours.size === 1) {
      this._throughs.delete(u);
      this._leaves.add(u);
    }
    else if (uNeighbours.size < 1) {
      this._leaves.delete(u);
      this._singles.add(u);
    }
  }

  isSingle(v) {
    return this._singles.has(v);
  }

  singles() {
    return this._singles;
  }

  isLeaf(v) {
    return this._leaves.has(v);
  }

  leaves() {
    return this._leaves;
  }

  isThrough(v) {
    return this._throughs.has(v);
  }

  throughs() {
    return this._throughs;
  }

  isCross(v) {
    return this._crosses.has(v);
  }

  crosses() {
    return this._crosses;
  }

  dfs(ctx) {
    ctx.stack = [];
    this.travers(ctx);
  }

  travers({
    stack,
    start,
    visit = (/* v, u */) => false,
    filter = (neighbours) => neighbours,
    getBack // = (/* u, v */) => {}
  } = {}) {
    const planned = new Set();
    const visitOrder = [];
    stack.push({ v: start });
    planned.add(start);

    while (stack.length > 0) {
      const current = stack.pop();
      const neighbours = filter(this.neighbours(current.v));
      visit(current.v, current.u);

      if (getBack) {
        visitOrder.push(current);
      }

      for (const u of neighbours) {
        if (!planned.has(u)) {
          planned.add(u);
          stack.push({ v: u, u: current.v});
        }
      }
    }

    while (visitOrder.length > 0) {
      const current = visitOrder.pop();
      getBack(current.v, current.u);
    }
  }
}

const Bit = {
  last: (v) => v & -v,
  inc: (v) => v + Bit.last(v),
  dec: (v) => v - Bit.last(v)
};

function isInInterval(x, interval) {
  return x > interval.left && x < interval.right;
}

class Interval {
  constructor(begin, end) {
    const n = end - begin + 1;
    this._begin = begin;
    this._mins = new Array(n);
    this._maxs = new Array(n);
  }

  length () {
    return this._maxs.length;
  }

  addPoint(point) {
    const index = point - this._begin;
    let minIndex = index;
    let maxIndex = index;
    let min;
    let max;

    do {
      this._mins[minIndex] = point;
      minIndex = this._nextRightIndex(minIndex);
      min = this._mins[minIndex] || 0;
    }
    while (min < point && minIndex < this.length());

    do {
      this._maxs[maxIndex] = point;
      maxIndex = this._nextLeftIndex(maxIndex);
      max = this._maxs[maxIndex] || this.length();
    }
    while (max > point && maxIndex >= 0);
  }

  findInterval(point) {
    const index = point - this._begin;
    let leftIndex = index;
    let rightIndex = index;
    let left;
    let right;

    do {
      left = this._mins[leftIndex];
      leftIndex = this._nextLeftIndex(leftIndex);
    }
    while (left === undefined && leftIndex >= 0);

    do {
      right = this._maxs[rightIndex];
      rightIndex = this._nextRightIndex(rightIndex);
    }
    while (right === undefined && rightIndex < this.length());

    left = left === undefined ? this._beforeFirst() : left;
    right = right === undefined ? this._afterLast() : right;

    return {left, right};
  }

  _nextLeftIndex(index) {
    return  index > 0 ? Bit.dec(index) : index - 1;
  }

  _nextRightIndex(index) {
    return index === 0                 ? 1 :
           index === this._lastIndex() ? this._lastIndex() + 1 :
                                         Math.min(Bit.inc(index), this._lastIndex());
  }

  _lastIndex() {
    return this.length() - 1;
  }

  _beforeFirst() {
    return this._begin - 1;
  }

  _afterLast() {
    return this._begin + this.length();
  }
}