export { solve as solution };

function solve(roads) {
  const context = { count: 0};

  initializeCities(context, roads);
  initializeRoads(context, roads);
  initializeSubsets(context);
  updateRoadWeights(context);

  while (context.roadMinHeap.length > 0) {
    findMinRoads(context);
    joinZeroRoads(context);
    countRoadChains(context);
    mergeSubsets(context);
  }

  // console.dir(context, { depth: null });

  return context.count + context.cities.length;
}

function findMinRoads(context) {
  context.minRoads = [context.roadMinHeap.pop()];

  while (context.roadMinHeap.length > 0 && context.roadMinHeap.top().weight === 0) {
    context.minRoads.push(context.roadMinHeap.pop());
  }

}

function joinZeroRoads(context) {
  const minRoads = context.minRoads;
  const minRoadChains = [];

  for (let i = 0; i < minRoads.length; ++i) {
    const roadChain = [minRoads[i]];

    // TODO if join subsets it may join roads in beginning and in the end of subset
    while (i + 1 < minRoads.length && roadChain[roadChain.length - 1].rightSubsetIndex === minRoads[i + 1].leftSubsetIndex) {
      roadChain.push(minRoads[i + 1]);
      ++i;
    }

    minRoadChains.push(roadChain);
  }

  context.minRoadChains = minRoadChains;
}

function mergeSubsets(context) {
  removeInternalRoads(context);

  for (const roadChain of context.minRoadChains) {
    const firstRoad = roadChain[0];
    const lastRoad = roadChain[roadChain.length - 1];
    const leftCityOnRoad = context.cities[firstRoad.leftCityIndex].number;
    const rightCityOnRoad = context.cities[lastRoad.rightCityIndex].number;
    const roadChainWeight = firstRoad.weight;
    const leftSubsetIndex = firstRoad.leftSubsetIndex;
    const rightSubsetIndex = lastRoad.rightSubsetIndex;
    const leftSubset = context.subsets[leftSubsetIndex];
    const rightSubset = context.subsets[rightSubsetIndex];
    let targetSubset = leftSubset;
    let sourceSubset = rightSubset;

    if (targetSubset.roads.size > sourceSubset.roads.size) {
      [targetSubset, sourceSubset] = [sourceSubset, targetSubset];
    }

    console.log(leftCityOnRoad, '-', rightCityOnRoad);
    console.log(targetSubset.leftBorder.length, ' -- ', targetSubset.minCity, '-', targetSubset.maxCity,' -- ', targetSubset.rightBorder.length);
    console.log(sourceSubset.leftBorder.length, ' -- ', sourceSubset.minCity, '-', sourceSubset.maxCity,' -- ', sourceSubset.rightBorder.length);

    targetSubset.minCity = Math.min(targetSubset.minCity, sourceSubset.minCity);
    targetSubset.maxCity = Math.max(targetSubset.maxCity, sourceSubset.maxCity);

    if (roadChainWeight === 0) {
      targetSubset.sum = calculateSegmentWeight(targetSubset.minCity, targetSubset.maxCity);
    }
    else {
      targetSubset.sum += sourceSubset.sum;
    }

    targetSubset.leftBorder = (targetSubset.minCity === leftCityOnRoad) ? roadChain : leftSubset.leftBorder;
    targetSubset.rightBorder = (targetSubset.maxCity === rightCityOnRoad) ? roadChain : rightSubset.rightBorder;

    console.log('merged');
    console.log(targetSubset.leftBorder.length, ' -- ', targetSubset.minCity, '-', targetSubset.maxCity,' -- ', targetSubset.rightBorder.length);
    console.log();

    mergeRoads(context, targetSubset, sourceSubset);
    updateRoadWeights(context, targetSubset.roads); // TODO move out of cycle?
    delete context.subsets[sourceSubset.index];
  }
}

function removeInternalRoads(context) {
  for (const road of context.minRoads) {
    const leftSubset = context.subsets[road.leftSubsetIndex];
    leftSubset.roads.delete(road.index);

    const rightSubset = context.subsets[road.rightSubsetIndex];
    rightSubset.roads.delete(road.index);
  }
}

function mergeRoads(context, targetSubset, sourceSubset) {
  for (const roadIndex of sourceSubset.roads) {
    const road = context.roads[roadIndex];

    if (road.leftSubsetIndex === sourceSubset.index) {
      road.leftSubsetIndex = targetSubset.index;
    }
    else {
      road.rightSubsetIndex = targetSubset.index;
    }

    targetSubset.roads.add(roadIndex);
  }
}

function countRoadChains(context) {
  for (const roadChain of context.minRoadChains) {
    if (roadChain.length > 1) {
      context.count += roadChain.length * (roadChain.length + 1) / 2;
    }
    else if (roadChain.length === 1 && roadChain[0].weight === 0) {
      ++context.count;
    }
  }
}

