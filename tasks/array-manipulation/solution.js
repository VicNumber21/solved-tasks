export { fn as solution };

function fn(n, queries) {
  let remainingSum = 0;
  const lefts = new Map();
  const rights = new Map();

  for (let [left, right, value] of queries) {
    left = +left;
    right = +right;
    remainingSum += value;
    lefts.set(left, (lefts.get(left) || 0) + value);
    rights.set(right, (rights.get(right) || 0) + value);
  }

  const sortedLefts = Array.from(lefts).sort(([left1], [left2]) => left2 - left1);
  const sortedRights = Array.from(rights).sort(([right1], [right2]) => right2 - right1);

  let max = 0;
  let currentSum = 0;
  while (sortedLefts.length > 0 && ((max - currentSum) < remainingSum)) {
    let [left, increment] = sortedLefts.pop();

    let decrement = 0;
    while (sortedRights.length > 0 && sortedRights[sortedRights.length - 1][0] < left) {
      const [, value] = sortedRights.pop();
      decrement += value;
    }

    currentSum += increment - decrement;
    max = Math.max(max, currentSum);
    remainingSum -= decrement;
  }

  return max;
}
