import * as child from 'child_process';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as program from 'commander';
import { CommitTypes, ICommitType } from './types';

program.option('-f, --from <tag>', 'From tag');
program.option('-t, --to <tag>', 'To tag');
program.option('-o, --out <fileName>', 'Filename to output changelog to');
program.parse(process.argv);

const packagePath = './package.json';

interface ICommit {
  author: string;
  sha: string;
  type: string;
  message: string;
  context: string;
}

const groups: { [type: string]: { [context: string]: ICommit[] } } = {};
let version = 'unknown';
if (program.to) {
  version = program.to;
} else if (fs.existsSync(packagePath)) {
  const packageObj = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  version = packageObj.version;
}

function run() {
  let from = program.from;
  const to = program.to || 'HEAD';
  if (!from) {
    from = _.trim(child.execSync('git describe --abbrev=0'));
    console.log(`Found latest release at: ${from}`);
  }
  if (from === `v${version}`) {
    console.log(`Current version v${version} and latest tag match. No changelog will be created`);
    return;
  }

  const output = child.execSync(`git log ${from}..${to} --format="%H [%cn] %s"`).toString('utf-8');
  const commits: ICommit[] = output.split('\n')
    .map((raw) => {
      const commit: ICommit = { author: '', sha: '', type: '', message: '', context: '' };
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
    .filter((commit) => !!commit.sha);

  _.forEach(commits, (commit: ICommit) => {
    groups[commit.type] = groups[commit.type] || {};
    groups[commit.type][commit.context] = groups[commit.type][commit.context] || [];
    groups[commit.type][commit.context].push(commit);
  });

  let changelog = `# Version ${version} (${new Date().toISOString().split('T')[0]
    })\n\n`;

  _.forEach(CommitTypes, (type: ICommitType) => {
    if (groups[type.id]) {
      changelog += `\n## ${type.name}\n\n`;
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

  const changeLogsPath = './changelogs';
  if (!fs.existsSync(changeLogsPath)) {
    fs.mkdirSync(changeLogsPath);
  }
  fs.writeFileSync(`${changeLogsPath}/${program.out || version}.md`, changelog);
  console.log(`Finished Creating Changelog ${version}`);
}

function formatCommit(commit: ICommit) {
  let remoteURL = child.execSync('git config --get remote.origin.url').toString('utf-8');
  remoteURL = remoteURL.replace('.git', '');
  return `${commit.message} [[${commit.author}](${remoteURL}/commit/${commit.sha})]`;
}

// Run this thang!
run();