function updateRoadWeights(context, roadIndexes = false) {
  if (context.roadMinHeap === undefined) {
    context.roadMinHeap = new RoadMinBinHeap(context.roads.length);
  }

  let roadsToUpdate = context.roads;

  if (roadIndexes) {
    roadsToUpdate = [];

    for (const index of roadIndexes) {
      roadsToUpdate.push(context.roads[index]);
    }
  }

  for (const road of roadsToUpdate) {
    road.weight = calculateRoadWeight(context, road);

    if (road.heapIndex === undefined) {
      context.roadMinHeap.push(road);
    }
    else {
      context.roadMinHeap.shiftUp(road.heapIndex);
      context.roadMinHeap.shiftDown(road.heapIndex);
    }
  }
}

function calculateRoadWeight(context, road) {
  const leftSubset = context.subsets[road.leftSubsetIndex];
  const rightSubset = context.subsets[road.rightSubsetIndex];
  const minCity = Math.min(leftSubset.minCity, rightSubset.minCity);
  const maxCity = Math.max(leftSubset.maxCity, rightSubset.maxCity);
  const segmentWeight = calculateSegmentWeight(minCity, maxCity);

  return segmentWeight - leftSubset.sum - rightSubset.sum;
}

function calculateSegmentWeight(minCity, maxCity) {
  const count = maxCity - minCity + 1;
  return count * (minCity + maxCity) / 2;
}

function initializeCities(context, roads) {
  let cities = new Array(roads.length + 1);

  for (let i = 0; i < cities.length; ++i) {
    cities[i] = {
      index: i,
      number: i + 1,
      roads: new Set()
    };
  }

  context.cities = cities;
}

function initializeSubsets(context) {
  context.subsets = context.cities.map((city) => {
    return {
      index: city.index,
      minCity: city.number,
      maxCity: city.number,
      leftBorder: [],
      rightBorder: [],
      roads: new Set(city.roads),
      sum: city.number
    };
  });
}

function initializeRoads(context, roads) {
  context.roads = roads.map((road) => {
    const cityIndex1 = road[0] - 1;
    const cityIndex2 = road[1] - 1;
    const minCityIndex = Math.min(cityIndex1, cityIndex2);
    const maxCityIndex = Math.max(cityIndex1, cityIndex2);

    return {
      leftCityIndex: minCityIndex,
      rightCityIndex: maxCityIndex,
      leftSubsetIndex: minCityIndex,
      rightSubsetIndex: maxCityIndex
    };
  });

  for (let i = 0; i < context.roads.length; ++i) {
    const road = context.roads[i];

    road.index = i;
    context.cities[road.leftSubsetIndex].roads.add(i);
    context.cities[road.rightSubsetIndex].roads.add(i);
  }
}

class RoadMinBinHeap {
  constructor(maxLength = 0) {
    this.length = 0;
    this._heap = new Array(maxLength);
  }

  push(road) {
    const index = this.length;
    this._heap[index] = road;
    road.heapIndex = index;
    ++this.length;
    this.shiftUp(index);
  }

  shiftUp(index) {
    let childIndex = index;
    let parentIndex = this._parentIndex(childIndex);

    while (this._isLess(childIndex, parentIndex)) {
      this._swap(parentIndex, childIndex);
      childIndex = parentIndex;
      parentIndex = (childIndex - 1) >> 1;
    }
  }

  pop() {
    const ret = this.top();

    if (ret !== undefined) {
      --this.length;
      this._swap(0, this.length);
      this.shiftDown(0);
      delete ret.heapIndex;
    }

    return ret;
  }

  shiftDown(index) {
    let parentIndex = index;
    let minChildIndex = this._minChildIndex(parentIndex);

    while (this._isLess(minChildIndex, parentIndex)) {
      this._swap(parentIndex, minChildIndex);
      parentIndex = minChildIndex;
      minChildIndex = this._minChildIndex(parentIndex);
    }
  }

  top() {
    return this.length > 0 ? this._heap[0] : undefined;
  }

  _swap(index1, index2) {
    [ this._heap[index1], this._heap[index2] ] = [ this._heap[index2], this._heap[index1] ];
    this._heap[index1].heapIndex = index1;
    this._heap[index2].heapIndex = index2;
  }

  _minChildIndex(parentIndex) {
    const leftChildIndex = (parentIndex << 1) + 1;
    const rightChildIndex = (parentIndex << 1) + 2;
    let minChildIndex = leftChildIndex;

    if (this._isLess(rightChildIndex, leftChildIndex)) {
      minChildIndex = rightChildIndex;
    }

    return minChildIndex;
  }

  _parentIndex(childIndex) {
    return (childIndex - 1) >> 1;
  }

  _isLess (index1, index2) {
    const road1 = this._heap[index1];
    const road2 = this._heap[index2];

    return this._isInBounds(index1) && this._isInBounds(index2)
      && (road1.weight < road2.weight || road1.weight === road2.weight && road1.leftSubsetIndex < road2.leftSubsetIndex);
  }

  _isInBounds (index) {
    return index >= 0 && index < this.length;
  }
}
