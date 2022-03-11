const args = process.argv.slice(2);
const options = {
  isDebug: args[2] === 'debug=true'
};

if (args.length === 0) {
  throw(new Error('Task name must be passed'));
}

(async () => {
  const taskName = args[0];
  const taskJsFile = args[2];
  let testNames = [];

  if (args[1] && args[1] !== '*') {
    testNames = args[1].split(',');
  }

  const timeout = options.isDebug ? 9999999 : 10000;
  let timeoutId;
  await Promise.race([
    taskMain(taskName, testNames, taskJsFile)
      .finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }),

    new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        console.error('Timeout ' + timeout + '!');
        reject(new Error('Timeout'));
      }, timeout);
    })
  ]);
})();


// Internals
import { fileURLToPath } from 'url';
import * as path from 'path'
import fs from "fs";


async function taskMain(taskName, testNames, taskJsFile) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const taskDir = path.join(moduleDir, 'tasks', taskName);
  const taskIndexJs = path.join(taskDir, 'index.js');
  const index = await import(taskIndexJs);
  const taskSolutionJs = path.join(taskDir, taskJsFile || 'solution.js');
  const module = await import(taskSolutionJs);
  const tests = await getTests(taskDir, testNames);
  let counters = { PASSED: 0, FAILED: 0};

  for (let test of tests) {
    const { input, beforeParsing, afterParsing } = await loadTestInput(test.dir, index.parseInput);
    const output = index.solve(module.solution, input).map(x => x.toString());
    const afterExecution = process.hrtime.bigint();
    const diff = await checkOutput(test.dir, output);
    printResults({
      solution: taskSolutionJs,
      testName: test.name,
      output: output,
      diff: diff,
      performance: {
        parsing: afterParsing - beforeParsing,
        execution: afterExecution - afterParsing
      }
    });
    ++counters[verdict(diff)];
  }

  console.log(`RUN: ${tests.length}, PASSED:${counters.PASSED}, FAILED: ${counters.FAILED}`);
}

async function getTests(taskDir, testNames) {
  testNames = testNames || [];
  const testsDir = path.join(taskDir, 'tests');
  testNames = await (testNames.length === 0 ? readDir(testsDir) : testNames);
  testNames.sort();

  return testNames.map(name => {
    return {
      name: name, dir: path.join(testsDir, name)
    };
  });
}

async function readDir(dirPath) {
  const dir = await fs.promises.opendir(dirPath);
  let result = [];

  for await (const dirEntry of dir) {
    result.push(dirEntry.name);
  }

  return result;
}

function readTestInput(testDir) {
  return readFile(testDir, 'input.txt');
}

const EOF = {};

function readTestOutput(testDir) {
  return readFile(testDir, 'output.txt');
}

function readFile(dir, name) {
  const inputString = fs.readFileSync(path.join(dir, name), { encoding: 'utf-8' });
  const input = inputString.replace(/\s*$/, '')
    .split('\n')
    .map(str => str.replace(/\s*$/, ''));

  return readLineFromArray(input);
}

function readLineFromArray(arr) {
  let currentLine = 0;

  return () => {
    return currentLine < arr.length? arr[currentLine++] : EOF;
  };
}

function printResults(results) {
  console.log(`JS: ${results.solution}`);
  console.log(`Name: ${results.testName}`);

  if (options.isDebug) {
    console.log(results.output.join('\n'));
  }

  console.log(
`Performance:
  - parsing: ${formatTimestamp(results.performance.parsing)}
  - execution: ${formatTimestamp(results.performance.execution)}`);

  console.log(`Verdict: ${verdict(results.diff)}\n`);
  printDiff(results.diff);
}

function verdict(diff) {
  return (diff.length === 0) ? 'PASSED' : 'FAILED';
}

function printDiff(diff) {
  const limit = 3;

  if (diff.length > 0) {
    console.log(`${diff.length} differences from expected output found`);
  }

  if (diff.length > limit) {
    console.log(`Top ${limit} differences:\n`);
  }

  diff.slice(0, limit).forEach((diff) => {
    console.log(`Line: ${diff.line}`);
    console.log(`Expected: ${diff.expected}`);
    console.log(`  Actual: ${diff.actual}\n`);
  });
}

async function loadTestInput(testDir, parseInput) {
  let beforeParsing, input, afterParsing;

  if (isTextInput(testDir)) {
    const readLine = readTestInput(testDir);
    beforeParsing = process.hrtime.bigint();
    input = parseInput(readLine);
    afterParsing = process.hrtime.bigint();
  }
  else {
    beforeParsing = process.hrtime.bigint();
    input = (await import(path.join(testDir, 'input.js'))).input;
    afterParsing = process.hrtime.bigint();
  }

  return { input, beforeParsing, afterParsing };
}

function isTextInput(testDir) {
  return fs.existsSync(path.join(testDir, 'input.txt'));
}

async function loadTestOutput(testDir) {
  return isTextOutput(testDir) ?
    readTestOutput(testDir) :
    readLineFromArray((await import(path.join(testDir, 'output.js'))).output);
}

function isTextOutput(testDir) {
  return fs.existsSync(path.join(testDir, 'output.txt'));
}

async function checkOutput(testDir, actualOutput) {
  const nextExpected = await loadTestOutput(testDir);
  const nextActual = readLineFromArray(actualOutput);
  let diff = [];
  let expected = nextExpected();
  let actual = nextActual();
  let line = 1;

  while (expected !== EOF || actual !== EOF) {
    if (expected !== actual) {
      diff.push({
        line: line,
        expected: resultToString(expected),
        actual: resultToString(actual)
      });
    }

    expected = nextExpected();
    actual = nextActual();
    ++line;
  }

  return diff;
}

function resultToString(result) {
  return result === EOF ? 'End of file' : result;
}

const nanoInMilliSecond = 1000n * 1000n;
const nanoInSecond = nanoInMilliSecond * 1000n;
const nanoInMinute = nanoInSecond * 60n;
const nanoInHour = nanoInMinute * 60n;
const nanoInDay = nanoInHour * 24n;
const formatter = [
  { value: nanoInDay, name: 'day(s)'},
  { value: nanoInHour, name: 'h'},
  { value: nanoInMinute, name: 'min'},
  { value: nanoInSecond, name: 'sec'},
  { value: nanoInMilliSecond, name: 'ms'},
  { value: 1n, name: 'ns'},
];
function formatTimestamp(timestamp) {
  return formatter .reduce((timestampStr, unit) => {
    if (timestamp >= unit.value) {
      timestampStr += timestampStr.length > 0 ? ' ' : '';
      timestampStr += `${timestamp / unit.value} ${unit.name};`
      timestamp %= unit.value;
    }

    return timestampStr;
  }, '');
}
