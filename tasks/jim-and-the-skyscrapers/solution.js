export { solve as solution };

function solve(houses) {
  const indexes = new Array(houses.length);
  for (let i = 0; i < houses.length; ++i) indexes[i] = i;
  indexes.sort((i1, i2) => houses[i1] === houses[i2] ? i2 - i1 : houses[i2] - houses[i1]);

  const skip = new Array(houses.length);
  const addSkip = (left, right) => { skip[left] = right; skip[right] = left; };

  let counted = 0;
  let count = 0;

  while (counted < houses.length) {
    let index = indexes.pop();

    if (skip[index] === undefined) {
      ++counted;
      const [ house, left] = [ houses[index], index ];
      let [ houseCount, right ] = [ 1, index ];
      addSkip(left, right);

      for (++index; index < houses.length && (skip[index] !== undefined || houses[index] === house); ++index) {
        if (skip[index] === undefined) {
          ++counted;
          ++houseCount;
        }
        else {
          index = skip[index];
        }

        right = index;
        addSkip(left, right);
      }

      count += houseCount * (houseCount - 1);
    }
  }

  return count;
}
