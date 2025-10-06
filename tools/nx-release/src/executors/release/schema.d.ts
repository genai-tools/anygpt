export interface ReleaseExecutorSchema {
  baseBranch?: string;
  targetBranch?: string;
  changelogPatterns?: string[];
  aiProvider?: 'anygpt' | 'none';
  aiCommand?: string;
  autoMerge?: boolean;
  skipPublish?: boolean;
  diffPaths?: string[];
}
