export interface PrUpdateExecutorSchema {
  baseBranch?: string;
  targetBranch?: string;
  aiCommand?: string;
  aiTitleCommand?: string;
  model?: string;
  maxLinesPerFile?: number;
  interactiveAI?: boolean;
  verbose?: boolean;
  diffPaths?: string[];
  changelogPatterns?: string[];
}
