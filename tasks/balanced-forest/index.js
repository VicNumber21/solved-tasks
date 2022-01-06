export function parseInput(readLine) {
  const input = [];
  const q = parseInt(readLine(), 10);

  for (let qItr = 0; qItr < q; ++qItr) {
      const n = parseInt(readLine(), 10);

      let tree = {};
      tree.vertices = readLine().split(' ').map(vertex => parseInt(vertex, 10));

      tree.edges = Array(n - 1);

      for (let i = 0; i < n - 1; ++i) {
          tree.edges[i] = readLine().split(' ').map(edgesTemp => parseInt(edgesTemp, 10));
      }

      input.push(tree);
  }

  return input;
}

export function solve(solution, input) {
  return input.map(tree => solution(tree.vertices, tree.edges));
}
