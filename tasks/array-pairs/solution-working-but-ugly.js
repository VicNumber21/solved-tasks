export { fn as solution };

function fn(arr) {
  let count = 0;
  let newIndex = 0;
  let newLength = arr.length;

  for(let i = 0; i < arr.length; ++i) {
    if (arr[i] === 1) {
      count += --newLength;
    }
    else {
      arr[newIndex] = { value: arr[i], i: newIndex };
      ++newIndex;
    }
  }

  arr.length = newLength;

  const sortedArr = Array.from(arr).sort((x1, x2) => x1.value - x2.value);
  const min = sortedArr[0].value;
  const minMax = min * sortedArr[1].value;

  const root = {
    range: { i: -1, j: arr.length }
  };

  while (sortedArr.length > 0 && sortedArr[sortedArr.length - 1].value >= minMax) {
    let currentMax = sortedArr.pop();
    let currentNode = root;
    let nodeFound = false;

    if (currentNode.maxRange === undefined) {
      currentNode.maxRange = { i: currentMax.i, j: currentMax.i }
      nodeFound = true;
    }

    while (!nodeFound) {
      let previousNode = currentNode;

      if (currentMax.i < currentNode.maxRange.i) {
        currentNode = currentNode.left;
      }
      else {
        currentNode = currentNode.right;
      }

      if (currentNode === undefined) {
        nodeFound = true;

        if (previousNode.maxRange.i - currentMax.i === 1) {
          previousNode.maxRange.i = currentMax.i;
          currentNode = previousNode;
        }
        else if (currentMax.i - previousNode.range.i === 1) {
          previousNode.range.i = currentMax.i;
          currentNode = previousNode;
        }
        else if (currentMax.i - previousNode.maxRange.j === 1) {
          previousNode.maxRange.j = currentMax.i;
          currentNode = previousNode;
        }
        else if (previousNode.range.j - currentMax.i === 1) {
          previousNode.range.j = currentMax.i;
          currentNode = previousNode;
        }
        else {
          currentNode = {
            maxRange: { i: currentMax.i, j: currentMax.i }
          };

          if (currentMax.i < previousNode.maxRange.i) {
            currentNode. range = { i: previousNode.range.i, j: previousNode.maxRange.i };
            previousNode.left = currentNode;
          }
          else {
            currentNode.range = { i: previousNode.maxRange.j, j: previousNode.range.j };
            previousNode.right = currentNode;
          }
        }
      }
    }

    if (currentNode.leftCounter !== undefined && currentNode.rightCounter !== undefined) {
      continue;
    }

    const maxMin = currentMax.value / min;
    let leftCounter = currentNode.leftCounter;
    let rightCounter = currentNode.rightCounter;
    let leftMin = 0;
    let rightMin = 0;

    if (leftCounter === undefined) {
      [leftCounter, leftMin] = countNumbers(arr, maxMin, currentNode.range.i + 1, currentMax.i - 1);

      if (currentNode.rightCounter) {
        rightMin = subCounters(currentNode.rightCounter, leftCounter, maxMin);
      }
    }

    if (rightCounter === undefined) {
      [rightCounter, rightMin] = countNumbers(arr, maxMin, currentMax.i + 1, currentNode.range.j - 1);

      if (currentNode.leftCounter) {
        leftMin = subCounters(currentNode.leftCounter, rightCounter, maxMin);
      }
    }

    currentNode.leftCounter = leftCounter;
    currentNode.rightCounter = rightCounter;

    const leftMinMax = currentMax.value / rightMin;
    const rightMinMax = currentMax.value / leftMin;

    trimCounter(currentNode.leftCounter, leftMinMax);
    trimCounter(currentNode.rightCounter, rightMinMax);

    if(currentNode.leftCounter.size === 0 || currentNode.rightCounter.size === 0) {
      continue;
    }

    let sortedLeft = Array.from(currentNode.leftCounter).sort(([x1], [x2]) => x1 - x2);
    let sortedRight = Array.from(currentNode.rightCounter).sort(([x1], [x2]) => x1 - x2);

    if (sortedRight.length < sortedLeft.length) {
      [sortedLeft, sortedRight] = [sortedRight, sortedLeft];
    }

    for (let rightInd = 1; rightInd < sortedRight.length ; ++rightInd) {
      sortedRight[rightInd][1] += sortedRight[rightInd - 1][1];
    }

    let rightMinLength = sortedRight.length;

    for (let leftInd = 0; leftInd < sortedLeft.length; ++leftInd) {
      const rightMinMax = currentMax.value / sortedLeft[leftInd][0];
      let rightInd = binarySearch(sortedRight, rightMinLength - 1, rightMinMax) - 1;

      if (rightInd < 0 ) {
        break
      }
      else {
        count += sortedLeft[leftInd][1] * sortedRight[rightInd][1];
        rightMinLength = rightInd + 1;
      }
    }
  }

  return count;
}

function countNumbers(arr, maxMin, i, j) {
  const counter = new Map();
  let min = maxMin + 1;

  for (let ind = i; ind <= j; ++ind) {
    const value = arr[ind].value;

    if (value <= maxMin) {
      min = Math.min(min, value);
      counter.set(value, (counter.get(value) || 0) + 1);
    }
  }

  return [counter, min];
}

function reduceCounter(counter, value, count) {
  const newCount = (counter.get(value) || 0) - count;

  if (newCount > 0) {
    counter.set(value, newCount);
  }
  else {
    counter.delete(value);
  }
}

function trimCounter(counter, maxMin) {
  for (const [value] of counter) {
    if (value > maxMin) {
      counter.delete(value);
    }
  }
}

function subCounters(counterToReduce, counter, maxMin) {
  let min = maxMin + 1;

  for (const [value, count] of counter) {
    if (value <= maxMin) {
      reduceCounter(counterToReduce, value, count);

      if (counterToReduce.has(value)) {
        min = Math.min(value);
      }
    }
    else {
      counter.delete(value);
    }
  }

  return min;
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
