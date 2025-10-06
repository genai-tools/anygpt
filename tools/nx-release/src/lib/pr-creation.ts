import { execa } from 'execa';
import { writeFile } from 'fs/promises';

export async function getExistingPR(
  headBranch: string,
  baseBranch: string
): Promise<string | null> {
  try {
    const { stdout } = await execa('gh', [
      'pr',
      'list',
      '--head',
      headBranch,
      '--base',
      baseBranch,
      '--state',
      'open',
      '--json',
      'number',
      '--jq',
      '.[0].number',
    ]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export function buildPRBody(aiSummary: string): string {
  return `## 🚀 Release PR

This PR will publish the version changes to npm when merged.

${aiSummary ? `### 🤖 AI Summary\n\n${aiSummary}\n\n` : ''}### ✅ Next Steps

1. Review changes in the Files tab
2. Check the changelog comment below 📋
3. Wait for CI checks to pass ✅
4. Merge to publish to npm 📦
`;
}

export async function addChangelogComment(
  prNumber: string,
  changelog: string
): Promise<void> {
  const commentBody = `## 📋 Changelog

${changelog}

---
*This changelog was automatically generated from conventional commits.*`;

  await execa('gh', [
    'pr',
    'comment',
    prNumber,
    '--body',
    commentBody,
  ]);
}

export async function createPR(
  title: string,
  body: string,
  headBranch: string,
  baseBranch: string
): Promise<string> {
  const prBodyPath = '/tmp/release-pr.md';
  await writeFile(prBodyPath, body, 'utf-8');

  console.log('\n📝 Creating release PR...');
  const { stdout: prUrl } = await execa('gh', [
    'pr',
    'create',
    '--title',
    title,
    '--body-file',
    prBodyPath,
    '--head',
    headBranch,
    '--base',
    baseBranch,
  ]);

  return prUrl.trim();
}

export async function updatePR(
  prNumber: string,
  body: string
): Promise<void> {
  const prBodyPath = '/tmp/release-pr.md';
  await writeFile(prBodyPath, body, 'utf-8');

  console.log(`\n📝 Updating existing PR #${prNumber}...`);
  await execa('gh', ['pr', 'edit', prNumber, '--body-file', prBodyPath]);
}

export async function enableAutoMerge(prNumber: string): Promise<void> {
  console.log('🔄 Enabling auto-merge...');
  try {
    await execa('gh', ['pr', 'merge', '--auto', '--merge', prNumber]);
    console.log('✅ Auto-merge enabled - PR will merge when CI passes');
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message?.includes('is in clean status')) {
        console.log('ℹ️  PR is already mergeable - auto-merge not needed');
      } else if (error.message?.includes('Protected branch rules not configured')) {
        console.log('⚠️  Auto-merge requires branch protection rules on production branch');
        console.log('   You can merge manually or enable branch protection in repo settings');
      } else if (error.message?.includes('Auto merge is not allowed for this repository')) {
        console.log('⚠️  Auto-merge is not enabled for this repository');
        console.log('   Enable it in Settings → General → Pull Requests → Allow auto-merge');
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
}

export async function openPRInBrowser(prNumber?: string): Promise<void> {
  if (prNumber) {
    await execa('gh', ['pr', 'view', prNumber, '--web']);
  } else {
    await execa('gh', ['pr', 'view', '--web']);
  }
}

export async function getRepoName(): Promise<string> {
  const { stdout } = await execa('gh', [
    'repo',
    'view',
    '--json',
    'nameWithOwner',
    '-q',
    '.nameWithOwner',
  ]);
  return stdout.trim();
}
