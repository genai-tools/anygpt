#!/usr/bin/env node
import { execa } from 'execa';
import { readFile, writeFile } from 'fs/promises';

async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execa('git', ['branch', '--show-current']);
  return stdout.trim();
}

async function hasUncommittedChanges(): Promise<boolean> {
  try {
    await execa('git', ['diff-index', '--quiet', 'HEAD', '--']);
    return false;
  } catch {
    return true;
  }
}

async function extractChangelog(): Promise<string> {
  const packages = [
    'packages/*/CHANGELOG.md',
    'packages/connectors/*/CHANGELOG.md',
  ];

  let changelog = '';

  for (const pattern of packages) {
    const { stdout } = await execa('bash', [
      '-c',
      `ls ${pattern} 2>/dev/null || true`,
    ]);

    const files = stdout.split('\n').filter(Boolean);

    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        const pkgName = file.split('/').slice(-2, -1)[0];

        // Extract first changelog entry (between first two ## headers)
        const lines = content.split('\n');
        const firstHeaderIdx = lines.findIndex((l) => l.startsWith('## '));
        if (firstHeaderIdx === -1) continue;

        const secondHeaderIdx = lines.findIndex(
          (l, i) => i > firstHeaderIdx && l.startsWith('## ')
        );
        const endIdx = secondHeaderIdx === -1 ? lines.length : secondHeaderIdx;

        const entry = lines.slice(firstHeaderIdx, endIdx).join('\n').trim();
        if (entry) {
          changelog += `\n### 📦 ${pkgName}\n${entry}\n`;
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return changelog;
}

async function getExistingPR(): Promise<string | null> {
  try {
    const { stdout } = await execa('gh', [
      'pr',
      'list',
      '--head',
      'main',
      '--base',
      'production',
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

async function main() {
  console.log('🚀 Starting release process...\n');

  // Check branch
  const branch = await getCurrentBranch();
  if (branch !== 'main') {
    console.error(`❌ Error: Must be on main branch (currently on ${branch})`);
    process.exit(1);
  }

  // Check for uncommitted changes
  if (await hasUncommittedChanges()) {
    console.error('❌ Error: You have uncommitted changes');
    process.exit(1);
  }

  // Pull latest
  console.log('📥 Pulling latest changes...');
  await execa('git', ['pull', 'origin', 'main'], { stdio: 'inherit' });

  // Get current commit SHA before release
  const { stdout: beforeSha } = await execa('git', ['rev-parse', 'HEAD']);

  // Run nx release (version + changelog + commit + tag)
  console.log('\n📝 Running nx release...');
  try {
    await execa('npx', ['nx', 'release', '--skip-publish'], {
      stdio: 'inherit',
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('No changes were detected')) {
      console.log('\n❌ No version changes were made');
      console.log('ℹ️  No changes detected - nothing to release');
      return;
    }
    throw error;
  }

  // Check if nx created a new commit (version bump)
  const { stdout: afterSha } = await execa('git', ['rev-parse', 'HEAD']);
  
  if (beforeSha.trim() === afterSha.trim()) {
    console.log('\n❌ No version changes were made');
    console.log('ℹ️  No changes detected - nothing to release');
    return;
  }

  console.log('\n✅ Version bumps and tags created');

  // Push to main with tags
  console.log('📤 Pushing to main with tags...');
  await execa('git', ['push', 'origin', 'main', '--follow-tags'], { stdio: 'inherit' });

  // Extract changelog
  console.log('\n📋 Extracting changelog...');
  const changelog = await extractChangelog();

  // Create PR body
  const prBody = `## 🚀 Release PR

This PR will publish the version changes to npm when merged.

### 📋 Changelog
${changelog}

### ✅ Next Steps

1. Review changes in the Files tab
2. Wait for CI checks to pass ✅
3. Merge to publish to npm 📦
`;

  const prBodyPath = '/tmp/release-pr.md';
  await writeFile(prBodyPath, prBody, 'utf-8');

  // Check for existing PR
  const existingPR = await getExistingPR();

  if (!existingPR) {
    console.log('\n📝 Creating release PR...');
    const { stdout: prUrl } = await execa('gh', [
      'pr',
      'create',
      '--title',
      `Release: ${new Date().toISOString().split('T')[0]}`,
      '--body-file',
      prBodyPath,
      '--head',
      'main',
      '--base',
      'production',
    ]);
    console.log(`✅ PR created: ${prUrl}`);

    // Extract PR number from URL
    const prNumber = prUrl.trim().split('/').pop() || '';

    // Enable auto-merge with merge commit strategy
    console.log('🔄 Enabling auto-merge...');
    try {
      await execa('gh', ['pr', 'merge', '--auto', '--merge', prNumber]);
      console.log('✅ Auto-merge enabled - PR will merge when CI passes');
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('is in clean status')) {
        console.log('ℹ️  PR is already mergeable - auto-merge not needed');
      } else {
        throw error;
      }
    }

    // Open in browser
    await execa('gh', ['pr', 'view', '--web']);
  } else {
    console.log(`\n📝 Updating existing PR #${existingPR}...`);
    await execa('gh', ['pr', 'edit', existingPR, '--body-file', prBodyPath]);

    // Enable auto-merge with merge commit strategy
    console.log('🔄 Enabling auto-merge...');
    try {
      await execa('gh', ['pr', 'merge', '--auto', '--merge', existingPR]);
      console.log('✅ Auto-merge enabled - PR will merge when CI passes');
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('is in clean status')) {
        console.log('ℹ️  PR is already mergeable - auto-merge not needed');
      } else {
        throw error;
      }
    }

    const { stdout: repoName } = await execa('gh', [
      'repo',
      'view',
      '--json',
      'nameWithOwner',
      '-q',
      '.nameWithOwner',
    ]);
    console.log(
      `✅ PR updated: https://github.com/${repoName.trim()}/pull/${existingPR}`
    );

    // Open in browser
    await execa('gh', ['pr', 'view', existingPR, '--web']);
  }

  console.log('\n🎉 Release process complete!');
  console.log('   Review the PR and merge when CI passes\n');
}

main().catch((error) => {
  console.error('\n❌ Release failed:', error.message);
  if (error.stderr) {
    console.error(error.stderr);
  }
  process.exit(1);
});
