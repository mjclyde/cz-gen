import * as child from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as program from 'commander';
import { Types } from './types';

program.option('-f, --from <tag>', 'From tag');
program.parse(process.argv);

const groups = {};
let version = 'unknown';
const packagePath = path.join(__dirname, '/package.json');
if (fs.existsSync(packagePath)) {
  const packageObj = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  version = packageObj.version;
}

function run() {
  if (!program.from) {
    console.log('Error! please provide a valid --from option');
    return;
  }

  const output = child.execSync(`git log ${program.from}..HEAD --format="%H [%cn] %s"`).toString('utf-8');
  const commits = output.split('\n')
    .map(raw => {
      const commit = {
        author: '',
        sha: '',
        type: '',
        context: '',
        message: '',
      };
      const parts = /^(\S+)\s+\[(.+)\]\s+(\w+)(\(.+\))?:\s+(.+)$/gi.exec(raw);
      if (parts && parts.length === 6) {
        commit.sha = parts[1];
        commit.author = parts[2];
        commit.type = parts[3];
        commit.context = parts[4] ? _.trim(parts[4], '()') : null;
        commit.message = parts[5];
      }
      return commit;
    })
    .filter(commit => !!commit.sha);

  _.forEach(commits, (commit) => {
    groups[commit.type] = groups[commit.type] || {};
    groups[commit.type][commit.context] = groups[commit.type][commit.context] || [];
    groups[commit.type][commit.context].push(commit);
  });

  let changelog = `# Version ${version} (${
    new Date().toISOString().split('T')[0]
    })\n\n`;

  _.forEach(Types, (type) => {
    if (groups[type.id]) {
      changelog += `## ${type.name}\n\n`;
      const contexts = Object.keys(groups[type.id]).sort().filter((context) => context !== 'null');
      _.forEach(groups[type.id]['null'], (commit) => changelog += `* ${formatCommit(commit)}\n`);
      _.forEach(contexts, (context) => {
        changelog += `* ${context}:\n`;
        _.forEach(groups[type.id][context], (commit) => {
          changelog += `\t* ${formatCommit(commit)}\n`;
        });
      });
    }
  });

  const changeLogsPath = path.join(__dirname, '/changelogs')
  if (!fs.existsSync(changeLogsPath)) {
    fs.mkdirSync(changeLogsPath);
  }
  fs.writeFileSync(`${changeLogsPath}/${version}.md`, changelog);
}

function formatCommit(commit) {
  return `${commit.message} [[${commit.author}](https://github.com/NextCenturyMeters/ncss-cloud/commit/${commit.sha})]`;
}

// Run this thang!
run();
console.log(`Finished Creating Changelog ${version}`);
