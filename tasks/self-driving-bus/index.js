import { solution } from './solution.js';


export function parseInput(readLine) {
  const n = parseInt(readLine().trim(), 10);
  let tree = Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    tree[i] = readLine().replace(/\s+$/g, '').split(' ').map(treeTemp => parseInt(treeTemp, 10));
  }

  return [tree];
}

export function solve(input) {
  return [solution.apply(null, input)];
}
