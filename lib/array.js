Array.prototype.first = function () {
  return this[0];
}

Array.prototype.last = function () {
  return this[this.length - 1];
}

Array.prototype.sum = function () {
  return this.reduce((acc, x) => acc + x, 0);
}

Array.prototype.mapInPlace = function (fn) {
  for (let i = 0; i < this.length; ++i) {
    this[i] = fn(this[i]);
  }
}

Array.prototype.binSearchH = function (value, firstIndex = 0, lastIndex = this.length - 1) {
  let low = firstIndex;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.ceil((low + high) / 2);

    if (this[mid] <= value) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return low;
}

Array.prototype.binSearchL = function (value, firstIndex = 0, lastIndex = this.length - 1) {
  let low = firstIndex;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.ceil((low + high) / 2);

    if (this[mid] < value) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return low;
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