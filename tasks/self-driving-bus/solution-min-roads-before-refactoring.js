export { solve as solution };

function solve(roads) {
  const context = { lastSubset: { count: function () { return 1; } } };
  context.roads = createRoads(roads);
  updateRoadWeights(context);

  while (context.roadMinHeap.length > 0) {
    // TODO debug
    printRoadMinHeap(context);

    findMinRoads(context);
    joinZeroRoads(context);

    // TODO debug
    printMinRoadChains(context);

    handleChainRoads(context);
    handleMixRoads(context);
    handleSubsetRoads(context);

    console.log('current count - ', context.lastSubset.count());
  }

  return context.lastSubset.count();
}

function handleChainRoads(context) {
  if (context.chainRoads.length > 0) {
    const roadsToUpdate = new Set();
    for (const chainRoadSet of context.chainRoads) {
      context.lastSubset = createChain(context, chainRoadSet, roadsToUpdate);
    }

    updateRoadWeights(context, roadsToUpdate);
  }
}

function createChain(context, chainRoads, roadsToUpdate) {
  const subsets = [chainRoads[0].leftSubset];

  for (const road of chainRoads) {
    road.leftSubset.roads.delete(road.id);
    road.rightSubset.roads.delete(road.id);
    road.leftSubset.rightRoad = road;
    road.rightSubset.leftRoad = road;
    subsets.push(road.rightSubset);
  }

  const chain = {
    type: 'segment',
    subtype: 'chain',
    minCity: subsets[0].minCity,
    maxCity: subsets[subsets.length - 1].maxCity,
    roads: new Set(),
    sum: 0,
    chained: 0,
    intCount: 0,
    count: function () {
      return this.intCount + this.chained * (this.chained + 1) / 2;
    },

    toString: function () {
      return 'chain(' + this.minCity + '-' + this.maxCity + '){' + this.chained + '}';
    }
  };

  for (let i = 0; i < subsets.length; ++i) {
    const currentSubset = subsets[i];

    chain.sum += currentSubset.sum;

    // (leftCity |- leftRoad -| rightCity) (minCity |= currentSubset =| maxCity) (leftCity |- rightRoad -| rightCity)
    const embed = currentSubset.subtype === 'chain' &&
      (!currentSubset.leftRoad || currentSubset.leftRoad.rightCity === currentSubset.minCity) &&
      (!currentSubset.rightRoad || currentSubset.rightRoad.leftCity === currentSubset.maxCity);

    if (embed) {
      chain.chained += currentSubset.chained;
    } else {
      ++chain.chained;
    }

    if (!embed) {
      chain.intCount += currentSubset.count() - 1;
    }

    if (roadsToUpdate) {
      // TODO how to extract whole this "if" ?
      for (const roadId of currentSubset.roads) {
        roadsToUpdate.add(roadId);
        chain.roads.add(roadId);

        const road = context.roads[roadId];

        if (road.leftSubset === currentSubset) {
          road.leftSubset = chain;
        } else {
          road.rightSubset = chain;
        }
      }
    }
  }

  return chain;
}

function handleMixRoads(context) {
  if (context.mixRoads.length > 0) {
    const mixRoad = context.mixRoads[0][0];
    const leftSubset = mixRoad.leftSubset;
    const rightSubset = mixRoad.rightSubset;
    /* leftSubset.roads.delete(mixRoad.id);
    rightSubset.roads.delete(mixRoad.id);

    const isSimpleMix = !(leftSubset.leftSegment || leftSubset.rightSegment || rightSubset.leftSubset || rightSubset.rightSegment);

    const mix = isSimpleMix ? createSimpleMix(leftSubset, rightSubset) : convertToChain(mixRoad);

    context.lastSubset = mix;

    // TODO road update is dup; rework later
    for (const roadId of leftSubset.roads) {
      mix.roads.add(roadId);

      const road = context.roads[roadId];

      if (road.leftSubset === leftSubset) {
        road.leftSubset = mix;
      } else {
        road.rightSubset = mix;
      }
    }

    // TODO road update is dup; rework later
    for (const roadId of rightSubset.roads) {
      mix.roads.add(roadId);

      const road = context.roads[roadId];

      if (road.leftSubset === rightSubset) {
        road.leftSubset = mix;
      } else {
        road.rightSubset = mix;
      }
    } */
    const subset = createSubset(context, mixRoad);
    convertToMix(subset);
    const segment = subset.leftSegment || subset.rightSegment ?
      createChain(context, [subset.leftMiddleRoad, subset.middleRightRoad].filter((x) => x)) :
      subset.middleSubset;

    // TODO better way?
    context.lastSubset = segment;

    updateRoads(context, leftSubset, segment);
    updateRoads(context, rightSubset, segment);

    updateRoadWeights(context, segment.roads);
  }
}

