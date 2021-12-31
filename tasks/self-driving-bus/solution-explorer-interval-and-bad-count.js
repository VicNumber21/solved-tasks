export { solve as solution };

function solve(roads) {
  const treeLand = new Graph(roads);
  const treeLandMap = explore(treeLand);

  console.log(treeLand);
  console.log(treeLandMap);

  const neighboursDiff = (city1, city2) => treeLand.neighbours(city2).size - treeLand.neighbours(city1).size;

  const regionalValueDiff = (city1, city2) =>
    (treeLandMap.cityRegionalValue.get(city2) || 0) - (treeLandMap.cityRegionalValue.get(city1) || 0);

  const stepsDiff = (city1, city2) =>
    (treeLandMap.stepsToCity.get(city2) || 0) - (treeLandMap.stepsToCity.get(city1) || 0);

  const isBiggerCity = (city1, city2) => {
    let diff;

    for (const diffFn of [neighboursDiff, regionalValueDiff, stepsDiff]) {
      diff = diffFn(city1, city2);
      if (diff !== 0) break;
    }

    return diff > 0;
  };

  let segmentCount = 0;
  const cityCount = treeLand.order();
  const cityInterval = new Interval(1, cityCount);
  const cityQueue = new BinHeap({maxLength: cityCount, moveUp: isBiggerCity});

  for (const city of treeLand.crosses()) {
    cityQueue.push(city);
  }

  while (cityQueue.top() && treeLand.neighbours(cityQueue.top()).size > 2) {
    const cross = cityQueue.pop();
    const crossNeighbours = treeLand.neighbours(cross);
    const crossInterval = cityInterval.findInterval(cross);
    segmentCount += countForCity(treeLand, cross,crossInterval);
    cityInterval.addPoint(cross);
    treeLand.removeVertex(cross);

    for (const neighbour of crossNeighbours) {
      cityQueue.shiftDown(neighbour);
    }
  }

  return segmentCount;
}

function countForCity(treeLand, city, interval) {
  const queued = new Set();
  queued.add(city);

  const leftInterval = {left: interval.left, right: city};
  const leftQueue = new BinHeap({
    maxLength: leftInterval.right - leftInterval.left,
    moveUp: (city1, city2) => city1 < city2
  });

  leftQueue.push(city);

  const leftContext = {
    treeLand: treeLand,
    interval: leftInterval,
    nextBestCity: (city) => city - 1,
    queue: leftQueue,
    queued: queued
  };

  const rightInterval = {left: city, right: interval.right};
  const rightQueue = new BinHeap({
    maxLength: rightInterval.right - rightInterval.left,
    moveUp: (city1, city2) => city1 > city2
  });

  rightQueue.push(city);

  const rightContext = {
    treeLand: treeLand,
    interval: rightInterval,
    nextBestCity: (city) => city + 1,
    queue: rightQueue,
    queued: queued
  };

  return countForQueue(leftContext) * countForQueue(rightContext);
}

function countForQueue(ctx) {
  let count = 0;
  let bestCity = ctx.queue.top();
  let sum = 0;
  let bestSum = 0;

  while (ctx.queue.length > 0) {
    const city = ctx.queue.pop();
    sum += city;
    bestSum += bestCity;

    if (bestSum === sum) ++count;

    bestCity = ctx.nextBestCity(bestCity);

    for (const neighbour of ctx.treeLand.neighbours(city)) {
      if (neighbour > ctx.interval.left && neighbour < ctx.interval.right && !ctx.queued.has(neighbour)) {
        ctx.queue.push(neighbour);
        ctx.queued.add(neighbour);
      }
    }
  }

  return count;
}

function explore(land) {
  const map = {
    routes: new Map(),
    cityToRoute: new Map(),
    stepsToCity: new Map(),
    cityRegionalValue: new Map(),
    unexploredNeighbours: new Map()
  };

  let explorers = land.leaves().map((leaf) => new Explorer(leaf, land, map));

  while (explorers.length > 0) {
    const newExplorers = [];

    for (const explorer of explorers) {
      explorer.doNextStep();

      if (explorer.keepWalking()) {
        newExplorers.push(explorer);
      }
    }

    explorers = newExplorers;
  }

  delete map.unexploredNeighbours;

  return map;
}

