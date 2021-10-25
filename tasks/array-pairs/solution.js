export { solve as solution };

function solve(arr) {
  const initialLength = arr.length;
  arr = arr.filter((x) => x > 1);
  let count = (initialLength -1 + arr.length) * (initialLength - arr.length) / 2;
  const stack = buildStack(arr);

  while (stack.length > 0) {
    const currentNode = stack.pop();
    const [leftCounter, leftMin] = currentNode.left ? [ currentNode.left.counter, currentNode.left.min ] :
                                           countNumbers(arr, currentNode.range.i + 1, currentNode.max.i - 1);
    const [rightCounter, rightMin] = currentNode.right ? [ currentNode.right.counter, currentNode.right.min ]
                                           : countNumbers(arr, currentNode.max.i + 1, currentNode.range.j - 1);

    const max = arr[currentNode.max.i];
    let leftSorted = sortCounter(leftCounter, max / rightMin);
    let rightSorted = sortCounter(rightCounter, max / leftMin);

    currentNode.counter = mergeCounters(leftCounter, rightCounter, max);
    currentNode.min = Math.min(leftMin, rightMin);

    count += countPairs(max, leftSorted, rightSorted);
  }

  return count;
}

function countNumbers(arr, i, j) {
  const counter = new Map();
  let min = Infinity;

  for (let ind = i; ind <= j; ++ind) {
    const value = arr[ind];
    increaseCounter(counter, value, 1);
    min = Math.min(min, value);
  }

  return [counter, min];
}

function increaseCounter(counter, value, count) {
  counter.set(value, (counter.get(value) || 0) + count);
}

function mergeCounters(counter1, counter2, max) {
  if (counter1.size < counter2.size) {
    [counter1, counter2] = [counter2, counter1];
  }

  increaseCounter(counter1, max, 1);

  for (const [value, count] of counter2) {
    increaseCounter(counter1, value, count);
  }

  return counter1;
}

function sortCounter(counter, maxMin) {
  const sorted = [];

  for (const c of counter) {
    if (c[0] <= maxMin) {
      sorted.push(c);
    }
  }

  sorted.sort(([x1], [x2]) => x1 - x2);

  return sorted;
}

function countPairs(max, leftSorted, rightSorted) {
  let count = 0;

  if (rightSorted.length < leftSorted.length) {
    [leftSorted, rightSorted] = [rightSorted, leftSorted];
  }

  for (let rightInd = 1; rightInd < rightSorted.length ; ++rightInd) {
    rightSorted[rightInd][1] += rightSorted[rightInd - 1][1];
  }

  let rightMinLength = rightSorted.length;

  for (let leftInd = 0; leftInd < leftSorted.length && rightMinLength > 0; ) {
    const rightMaxMin = max / leftSorted[leftInd][0];
    let rightInd = binarySearch(rightSorted, rightMinLength - 1, rightMaxMin) - 1;
    const leftMaxMin = max / rightSorted[rightInd][0];
    let leftMinCount = 0;

    while (leftInd < leftSorted.length && leftSorted[leftInd][0] <= leftMaxMin) {
      leftMinCount += leftSorted[leftInd++][1];
    }

    count += leftMinCount * rightSorted[rightInd][1];
    rightMinLength = rightInd + 1;
  }

  return count;
}

function binarySearch(arr, lastIndex, value) {
  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.ceil((low + high) / 2);

    if (arr[mid][0] <= value) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return low;
}

function findPrevNode(root, maxI) {
  let prevNode = root;
  let currentNode = root;

  while (currentNode) {
    prevNode = currentNode;

    if (maxI < prevNode.max.i) {
      currentNode = prevNode.left;
    } else {
      currentNode = prevNode.right;
    }
  }

  return prevNode;
}

function updateTree(prevNode, maxI, length) {
  return prevNode && joinToPrev(prevNode, maxI) ? prevNode : createNode(prevNode, maxI, length);
}

function createNode(prevNode, maxI, length) {
  const currentNode = {
    max: {
      i: maxI,
      inRange: {i: maxI, j: maxI},
      outRange: {i: -1, j: length}
    },
    range: {i: -1, j: length}
  }

  if (prevNode) {
    if (maxI < prevNode.max.i) {
      currentNode.range = { i: prevNode.range.i, j: prevNode.max.i };
      currentNode.max.outRange = { i: prevNode.max.outRange.i, j: prevNode.max.inRange.i };
      prevNode.left = currentNode;
    }
    else {
      currentNode.range = { i: prevNode.max.i, j: prevNode.range.j };
      currentNode.max.outRange = { i: prevNode.max.inRange.j, j: prevNode.max.outRange.j };
      prevNode.right = currentNode;
    }
  }

  return currentNode;
}

function joinToPrev(prevNode, maxI) {
  let joined = false;

  if (prevNode.max.inRange.i - maxI === 1) {
    prevNode.max.inRange.i = maxI;
    joined = true;
  }
  else if (maxI - prevNode.max.outRange.i === 1) {
    prevNode.max.outRange.i = maxI;
    joined = true;
  }
  else if (maxI - prevNode.max.inRange.j === 1) {
    prevNode.max.inRange.j = maxI;
    joined = true;
  }
  else if (prevNode.max.outRange.j - maxI === 1) {
    prevNode.max.outRange.j = maxI;
    joined = true;
  }

  return joined;
}

function buildStack(arr) {
  const indexes = arr.map((x, i) => i);
  indexes.sort((i1, i2) => arr[i1] - arr[i2]);
  const min = arr[indexes[0]];
  const minMax = min * arr[indexes[1]];
  let root;
  const stack = [];

  for (let i = indexes.length - 1, maxI = indexes[i], maxV = maxI !== undefined && arr[maxI];
       maxV >= minMax;
       maxI = indexes[--i], maxV = arr[maxI])
  {
    const prevNode = findPrevNode(root, maxI);
    let currentNode = updateTree(prevNode, maxI, arr.length);

    if (!root) {
      root = currentNode;
    }

    if (prevNode !== currentNode) {
      stack.push(currentNode);
    }
  }

  return stack;
}