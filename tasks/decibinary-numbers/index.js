export function parseInput(readLine) {
  const q = parseInt(readLine(), 10);
  let input = [];

  for (let qItr = 0; qItr < q; ++qItr) {
    input.push(BigInt(readLine()));
  }

  return input;
}

export function solve(solution, input) {
  return input.map(solution);
}
