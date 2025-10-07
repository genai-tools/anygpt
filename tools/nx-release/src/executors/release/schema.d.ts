export interface ReleaseExecutorSchema {
  baseBranch?: string;
  targetBranch?: string;
  changelogPatterns?: string[];
  aiCommand?: string;
  maxLinesPerFile?: number;
  autoMerge?: boolean;
  skipPublish?: boolean;
  diffPaths?: string[];
}
