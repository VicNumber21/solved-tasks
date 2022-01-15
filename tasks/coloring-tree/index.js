export function parseInput(readLine) {
  const firstMultipleInput = readLine().replace(/\s+$/g, '').split(' ');

  const n = parseInt(firstMultipleInput[0], 10);
  const m = parseInt(firstMultipleInput[1], 10);
  const root = parseInt(firstMultipleInput[2], 10);

  let tree = Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    tree[i] = readLine().replace(/\s+$/g, '').split(' ').map(treeTemp => parseInt(treeTemp, 10));
  }

  let color = [];

  for (let i = 0; i < n; i++) {
    const colorItem = parseInt(readLine().trim(), 10);
    color.push(colorItem);
  }

  let s = [];

  for (let i = 0; i < m; i++) {
    const sItem = parseInt(readLine().trim(), 10);
    s.push(sItem);
  }

  return [root, tree, color, s];
}

export function solve(solution, input) {
  return solution.apply(null, input);
}
