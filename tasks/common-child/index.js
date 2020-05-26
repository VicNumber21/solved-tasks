import { solution } from './solution.js';


export function parseInput(readLine) {
  return [readLine(), readLine()];
}

export function solve(input) {
  return [solution.apply(null, input)];
}
