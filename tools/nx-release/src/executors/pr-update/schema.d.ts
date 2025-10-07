export interface PrUpdateExecutorSchema {
  baseBranch?: string;
  targetBranch?: string;
  aiCommand?: string;
  maxLinesPerFile?: number;
  diffPaths?: string[];
  changelogPatterns?: string[];
}
