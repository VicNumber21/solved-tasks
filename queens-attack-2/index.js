import { queensAttack } from './solution.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path'


export async function main(testNames) {
  const tests = await getTests(testNames);

  for (let test of tests) {
    const readLine = readTestInput(test.dir);
    let results = [];

    const nk = readLine().split(' ');
    const n = parseInt(nk[0], 10);
    const k = parseInt(nk[1], 10);
    const r_qC_q = readLine().split(' ');
    const r_q = parseInt(r_qC_q[0], 10);
    const c_q = parseInt(r_qC_q[1], 10);
    let obstacles = Array(k);

    for (let i = 0; i < k; i++) {
      obstacles[i] = readLine().split(' ').map(obstaclesTemp => parseInt(obstaclesTemp, 10));
    }

    let result = queensAttack(n, k, r_q, c_q, obstacles);

    results.push(result.toString());

    const verdict = checkResults(test.dir, results);
    printResults(test.name, results, verdict);
  }
}


// Internals
async function getTests(testNames) {
  testNames = testNames || [];
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const testsDir = path.join(moduleDir, 'tests');
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
