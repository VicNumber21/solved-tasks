import { solution } from './solution.js';


export function parseInput(readLine) {
  parseInt(readLine().trim(), 10); // n not needed in JS in fact
  const p = readLine().replace(/\s+$/g, '').split(' ').map(pTemp => parseInt(pTemp, 10));

  return [p];
}

export function solve(input) {
  return [solution.apply(null, input)];
}
