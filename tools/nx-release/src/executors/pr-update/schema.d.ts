export interface PrUpdateExecutorSchema {
  baseBranch?: string;
  targetBranch?: string;
  aiProvider?: 'anygpt' | 'none';
  aiCommand?: string;
  diffPaths?: string[];
  changelogPatterns?: string[];
}
