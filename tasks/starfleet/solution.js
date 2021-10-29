export { solve as solution };

function solve(v, ships, queries) {
  const frequencies = new Map();

  for (const [, shipY, shipF] of ships) {
    const yCounts = frequencies.get(shipF) || new Map();
    const yCount = yCounts.get(shipY) || 0;
    yCounts.set(shipY, yCount + 1);
    frequencies.set(shipF, yCounts);
  }

  const sortedFleetCounts = [];

  for (const [, yCounts] of frequencies) {
    const sortedCounts = Array.from(yCounts).sort(([y1], [y2]) => y1 - y2);

    for (let i = 1; i < sortedCounts.length; ++i) {
      sortedCounts[i][1] += sortedCounts[i - 1][1];
    }

    sortedFleetCounts.push([sortedCounts[sortedCounts.length - 1][1], sortedCounts]);
  }

  sortedFleetCounts.sort(([max1], [max2]) => max2 - max1);

  return queries.map(([yUp, yDown]) => {
    let maxCount = 0;

    for (const [currentMax, yCounts] of sortedFleetCounts) {
      if (currentMax <= maxCount) break;

      let downIndex = binarySearch(yCounts, yDown) - 1;
      let upIndex = binarySearch(yCounts, yUp, downIndex);

      if (yCounts[upIndex] !== undefined && yCounts[upIndex][0] !== yUp || upIndex === yCounts.length) {
        --upIndex;
      }

      const downCount = yCounts[downIndex] === undefined ? 0 : yCounts[downIndex][1];
      const upCount = yCounts[upIndex] === undefined ? 0 : yCounts[upIndex][1];
      const count = upCount - downCount;
      maxCount = Math.max(maxCount, count);
    }

    return maxCount;
  });
}

function binarySearch(counter, y, lowIndex = 0) {
  let low = lowIndex >= 0 ? lowIndex : 0;
  let high = counter.length - 1;

  while (low <= high) {
    const mid = Math.ceil((low + high) / 2);

    if (counter[mid][0] < y) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return low;
}
