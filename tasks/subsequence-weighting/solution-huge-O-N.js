export { fn as solution };

// This is too slow because of big max value of a (1e9)
// So it is kinda O(n) but K is huge... bigger than n =)

function fn(a, w) {
  let aMin = 1e9;
  let aMax = 0;

  for (const aIt of a) {
    aMin = Math.min(aMin, aIt);
    aMax = Math.max(aMax, aIt);
  }

  const length = aMax - aMin + 1;
  const sums = new Array(length);

  for (let i = a.length - 1; i >= 0; --i) {
    let sumIt = a[i] - aMin;
    const sum = (sums[sumIt + 1] || 0) + w[i];

    for(; sumIt >= 0 && sum > (sums[sumIt] || 0); --sumIt) {
      sums[sumIt] = sum;
    }
  }

  return sums.reduce((acc, sum) => Math.max(acc || 0, sum || 0), 0);
}
