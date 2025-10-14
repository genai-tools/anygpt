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

export function buildPRBody(
  aiSummary: string,
  releases: Array<{ name: string; version: string }>
): string {
  const releasesList = releases
    .map((r) => `- \`${r.name}@${r.version}\``)
    .join('\n');

  return `## 🚀 Release PR

${releasesList ? `### 📦 Packages to Publish\n\n${releasesList}\n\n` : ''}${
    aiSummary ? `### 💡 What Changed\n\n${aiSummary}\n\n` : ''
  }### ⚡ Auto-Merge Enabled

This PR will **automatically merge** once all CI checks pass ✅

If checks fail, review the errors and push fixes to this branch.

---
*Detailed changelogs are available in individual package CHANGELOG.md files*
`;
}

export async function addUpdateComment(
  prNumber: string,
  source: 'publish' | 'pr-update'
): Promise<void> {
  const commentBody =
    source === 'publish'
      ? '🚀 Auto-updated from `npx nx publish`'
      : '🔄 Manually updated via `npx nx pr-update`';

  await execa('gh', ['pr', 'comment', prNumber, '--body', commentBody]);
  console.log(`   Added ${source} tracking comment`);
}

export async function createPR(
  title: string,
  body: string,
  baseBranch: string,
  options: { draft?: boolean; headBranch?: string } = {}
): Promise<string> {
  const prBodyPath = '/tmp/release-pr.md';
  await writeFile(prBodyPath, body, 'utf-8');

  const { draft = false, headBranch } = options;

  console.log(`\n📝 Creating ${draft ? 'draft ' : ''}release PR...`);
  const args = [
    'pr',
    'create',
    '--title',
    title,
    '--body-file',
    prBodyPath,
    '--base',
    baseBranch,
  ];

  if (headBranch) {
    args.push('--head', headBranch);
  }

  if (draft) {
    args.push('--draft');
  }

  const { stdout: prUrl } = await execa('gh', args);

  return prUrl.trim();
}

export async function updatePR(
  prNumber: string,
  body: string,
  title?: string
): Promise<void> {
  const prBodyPath = '/tmp/release-pr.md';
  await writeFile(prBodyPath, body, 'utf-8');

  console.log(`\n📝 Updating existing PR #${prNumber}...`);
  const args = ['pr', 'edit', prNumber, '--body-file', prBodyPath];

  if (title) {
    args.push('--title', title);
    console.log(`   Title: "${title}"`);
  }

  await execa('gh', args);
}

async function checkBranchProtection(
  branch: string
): Promise<{ hasProtection: boolean; hasRequiredChecks: boolean }> {
  try {
    const result = await execa('gh', [
      'api',
      `repos/{owner}/{repo}/branches/${branch}/protection`,
    ]);
    const protection = JSON.parse(result.stdout);
    const hasRequiredChecks =
      protection.required_status_checks?.contexts?.length > 0 ||
      protection.required_status_checks?.checks?.length > 0;
    return { hasProtection: true, hasRequiredChecks };
  } catch {
    return { hasProtection: false, hasRequiredChecks: false };
  }
}

export async function enableAutoMerge(
  prNumber: string,
  targetBranch = 'production'
): Promise<void> {
  console.log('🔄 Checking branch protection rules...');

  // Check if branch protection is configured
  const { hasProtection, hasRequiredChecks } = await checkBranchProtection(
    targetBranch
  );

  if (!hasProtection || !hasRequiredChecks) {
    console.log(
      `⚠️  WARNING: Branch protection not properly configured for '${targetBranch}'`
    );
    console.log(
      '   Without required status checks, auto-merge will merge immediately!'
    );
    console.log(
      `   Configure at: https://github.com/{owner}/{repo}/settings/branch_protection_rules`
    );
    console.log('   Required: Enable "Require status checks to pass"');
    console.log('   Skipping auto-merge to prevent premature merge.');
    return;
  }

  console.log('✅ Branch protection configured - enabling auto-merge...');
  try {
    // Use merge commit instead of rebase to avoid commit SHA divergence
    // between main and production branches
    await execa('gh', ['pr', 'merge', '--auto', '--merge', prNumber]);
    console.log('✅ Auto-merge enabled - PR will merge when CI passes');
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message?.includes('is in clean status')) {
        console.log('ℹ️  PR is already mergeable - auto-merge not needed');
      } else if (
        error.message?.includes('Protected branch rules not configured')
      ) {
        console.log(
          '⚠️  Auto-merge requires branch protection rules on production branch'
        );
        console.log(
          '   You can merge manually or enable branch protection in repo settings'
        );
      } else if (
        error.message?.includes('Auto merge is not allowed for this repository')
      ) {
        console.log('⚠️  Auto-merge is not enabled for this repository');
        console.log(
          '   Enable it in Settings → General → Pull Requests → Allow auto-merge'
        );
      } else if (
        error.message?.includes('is in unstable status') ||
        error.message?.includes('unstable status')
      ) {
        console.log(
          '⚠️  Cannot enable auto-merge: PR has failing checks or conflicts'
        );
        console.log(
          '   Auto-merge will be enabled automatically once checks pass and conflicts are resolved'
        );
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

export async function getPRBaseCommit(
  prNumber: string,
  targetBranch: string
): Promise<string> {
  // Get the current HEAD of the target branch (e.g., production)
  // This represents where the PR will merge into
  const { stdout } = await execa('git', [
    'rev-parse',
    `origin/${targetBranch}`,
  ]);
  return stdout.trim();
}

export async function markPRReady(prNumber: string): Promise<void> {
  console.log('Converting draft PR to ready...');
  try {
    await execa('gh', ['pr', 'ready', prNumber]);
    console.log('PR marked as ready for review');
  } catch {
    // Ignore error if PR is already ready
    console.log('PR is already ready (not a draft)');
  }
}
