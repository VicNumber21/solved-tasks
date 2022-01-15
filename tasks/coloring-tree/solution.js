export { solve as solution };

function solve(root, tree, colors, subroots) {
  const graph = new Graph(tree);
  const vertices = [];
  const stack = [];
  const queue = new Queue(stack);
  const answers = new Array(graph.order());
  const colorCounter = new Map();

  for (const color of colors) {
    const count = colorCounter.get(color) || 0;
    colorCounter.set(color, count + 1);
  }

  graph.travers({
    stack: queue,
    start: root - 1,
    visit: (v, prev) => {
      vertices[v] = Array.from(graph.neighbours(v)).filter((val) => val !== prev);
    }
  });

  while (stack.length > 0) {
    const v = stack.pop().v;
    const children = vertices[v];
    const colorSets = children.map((child) => answers[child]);

    for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      answers[child] = colorSets[i].size;
    }

    answers[v] = new ColorSet(v, colorSets, { map: colors, counter: colorCounter});
  }

  answers[root - 1] = answers[root - 1].size;

  return subroots.map((s) => answers[s - 1]);
}

class ColorSet {
  constructor(v, colorSets, colors) {
    this._colors = colors;
    this._uniqueColorCount = 0;
    this._merge(v, colorSets);
  }

  get size()  {
    return this._uniqueColorCount + this._set.size;
  }

  _merge(v, colorSets) {
    const sets = [];

    for (const colorSet of colorSets) {
      this._uniqueColorCount += colorSet._uniqueColorCount;
      sets.push(colorSet._set);
    }

    sets.sort((set1, set2) => set2.size - set1.size);
    this._set = sets.pop() || new Set();

    for (const set of sets) {
      for (const color of set) {
        this._set.add(color);
      }
    }

    const color = this._colors.map[v];

    if (this._colors.counter.get(color) === 1) {
      ++this._uniqueColorCount;
    }
    else {
      this._set.add(color);
    }
  }
}

class Queue {
  constructor(stack) {
    this._stack = stack;
    this._index = 0;
    this.length = 0;
  }

  push(v) {
    this._stack.push(v);
    ++this.length;
  }

  pop() {
    let v;

    if (this._index < this._stack.length) {
      --this.length;
      v = this._stack[this._index++];
    }

    return v;
  }
}

class Graph {
  constructor(edges) {
    this._adjLists = new Map();
    this.addVertex(edges[0][0] - 1);

    for (const [u, v] of edges) {
      this.addEdge(u - 1, v - 1);
      this.addEdge(v - 1, u - 1);
    }
  }

  order() {
    return this._adjLists.size;
  }

  neighbours(v) {
    return  this._adjLists.get(v);
  }

  addVertex(v) {
    if (!this._adjLists.has(v)) {
      this._adjLists.set(v, new Set());
    }
  }

  addEdge(u, v) {
    this.addVertex(u);
    const uNeighbours = this.neighbours(u);
    uNeighbours.add(v);
  }

  travers({
            stack,
            start,
            visit = (/* v, u */) => false
          } = {}) {
    const planned = new Set();
    stack.push({ v: start });
    planned.add(start);

    while (stack.length > 0) {
      const current = stack.pop();
      const neighbours = this.neighbours(current.v);
      visit(current.v, current.u);

      for (const u of neighbours) {
        if (!planned.has(u)) {
          planned.add(u);
          stack.push({ v: u, u: current.v});
        }
      }
    }
  }
}
