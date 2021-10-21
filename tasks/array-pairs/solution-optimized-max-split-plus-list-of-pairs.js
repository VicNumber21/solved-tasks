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

  maxs.sort((x1, x2) => x1.value - x2.value);

  pairs.sort((x1, x2) => {
    return x1.i - x2.i;
  });

  const head = {prev: null, next: null};
  head.prev = head;
  head.next = head;
  let currentNode = head;

  for (const pair of pairs) {
    pair.prev = currentNode;
    pair.next = currentNode.next;
    pair.next.prev = pair;
    pair.prev.next = pair;
    currentNode = pair;
  }

  while (maxs.length > 0) {
    const currentMax = maxs.pop();
    currentNode = head.next;

    while (currentNode !== head) {
      let handledNode = currentMax.value < currentNode.p;

      if (!handledNode && currentNode.i <= currentMax.i && currentMax.i <= currentNode.j) {
        ++count;
        handledNode = true;
      }

      if (handledNode) {
        currentNode.prev.next = currentNode.next;
        currentNode.next.prev = currentNode.prev;
      }

      currentNode = currentNode.next;
    }

    if (head.next === head) break;
  }

  return count;
}