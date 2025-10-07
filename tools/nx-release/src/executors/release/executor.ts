import { execa } from 'execa';
import type { ExecutorContext } from '@nx/devkit';
import type { ReleaseExecutorSchema } from './schema.js';
import {
  getCurrentBranch,
  hasUncommittedChanges,
  hasUnpushedCommits,
  pullLatest,
  getCurrentCommitSha,
  getTagsAtCommit,
  pushWithTags,
  getNewTags,
  getDiffSinceLastRelease,
  getDiff,
} from '../../lib/git-operations.js';
import {
  extractChangelog,
  extractReleasesFromTags,
  buildPRTitle,
} from '../../lib/changelog.js';
import { generateAISummary } from '../../lib/ai-summary.js';
import {
  getExistingPR,
  buildPRBody,
  createPR,
  updatePR,
  enableAutoMerge,
  openPRInBrowser,
  getRepoName,
  addChangelogComment,
  getPRBaseCommit,
} from '../../lib/pr-creation.js';

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
    aiCommand,
    maxLinesPerFile = 150,
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

    // Check for existing PR to determine diff base
    const existingPR = await getExistingPR(baseBranch, targetBranch);
    
    // Get diff for AI summary BEFORE creating new tags
    let diffForAI = '';
    if (aiCommand) {
      console.log('📊 Getting diff for AI analysis...');
      
      if (existingPR) {
        // For existing PR, diff from the target branch HEAD (where PR will merge)
        const prBaseCommit = await getPRBaseCommit(existingPR, targetBranch);
        console.log(`   Using ${targetBranch} branch HEAD: ${prBaseCommit.substring(0, 7)}`);
        diffForAI = await getDiff(prBaseCommit, beforeSha, diffPaths);
      } else {
        // For new PR, diff from last release tag
        diffForAI = await getDiffSinceLastRelease(diffPaths);
      }
    }

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
      
      // Handle first release for new packages
      if (
        error instanceof Error &&
        error.message?.includes('No git tags matching pattern')
      ) {
        console.log('\n⚠️  Detected new package(s) without git tags');
        console.log('🔄 Retrying with --first-release flag...\n');
        
        const args = ['nx', 'release', '--first-release'];
        if (skipPublish) {
          args.push('--skip-publish');
        }
        await execa('npx', args, { stdio: 'inherit' });
      } else {
        throw error;
      }
    }

    // Check if nx created a new commit (version bump)
    const afterSha = await getCurrentCommitSha();

    if (beforeSha === afterSha) {
      // No version bump, but check if there are other commits to push
      const hasUnpushed = await hasUnpushedCommits(baseBranch);
      
      if (!hasUnpushed) {
        console.log('\n❌ No version changes were made');
        console.log('ℹ️  No changes detected - nothing to release');
        return { success: true };
      }
      
      // We have unpushed commits (e.g., CI fixes, docs) but no version bump
      console.log('\n⚠️  No version changes, but found unpushed commits');
      console.log('📤 Pushing commits to update PR...');
      await pushWithTags(baseBranch);
      
      console.log('✅ PR updated with latest commits');
      console.log('ℹ️  No package versions were bumped - PR will not publish to npm');
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

    // Generate AI summary if enabled (using pre-captured diff)
    let aiSummary = '';
    if (aiCommand && diffForAI) {
      console.log('🤖 Generating AI summary...');
      aiSummary = await generateAISummary(changelog, releases, diffForAI, aiCommand, {
        maxLinesPerFile,
      });
    }

    // Create PR body (without changelog)
    const prBody = buildPRBody(aiSummary, releases);

    // Use the existingPR we already checked earlier
    if (!existingPR) {
      const prUrl = await createPR(prTitle, prBody, baseBranch, targetBranch);
      console.log(`✅ PR created: ${prUrl}`);

      // Extract PR number from URL
      const prNumber = prUrl.split('/').pop() || '';

      // Add changelog as a comment
      console.log('📋 Adding changelog comment...');
      await addChangelogComment(prNumber, changelog);

      // Enable auto-merge if requested
      if (autoMerge) {
        await enableAutoMerge(prNumber);
      }

      // Open in browser
      await openPRInBrowser();
    } else {
      await updatePR(existingPR, prBody);

      // Update changelog comment
      console.log('📋 Adding changelog comment...');
      await addChangelogComment(existingPR, changelog);

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