class Explorer {
  constructor(start, land, map) {
    this._start = start;
    this._land = land;
    this._map = map;
    this._nextCity = this._start;
    this._route = [];
    this._map.routes.set(this._start, this._route);
    this.doNextStep();
  }

  doNextStep() {
    if (!this._isCityExplored(this._nextCity)) {
      if (this._land.isCross(this._nextCity)) {
        this._visitCross();
      }
      else {
        this._passThrough();
      }
    }

    this._updateNextCity();
  }

  _visitCross() {
    const unexploredNeighbours = this._map.unexploredNeighbours.get(this._nextCity) ||
                               new Set(this._land.neighbours(this._nextCity));
    unexploredNeighbours.delete(this._lastVisitedCity());
    this._map.unexploredNeighbours.set(this._nextCity, unexploredNeighbours);

    const currentRegionalValue = this._map.cityRegionalValue.get(this._nextCity) || 0;
    this._map.cityRegionalValue.set(this._nextCity, currentRegionalValue + this._route.length);

    if (unexploredNeighbours.size < 2) {
      this._passThrough();
    }
  }

  _passThrough() {
    this._route.push(this._nextCity);
    this._map.cityToRoute.set(this._nextCity, this._start);
    this._map.stepsToCity.set(this._nextCity, this._route.length + 1);

    if (this._land.isCross(this._nextCity)) {
      const currentRegionalValue = this._map.cityRegionalValue.get(this._nextCity);
      this._map.cityRegionalValue.set(this._nextCity, currentRegionalValue + 1);
    }
  }

  _lastVisitedCity() {
    return this._route[this._route.length - 1];
  }

  _updateNextCity() {
    const lastPlannedCity = this._nextCity;
    delete this._nextCity;

    if (lastPlannedCity === this._lastVisitedCity()) {
      this._nextCity = Array.from(this._land.neighbours(lastPlannedCity)).find((city) => !this._isCityExplored(city));
    }
  }

  _isCityExplored(city) {
    return this._map.cityToRoute.get(city);
  }

  keepWalking() {
    return this._nextCity !== undefined;
  }
}

class Graph {
  constructor(roads) {
    this._adjLists = new Map();
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
      this._leaves.add(v);
    }
  }

  removeVertex(v) {
    const vNeighbours = this.neighbours(v);

    for (const neighbour of vNeighbours) {
      this.removeEdge(neighbour, v);
    }

    for (const registrar of [this._adjLists, this._leaves, this._throughs, this._crosses]) {
      registrar.delete(v);
    }
  }

  addEdge(u, v) {
    this.addVertex(u);
    const uNeighbours = this.neighbours(u);
    uNeighbours.add(v);

    if (uNeighbours.size === 2) {
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
    else if (uNeighbours.size < 2) {
      this._throughs.delete(u);
      this._leaves.add(u);
    }
  }

  isLeaf(v) {
    return this._leaves.has(v);
  }

  leaves() {
    return Array.from(this._leaves);
  }

  isThrough(v) {
    return this._throughs.has(v);
  }

  throughs() {
    return Array.from(this._throughs);
  }

  isCross(v) {
    return this._crosses.has(v);
  }

  crosses() {
    return Array.from(this._crosses);
  }

  // TODO check if required
  dfs(start, visitVertex, getBack = (/* u, v */) => {}) {
    this.travers(start, [], visitVertex, getBack);
  }

  // TODO check if required
  travers(start, stack, visitVertex = (/* v, u */) => {}, getBack = (/* u, v */) => {}) {
    const planned = new Set();
    const visited = [];
    stack.push({ v: start });
    planned.add(start);

    while (stack.length > 0) {
      const current = stack.pop();
      const neighbours = this.neighbours(current.v);
      visitVertex(current.v, current.u);
      visited.push(current);

      for (const u of neighbours) {
        if (!planned.has(u)) {
          planned.add(u);
          stack.push({ v: u, u: current.v});
        }
      }
    }

    while (visited.length > 0) {
      const current = visited.pop();
      getBack(current.v, current.u);
    }
  }
}

