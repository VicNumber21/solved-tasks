export function parseInput(readLine) {
  const firstMultipleInput = readLine().replace(/\s+$/g, '').split(' ');
  const n = parseInt(firstMultipleInput[0], 10);
  const h = parseInt(firstMultipleInput[1], 10);
  const v = parseInt(firstMultipleInput[2], 10);

  let junctions = Array(n);

  for (let i = 0; i < n; i++) {
    junctions[i] = readLine().replace(/\s+$/g, '').split(' ').map(junctionsTemp => parseInt(junctionsTemp, 10));
  }

  let edges = Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    edges[i] = readLine().replace(/\s+$/g, '').split(' ').map(edgesTemp => parseInt(edgesTemp, 10));
  }

  return [h, v, junctions, edges];
}

export function solve(solution, input) {
  return [solution.apply(null, input)];
}
