export function parseInput(readLine) {
  const firstMultipleInput = readLine().replace(/\s+$/g, '').split(' ');
  const n = parseInt(firstMultipleInput[0], 10);
  const m = parseInt(firstMultipleInput[1], 10);
  let queries = Array(m);

  for (let i = 0; i < m; i++) {
    queries[i] = readLine().replace(/\s+$/g, '').split(' ').map(queriesTemp => parseInt(queriesTemp, 10));
  }

  return [n, queries];
}

export function solve(solution, input) {
  return [solution.apply(null, input)];
}
