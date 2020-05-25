// TODO Use commandline arguments to send task name
// TODO Use commandline arguments to send test name to main

(async () => {
  const module = await import('./organizing-containers-of-balls/index.js');
  module.main();
})();
