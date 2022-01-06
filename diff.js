const args = process.argv.slice(2);
if (args.length < 3) {
  throw(new Error('Task name, test name and solutions must be passed'));
}

(async () => {
  const taskName = args[0];
  const testName = args[1];
  const solutions = args[2].split(',');
  const diffJsFile = args[3];

  const timeout = 10000;
  let timeoutId;
  await Promise.race([
    taskMain(taskName, testName, solutions, diffJsFile)
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


async function taskMain(taskName, testName, solutions, diffJsFile) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const taskDir = path.join(moduleDir, 'tasks', taskName);
  const taskIndexJs = path.join(taskDir, 'index.js');
  const index = await import(taskIndexJs);
  const taskSolutionsJs = solutions.map((solution) => path.join(taskDir, solution));
  const modules = await Promise.all(taskSolutionsJs.map((solutionJs) => import(solutionJs)));
  const test = (await getTests(taskDir, [testName]))[0];
  const readLine = readTestInput(test.dir);
  const beforeParsing = process.hrtime.bigint();
  const input = index.parseInput(readLine);
  const afterParsing = process.hrtime.bigint();
  let counters = { PASSED: 0, FAILED: 0};
  const debugOutput = solutions.map(() => []);
  console.log(`Name: ${testName}\n`);

  for (let moduleIndex = 0; moduleIndex < modules.length; ++moduleIndex) {
    console.log(`JS: ${solutions[moduleIndex]}`);

    const module = modules[moduleIndex];
    const originalConsoleLog = console.log;
    console.log = (...args) => debugOutput[moduleIndex].push(args);
    const beforeExecution = process.hrtime.bigint();
    const output = index.solve(module.solution, input, debugOutput[moduleIndex]).map(x => x.toString());
    const afterExecution = process.hrtime.bigint();
    console.log = originalConsoleLog;
    const diff = checkOutput(test.dir, output);
    printResults({
      diff: diff,
      performance: {
        parsing: afterParsing - beforeParsing,
        execution: afterExecution - beforeExecution
      }
    });
    ++counters[verdict(diff)];
  }

  console.log(`RUN: ${modules.length}, PASSED:${counters.PASSED}, FAILED: ${counters.FAILED}`);
  console.log('\nDiff analysis:');

  const taskDiffJs = path.join(taskDir, diffJsFile || 'diff.js');
  const diff = await import(taskDiffJs);
  diff.diff(debugOutput);
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

function checkOutput(testDir, actualOutput) {
  const nextExpected = readTestOutput(testDir);
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