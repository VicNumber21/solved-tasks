export function parseInput(readLine) {
  readLine();
  const arr = readLine().replace(/\s+$/g, '').split(' ').map(arrTemp => parseInt(arrTemp, 10));

  return [arr];
}

export function solve(solution, input) {
  return [solution.apply(null, input)];
}
