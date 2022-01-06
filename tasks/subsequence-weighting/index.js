export function parseInput(readLine) {
  const t = parseInt(readLine().trim(), 10);
  const input = [];

  for (let tItr = 0; tItr < t; tItr++) {
    parseInt(readLine().trim(), 10);
    const a = readLine().replace(/\s+$/g, '').split(' ').map(aTemp => parseInt(aTemp, 10));
    const w = readLine().replace(/\s+$/g, '').split(' ').map(wTemp => parseInt(wTemp, 10));

    input.push([a, w]);
  }

  return input;
}

export function solve(solution, input) {
  return input.map((args) => solution.apply(null, args));
}
