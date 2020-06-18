
export interface ICommitType {
  id: string;
  name: string;
}

export const CommitTypes: ICommitType[] = [
  { id: 'feat', name: 'Features' },
  { id: 'fix', name: 'Bug Fixes' },
  { id: 'style', name: 'Style Changes' },
  { id: 'perf', name: 'Performance Improvements' },
  { id: 'test', name: 'Test Changes' },
  { id: 'docs', name: 'Documentation Changes' },
  { id: 'refactor', name: 'Refactoring' },
  { id: 'build', name: 'Build System Changes' },
  { id: 'ci', name: 'CI Changes' },
  { id: 'chore', name: 'Chores' },
  { id: 'revert', name: 'Reverts' },
];
