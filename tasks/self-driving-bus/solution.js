export { solve as solution };

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
  const most = { left: city, right: city, rightLeft: city };
  let left = city;
  let canGoLeft = true;
  const leftMap = new Map([[city, { isSegment: true, count: 1, min: city}]]);

  for (let right = city; right < interval.right && left > interval.left; ++right) {
    const rightValue = map.get(right);
    if (!rightValue) break;
    most.left = Math.min(most.left, rightValue.min);
    most.rightLeft = Math.min(most.rightLeft, rightValue.min);
    most.right = Math.max(most.right, rightValue.max);
    if (!canGoLeft && most.left < left) break;
    if (right < most.right) continue;

    let prevLeftObj = leftMap.get(left);

    for (let nextLeft = left - 1; canGoLeft && left > interval.left; --nextLeft) {
      const leftValue = map.get(nextLeft);
      if (!leftValue) { canGoLeft = false; break; }
      if (right < leftValue.max) break;
      left = nextLeft;
      most.left = Math.min(most.left, leftValue.min);
      const isSegment = most.left === left;
      const leftObj = {
        isSegment,
        count: prevLeftObj.count + (isSegment ? 1 : 0),
        min: most.left
      }
      leftMap.set(left, leftObj);
      prevLeftObj = leftObj;
    }

    let leftObj = leftMap.get(most.rightLeft);

    while (leftObj && leftObj.min < most.rightLeft) {
      most.rightLeft = leftObj.min;
      leftObj = leftMap.get(most.rightLeft);
    }

    if (leftObj && leftObj.isSegment) {
      count += leftMap.get(left).count - leftObj.count + 1;
    }
    else if (!canGoLeft) {
      break;
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