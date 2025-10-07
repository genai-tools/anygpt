export interface PrUpdateExecutorSchema {
  baseBranch?: string;
  targetBranch?: string;
  aiCommand?: string;
  model?: string;
  maxLinesPerFile?: number;
  diffPaths?: string[];
  changelogPatterns?: string[];
}
