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
    return true;
  }
}

export async function pullLatest(branch: string): Promise<void> {
  await execa('git', ['pull', 'origin', branch], { stdio: 'inherit' });
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
  return stdout
    .split('\n')
    .filter((tag) => tag && !beforeTags.has(tag));
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
  return stdout;
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
