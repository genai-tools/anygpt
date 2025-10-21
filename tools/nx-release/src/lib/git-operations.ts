import { execa } from 'execa';

export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execa('git', ['branch', '--show-current']);
  return stdout.trim();
}

export async function hasUncommittedChanges(): Promise<boolean> {
  try {
    await execa('git', ['diff-index', '--quiet', 'HEAD', '--']);
    return false;
  } catch {
    // Show what files have uncommitted changes
    try {
      const { stdout } = await execa('git', ['status', '--porcelain']);
      if (stdout) {
        console.error('\n📋 Uncommitted changes detected:');
        console.error(stdout);
      }
    } catch {
      // Ignore error in debug output
    }
    return true;
  }
}

export async function hasUnpushedCommits(branch: string): Promise<boolean> {
  try {
    const { stdout } = await execa('git', [
      'rev-list',
      `origin/${branch}..HEAD`,
      '--count',
    ]);
    return parseInt(stdout.trim(), 10) > 0;
  } catch {
    return false;
  }
}

export async function pullLatest(branch: string): Promise<void> {
  await execa('git', ['pull', '--rebase', 'origin', branch], {
    stdio: 'inherit',
  });
}

export async function getCurrentCommitSha(): Promise<string> {
  const { stdout } = await execa('git', ['rev-parse', 'HEAD']);
  return stdout.trim();
}

export async function getTagsAtCommit(sha: string): Promise<Set<string>> {
  const { stdout } = await execa('git', ['tag', '--points-at', sha]);
  return new Set(stdout.split('\n').filter(Boolean));
}

export async function pushWithTags(branch: string): Promise<void> {
  await execa('git', ['push', 'origin', branch, '--follow-tags'], {
    stdio: 'inherit',
  });
}

export async function getNewTags(
  beforeTags: Set<string>,
  afterSha: string
): Promise<string[]> {
  const { stdout } = await execa('git', ['tag', '--points-at', afterSha]);
  return stdout.split('\n').filter((tag) => tag && !beforeTags.has(tag));
}

export async function getDiff(
  baseSha: string,
  headSha: string,
  paths: string[]
): Promise<string> {
  const { stdout } = await execa(
    'git',
    ['diff', `${baseSha}..${headSha}`, '--', ...paths],
    { stdio: 'pipe' }
  );
  return filterDiff(stdout);
}

/**
 * Filter diff to remove noise and limit large files
 */
function filterDiff(diff: string): string {
  const lines = diff.split('\n');
  const result: string[] = [];
  let currentFile = '';
  let currentFileLines: string[] = [];
  let inFile = false;

  // Files to completely exclude from diff
  const excludeFiles = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'npm-shrinkwrap.json',
  ];

  const maxLinesPerFile = 1000;

  for (const line of lines) {
    // Detect file header
    if (line.startsWith('diff --git')) {
      // Save previous file if any
      if (inFile && currentFileLines.length > 0) {
        if (currentFileLines.length > maxLinesPerFile) {
          result.push(...currentFileLines.slice(0, maxLinesPerFile));
          result.push(
            `... (${
              currentFileLines.length - maxLinesPerFile
            } more lines truncated for ${currentFile})`
          );
        } else {
          result.push(...currentFileLines);
        }
      }

      // Start new file
      currentFile = line;
      currentFileLines = [];

      // Check if this file should be excluded
      const shouldExclude = excludeFiles.some((excludeFile) =>
        line.includes(excludeFile)
      );

      if (shouldExclude) {
        inFile = false;
        result.push(line);
        result.push('... (lockfile changes excluded from diff)');
        result.push('');
      } else {
        inFile = true;
        currentFileLines.push(line);
      }
    } else if (inFile) {
      currentFileLines.push(line);
    }
  }

  // Don't forget the last file
  if (inFile && currentFileLines.length > 0) {
    if (currentFileLines.length > maxLinesPerFile) {
      result.push(...currentFileLines.slice(0, maxLinesPerFile));
      result.push(
        `... (${
          currentFileLines.length - maxLinesPerFile
        } more lines truncated)`
      );
    } else {
      result.push(...currentFileLines);
    }
  }

  return result.join('\n');
}

export async function getLastReleaseTag(): Promise<string | null> {
  try {
    // Get the most recent tag that matches the release pattern
    const { stdout } = await execa('git', [
      'describe',
      '--tags',
      '--abbrev=0',
      '--match=*@*',
    ]);
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getDiffSinceLastRelease(
  paths: string[]
): Promise<string> {
  const lastTag = await getLastReleaseTag();
  const base = lastTag || 'HEAD~10'; // Fallback to last 10 commits if no tag

  const { stdout } = await execa(
    'git',
    ['diff', `${base}..HEAD`, '--', ...paths],
    { stdio: 'pipe' }
  );
  return stdout;
}
