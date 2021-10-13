export { fn as solution };

class FakeStack {
  constructor() {
    this.reset();
  }

  push(val) {
    this.top = val;
    ++this.length;
  }

  reset() {
    this.top = undefined;
    this.length = 0;
  }
}

function fn(p) {
  let undead = 1E9;
  let max = 0;
  let stacks = [];
  const maxStackIndex = 0;
  let currentStackIndex = -1;

  for (const plant of p) {
    if (undead >= plant) {
      undead = plant;
      stacks = [];
      currentStackIndex = -1;
    }
    else {
      const newCurrentStackIndex = binarySearch(stacks, currentStackIndex, plant);

      if (newCurrentStackIndex === stacks.length) {
        stacks.push(new FakeStack());
      }
      else if (newCurrentStackIndex > currentStackIndex) {
        stacks[newCurrentStackIndex] = new FakeStack();
      }

      currentStackIndex = newCurrentStackIndex;
      stacks[currentStackIndex].push(plant);


      if (currentStackIndex >0 && stacks[currentStackIndex - 1].length === stacks[currentStackIndex].length) {
        stacks[currentStackIndex - 1] = stacks[currentStackIndex];
        --currentStackIndex;
      }

      max = Math.max(max, stacks[maxStackIndex].length);
    }
  }

  return max;
}

function binarySearch(stacks, lastIndex, plant) {
  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.ceil((low + high) / 2);

    if (stacks[mid].top < plant) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return low;
}