const Bit = {
  last: (v) => v & -v,
  inc: (v) => v + Bit.last(v),
  dec: (v) => v - Bit.last(v)
};

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
    return  index === this._lastIndex() ? this._lastIndex() + 1 :
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

class BinHeap {
  constructor({
    maxLength = 0,
    moveUp ,
    elValue = (el) => el,
    assignIndex,
    getIndex,
    removeIndex
  } = {}) {
    this.length = 0;
    this._options = { maxLength, moveUp, elValue, assignIndex, getIndex, removeIndex }
    this._heap = new Array(this._options.maxLength);

    if (!this._options.assignIndex) {
      this._indexMap = new Map();
    }
  }

  push(el) {
    const index = this.length;
    this._heap[index] = el;
    this._assignIndex(el, index);
    ++this.length;
    this._shiftUp(index);
  }

  pop() {
    const ret = this.top();

    if (ret !== undefined) {
      --this.length;
      this._swap(0, this.length);
      this._shiftDown(0);
      this._removeIndex(ret);
    }

    return ret;
  }

  shiftUp(el) {
    const index = this._index(el);

    if (this._isInBounds(index)) {
      this._shiftUp(index);
    }
  }

  shiftDown(el) {
    const index = this._index(el);

    if (this._isInBounds(index)) {
      this._shiftDown(index);
    }
  }

  top() {
    return this.length > 0 ? this._heap[0] : undefined;
  }

  _shiftUp(index) {
    let childIndex = index;
    let parentIndex = this._parentIndex(childIndex);

    while (this._needMoveUp(childIndex, parentIndex)) {
      this._swap(parentIndex, childIndex);
      childIndex = parentIndex;
      parentIndex = (childIndex - 1) >> 1;
    }
  }

  _shiftDown(index) {
    let parentIndex = index;
    let minChildIndex = this._minChildIndex(parentIndex);

    while (this._needMoveUp(minChildIndex, parentIndex)) {
      this._swap(parentIndex, minChildIndex);
      parentIndex = minChildIndex;
      minChildIndex = this._minChildIndex(parentIndex);
    }
  }

  _assignIndex(el, index) {
    if (this._indexMap) {
      this._indexMap.set(el, index);
    }
    else {
      this._options.assignIndex(el, index);
    }
  }

  _index(el) {
    return this._indexMap ? this._indexMap.get(el) : this._options.getIndex(el);
  }

  _removeIndex(el) {
    if (this._indexMap) {
      this._indexMap.delete(el);
    }
    else {
      this._options.removeIndex(el);
    }
  }

  _swap(index1, index2) {
    [ this._heap[index1], this._heap[index2] ] = [ this._heap[index2], this._heap[index1] ];
    this._assignIndex(this._heap[index1], index1);
    this._assignIndex(this._heap[index2], index2);
  }

  _minChildIndex(parentIndex) {
    const leftChildIndex = (parentIndex << 1) + 1;
    const rightChildIndex = (parentIndex << 1) + 2;
    let minChildIndex = leftChildIndex;

    if (this._needMoveUp(rightChildIndex, leftChildIndex)) {
      minChildIndex = rightChildIndex;
    }

    return minChildIndex;
  }

  _parentIndex(childIndex) {
    return (childIndex - 1) >> 1;
  }

  _needMoveUp (childIndex, parentIndex) {
    const child = this._options.elValue(this._heap[childIndex]);
    const parent = this._options.elValue(this._heap[parentIndex]);

    return this._isInBounds(childIndex) && this._isInBounds(parentIndex) && this._options.moveUp(parent, child);
  }

  _isInBounds (index) {
    return index >= 0 && index < this.length;
  }
}
