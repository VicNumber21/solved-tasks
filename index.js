const args = process.argv.slice(2);
const options = {
  isDebug: args[2] === 'debug=true'
};

if (args.length === 0) {
  throw(new Error('Task name must be passed'));
}

(async () => {
  const taskName = args[0];
  let testNames = [];

  if (args[1]) {
    testNames = args[1].split(',');
  }

  const timeout = options.isDebug ? 9999999 : 10000;
  let timeoutId;
  await Promise.race([
    taskMain(taskName, testNames)
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


async function taskMain(taskName, testNames) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const taskDir = path.join(moduleDir, 'tasks', taskName);
  const taskModule = path.join(taskDir, 'index.js');
  const module = await import(taskModule);
  const tests = await getTests(taskDir, testNames);

  for (let test of tests) {
    const readLine = readTestInput(test.dir);
    const input = module.parseInput(readLine);
    const results = module.solve(input).map(x => x.toString());
    const diff = checkResults(test.dir, results);
    printResults(test.name, results, diff);
  }
}

async function getTests(taskDir, testNames) {
  testNames = testNames || [];
  const testsDir = path.join(taskDir, 'tests');
  testNames = await (testNames.length === 0 ? readDir(testsDir) : testNames);

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

function printResults(name, results, diff) {
  console.log(name);

  if (options.isDebug) {
    console.log(results.join('\n'));
  }

  const verdict = diff.length === 0 ? 'PASSED' : 'FAILED';
  console.log(`Verdict: ${verdict}\n`);
  printDiff(diff);
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

function checkResults(testDir, actualResults) {
  const nextExpected = readTestOutput(testDir);
  const nextActual = readLineFromArray(actualResults);
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