function convertToMix(subset) {
  const middleSubset = subset.middleSubset;
  middleSubset.type = 'segment';
  middleSubset.subtype = 'mix';
  middleSubset.count = function () {
    return this.intCount + 1;
  };
  middleSubset.toString = function () {
    return 'mix(' + this.minCity + '-' + this.maxCity + ')';
  };
}

// TODO do I need it still?
function createSimpleMix(leftSubset, rightSubset) {
  return  {
    type: 'segment',
    subtype: 'mix',
    minCity: Math.min(leftSubset.minCity, rightSubset.minCity),
    maxCity: Math.max(leftSubset.maxCity, rightSubset.maxCity),
    roads: new Set(),
    sum: leftSubset.sum + rightSubset.sum,
    intCount: leftSubset.count() + rightSubset.count(), // TODO check if right
    count: function () {
      return this.intCount + 1;
    },

    toString: function () {
      return 'mix(' + this.minCity + '-' + this.maxCity + ')';
    }
  };
}

function updateRoads(context, oldSubset, newSubset) {
  for (const roadId of oldSubset.roads) {
    newSubset.roads.add(roadId);

    const road = context.roads[roadId];

    if (road.leftSubset === oldSubset) {
      road.leftSubset = newSubset;
    } else {
      road.rightSubset = newSubset;
    }
  }
}

function createSubset(context, subsetRoad) {
  const leftSubset = subsetRoad.leftSubset;
  const rightSubset = subsetRoad.rightSubset;
  leftSubset.roads.delete(subsetRoad.id);
  rightSubset.roads.delete(subsetRoad.id);

  const isLeftSegment = leftSubset.type === 'segment' && !isCityFromSubset(leftSubset.minCity, rightSubset);
  const isRightSegment = rightSubset.type === 'segment' && !isCityFromSubset(rightSubset.minCity, leftSubset);

  const lsRS = leftSubset.rightSegment && !isCityFromSubset(subsetRoad.leftCity, leftSubset.rightSegment) && leftSubset.rightSegment;
  const rsRS = rightSubset.rightSegment && !isCityFromSubset(subsetRoad.rightCity, rightSubset.rightSegment) && rightSubset.rightSegment;

  const intMostRightSegment = lsRS && rsRS ? (lsRS.minCity < rsRS.minCity ? rsRS : lsRS) : (lsRS || rsRS);

  const keepMostLeftSegment = leftSubset.leftSegment && !isCityFromSubset(subsetRoad.leftCity, leftSubset.leftSegment);
  const keepMostRightSegment = intMostRightSegment && (!isRightSegment || rightSubset.minCity < intMostRightSegment.minCity);

  const subset = mergeSubsets(leftSubset, rightSubset);

  const rightSegmentBit = 0x01;
  const middleSubsetBit = rightSegmentBit << 1;
  const leftSegmentBit = rightSegmentBit << 2;
  const fullSubsetBit = leftSegmentBit | middleSubsetBit | rightSegmentBit;

  let middleSubsetBits = (fullSubsetBit << 3) | fullSubsetBit;

  if (keepMostLeftSegment) {
    subset.leftSegment = leftSubset.leftSegment;
    subset.leftMiddleRoad = leftSubset.leftMiddleRoad;
    middleSubsetBits &= ~(leftSegmentBit << 3);
  } else if (isLeftSegment) {
    subset.leftSegment = leftSubset;
    subset.leftMiddleRoad = subsetRoad;
    middleSubsetBits &= ~(fullSubsetBit << 3);
  }

  if (keepMostRightSegment) {
    const isRightSegmentFromLeftSubset = leftSubset.rightSegment === intMostRightSegment;
    subset.rightSegment = intMostRightSegment;
    subset.middleRightRoad = isRightSegmentFromLeftSubset ? leftSubset.middleRightRoad : rightSubset.middleRightRoad;
    middleSubsetBits &= ~(isRightSegmentFromLeftSubset ? (rightSegmentBit << 3) : rightSegmentBit);
  } else if (isRightSegment) {
    subset.rightSegment = rightSubset;
    subset.middleRightRoad = subsetRoad;
    middleSubsetBits &= ~fullSubsetBit;
  }


  if (middleSubsetBits) {
    const leftPartBits = (middleSubsetBits & (fullSubsetBit << 3)) >> 3;
    const rightPartBits = middleSubsetBits & fullSubsetBit;

    console.log('left: ', (middleSubsetBits & (fullSubsetBit << 3)) >> 3, 'right: ', middleSubsetBits & fullSubsetBit);

    const isLeftFull = leftPartBits === fullSubsetBit;
    const isRightFull = rightPartBits === fullSubsetBit;

    const subsetParts = ([
      isLeftFull && leftSubset,
      isRightFull && rightSubset,
      !isLeftFull && ((leftPartBits & leftSegmentBit) === leftSegmentBit) && leftSubset.leftSegment,
      !isLeftFull && ((leftPartBits & middleSubsetBit) === middleSubsetBit) && leftSubset.middleSubset,
      !isLeftFull && ((leftPartBits & rightSegmentBit) === rightSegmentBit) && leftSubset.rightSegment,
      !isRightFull && ((rightPartBits & leftSegmentBit) === leftSegmentBit) && rightSubset.leftSegment,
      !isRightFull && ((rightPartBits & middleSubsetBit) === middleSubsetBit) && rightSubset.middleSubset,
      !isRightFull && ((rightPartBits & rightSegmentBit) === rightSegmentBit) && rightSubset.rightSegment
    ]).filter((part) => part);

    subset.middleSubset = subsetParts[0];

    for (let i = 1; i < subsetParts.length; ++i) {
      subset.middleSubset = mergeSubsets(subset.middleSubset, subsetParts[i]);
    }
  }

  if (subset.leftMiddleRoad) {
    subset.leftMiddleRoad.leftSubset = subset.leftSegment;
    subset.leftMiddleRoad.rightSubset = subset.middleSubset;
  }

  if (subset.middleRightRoad) {
    subset.middleRightRoad.leftSubset = subset.middleSubset;
    subset.middleRightRoad.rightSubset = subset.rightSegment;
  }

  if (subset.middleSubset) {
    subset.middleSubset.subtype = 'simple';
  }

  if (subset.leftSegment && subset.rightSegment) {
    subset.subtype = 'double';
  } else if (subset.leftSegment) {
    subset.subtype = 'left';
  } else if (subset.rightSegment) {
    subset.subtype = 'right';
  }

  return subset;
}

