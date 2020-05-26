// TODO Use commandline arguments to send task name
// TODO Use commandline arguments to send test name to main

(async () => {
  const module = await import('./organizing-containers-of-balls/index.js');
  const timeout = 10000;
  let timeoutId;
  await Promise.race([
    module.main()
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
