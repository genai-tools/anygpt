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

interface PackageRelease {
  name: string;
  version: string;
}

async function extractChangelog(): Promise<{ changelog: string; releases: PackageRelease[] }> {
  const packages = [
    'packages/*/CHANGELOG.md',
    'packages/connectors/*/CHANGELOG.md',
  ];

  let changelog = '';
  const releases: PackageRelease[] = [];

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

        // Extract version from first header (e.g., "## 0.8.0 (2025-10-06)")
        const versionMatch = lines[firstHeaderIdx].match(/##\s+([\d.]+)/);
        if (versionMatch) {
          releases.push({ name: pkgName, version: versionMatch[1] });
        }

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

  return { changelog, releases };
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

async function generateAISummary(
  changelog: string, 
  releases: PackageRelease[],
  baseSha: string,
  headSha: string
): Promise<string> {
  try {
    const releaseInfo = releases.map(r => `${r.name}@${r.version}`).join(', ');
    
    // Get the diff for the release
    console.log('📊 Getting diff for AI analysis...');
    const { stdout: diff } = await execa('git', [
      'diff',
      `${baseSha}..${headSha}`,
      '--',
      'packages/*/src/**',
      'packages/connectors/*/src/**',
    ], {
      stdio: 'pipe',
    });

    const prompt = `Generate a concise, professional summary for this release PR. Include:
1. A brief overview of what's being released (${releaseInfo})
2. Key highlights from the changelog
3. Notable code changes from the diff
4. Any important notes for reviewers

Changelog:
${changelog}

Code Changes (diff):
${diff.slice(0, 5000)}${diff.length > 5000 ? '\n... (truncated)' : ''}

Keep it under 250 words and use a friendly, professional tone. Focus on what matters to reviewers.`;

    console.log('🤖 Generating AI summary...');
    const { stdout } = await execa('npx', ['anygpt', 'chat', prompt], {
      stdio: 'pipe',
    });
    
    return stdout.trim();
  } catch {
    console.log('⚠️  AI summary generation failed, using default summary');
    return '';
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

  // Get list of existing tags before release
  const { stdout: beforeTags } = await execa('git', ['tag', '--points-at', 'HEAD']);
  const existingTags = new Set(beforeTags.split('\n').filter(Boolean));

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

  // Get new tags created by this release
  const { stdout: afterTags } = await execa('git', ['tag', '--points-at', 'HEAD']);
  const newTags = afterTags.split('\n').filter(tag => tag && !existingTags.has(tag));
  
  // Extract package releases from new tags (format: "cli@0.10.0")
  const releases: PackageRelease[] = newTags
    .map(tag => {
      const match = tag.match(/^(.+)@([\d.]+)$/);
      if (match) {
        return { name: match[1], version: match[2] };
      }
      return null;
    })
    .filter((r): r is PackageRelease => r !== null);

  // Extract changelog
  console.log('\n📋 Extracting changelog...');
  const { changelog } = await extractChangelog();

  // Build PR title from releases
  let prTitle = 'Release';
  if (releases.length === 1) {
    prTitle = `Release ${releases[0].name} v${releases[0].version}`;
  } else if (releases.length > 1) {
    prTitle = `Release: ${releases.map(r => `${r.name}@${r.version}`).join(', ')}`;
  } else {
    prTitle = `Release: ${new Date().toISOString().split('T')[0]}`;
  }

  // Generate AI summary with diff
  const aiSummary = await generateAISummary(changelog, releases, beforeSha.trim(), afterSha.trim());

  // Create PR body
  const prBody = `## 🚀 Release PR

This PR will publish the version changes to npm when merged.

${aiSummary ? `### 🤖 AI Summary\n\n${aiSummary}\n\n` : ''}### 📋 Changelog
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
      prTitle,
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

    // Enable auto-merge with squash strategy (no merge commits)
    console.log('🔄 Enabling auto-merge...');
    try {
      await execa('gh', ['pr', 'merge', '--auto', '--squash', prNumber]);
      console.log('✅ Auto-merge enabled - PR will squash merge when CI passes');
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

    // Open in browser
    await execa('gh', ['pr', 'view', '--web']);
  } else {
    console.log(`\n📝 Updating existing PR #${existingPR}...`);
    await execa('gh', ['pr', 'edit', existingPR, '--body-file', prBodyPath]);

    // Note: We don't enable auto-merge for existing PRs because they might have
    // stale check status from previous commits. Auto-merge should only be enabled
    // when creating a new PR, or manually by the user after checks pass.
    console.log('ℹ️  Auto-merge not enabled for existing PR - enable manually if needed');

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
