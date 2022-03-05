const Bit = {
  last: (v) => v & -v,
  inc: (v) => v + Bit.last(v),
  dec: (v) => v - Bit.last(v)
};

const Bit = {
  last: (v) => v & -v,
  inc: (v) => v + Bit.last(v),
  dec: (v) => v - Bit.last(v),
  incIndexes: function* (v, length, needLast = false) {
    for(let i = v; i < length; i = Bit.inc(i)) {
      yield i;
    }

    if (needLast) {
      yield length - 1;
    }
  },
  decIndexes: function* (v, needFirst = false) {
    for(let i = v; i > 0; i = Bit.dec(i)) {
      yield i;
    }

    if (needFirst) {
      yield 1;
    }
  },
  reversIncIndexes: function* (v, length, needLast = false) {
    for(let i = length - v; i < length; i = Bit.inc(i)) {
      yield i;
    }

    if (needLast) {
      yield length - 1;
    }
  },
  reverseDecIndexes: function* (v, length, needFirst = false) {
    for(let i = length - v; i > 0; i = Bit.dec(i)) {
      yield i;
    }

    if (needFirst) {
      yield 1;
    }
  },
  leftIncIndexes: function* (v, length, needFirst = false) {
    yield v;

    for(let i = Bit.inc(length - v); i < length; i = Bit.inc(i)) {
      yield length - i;
    }

    if (needFirst) {
      yield 1;
    }
  },
  leftDecIndexes: function* (v, length, needLast = false) {
    yield v;

    for(let i = Bit.dec(length - v); i > 0; i = Bit.dec(i)) {
      yield length - i;
    }

    if (needLast) {
      yield length - 1;
    }
  }
};

