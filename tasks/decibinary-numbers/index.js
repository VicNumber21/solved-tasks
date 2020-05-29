import { solution } from './solution.js';


export function parseInput(readLine) {
  const q = parseInt(readLine(), 10);
  let input = [];

  for (let qItr = 0; qItr < q; ++qItr) {
    input.push(parseInt(readLine(), 10));
  }

  return input;
}

export function solve(input) {
  return input.map(solution);
}
