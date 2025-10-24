export interface ReleaseExecutorSchema {
  baseBranch?: string;
  targetBranch?: string;
  changelogPatterns?: string[];
  aiCommand?: string;
  aiTitleCommand?: string;
  model?: string;
  maxLinesPerFile?: number;
  aiTimeout?: number;
  autoMerge?: boolean;
  skipPublish?: boolean;
  diffPaths?: string[];
  prDescriptionFile?: string;
}
