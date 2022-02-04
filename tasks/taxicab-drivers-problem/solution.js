export { solve as solution };

const Area = {
  H1V1: 0,
  H2V1: 1,
  H1V2: 2,
  H2V2: 3,
  Out: 4
};

function solve(hLimit, vLimit, junctions, edges) {
  let count = 0;
  const graph = new Graph(edges);
  const limit = { h: hLimit, hHalf: hLimit / 2, v: vLimit, vHalf: vLimit / 2  };
  const crosses = graph.crosses().sort((c1, c2) => graph.neighbours(c2).size - graph.neighbours(c1).size);

  for (const cross of crosses) {
    if (graph.isCross(cross)) {
      const areas = sortJunctions(graph, cross, junctions, limit);
      const [ h1v1, h1v2 ] = [ areas[Area.H1V1], areas[Area.H1V2] ];
      const [ h2v1, h2v2 ] = [ areas[Area.H2V1], areas[Area.H2V2] ];

      count += countOut(areas);

      count += countInAreaOnDifferentBranches(h2v1);
      count += countInAreaOnDifferentBranches(h1v2);
      count += countInAreaOnDifferentBranches(h2v2);

      count += countBetweenAreasOnDifferentBranches(h2v1, h2v2);
      count += countBetweenAreasOnDifferentBranches(h1v2, h2v2);

      count += countBySingleCord(h1v1, h1v2, (p) => p.y, limit);
      count += countBySingleCord(h1v1, h2v1, (p) => p.x, limit);

      count += countByDoubleCord(h1v1, h2v2, limit);
      count += countByDoubleCord(h1v2, h2v1, limit);

      graph.removeVertex(cross);
    }
  }

  const leaves = graph.leaves();

  for (const leaf of leaves) {
    if (graph.isLeaf(leaf)) {
      count += countOnChain(graph, leaf, junctions, limit);
    }
  }

  return count;
}

function countByDoubleCord(leftArea, rightArea, limit) {
  let count = 0;
  const [vArea, qArea] = [leftArea, rightArea].sort((a1, a2) => a1.vertices.length - a2.vertices.length);
  const order = (p1, p2) => p1.y !== p2.y ? p1.y - p2.y : p1.x - p2.x;
  const vPoints = getPoints(vArea.vertices, vArea.ctx.junctions).sort(order);

  const queries = qArea.vertices.map((v) => {
    const q = createQuery(qArea.ctx.junctions[v], limit);
    q.branchName = qArea.ctx.branchNames.get(v);
    return q;
  }).sort(order);

  let vIndex = 0;
  const vBranchCords = new Map();
  const vCords = { arr: [], sorted: false };
  const sort = (ctx) => {
    if (!ctx.sorted) {
      ctx.arr.sort();
      ctx.sorted = true;
    }
  };

  for (const query of queries) {
    let vPoint = vPoints[vIndex];

    while (vIndex < vPoints.length && vPoint.y <= query.y) {
      vCords.arr.push(vPoint.x);
      vCords.sorted = false;
      const vBranchName = vArea.ctx.branchNames.get(vPoint.v);
      const vBranch = vBranchCords.get(vBranchName) || { arr: [], sorted: false };
      vBranch.arr.push(vPoint.x);
      vBranch.sorted = false;
      vBranchCords.set(vBranchName, vBranch);
      vPoint = vPoints[++vIndex];
    }

    sort(vCords);
    const vReachableCount = binarySearch(vCords.arr, query.x);
    const vUnreachableCount = vArea.vertices.length - vReachableCount;

    const qBranch = vBranchCords.get(query.branchName) || { arr: [], sorted: false };
    sort(qBranch);
    const qFullBranch = vArea.branches.get(query.branchName) || [];
    const qBranchReachableCount = binarySearch(qBranch.arr, query.x);
    const qBranchUnreachableCount = qFullBranch.length - qBranchReachableCount;

    count += vUnreachableCount - qBranchUnreachableCount;
  }

  return count;
}

function countBySingleCord(closeArea, farArea, getCord, limit) {
  let count = 0;
  const [vArea, qArea] = [closeArea, farArea].sort((a1, a2) => a1.vertices.length - a2.vertices.length);
  const vCords = getPoints(vArea.vertices, vArea.ctx.junctions).map(getCord).sort();
  const vBranchCords = new Map();

  for (const [branchName, vBranch] of vArea.branches) {
    vBranchCords.set(branchName, getPoints(vBranch, vArea.ctx.junctions).map(getCord).sort());
  }

  const queries = qArea.vertices.map((v) => {
    const q = createQuery(qArea.ctx.junctions[v], limit);
    q.branchName = qArea.ctx.branchNames.get(v);
    return q;
  }).sort((p1, p2) => getCord(p1) - getCord(p2));

  let vReachableCount = 0;
  const vBranchReachableCounts = new Map();

  for (const query of queries) {
    vReachableCount = binarySearch(vCords, getCord(query), {firstIndex: vReachableCount});
    const vUnreachableCount = vCords.length - vReachableCount;

    const vBranch = vBranchCords.get(query.branchName) || [];
    let vBranchReachableCount = vBranchReachableCounts.get(query.branchName) || 0;
    vBranchReachableCount = binarySearch(vBranch, getCord(query), {firstIndex: vBranchReachableCount});
    const vBranchUnreachableCount = vBranch.length - vBranchReachableCount;

    count += vUnreachableCount - vBranchUnreachableCount;
  }

  return count;
}

function getPoints(vertices, junctions) {
  return vertices.map((v) => {
    const { x, y } = junctions[v];
    return { v, x, y};
  });
}

