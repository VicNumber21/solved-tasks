import { solution } from './solution.js';


export function parseInput(readLine) {
  const T = parseInt(readLine().trim(), 10);
  const tests = [];

  for (let tItr = 0; tItr < T; ++tItr) {
    const firstMultipleInput = readLine().replace(/\s+$/g, '').split(' ');

    const n = parseInt(firstMultipleInput[0], 10);

    const m = parseInt(firstMultipleInput[1], 10);

    let operations = [];

    for (let i = 0; i < m; i++) {
      const opsItem = readLine();
      operations.push(opsItem);
    }

    tests.push([n, operations]);
  }

  return tests;
}

export function solve(tests) {
  return tests.reduce((res, test) => res.concat(solution.apply(null, test)), []);
}
