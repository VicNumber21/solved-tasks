export function parseInput(readLine) {
  return [readLine(), readLine()];
}

export function solve(solution, input) {
  return [solution.apply(null, input)];
}
