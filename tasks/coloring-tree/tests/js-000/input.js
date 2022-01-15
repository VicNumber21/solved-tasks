const N = 100000;
const tree = [];

for (let i = 1; i < N; ++i) {
  tree.push([i, i + 1]);
}

const colors = [];

for (let i = 0; i < N; ++i) {
  colors.push(i);
}

const subtrees = [];

for (let i = 0; i < N; ++i) {
  subtrees.push(N);
}

export const input = [1, tree, colors, subtrees];