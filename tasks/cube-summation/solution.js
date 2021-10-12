export { fn as solution };

function fn(n, operations) {
  const fnMap = {
    UPDATE: updateCube,
    QUERY: queryCube
  };

  const results = [];
  const cube = {
    w: new Map(),
    x: new Array(n),
    y: new Array(n),
    z: new Array(n)
  };

  for(const operation of operations) {
    const op = operation.split(' ');
    const res = fnMap[op[0]](cube, +op[1], +op[2], +op[3], +op[4], +op[5], +op[6]);

    if (res !== undefined) {
      results.push(res);
    }
  }

  return results;
}

function updateCube(cube, x, y, z, w) {
  const id = [x, y, z].join('-');
  cube.w.set(id, w);
  updateDimension(cube.x, x - 1, id);
  updateDimension(cube.y, y - 1, id);
  updateDimension(cube.z, z - 1, id);
}

function updateDimension(dimension, l, id) {
  const dimSet = dimension[l] || new Set();
  dimSet.add(id);
  dimension[l] = dimSet;
}

function queryCube(cube, x1, y1, z1, x2, y2, z2) {
  let valuesSet = dimensionUnion(cube.x, x1, x2);

  if (valuesSet.size > 0) {
    valuesSet = intersection(valuesSet, dimensionUnion(cube.y, y1, y2));
  }

  if (valuesSet.size > 0) {
    valuesSet = intersection(valuesSet, dimensionUnion(cube.z, z1, z2));
  }

  let res = 0;

  for (const valueId of valuesSet) {
    res += cube.w.get(valueId);
  }

  return res;
}

function dimensionUnion(dimension, l1, l2) {
  const dimSet = new Set();

  for (let l = l1 - 1; l < l2; ++l) {
    if (dimension[l] !== undefined) {
      union(dimSet, dimension[l]);
    }
  }

  return dimSet;
}

function union(setA, setB) {
  for (let elem of setB) {
    setA.add(elem);
  }
}

function intersection(setA, setB) {
  const intSet = new Set();

  for (let elem of setB) {

    if (setA.has(elem)) {
      intSet.add(elem);
    }
  }

  return intSet;
}