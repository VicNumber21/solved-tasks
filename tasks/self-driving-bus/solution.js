export { solve as solution };

function solve(tree) {
  const rootQueue = new Array(tree.length + 1);
  rootQueue[0] = new Map();
  addVertex(rootQueue[0], 1);

  for (const [u, v] of tree) {
    addEdge(rootQueue[0], u, v);
    addEdge(rootQueue[0], v, u);
  }

  let count = rootQueue.length;

  for (let rootIndex = 0; rootIndex < rootQueue.length; ++rootIndex) {
    const root = rootIndex + 1;
    const rootTree = rootQueue[rootIndex];
    const inVertexQueue = new Set();
    inVertexQueue.add(root);
    const vertexQueue = new MinBinHeap(rootQueue.length);

    for (const nextRoot of rootTree.get(root)) {
      const nextRootTree = new Map();
      addVertex(nextRootTree, nextRoot);
      rootQueue[nextRoot - 1] = nextRootTree;
      vertexQueue.push(nextRoot);
      inVertexQueue.add(nextRoot);
    }

    let bestVertex = root;
    let bestSum = bestVertex;
    let sum = root;

    while (vertexQueue.length > 0) {
      const vertex = vertexQueue.pop();
      sum += vertex;
      bestSum += ++bestVertex;

      if (sum === bestSum) {
        ++count;
      }

      const vertexTree = rootQueue[vertex - 1];

      for (const nextVertex of rootTree.get(vertex)) {
        if (!inVertexQueue.has(nextVertex)) {
          vertexQueue.push(nextVertex);
          inVertexQueue.add(nextVertex);
          addEdge(vertexTree, vertex, nextVertex);
          addEdge(vertexTree, nextVertex, vertex);
          rootQueue[nextVertex - 1] = vertexTree;
        }
      }
    }
  }

  return count;
}

function addVertex(tree, u) {
  const uNeighbours = tree.get(u) || [];
  tree.set(u, uNeighbours);
  return uNeighbours;
}

function addEdge(tree, u, v) {
  const uNeighbours = addVertex(tree, u);
  uNeighbours.push(v);
}

class MinBinHeap {
  constructor(maxLength = 0) {
    this.length = 0;
    this._heap = new Array(maxLength);
  }

  push(val) {
    let childIndex = this.length;
    let parentIndex = (childIndex - 1) >> 1;
    this._heap[childIndex] = val;
    ++this.length;

    while (parentIndex >= 0 && this._heap[parentIndex] > this._heap[childIndex]) {
      [ this._heap[parentIndex], this._heap[childIndex] ] = [ this._heap[childIndex], this._heap[parentIndex] ];
      childIndex = parentIndex;
      parentIndex = (childIndex - 1) >> 1;
    }
  }

  pop() {
    const ret = this.top();

    if (ret !== undefined) {
      --this.length;
      [this._heap[0], this._heap[this.length]] = [this._heap[this.length], this._heap[0]];

      let parentIndex = 0;
      let leftChildIndex = (parentIndex << 1) + 1;
      let rightChildIndex = (parentIndex << 1) + 2;
      let minChildIndex = leftChildIndex;

      if (rightChildIndex < this.length && this._heap[rightChildIndex] < this._heap[leftChildIndex]) {
        minChildIndex = rightChildIndex;
      }

      while (minChildIndex < this.length && this._heap[parentIndex] > this._heap[minChildIndex]) {
        [this._heap[parentIndex], this._heap[minChildIndex]] = [this._heap[minChildIndex], this._heap[parentIndex]];
        parentIndex = minChildIndex;
        leftChildIndex = (parentIndex << 1) + 1;
        rightChildIndex = (parentIndex << 1) + 2;
        minChildIndex = leftChildIndex;

        if (rightChildIndex < this.length && this._heap[rightChildIndex] < this._heap[leftChildIndex]) {
          minChildIndex = rightChildIndex;
        }
      }
    }

    return ret;
  }

  top() {
    return this.length > 0 ? this._heap[0] : undefined;
  }
}