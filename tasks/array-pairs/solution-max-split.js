export { fn as solution };

function fn(arr) {
  // it must be O(n*log(n))
  let count = 0;
  let newIndex = 0;
  let newLength = arr.length;

  for(let i = 0; i < arr.length; ++i) {
    if (arr[i] === 1) {
      count += --newLength;
    }
    else {
      arr[newIndex] = { a: arr[i], i: newIndex };
      ++newIndex;
    }
  }

  arr.length = newLength;
  const sortedArr = Array.from(arr).sort((x1, x2) => x1.a - x2.a);
  const foundPairs = new Set();

  while (sortedArr.length > 1) {
    const max = sortedArr.pop();
    const min = sortedArr[0];
    const maxMin = max.a / min.a;

    if (maxMin < min.a) break;

    const lefts = new Map();
    const rights = new Map();

    for (const a of sortedArr) {
      if (a.a > maxMin) break;

      const side = a.i < max.i ? lefts : rights;
      const list = side.get(a.a) || [];
      list.push(a.i);
      side.set(a.a, list);
    }

    for (const [left, leftIndexes] of lefts) {
      for (const [right, rightIndexes] of rights) {
        if (left * right <= max.a) {
          for (const leftIndex of leftIndexes) {
            for (const rightIndex of rightIndexes) {
              foundPairs.add(leftIndex + '-' + rightIndex);
            }
          }
        }
      }
    }
  }

  return count + foundPairs.size;
}