function handleSubsetRoads(context) {
  if (context.subsetRoads.length > 0) {
    const subsetRoad = context.subsetRoads[0][0];
    const leftSubset = subsetRoad.leftSubset;
    const rightSubset = subsetRoad.rightSubset;
    const subset = createSubset(context, subsetRoad);

    // TODO better way?
    context.lastSubset = subset;

    updateRoads(context, leftSubset, subset);
    updateRoads(context, rightSubset, subset);

    updateRoadWeights(context, subset.roads);
  }
}

function isCityFromSubset(city, subset) {
  return city >= subset.minCity && city <= subset.maxCity;
}

function undefinedSubset() {
  return {
    minCity: Number.MAX_SAFE_INTEGER,
    maxCity: 0,
    sum: 0,
    count: function () { return 0; }
  };
}

function mergeSubsets(leftSubset, rightSubset) {
  leftSubset = leftSubset || undefinedSubset();
  rightSubset = rightSubset || undefinedSubset();

  return {
    type: 'subset',
    subtype: 'simple',
    minCity: Math.min(leftSubset.minCity, rightSubset.minCity),
    maxCity: Math.max(leftSubset.maxCity, rightSubset.maxCity),
    roads: new Set(),
    sum: leftSubset.sum + rightSubset.sum,
    intCount: leftSubset.count() + rightSubset.count(), // TODO check if right
    count: function () {
      return this.intCount;
    },

    toString: function () {
      return this.subtype === 'simple' ? 'subset(' + this.minCity + '-' + this.maxCity + ')' :
        // '' + this.subtype + '-subset(' + (this.leftSegment ? this.leftSegment : '') +
        // (this.middleSubset ? '-' + this.middleSubset : '') +
        // (this.rightSegment ? '-' + this.rightSegment : '') + ')';
        '' + this.subtype + '-subset(' + [this.leftSegment, this.middleSubset, this.rightSegment].filter((v) => v).join('-') + ')';
    }
  };
}

