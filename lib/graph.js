import './array';

export class Graph extends Array {
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

  anyLeaf() {
    return this.findVertex(this.isLeaf.bind(this));
  }

  findVertex(cb) {
    let vertex = this.ctx.firstVertex;

    for (; vertex < this.length && !cb(vertex); ++vertex) {}

    return vertex < this.length ? vertex : false;
  }

  isLeaf(v) {
    return this[v].length === 1;
  }
}