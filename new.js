const args = process.argv.slice(2);

if (args.length === 0) {
  throw(new Error('Command must be passed'));
}

const templateName = 'hacker-rank';
const templateAutomation = {
  'hacker-rank': [
    updateReadme
  ]
};


(() => {
  const commands = {
    'task': createTask,
    'test': createTest
  };

  const command = args[0];

  if (commands.hasOwnProperty(command)) {
    commands[command]()
  }
  else {
    throw(new Error('Unknown command ' + command));
  }
})();


// Internals
import { fileURLToPath } from 'url';
import * as path from 'path'
import fs from "fs";


function createTask() {
  const taskName = args[1];
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const taskDir = path.join(moduleDir, 'tasks', taskName);

  if (fs.existsSync(taskDir)) {
    throw(new Error('Task dir exists for ' + taskName));
  }
  else {
    fs.mkdirSync(taskDir);
  }

  const templateDir = path.join(moduleDir, 'templates', templateName, 'task');
  const templateFiles = fs.readdirSync(templateDir);

  for (let fileName of templateFiles) {
    const srcFile = path.join(templateDir, fileName);
    const dstFile = path.join(taskDir, fileName);
    fs.copyFileSync(srcFile, dstFile);
  }

  for (const automation of templateAutomation[templateName]) {
    automation(taskName, taskDir);
  }
}

function updateReadme(taskName, taskDir) {
  const taskPrettyName = taskName
    .split('-')
    .map((word) => {
      word = word.toLowerCase();
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');

  const taskUrl = 'https://' + path.join('www.hackerrank.com/challenges', taskName, 'problem');
  const readmeFile = path.join(taskDir, 'README.md');

  let readmeStr = fs.readFileSync(readmeFile, { encoding: 'utf8'});
  readmeStr = readmeStr.replace(/Task_Name/g, taskPrettyName);
  readmeStr = readmeStr.replace(/Task_Url/g, taskUrl);

  fs.writeFileSync(readmeFile, readmeStr, { encoding: 'utf8'});
}

function createTest() {
  const taskName = args[1];
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const taskDir = path.join(moduleDir, 'tasks', taskName);

  if (!fs.existsSync(taskDir)) {
    throw(new Error('Task dir does not exists for ' + taskName));
  }

  const testsDir = path.join(taskDir, 'tests');

  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir);
  }

  const testName = args[2];
  const testDir = path.join(testsDir, testName);

  if (fs.existsSync(testDir)) {
    throw(new Error('Test dir exists for ' + testName));
  }
  else {
    fs.mkdirSync(testDir);
  }

  const templateDir = path.join(moduleDir, 'templates', templateName, 'test');
  const templateFiles = fs.readdirSync(templateDir);

  for (let fileName of templateFiles) {
    const srcFile = path.join(templateDir, fileName);
    const dstFile = path.join(testDir, fileName);
    fs.copyFileSync(srcFile, dstFile);
  }
}
