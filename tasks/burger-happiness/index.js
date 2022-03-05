export function parseInput(readLine) {
  const n = parseInt(readLine().trim(), 10);
  const restaurants = Array(n);

  for (let i = 0; i < n; i++) {
    restaurants[i] = readLine().replace(/\s+$/g, '').split(' ').map(restaurantsTemp => parseInt(restaurantsTemp, 10));
  }

  return [restaurants];
}

export function solve(solution, input) {
  return [solution.apply(null, input)];
}
