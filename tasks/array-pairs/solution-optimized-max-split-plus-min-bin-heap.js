export { fn as solution };

class MinBinHeap {
  constructor(maxLength) {
    this.length = 0;
    this._heap = new Array(maxLength);
  }

  push(pair) {
    let childIndex = this.length;
    let parentIndex = (childIndex - 1) >> 1;
    this._heap[childIndex] = pair;
    ++this.length;

    while (parentIndex >= 0 && this._heap[parentIndex].p > this._heap[childIndex].p) {
      [ this._heap[parentIndex], this._heap[childIndex] ] = [ this._heap[childIndex], this._heap[parentIndex] ];
      childIndex = parentIndex;
      parentIndex = (childIndex - 1) >> 1;
    }
  }

  pop() {
    const ret = this.top();
    --this.length;
    [ this._heap[0], this._heap[this.length] ] = [ this._heap[this.length], this._heap[0] ];

    let parentIndex = 0;
    let leftChildIndex = (parentIndex << 1) + 1;
    let rightChildIndex = (parentIndex << 1) + 2;
    let minChildIndex = leftChildIndex;

    if (rightChildIndex < this.length && this._heap[rightChildIndex].p < this._heap[leftChildIndex].p) {
      minChildIndex = rightChildIndex;
    }

    while (minChildIndex < this.length && this._heap[parentIndex].p > this._heap[minChildIndex].p) {
      [ this._heap[parentIndex], this._heap[minChildIndex] ] = [ this._heap[minChildIndex], this._heap[parentIndex] ];
      parentIndex = minChildIndex;
      leftChildIndex = (parentIndex << 1) + 1;
      rightChildIndex = (parentIndex << 1) + 2;
      minChildIndex = leftChildIndex;

      if (rightChildIndex < this.length && this._heap[rightChildIndex].p < this._heap[leftChildIndex].p) {
        minChildIndex = rightChildIndex;
      }
    }

    return ret;
  }

  top() {
    return this._heap[0];
  }
}


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
  const max = sortedArr[sortedArr.length - 1].value;
  const min = sortedArr[0].value;
  const maxMin = max / min
  const minMax = min * sortedArr[1].value;
  const mins = [];

  for (const a of sortedArr) {
    if (a.value > maxMin) {
      break;
    }
    else {
      mins.push(a);
    }
  }

  mins.sort((x1, x2) => x1.value - x2.value);

  const pairs = [];
  const pointsSet = new Set();

  for (let i = 0; i < mins.length - 1; ++i) {
    for (let j = i + 1, p; j < mins.length && (p = mins[i].value * mins[j].value) <= max; ++j) {
      let pairI = mins[i].i;
      let pairJ = mins[j].i;

      if (pairI > pairJ) {
        [pairI, pairJ] = [pairJ, pairI];
      }

      if (pairJ - pairI !== 1) {
        pairs.push({i: pairI , j: pairJ, p: p});
        pointsSet.add(pairI);
        pointsSet.add(pairJ);
      }
    }
  }

  const points = Array.from(pointsSet).sort((x1, x2) => x1 - x2);
  const maxs = [];

  for (let i = 0; i < points.length - 1; ++ i) {
    const currentPoint = points[i];
    const nextPoint = points[i + 1];
    let currentMax = arr[currentPoint];

    for (let j = currentPoint + 1; j <= nextPoint; ++j) {
      if (currentMax.value < arr[j].value) {
        currentMax = arr[j];
      }
    }

    if (currentMax !== maxs[maxs.length - 1] && currentMax.value >= minMax) {
      maxs.push(currentMax);
    }
  }

  maxs.sort((x1, x2) => x1.i - x2.i);

  pairs.sort((x1, x2) => {
    return x1.i - x2.i;
  });

  const minBinHeap = new MinBinHeap(pairs.length);
  let pairIndex = 0;

  for(const currentMax of maxs) {
    while (minBinHeap.length > 0 && minBinHeap.top().p <= currentMax.value) {
      const pair = minBinHeap.pop();

      if (pair.i < currentMax.i && currentMax.i < pair.j) {
        ++count;
      }
    }

    while (pairIndex < pairs.length && pairs[pairIndex].i < currentMax.i) {
      const pair = pairs[pairIndex++];

      const maxInRange = pair.j >= currentMax.i;

      if (maxInRange && pair.p <= currentMax.value) {
        ++count;
      }
      else if (maxInRange){
        minBinHeap.push(pair);
      }
    }

    if (pairIndex >= pairs.length && minBinHeap.length === 0) break;
  }

  return count;
}
