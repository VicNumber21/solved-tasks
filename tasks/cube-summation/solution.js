export { fn as solution };

function fn(n, operations) {
  const fnMap = {
    UPDATE: updateCube,
    QUERY: queryCube
  };

  const results = [];
  const cube = {
    c: new Map(),
    x: new Array(n),
    y: new Array(n),
    z: new Array(n),
    w: []
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
  const idKey = [x, y, z].join('-');
  let id = cube.c.get(idKey);

  if (id === undefined) {
    id = cube.w.length;
    cube.w.push(w);
    cube.c.set(idKey, id);
    updateDimension(cube.x, x - 1, id);
    updateDimension(cube.y, y - 1, id);
    updateDimension(cube.z, z - 1, id);
  }
  else {
    cube.w[id] = w;
  }
}

function updateDimension(dimension, l, id) {
  const flag = idFlag(id);
  dimension[l] = (dimension[l] ? dimension[l] | flag : flag);
}

function queryCube(cube, x1, y1, z1, x2, y2, z2) {
  let idFlags = dimensionIdFlags(cube.x, x1, x2);

  if (idFlags > 0n) {
    idFlags &= dimensionIdFlags(cube.y, y1, y2)
  }

  if (idFlags > 0n) {
    idFlags &= dimensionIdFlags(cube.z, z1, z2)
  }

  let res = 0;

  while (idFlags > 0) {
    const id= bigIntLog2(idFlags);
    res += cube.w[id];
    idFlags &= ~idFlag(id);
  }

  return res;
}

function dimensionIdFlags(dimension, l1, l2) {
  let ids = 0n;

  for (let l = l1 - 1; l < l2; ++l) {
    if (dimension[l] !== undefined) {
      ids |= dimension[l];
    }
  }

  return ids;
}

function idFlag(id) {
  return (1n << BigInt(id));
}

function bigIntLog2(value) {
  let result = 0n, i, v;

  for (i = 1n; value >> (1n << i); i <<= 1n) {}

  while (value > 1n) {
    v = 1n << --i;
    if (value >> v) {
      result += v;
      value >>= v;
    }
  }

  return result;
}
