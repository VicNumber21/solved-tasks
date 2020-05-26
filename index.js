const args = process.argv.slice(2);

if (args.length === 0) {
  throw(new Error('Task name must be passed'));
}

(async () => {
  const taskName = args[0];
  let testNames = [];

  if (args[1]) {
    testNames = args[1].split(',');
  }

  const timeout = 10000;
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
  const taskDir = path.join(moduleDir, taskName);
  const taskModule = path.join(taskDir, 'index.js');
  const module = await import(taskModule);
  const tests = await getTests(taskDir, testNames);

  for (let test of tests) {
    const readLine = readTestInput(test.dir);
    const input = module.parseInput(readLine);
    const results = module.solve(input).map(x => x.toString());
    const verdict = checkResults(test.dir, results);
    printResults(test.name, results, verdict);
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

function readTestOutput(testDir) {
  return readFile(testDir, 'output.txt');
}

function readFile(dir, name) {
  const inputString = fs.readFileSync(path.join(dir, name), { encoding: 'utf-8' });
  const input = inputString.replace(/\s*$/, '')
    .split('\n')
    .map(str => str.replace(/\s*$/, ''));

  let currentLine = 0;

  return () => {
    return currentLine < input.length? input[currentLine++] : readFile.eof;
  };
}
readFile.eof = {};

function printResults(name, results, verdict) {
  console.log(name);
  console.log(results.join('\n'));
  console.log('Verdict:', verdict, '\n');
}

function checkResults(testDir, actualResults) {
  const readExpectedOutputLine = readTestOutput(testDir);
  let verdict = true;

  for (let i = 0; verdict && i < actualResults.length; ++i) {
    verdict = (actualResults[i] === readExpectedOutputLine());
  }

  verdict = verdict && (readExpectedOutputLine() === readFile.eof);

  return verdict ? 'PASSED' : 'FAILED';
}
