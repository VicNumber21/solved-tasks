export { decibinaryNumbers as solution };

function decibinaryNumbers(x) {
  /*
  let sum = 0;
  let topDigit = 0;
  let nextDigitWeight = 2;
  const beforeAge = Date.now();

  if (!done) {
    for (let dec = 0; dec < 32; dec += 2) {
      if (dec === nextDigitWeight) {
        ++topDigit;
        nextDigitWeight *= 2;
      }

      const before = Date.now();
      const result = enumerateDecimalNumber(dec);
      const decibinaries = toDecibinaries(result, 1);
      const perf = Date.now() - before;
      sum += 2 * result.count;
      console.log(`Count = ${result.count}`);
      decibinaries.forEach(db => {
        console.log(db);
      })
      console.log(`PERF = ${perf}`);
    }
  }

  console.log(`sum = ${sum}`);
  console.log(`topDigit = ${topDigit}`)
  console.log(`PERF = ${Date.now() - beforeAge}`)

  done = true;
   */

  const xIndex = x - 1;
  let decimal = 0;
  let evenIndex = 0;
  let oddIndex = 0;
  let maxIndex = 0;
  let lastResult;

  do {
    lastResult = enumerateDecimalNumber(decimal);
    evenIndex = maxIndex;
    oddIndex = evenIndex + lastResult.count;
    maxIndex = oddIndex + lastResult.count;
    decimal += 2;
  }
  while (xIndex >= maxIndex);

  const odd = xIndex >= oddIndex ? 1 : 0;
  const index = odd ? xIndex - oddIndex : xIndex - evenIndex;

  return toDecibinary(lastResult, index, odd);
}

let resultsCache = [];
let topDigitCache = [];

function enumerateDecimalNumber(decimal, topDigit) {
  const cacheIndex = Math.floor(decimal / 2);
  const isTopDigitCached = cacheIndex < topDigitCache.length;

  if (topDigit === undefined && isTopDigitCached) {
    topDigit = topDigitCache[cacheIndex];
  }

  if (topDigit === undefined) {
    topDigit = detectTopDigit(decimal);
    topDigitCache.push(topDigit);
  }

  let result = {
    count: 0,
    topDigit: topDigit,
    variants: []
  };

  const maxDB = maxDecibinary(topDigit);

  if (resultsCache.length < topDigit + 1) {
    let copy = (resultsCache[topDigit - 1] || []).slice(0);
    resultsCache.push(copy);
  }

  const isResultCached = cacheIndex < resultsCache[topDigit].length;

  if (isResultCached) {
    result = resultsCache[topDigit][cacheIndex];
  }
  else if (maxDB < decimal) {
    result.count = 0;
  }
  else if (topDigit === 0) {
    result.count = 1;
    result.variants.push(decimal);
  }
  else {
    const topDigitWeight = 2 ** topDigit;
    const maxDigitValue = decimal / topDigitWeight;

    for (let currentDigit = 0; currentDigit <= maxDigitValue; ++currentDigit) {
      const subresult = enumerateDecimalNumber(decimal - currentDigit * topDigitWeight, topDigit - 1);
      result.count += subresult.count;
      result.variants.push(subresult);
    }
  }

  if (!isResultCached) {
    resultsCache[topDigit].push(result);
  }

  return result;
}

function detectTopDigit(decimal) {
  let topDigit = 0;

  while((decimal /= 2) >= 1) {
    ++topDigit;
  }

  return topDigit;
}

let maxDecibinaryCache = [];

function maxDecibinary(maxDigit) {
  let maxDB = 0;
  let digitWeight = 1;

  if (maxDigit < maxDecibinaryCache.length) {
    maxDB = maxDecibinaryCache[maxDigit];
  }
  else {
    for (let d = maxDigit; d >= 0; --d) {
      maxDB += 9 * digitWeight;
      digitWeight *= 2;
    }
  }

  return maxDB;
}

/* TODO debug
function toDecibinaries(result, odd) {
  let decibinaries = [];

  for (let i = 0; i < result.count; ++i) {
    decibinaries.push(toDecibinary(result, i, odd));
  }

  return decibinaries;
}
 */

function toDecibinary(result, index, odd) {
  let decibinary = -1;

  if (result.count === 1) {
    decibinary = result.variants[0] + odd;
    console.assert(index === 0); // TODO debug
  }
  else {
    let currentCount = 0;

    for (let currentDigit = 0; currentDigit < result.variants.length; ++currentDigit) {
      const variant = result.variants[currentDigit];
      const minIndex = currentCount;

      currentCount += variant.count;
      const maxIndex = currentCount;

      if (index >= minIndex && index < maxIndex) {
        decibinary = 10 ** result.topDigit * currentDigit + toDecibinary(variant, index - minIndex, odd);
        break;
      }
    }
  }

  return decibinary;
}

