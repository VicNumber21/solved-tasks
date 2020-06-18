export { balancedForest as solution };

function balancedForest(vertices, edges) {
  let tree = buildTree(vertices, edges);
  const overallSum = calculateSumsAndAssignIds(tree);
  let branchSums = buildBranchSums(tree);
  const lowerBoundCorrection = overallSum % 3n > 0n ? 1n : 0n;
  const lowerBound = overallSum / 3n + lowerBoundCorrection;
  const upperBound = overallSum / 2n;
  tree.sort((v1, v2) => Number(v1.sum - v2.sum));
  branchSums.sort((v1, v2) => Number(v1.sum - v2.sum));
  let third = false;
  let leftIndex = leftBinarySearch(tree, lowerBound);
  let rightIndex = leftBinarySearch(tree, overallSum - lowerBound);

  while(!third && (tree[leftIndex].sum <= upperBound || rightIndex >= leftIndex && tree[rightIndex].sum > upperBound)) {
    const leftThird = tree[leftIndex].sum;
    const rightSum = tree[rightIndex].sum;
    const rightThird = overallSum - rightSum;

    if (lowerBound > rightThird) {
      --rightIndex;
    }
    else if (lowerBound < rightThird && rightThird < leftThird) {
      if (searchReminderInBranch(tree, rightIndex, rightThird) ||
          searchReminderInBranch(tree, rightIndex, rightSum - rightThird))
      {
        third = rightThird;
      }

      --rightIndex;
    }
    else {
      if (searchDifferentBranches(tree, leftIndex) ||
        searchInSameBranch(tree, leftIndex) ||
        searchReminderOutOfBranch(tree, leftIndex, overallSum - 2n * leftThird) ||
        searchInBranchSums(branchSums, tree[leftIndex]))
      {
        third = leftThird;
      }

      while (leftThird === tree[leftIndex].sum) {
        ++leftIndex;
      }
    }
  }

  return third ? 3n * third - overallSum : -1;
}

function searchDifferentBranches(tree, index) {
  return tree[index].sum === tree[index + 1].sum;
}

function searchInSameBranch(tree, index) {
  const doubledThird = 2n * tree[index].sum;
  let doubledThirdIndex = leftBinarySearch(tree, doubledThird);
  let found = false;

  while (!found && tree[doubledThirdIndex].sum === doubledThird) {
    found = isSubset(tree[doubledThirdIndex], tree[index]);
    ++doubledThirdIndex;
  }

  return found;
}

function searchReminderOutOfBranch(tree, index, reminder) {
  let reminderIndex = leftBinarySearch(tree, reminder);
  let found = false;

  while (!found && tree[reminderIndex].sum === reminder) {
    found = !isSubset(tree[index], tree[reminderIndex]);
    ++reminderIndex;
  }

  return found;
}

function searchReminderInBranch(tree, index, reminder) {
  let reminderIndex = leftBinarySearch(tree, reminder);
  let found = false;

  while (!found && tree[reminderIndex].sum === reminder) {
    found = isSubset(tree[index], tree[reminderIndex]);
    ++reminderIndex;
  }

  return found;
}

function searchInBranchSums(branchSums, vertex) {
  let sumIndex = leftBinarySearch(branchSums, vertex.sum);
  let found = false;

  while (!found && branchSums[sumIndex].sum === vertex.sum) {
    found = (branchSums[sumIndex].vertex !== vertex);
    ++sumIndex;
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
    let vertex1 = tree[edge[0] - 1];
    let vertex2 = tree[edge[1] - 1];
    vertex1.next.push(vertex2);
    vertex2.next.push(vertex1);
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
        vertex.next = vertex.next.filter(v => v !== parent);
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

function buildBranchSums(tree) {
  let root = tree[0];
  let overallSum = root.sum;
  let branchSums = [];
  let vertexStack = [root];

  for (const v of root.next) {
    branchSums.push({ sum: v.sum + root.value, vertex: root });
  }

  while (vertexStack.length > 0) {
    const parent = vertexStack.pop();

    for(let vertex of parent.next) {
      for (const v of vertex.next) {
        branchSums.push({ sum: v.sum + vertex.value, vertex: vertex });
      }

      branchSums.push({ sum: overallSum - vertex.sum + vertex.value, vertex: vertex });

      vertexStack.push(vertex);
    }
  }

  return branchSums;
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
