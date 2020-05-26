import { solution } from './solution.js';


export function parseInput(readLine) {
  let input = [];
  const q = parseInt(readLine(), 10);

  for (let qItr = 0; qItr < q; qItr++) {
    const n = parseInt(readLine(), 10);
    let container = Array(n);

    for (let i = 0; i < n; ++i) {
      container[i] = readLine()
        .split(' ')
        .map(containerTemp => parseInt(containerTemp, 10));
    }

    input.push(container);
  }

  return input;
}

export function solve(input) {
  return input.map(solution);
}
