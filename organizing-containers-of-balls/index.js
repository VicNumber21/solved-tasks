import { organizingContainers } from './solution.js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path'


export async function main(testNames) {
  const testDirs = await getTestDirs(testNames);

  const ws = process.stdout;

  for (let testDir of testDirs) {
    const readLine = readTestInput(testDir);
    const q = parseInt(readLine(), 10);

    for (let qItr = 0; qItr < q; qItr++) {
      const n = parseInt(readLine(), 10);

      let container = Array(n);

      for (let i = 0; i < n; i++) {
        container[i] = readLine().split(' ').map(containerTemp => parseInt(containerTemp, 10));
      }

      let result = organizingContainers(container);

      ws.write(result + "\n");
    }
  }

  ws.end();
}


// Internals
async function getTestDirs(testNames) {
  testNames = testNames || [];
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const testsDir = path.join(moduleDir, 'tests');

  testNames = await (testNames.length === 0 ? readDir(testsDir) : testNames);
  return testNames.map(name => path.join(testsDir, name));
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

function readFile(dir, name) {
  const inputString = fs.readFileSync(path.join(dir, name), { encoding: 'utf-8' });
  const input = inputString.replace(/\s*$/, '')
    .split('\n')
    .map(str => str.replace(/\s*$/, ''));

  let currentLine = 0;

  return () => {
    return input[currentLine++];
  };
}
