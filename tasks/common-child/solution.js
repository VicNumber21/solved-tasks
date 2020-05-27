export { commonChild as solution };

function commonChild(s1, s2) {
  let previousChildLengths = new Array(s1.length);
  let currentChildLengths = new Array(s1.length);

  for(let i = 0; i < s1.length; ++i) {
    [previousChildLengths, currentChildLengths] = [currentChildLengths, previousChildLengths];

    for(let j = 0; j < s2.length; ++j) {
      if (s1[i] === s2[j]) {
        const previousLength = previousChildLengths[j - 1] || 0;
        currentChildLengths[j] = previousLength + 1;
      }
      else {
        currentChildLengths[j] = Math.max(currentChildLengths[j - 1] || 0, previousChildLengths[j] || 0);
      }
    }
  }
  return currentChildLengths[currentChildLengths.length - 1];
}
