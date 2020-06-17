export { balancedForest as solution };

function balancedForest(vertices, edges) {
  let tree = buildTree(vertices, edges);
  const overallSum = calculateSumsAndAssignIds(tree);
  const lowerBound = overallSum / 3n + 1n;
  const upperBound = overallSum / 2n;
  tree.sort((v1, v2) => Number(v1.sum - v2.sum));
  let index = leftBinarySearch(tree, lowerBound);
  let third = false;

  while(!third && tree[index].sum <= upperBound) {
    const currentSum = tree[index].sum;

    if (foundInDifferentBranches(tree, index) ||
        foundInSameBranch(tree, index) ||
        reminderFound(tree, index, overallSum - 2n * currentSum))
    {
      third = currentSum;
    }

    while (currentSum === tree[index].sum) {
      ++index;
    }
  }

  return third ? 3n * third - overallSum : -1;
}

function foundInDifferentBranches(tree, index) {
  return tree[index].sum === tree[index + 1].sum;
}

function foundInSameBranch(tree, index) {
  const doubledThird = 2n * tree[index].sum;
  let doubledThirdIndex = leftBinarySearch(tree, doubledThird);
  let found = false;

  while (!found && tree[doubledThirdIndex].sum === doubledThird) {
    found = isSubset(tree[doubledThirdIndex], tree[index]);
    ++doubledThirdIndex;
  }

  return found;
}

function reminderFound(tree, index, reminder) {
  let reminderIndex = leftBinarySearch(tree, reminder);
  let found = false;

  while (!found && tree[reminderIndex].sum === reminder) {
    found = !isSubset(tree[index], tree[reminderIndex]);
    ++reminderIndex;
  }

  return found;
}

function isSubset(superset, subset) {
  return subset.id.startsWith(superset.id);
}

function buildTree(vertices, edges) {
  let tree = vertices.map(value => {
    return {
      value: BigInt(value),
      next: []
    }
  });

  for(let edge of edges) {
    let vertex = tree[edge[0] - 1];
    vertex.next.push(tree[edge[1] - 1]);
  }

  return tree;
}

function calculateSumsAndAssignIds(tree) {
  let root = tree[0];
  root.id = '0';
  let vertexStack = [root];
  let nextStack = [root.next]

  while (vertexStack.length > 0) {
    const next = nextStack.pop();

    if (next.length > 0) {
      const parent = vertexStack[vertexStack.length - 1];
      nextStack.push([]);

      for (let [index, vertex] of next.entries()) {
        vertex.id = `${parent.id}-${index}`;
        vertexStack.push(vertex);
        nextStack.push(vertex.next);
      }
    }
    else {
      let vertex = vertexStack.pop();
      vertex.sum = vertex.value + vertex.next.map(v => v.sum).reduce((acc, sum) => acc + sum, 0n);
    }
  }

  return root.sum;
}

function leftBinarySearch(sortedArray, value) {
  let index = binarySearch(sortedArray, v => v.sum - value);
  const foundValue = sortedArray[index].sum;

  while (index > 0 && sortedArray[index - 1].sum === foundValue) {
    --index;
  }

  return index;
}

function binarySearch(sortedArray, predicate) {
  let left = 0;
  let right = sortedArray.length - 1;

  while (left !== right) {
    const mid = left + Math.floor((right - left) / 2);
    const midValue = sortedArray[mid];
    const predicateResult = predicate(midValue);

    if (predicateResult === 0n) {
      left = right = mid;
    }
    else if (predicateResult < 0) {
      left = mid > left ? mid : right;
    }
    else {
      right = mid;
    }
  }

  return left;
}