function createQuery(point, limit) {
  return { x: limit.h - point.x, y: limit.v - point.y};
}

function countInAreaOnDifferentBranches(area) {
  let count = 0;
  let areaVerticesCount = area.vertices.length;

  for (const [, branch] of area.branches) {
    const othersCount = areaVerticesCount - branch.length;
    count += branch.length * othersCount;
    areaVerticesCount = othersCount;
  }

  return count;
}

function countBetweenAreasOnDifferentBranches(sourceArea, unreachableArea) {
  let count = 0;
  const unreachableAreaCount = unreachableArea.vertices.length;

  for (const [branchName, sourceBranch] of sourceArea.branches) {
    const unreachableBranch = unreachableArea.branches.get(branchName) || [];
    const unreachableOthersCount = unreachableAreaCount - unreachableBranch.length;

    count += sourceBranch.length * unreachableOthersCount;
  }

  return count;
}

function countOut(areas) {
  let count = areas[Area.Out].vertices.length;
  const inLimitAreas = areas.slice(Area.H1V1, Area.Out);

  for (const area of inLimitAreas) {
    count += countBetweenAreasOnDifferentBranches(area, areas[Area.Out]);
  }

  count += countInAreaOnDifferentBranches(areas[Area.Out]);

  return count;
}

function sortJunctions(graph, root, junctions, limit) {
  const ctx = {
    branchNames: new Map(),
    junctions: new Array(junctions.length)
  };

  const areas = [
      { ctx: ctx, vertices: [], branches: new Map(), condition: (x, y) => x <= limit.hHalf && y <= limit.vHalf },
      { ctx: ctx, vertices: [], branches: new Map(), condition: (x, y) => x <= limit.h && y <= limit.vHalf },
      { ctx: ctx, vertices: [], branches: new Map(), condition: (x, y) => x <= limit.hHalf && y <= limit.v },
      { ctx: ctx, vertices: [], branches: new Map(), condition: (x, y) => x <= limit.h && y <= limit.v },
      { ctx: ctx, vertices: [], branches: new Map(), condition: () => true }
    ];

  graph.travers({
    stack: [],
    start: root,
    visit: (v, prev) => {
      const j = mapJunction(v, prev, junctions, ctx.junctions);
      if (prev === undefined) { return }

      const vBranchName = prev === root ? v : ctx.branchNames.get(prev);
      ctx.branchNames.set(v, vBranchName);

      for (const area of areas) {
        if (area.condition(j.x, j.y)) {
          area.vertices.push(v);
          const vBranch = area.branches.get(vBranchName) || [];
          vBranch.push(v);
          area.branches.set(vBranchName, vBranch);
          break;
        }
      }
    }
  });

  return areas;
}

function mapJunction(v, prev, originalJunctions, mappedJunctions) {
  const j = { x: 0, y: 0 };

  if (prev !== undefined) {
    const prevJ = originalJunctions[prev];
    const prevXY = mappedJunctions[prev];
    const vJ = originalJunctions[v];
    j.x = prevXY.x + Math.abs(vJ[0] - prevJ[0]);
    j.y = prevXY.y + Math.abs(vJ[1] - prevJ[1]);
  }

  mappedJunctions[v] = j;

  return j;
}

function countOnChain(graph, root, junctions, limit) {
  let count = 0;
  let currentLimit = { h: limit.h, v: limit.v };
  const mappedJunctions = new Array(junctions.length);
  mappedJunctions[root] = { x: 0, y: 0};
  let currentCount = 0;
  const reachableVerticesCounts = [];
  let currentRootIndex = 1;
  const visited = [];

  graph.travers({
    stack: [],
    start: root,
    visit: (v, prev) => {
      visited.push(v);
      const j = mapJunction(v, prev, junctions, mappedJunctions);

      while (j.x > currentLimit.h || j.y > currentLimit.v) {
        reachableVerticesCounts.push(currentCount);
        const currentRoot = visited[currentRootIndex++];
        const { x, y } = mappedJunctions[currentRoot];
        currentLimit = { h: x + limit.h, v: y + limit.v };
      }

      ++currentCount;
    }
  });

  for (const reachableCount of reachableVerticesCounts) {
    count += visited.length - reachableCount;
  }

  for (const v of visited) {
    graph.removeVertex(v);
  }

  return count;
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

  removeVertex(v) {
    const vNeighbours = this.neighbours(v);

    for (const neighbour of vNeighbours) {
      this.removeEdge(neighbour, v);
    }

    this._adjLists.delete(v);
  }

  addEdge(u, v) {
    this.addVertex(u);
    const uNeighbours = this.neighbours(u);
    uNeighbours.add(v);
  }

  removeEdge(u, v) {
    const uNeighbours = this.neighbours(u);
    uNeighbours.delete(v);
  }

  filter (condition) {
    const vertices = [];

    for (const [v] of this._adjLists) {
      if (condition(v)) {
        vertices.push(v);
      }
    }

    return vertices;
  }

  leaves () {
    return this.filter(this.isLeaf.bind(this));
  }

  isLeaf(v) {
    const neighbours = this.neighbours(v);
    return neighbours && neighbours.size === 1;
  }

  crosses () {
    return this.filter(this.isCross.bind(this));
  }

  isCross(v) {
    const neighbours = this.neighbours(v);
    return neighbours && neighbours.size > 2;
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

function binarySearch(arr, value, {
    firstIndex = 0,
    lastIndex = arr.length - 1,
    goRight = (a, v) => a <= v
  } = {})
{
  let low = firstIndex;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.ceil((low + high) / 2);

    if (goRight(arr[mid], value)) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return low;
}
