export function parseInput(readLine) {
  const stringsCount = parseInt(readLine().trim(), 10);

  let strings = [];

  for (let i = 0; i < stringsCount; i++) {
    const stringsItem = readLine();
    strings.push(stringsItem);
  }

  const queriesCount = parseInt(readLine().trim(), 10);

  let queries = [];

  for (let i = 0; i < queriesCount; i++) {
    const queriesItem = readLine();
    queries.push(queriesItem);
  }

  return [strings, queries];
}

export function solve(solution, input) {
  return solution.apply(null, input);
}
