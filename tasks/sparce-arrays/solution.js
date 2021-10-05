export { fn as solution };

function fn(strings, queries) {
  const counter = new Map();

  for (const str of strings) {
    counter.set(str, (counter.get(str) || 0) + 1);
  }

  return queries.map((q) => counter.get(q) || 0);
}
