export { fn as solution };

function fn(n, queries) {
  let remainingSum = 0;
  const lefts = {};
  const rights = {};

  for (const [left, right, value] of queries) {
    remainingSum += value;
    lefts[left] = (lefts[left] || 0) + value;
    rights[right] = (rights[right] || 0) + value;
  }

  const sortedLefts = Object.entries(lefts).sort(([left1], [left2]) => left2 - left1);
  const sortedRights = Object.entries(rights).sort(([right1], [right2]) => right2 - right1);

  let max = 0;
  let currentSum = 0;
  while (sortedLefts.length > 0 && ((max - currentSum) < remainingSum)) {
    let [left, increment] = sortedLefts.pop();
    left = +left;

    let decrement = 0;
    while (sortedRights.length > 0 && (+sortedRights[sortedRights.length - 1][0]) < left) {
      const [, value] = sortedRights.pop();
      decrement += value;
    }

    currentSum += increment - decrement;
    max = Math.max(max, currentSum);
    remainingSum -= decrement;
  }

  return max;
}
