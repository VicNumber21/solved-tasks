export { fn as solution };

function fn(a, w) {
  const sortedAW = new Array(a.length);

  for (let i = 0; i < a.length; ++i) {
    sortedAW[i] = {a: a[i], w: w[i], i};
  }

  sortedAW.sort((x1, x2) => {
    const dif = x1.a - x2.a;
    return dif ? dif : x2.i - x1.i;
  });

  const sortedInd = new Array(a.length);

  for (let i = 0; i < sortedAW.length; ++i) {
    sortedInd[sortedAW[i].i] = i;
  }

  const sums = new Array(a.length).fill(0);

  for (let i = a.length - 1; i >= 0; --i) {
    let sumIt = sortedInd[i];
    const aw = sortedAW[sumIt];
    const currentSum = sums[sumIt] + aw.w;
    sums[sumIt] = currentSum;

    for(--sumIt; sumIt >= 0 && sums[sumIt] < currentSum ; --sumIt) {
      sums[sumIt] = currentSum;
    }
  }

  return sums[0];
}
