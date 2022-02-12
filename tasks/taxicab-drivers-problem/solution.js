export { solve as solution };

// I was close to the solution but did not find the right one
// Below is 'work on mistakes' - rework of solution found in the Internet
// It seems that in competition programming arrays are win condition
// So I decided to try writing in this style
function solve(hLimit, vLimit, junctions, edges) {
  const graph = createJunctionsGraph(hLimit, vLimit, edges, junctions);
  const centroids = graph.centroidSplit();
  let reachableCount = 0;

  for(const centroid of centroids) {
    reachableCount += countReachable(graph, centroid);
    graph.ctx.isCounted[centroid] = true;
  }

  const n = junctions.length;
  const pairsCount = n * (n - 1) / 2;

  return pairsCount - reachableCount;
}

function createJunctionsGraph(hLimit, vLimit, edges, junctions) {
  const graph = new Graph(junctions.length);

  for (const [v, u] of edges) {
    const [ jv, ju ] = [ junctions[v - 1], junctions[u - 1] ];
    const [ dx, dy ] = [ Math.abs(jv[0] - ju[0]), Math.abs(jv[1] - ju[1])];
    graph[v].push({ v: u, dx, dy });
    graph[u].push({ v, dx, dy })
  }

  graph.ctx.limit = { H: hLimit, V:vLimit };
  graph.ctx.isCounted = new Array(graph.length).fill(false);

  return graph;
}

function countReachable(graph, v) {
  const vPoint = { x: 0, y:0 };
  const allPoints = [[vPoint]];
  const branchCounts = [];

  for (const neighbor of graph[v]) {
    const branchPoints = collectPoints(graph, neighbor, v, vPoint);
    branchCounts.push(countReachablePoints(branchPoints, graph.ctx.limit))
    allPoints.push(branchPoints);
  }

  const allCount = countReachablePoints(allPoints.flat(), graph.ctx.limit);

  return allCount - branchCounts.sum();
}

function collectPoints(graph, { v, dx, dy }, prev, prevPoint, points = []) {
  if (!graph.ctx.isCounted[v]) {
    const {H, V} = graph.ctx.limit;
    const vPoint = {x: prevPoint.x + dx, y: prevPoint.y + dy};

    if (vPoint.x <= H && vPoint.y <= V) {
      points.push(vPoint);

      for (const neighbor of graph[v]) {
        if (neighbor.v !== prev) {
          collectPoints(graph, neighbor, v, vPoint, points);
        }
      }
    }
  }

  return points;
}

const Bit = {
  last: (v) => v & -v,
  inc: (v) => v + Bit.last(v),
  dec: (v) => v - Bit.last(v)
};

function incXCount(xBits, xBit) {
  for (let bitIndex = xBit; bitIndex < xBits.length; bitIndex = Bit.inc(bitIndex)) {
    ++xBits[bitIndex];
  }
}

function queryXCount(xBits, xBit) {
  let countX = 0;

  for (let bitIndex = xBit; bitIndex > 0; bitIndex = Bit.dec(bitIndex)) {
    countX += xBits[bitIndex];
  }

  return countX;
}

function countReachablePoints(points, { H, V }) {
  let countWithDuplicates = 0;
  const order = (p1, p2) => p1.y !== p2.y ? p1.y - p2.y : p1.x - p2.x;
  points.sort(order);
  const queries = points.map((point) => ({ x: H - point.x, y: V - point.y})).sort(order);
  const selfQueriesCount = queries.filter(({ x, y}) => x >= H / 2 && y >= V / 2).length;

  const xs = points.map(({x}) => x).concat(queries.map(({x}) => x)).sortNumbers().uniqueInPlace();
  const xBits = new Array(xs.length + 1).fill(0);
  const xBitMap = new Map();
  for (let i = 0; i < xs.length; ++i) { xBitMap.set(xs[i], i + 1); }

  let pointIndex = 0;
  let queryIndex = 0;

  while (queryIndex < queries.length) {
    const [ point, query ] = [ points[pointIndex], queries[queryIndex] ];

    if (pointIndex < points.length && order(point, query) <= 0) {
      incXCount(xBits, xBitMap.get(point.x));
      ++pointIndex;
    }
    else {
      countWithDuplicates += queryXCount(xBits, xBitMap.get(query.x));
      ++queryIndex;
    }
  }

  return (countWithDuplicates - selfQueriesCount) / 2;
}

class Graph extends Array {
  constructor(n, firstVertex = 1) {
    super();
    const graph = new Array(n + firstVertex);
    graph.mapInPlace(() => []);
    graph[0] = { firstVertex };
    graph.__proto__ = Graph.prototype;

    return graph;
  }

  get ctx() {
    return this[0];
  }

  centroidSplit(start = 1) {
    const isNotWall = new Array(this.length).fill(true);
    const centroids = [];
    const subtreeRoots = [start];
    let i = 0;

    while (centroids.length < this.length - this.ctx.firstVertex) {
      const root = subtreeRoots[i++];
      const centroid = this.centroid(root, isNotWall);
      centroids.push(centroid);
      isNotWall[centroid] = false;

      for (const neighbor of this[centroid]) {
        if (isNotWall[neighbor.v]) {
          subtreeRoots.push(neighbor.v);
        }
      }
    }

    return centroids;
  }

  centroid(start = 1, isNotWall = []) {
    this.fillSubtreeSizes(start, { isNotWall });

    let centroid = start;
    let maxNeighbor = start;
    let isFound = false;
    const subtreeLength = this.subtreeSizes[start];
    const isVisited = new Set();

    while (!isFound) {
      isFound = true;
      centroid = maxNeighbor;
      isVisited.add(centroid);
      let maxNeighborSubtree = 0;

      for(const { v } of this[centroid]) {
        if (isNotWall[v] && !isVisited.has(v)) {
          if (2 * this.subtreeSizes[v] > subtreeLength) {
            isFound = false;
          }

          if (this.subtreeSizes[v] > maxNeighborSubtree) {
              maxNeighbor = v;
              maxNeighborSubtree = this.subtreeSizes[v];
          }
        }
      }

      isFound = isFound && (2 * (subtreeLength - this.subtreeSizes[centroid]) < subtreeLength);
    }

    return centroid;
  }

  get subtreeSizes() {
    if (!this.ctx.subtreeSizes) {
      this.ctx.subtreeSizes = new Array(this.length);
    }

    return this.ctx.subtreeSizes;
  }

  fillSubtreeSizes(v, { prev , isNotWall = [] } = {}) {
    this.subtreeSizes[v] = 1;

    for (const neighbor of this[v]) {
      if (isNotWall[neighbor.v] && neighbor.v !== prev) {
        this.fillSubtreeSizes(neighbor.v, { prev: v, isNotWall});
        this.subtreeSizes[v] += this.subtreeSizes[neighbor.v];
      }
    }
  }
}

Array.prototype.mapInPlace = function (fn) {
  for (let i = 0; i < this.length; ++i) {
    this[i] = fn(this[i]);
  }

  return this;
}

Array.prototype.last = function () {
  return this[this.length - 1];
}

Array.prototype.sum = function () {
  return this.reduce((acc, x) => acc + x, 0);
}

Array.prototype.sortNumbers = function () {
  return this.sort((x1, x2) => x1 - x2);
}

Array.prototype.uniqueInPlace = function () {
  let last = this.length > 0 ? 0 : -1;

  for (let index = 1; index < this.length; ++index) {
    if (this[last] !== this[index]) {
      this[++last] = this[index];
    }
  }

  this.length = last + 1;

  return this;
}