export function parseInput(readLine) {
  const nk = readLine().split(' ');
  const n = parseInt(nk[0], 10);
  const k = parseInt(nk[1], 10);
  const r_qC_q = readLine().split(' ');
  const r_q = parseInt(r_qC_q[0], 10);
  const c_q = parseInt(r_qC_q[1], 10);
  let obstacles = Array(k);

  for (let i = 0; i < k; i++) {
    obstacles[i] = readLine().split(' ').map(obstaclesTemp => parseInt(obstaclesTemp, 10));
  }

  return [n, k, r_q, c_q, obstacles];
}

export function solve(solution, input) {
  return [solution.apply(null, input)];
}
