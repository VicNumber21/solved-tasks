export { decibinaryNumbers as solution };

function decibinaryNumbers(x) {
  const indexCache = buildIndexCache(1e16);
  const xIndex = x - 1;
  const [entry, entryIndex] = binarySearch(indexCache, (entry) => entry.maxIndex - xIndex);
  const prevEntry = indexCache[entryIndex - 1] || { maxIndex: 0 };
  const evenIndex = prevEntry.maxIndex;
  const oddIndex = evenIndex + (entry.maxIndex - evenIndex) / 2;
  const odd = xIndex >= oddIndex ? 1 : 0;
  const index = odd ? xIndex - oddIndex : xIndex - evenIndex;

  return toDecibinary(entry.result, index, odd);
}

function binarySearch(sortedArray, predicate) {
  let left = 0;
  let right = sortedArray.length - 1;

  while (left !== right) {
    const mid = left + Math.floor((right - left) / 2);
    const midValue = sortedArray[mid];
    const predicateResult = predicate(midValue);

    if (predicateResult <= 0) {
      left = mid > left ? mid : right;
    }
    else {
      right = mid;
    }
  }

  return [sortedArray[left], left];
}


let indexCache = [];
function buildIndexCache (x) {
  if (indexCache.length === 0) {
    const xIndex = x - 1;
    let decimal = 0;
    let maxIndex = 0;
    let lastResult;

    do {
      lastResult = enumerateDecimalNumber(decimal);
      maxIndex += 2 * lastResult.count;
      decimal += 2;
      indexCache.push({
        result: lastResult,
        maxIndex: maxIndex
      });
    }
    while (xIndex >= maxIndex);
  }

  return indexCache;
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
    minTopDigitValue: 0,
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
    const topDigitBinaryWeight = 2 ** topDigit;
    let maxDigitValue = decimal / topDigitBinaryWeight;
    maxDigitValue = maxDigitValue > 9 ? 9 : maxDigitValue;
    const subdigitMaxDB = maxDecibinary(topDigit - 1);
    let minTopDigitValue = Math.floor((decimal - subdigitMaxDB) / topDigitBinaryWeight);
    minTopDigitValue = minTopDigitValue < 0 ? 0 : minTopDigitValue;
    result.minTopDigitValue = minTopDigitValue;

    for (let currentDigit = minTopDigitValue; currentDigit <= maxDigitValue; ++currentDigit) {
      const subresult = enumerateDecimalNumber(decimal - currentDigit * topDigitBinaryWeight, topDigit - 1);
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

  if (result.variants.length === 1) {
    decibinary = result.variants[0] + odd;
  }
  else {
    let currentCount = 0;

    for (let digitIndex = 0; digitIndex < result.variants.length; ++digitIndex) {
      const variant = result.variants[digitIndex];
      const minIndex = currentCount;

      currentCount += variant.count;
      const maxIndex = currentCount;

      if (index >= minIndex && index < maxIndex) {
        decibinary = 10 ** result.topDigit * (digitIndex + result.minTopDigitValue) + toDecibinary(variant, index - minIndex, odd);
        break;
      }
    }
  }

  return decibinary;
}
