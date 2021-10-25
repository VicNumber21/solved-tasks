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

          let prevCounter;

          if (currentMax.i < previousNode.maxRange.i) {
            currentNode. range = { i: previousNode.range.i, j: previousNode.maxRange.i };
            previousNode.left = currentNode;
            prevCounter = previousNode.leftCounter
          }
          else {
            currentNode.range = { i: previousNode.maxRange.j, j: previousNode.range.j };
            previousNode.right = currentNode;
            prevCounter = previousNode.rightCounter;
          }

          if (currentNode.maxRange.i - currentNode.range.i < currentNode.range.j - currentNode.maxRange.j) {
            currentNode.rightCounter = prevCounter;
          }
          else {
            currentNode.leftCounter = prevCounter;
          }
        }
      }
    }

    if (currentNode.leftCounter !== undefined && currentNode.rightCounter !== undefined) {
      continue;
    }

    const maxMin = currentMax.value / min;
    let leftCounter = trimCounter(currentNode.leftCounter, maxMin);
    let rightCounter = trimCounter(currentNode.rightCounter, maxMin);

    if (leftCounter === undefined) {
      leftCounter = countNumbers(arr, maxMin, currentNode.range.i + 1, currentMax.i - 1);

      if (currentNode.rightCounter) {
        rightCounter = subCounters(currentNode.rightCounter, leftCounter);
      }
    }

    if (rightCounter === undefined) {
      rightCounter = countNumbers(arr, maxMin, currentMax.i + 1, currentNode.range.j - 1);

      if (currentNode.leftCounter) {
        leftCounter = subCounters(currentNode.leftCounter, rightCounter);
      }
    }

    currentNode.leftCounter = leftCounter;
    currentNode.rightCounter = rightCounter;

    if(currentNode.leftCounter.length === 0 || currentNode.rightCounter.length === 0) {
      continue;
    }

    if(currentNode.leftCounter.length === 0 || currentNode.rightCounter.length === 0) {
      continue;
    }

    if (rightCounter.length < leftCounter.length) {
      [leftCounter, rightCounter] = [rightCounter, leftCounter];
    }

    const rightCounterSum = rightCounter.map(([, c]) => c);

    for (let rightInd = 1; rightInd < rightCounter.length ; ++rightInd) {
      rightCounterSum[rightInd] += rightCounterSum[rightInd - 1];
    }

    let rightMinLength = rightCounter.length;

    for (let leftInd = 0; leftInd < leftCounter.length; ++leftInd) {
      const rightMinMax = currentMax.value / leftCounter[leftInd][0];
      let rightInd = binarySearch(rightCounter, rightMinLength - 1, rightMinMax) - 1;

      if (rightInd < 0 ) {
        break
      }
      else {
        count += leftCounter[leftInd][1] * rightCounterSum[rightInd];
        rightMinLength = rightInd + 1;
      }
    }

    const leftMinMax = currentMax.value / currentNode.leftCounter[0][0];
    const rightMinMax = currentMax.value / currentNode.rightCounter[0][0];

    trimCounter(currentNode.leftCounter, leftMinMax);
    trimCounter(currentNode.rightCounter, rightMinMax);
  }

  return count;
}

function countNumbers(arr, maxMin, i, j) {
  const counter = new Map();

  for (let ind = i; ind <= j; ++ind) {
    const value = arr[ind].value;

    if (value <= maxMin) {
      counter.set(value, (counter.get(value) || 0) + 1);
    }
  }

  return Array.from(counter).sort(([x1], [x2]) => x1 - x2);
}

function trimCounter(counter, maxMin) {
  if (counter) {
    counter.length = binarySearch(counter, counter.length - 1, maxMin);
  }

  return counter;
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

function subCounters(counterToReduce, counter) {
  // let ind = counterToReduce.length - 1;
  //
  // for (let i = counter.length - 1; i >=0 && ind >=0; --i) {
  //   const [value, count] = counter[i];
  //   ind = binarySearch(counterToReduce, ind, value) - 1;
  //
  //   if (counterToReduce[ind][0] === value) {
  //     counterToReduce[ind][1] -= count;
  //   }
  // }
  //
  // return counterToReduce.filter(([, count]) => count > 0);
  const newCounter = new Map(counterToReduce);

  for (const [value, count] of counter) {
    reduceCounter(newCounter, value, count);
  }

  return Array.from(newCounter);
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