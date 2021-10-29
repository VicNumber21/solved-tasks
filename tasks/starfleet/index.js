import { solution } from './solution.js';


export function parseInput(readLine) {
  const firstMultipleInput = readLine().replace(/\s+$/g, '').split(' ');
  const n = parseInt(firstMultipleInput[0], 10);
  const q = parseInt(firstMultipleInput[1], 10);
  const v = parseInt(firstMultipleInput[2], 10);

  let ships = Array(n);

  for (let i = 0; i < n; i++) {
    ships[i] = readLine().replace(/\s+$/g, '').split(' ').map(shipsTemp => parseInt(shipsTemp, 10));
  }

  let queries = Array(q);

  for (let i = 0; i < q; i++) {
    queries[i] = readLine().replace(/\s+$/g, '').split(' ').map(queriesTemp => parseInt(queriesTemp, 10));
  }

  return [v, ships, queries];
}

export function solve(input) {
  return solution.apply(null, input);
}
