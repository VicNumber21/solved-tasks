export function diff([wrong, correct]) {
  correct.pop();

  const missedSet = new Set(correct.map((el) => el.join('')));

  for(const el of wrong) {
    missedSet.delete(el.slice(0, 3).join(''));
  }

  // 1044
  console.log(wrong.filter((el) => el[4] >= 1044 && el[4] <= 1070));
  // console.log(wrong.filter((el) => (el[0] === 1044 || el[2] === 1044) && el[4] !== 1176 && el[4] !== 1007));
  // console.log(wrong.filter((el) => (el[0] === 1045 || el[2] === 1045) && el[4] !== 1176 && el[4] !== 1007));
  // console.log(wrong.filter((el) => el[0] === 1044 || el[2] === 1044 || el[4] === 1044));
  // console.log(missedSet);
}

export function logSolution(left, right, rightLeft, leftMap, city) {
  for (; left <= rightLeft; ++left) {
    if (left !== right && leftMap.get(left).isSegment) {
      console.log(left,'-', right, ':', city);
    }
  }
}

