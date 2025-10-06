import { execa } from 'execa';
import type { ExecutorContext } from '@nx/devkit';
import type { ReleaseExecutorSchema } from './schema';
import {
  getCurrentBranch,
  hasUncommittedChanges,
  pullLatest,
  getCurrentCommitSha,
  getTagsAtCommit,
  pushWithTags,
  getNewTags,
  getDiffSinceLastRelease,
} from '../../lib/git-operations';
import {
  extractChangelog,
  extractReleasesFromTags,
  buildPRTitle,
} from '../../lib/changelog';
import { generateAISummary } from '../../lib/ai-summary';
import {
  getExistingPR,
  buildPRBody,
  createPR,
  updatePR,
  enableAutoMerge,
  openPRInBrowser,
  getRepoName,
} from '../../lib/pr-creation';

export default async function runExecutor(
  options: ReleaseExecutorSchema,
  _context: ExecutorContext
): Promise<{ success: boolean }> {
  const {
    baseBranch = 'main',
    targetBranch = 'production',
    changelogPatterns = [
      'packages/*/CHANGELOG.md',
      'packages/connectors/*/CHANGELOG.md',
    ],
    aiProvider = 'anygpt',
    aiCommand = 'npx anygpt chat',
    autoMerge = true,
    skipPublish = true,
    diffPaths = ['packages/*/src/**', 'packages/connectors/*/src/**'],
  } = options;

  try {
    console.log('🚀 Starting release process...\n');

    // Check branch
    const branch = await getCurrentBranch();
    if (branch !== baseBranch) {
      console.error(
        `❌ Error: Must be on ${baseBranch} branch (currently on ${branch})`
      );
      return { success: false };
    }

    // Check for uncommitted changes
    if (await hasUncommittedChanges()) {
      console.error('❌ Error: You have uncommitted changes');
      return { success: false };
    }

    // Pull latest
    console.log(`📥 Pulling latest changes from ${baseBranch}...`);
    await pullLatest(baseBranch);

    // Get current commit SHA before release
    const beforeSha = await getCurrentCommitSha();

    // Get list of existing tags before release
    const existingTags = await getTagsAtCommit(beforeSha);

    // Run nx release (version + changelog + commit + tag)
    console.log('\n📝 Running nx release...');
    try {
      const args = ['nx', 'release'];
      if (skipPublish) {
        args.push('--skip-publish');
      }
      await execa('npx', args, { stdio: 'inherit' });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message?.includes('No changes were detected')
      ) {
        console.log('\n❌ No version changes were made');
        console.log('ℹ️  No changes detected - nothing to release');
        return { success: true };
      }
      throw error;
    }

    // Check if nx created a new commit (version bump)
    const afterSha = await getCurrentCommitSha();

    if (beforeSha === afterSha) {
      console.log('\n❌ No version changes were made');
      console.log('ℹ️  No changes detected - nothing to release');
      return { success: true };
    }

    console.log('\n✅ Version bumps and tags created');

    // Push to main with tags
    console.log(`📤 Pushing to ${baseBranch} with tags...`);
    await pushWithTags(baseBranch);

    // Get new tags created by this release
    const newTags = await getNewTags(existingTags, afterSha);

    // Extract package releases from new tags
    const releases = extractReleasesFromTags(newTags);

    // Extract changelog
    console.log('\n📋 Extracting changelog...');
    const { changelog } = await extractChangelog(changelogPatterns);

    // Build PR title from releases
    const prTitle = buildPRTitle(releases);

    // Generate AI summary if enabled
    let aiSummary = '';
    if (aiProvider !== 'none') {
      console.log('📊 Getting diff for AI analysis...');
      const diff = await getDiffSinceLastRelease(diffPaths);
      aiSummary = await generateAISummary(changelog, releases, diff, aiCommand);
    }

    // Create PR body
    const prBody = buildPRBody(changelog, aiSummary);

    // Check for existing PR
    const existingPR = await getExistingPR(baseBranch, targetBranch);

    if (!existingPR) {
      const prUrl = await createPR(prTitle, prBody, baseBranch, targetBranch);
      console.log(`✅ PR created: ${prUrl}`);

      // Extract PR number from URL
      const prNumber = prUrl.split('/').pop() || '';

      // Enable auto-merge if requested
      if (autoMerge) {
        await enableAutoMerge(prNumber);
      }

      // Open in browser
      await openPRInBrowser();
    } else {
      await updatePR(existingPR, prBody);

      console.log(
        'ℹ️  Auto-merge not enabled for existing PR - enable manually if needed'
      );

      const repoName = await getRepoName();
      console.log(
        `✅ PR updated: https://github.com/${repoName}/pull/${existingPR}`
      );

      // Open in browser
      await openPRInBrowser(existingPR);
    }

    console.log('\n🎉 Release process complete!');
    console.log('   Review the PR and merge when CI passes');
    console.log(
      `\n💡 Tip: After the PR merges, run \`git pull origin ${targetBranch} && git push\` to sync ${baseBranch} with ${targetBranch}\n`
    );

    return { success: true };
  } catch (error) {
    console.error('\n❌ Release failed:', error);
    if (error instanceof Error && 'stderr' in error) {
      console.error((error as { stderr?: string }).stderr);
    }
    return { success: false };
  }
}