function findMinRoads(context) {
  context.minRoads = [context.roadMinHeap.pop()];

  while (context.roadMinHeap.length > 0 && context.roadMinHeap.top().weight === 0) {
    context.minRoads.push(context.roadMinHeap.pop());
  }

}

function joinZeroRoads(context) {
  const minRoads = context.minRoads;
  context.chainRoads = [];
  context.mixRoads = [];
  context.subsetRoads = [];

  for (let i = 0; i < minRoads.length; ++i) {
    const roadChain = [minRoads[i]];
    const isMix = minRoads[i].weight === 0;
    const isChain = isMix && minRoads[i].leftSubset.type === 'segment' && minRoads[i].rightSubset.type === 'segment';

    // TODO if join subsets it may join roads in beginning and in the end of subset
    while (i + 1 < minRoads.length && roadChain[roadChain.length - 1].rightSubset === minRoads[i + 1].leftSubset) {
      roadChain.push(minRoads[i + 1]);
      ++i;
    }

    if (isChain) {
      context.chainRoads.push(roadChain);
    }
    else if (isMix) {
      context.mixRoads.push(roadChain);
    }
    else {
      context.subsetRoads.push(roadChain);
    }
  }
}

// TODO debug
let step = 0;
function printRoadMinHeap(context) {
  console.log('Step:', step++);
  console.log('Road Min Heap');

  for (let i = 0; i < context.roadMinHeap.length; ++i) {
    const road = context.roadMinHeap._heap[i];
    console.log(road.toString());
  }

  console.log();
}

function printMinRoadChains(context) {
  console.log('Chain Roads');
  let chainId = 0;
  for (const chain of context.chainRoads || []) {
    console.log('Chain', chainId++);

    for (const road of chain) {
      console.log(road.toString());
    }
  }

  console.log('Mix Roads');
  let mixId = 0;
  for (const mix of context.mixRoads || []) {
    console.log('Mix', mixId++);

    for (const road of mix) {
      console.log(road.toString());
    }
  }

  console.log('Subset Roads');
  let subsetId = 0;
  for (const subset of context.subsetRoads || []) {
    console.log('Subset', subsetId++);

    for (const road of subset) {
      console.log(road.toString());
    }
  }

  console.log();
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
    road.weight = calculateRoadWeight(road);

    if (road.heapIndex === undefined) {
      context.roadMinHeap.push(road);
    }
    else {
      context.roadMinHeap.shiftUp(road.heapIndex);
      context.roadMinHeap.shiftDown(road.heapIndex);
    }
  }
}

function calculateRoadWeight(road) {
  const leftSubset = road.leftSubset;
  const rightSubset = road.rightSubset;
  const minCity = Math.min(leftSubset.minCity, rightSubset.minCity);
  const maxCity = Math.max(leftSubset.maxCity, rightSubset.maxCity);
  const segmentWeight = calculateSegmentWeight(minCity, maxCity);

  return segmentWeight - leftSubset.sum - rightSubset.sum;
}

function calculateSegmentWeight(minCity, maxCity) {
  const count = maxCity - minCity + 1;
  return count * (minCity + maxCity) / 2;
}

function createRoads(roads) {
  const segments = new Array(roads.length + 1);

  return roads.map((road, roadId) => {
    const leftCity = Math.min(road[0], road[1]);
    const rightCity = Math.max(road[0], road[1]);

    return {
      id: roadId,
      leftCity: leftCity,
      rightCity: rightCity,
      leftSubset: singleSegment(segments, leftCity, roadId),
      rightSubset: singleSegment(segments, rightCity, roadId),

      toString: function () { return '' + this.id + ': ' + this.leftSubset + ' [' + this.leftCity + ']' + ' - ' +
        'w[' + this.weight + ']' + ' - ' + '[' + this.rightCity + '] ' + this.rightSubset; }
    }
  });
}

function singleSegment(segments, city, roadId) {
  const index = city - 1;
  const segment = segments[index] !== undefined ? segments[index] : {
    type: 'segment',
    subtype: 'single',
    minCity: city,
    maxCity: city,
    roads: new Set(),
    sum: city,
    intCount: 0,
    count: function () { return 1; },

    toString: function () { return 'single(' + this.minCity + ')'; }
  };

  segment.roads.add(roadId);
  segments[index] = segment;

  return segment;
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
      && (road1.weight < road2.weight || road1.weight === road2.weight && road1.leftSubset.minCity < road2.leftSubset.minCity);
  }

  _isInBounds (index) {
    return index >= 0 && index < this.length;
  }
}
