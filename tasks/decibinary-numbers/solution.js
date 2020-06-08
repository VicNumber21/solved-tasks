export { decibinaryNumbers as solution };

let dbCache = new Map();

function decibinaryNumbers(x) {
  let decibinary = dbCache.get(x);

  if (decibinary === undefined) {
    decibinary = dbNumbers(x - 1);
    dbCache.set(x, decibinary);
  }

  return decibinary;
}

function dbNumbers(xIndex) {
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
    let maxDigitValue = decimal / topDigitWeight;
    maxDigitValue = maxDigitValue > 9 ? 9 : maxDigitValue;

    for (let currentDigit = 0; currentDigit <= maxDigitValue; ++currentDigit) {
      const subresult = enumerateDecimalNumber(decimal - currentDigit * topDigitWeight, topDigit - 1);
      result.count += subresult.count;
      result.variants.push(subresult);
    }
  }

  if (!isResultCached && result.count > 0) {
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

    maxDecibinaryCache[maxDigit] = maxDB;
  }

  return maxDB;
}

function toDecibinary(result, index, odd) {
  let decibinary = -1;

  // TODO just simple fix, is it good? can I check just length?
  if (result.count === 1 && result.variants.length === 1) {
    decibinary = result.variants[0] + odd;
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
