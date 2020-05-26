import { fileURLToPath } from 'url';
import * as path from 'path'

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

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const taskModule = path.join(moduleDir, taskName, 'index.js');

  const module = await import(taskModule);
  const timeout = 10000;
  let timeoutId;
  await Promise.race([
    module.main(testNames)
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
