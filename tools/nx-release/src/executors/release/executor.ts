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
  addUpdateComment,
  getPRDiff,
  markPRReady,
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
    model,
    maxLinesPerFile = 150,
    autoMerge = true,
    skipPublish = true,
    diffPaths = ['packages/*/src/**', 'packages/connectors/*/src/**'],
  } = options;

  // Override model in aiCommand if model parameter is provided
  const finalAiCommand =
    model && aiCommand
      ? aiCommand.replace(/--model\s+\S+/, `--model ${model}`)
      : aiCommand;

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

    // Check for existing PR
    const existingPR = await getExistingPR(baseBranch, targetBranch);

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

        // If no existing PR, create a draft PR to keep the workflow ready
        if (!existingPR) {
          console.log('📝 Creating draft PR to keep release workflow ready...');
          const prTitle = 'Draft release';
          const prBody = `## 📝 Draft Release PR\n\nThis is a draft PR created automatically to keep the release workflow ready.\n\nWhen you make changes that trigger version bumps, this PR will be updated with:\n- Package versions\n- Changelog\n- AI-generated summary\n\n**No action needed** - this will be automatically updated on the next release.`;
          const prUrl = await createPR(prTitle, prBody, targetBranch, {
            draft: true,
            headBranch: baseBranch,
          });
          console.log(`✅ Draft PR created: ${prUrl}`);
          await openPRInBrowser();
        } else {
          console.log('ℹ️  Existing PR found - no changes needed');
        }

        console.log('ℹ️  No changes detected - nothing to release');
        return { success: true };
      }

      // We have unpushed commits (e.g., CI fixes, docs) but no version bump
      console.log('\n⚠️  No version changes, but found unpushed commits');
      console.log('📤 Pushing commits to main...');
      await pushWithTags(baseBranch);

      // Still need to create/update PR to production
      if (!existingPR) {
        console.log('📝 Creating PR to production...');
        const prTitle = buildPRTitle([]);
        const prBody = buildPRBody('', []);
        const prUrl = await createPR(prTitle, prBody, targetBranch, {
          draft: false,
          headBranch: baseBranch,
        });
        console.log(`✅ PR created: ${prUrl}`);

        const prNumber = prUrl.split('/').pop() || '';

        if (autoMerge) {
          await enableAutoMerge(prNumber);
        }

        await openPRInBrowser();
      } else {
        console.log(
          'ℹ️  Existing PR will be updated automatically by the push'
        );
        const repoName = await getRepoName();
        console.log(
          `✅ PR updated: https://github.com/${repoName}/pull/${existingPR}`
        );
        await openPRInBrowser(existingPR);
      }

      console.log(
        'ℹ️  No package versions were bumped - PR will not publish to npm'
      );
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

    let prNumber: string;

    // For NEW PR: Generate AI summary from local diff before creating PR
    if (!existingPR && finalAiCommand) {
      console.log(
        `\n🤖 Generating AI summary from local changes${
          model ? ` with model: ${model}` : ''
        }...`
      );
      try {
        // Use local diff since PR doesn't exist yet
        const localDiff = await getDiff(
          `origin/${targetBranch}`,
          afterSha,
          diffPaths
        );
        // Step 1: Generate summary
        const aiSummary = await generateAISummary(
          changelog,
          releases,
          localDiff,
          finalAiCommand,
          {
            maxLinesPerFile,
          }
        );

        // Step 2: Create PR with summary first
        const prBodyWithAI = buildPRBody(aiSummary, releases);
        const prUrl = await createPR(prTitle, prBodyWithAI, targetBranch, {
          headBranch: baseBranch,
        });
        console.log(`✅ PR created with AI summary: ${prUrl}`);
        prNumber = prUrl.split('/').pop() || '';

        // Step 3: Generate title from summary and update PR
        if (aiSummary) {
          console.log('🎯 Generating AI title from summary...');
          const { generateAITitle } = await import('../../lib/ai-summary.js');
          const aiTitle = await generateAITitle(
            aiSummary,
            changelog,
            releases,
            finalAiCommand
          );

          if (aiTitle) {
            await updatePR(prNumber, prBodyWithAI, aiTitle);
            console.log(`✅ PR title updated: "${aiTitle}"`);
          }
        }

        // Enable auto-merge if requested
        if (autoMerge) {
          await enableAutoMerge(prNumber);
        }
      } catch (error) {
        console.warn('⚠️  Failed to generate AI summary:', error);
        console.log('   Creating PR without AI summary');

        // Fallback: Create PR without AI summary
        const prBodyWithoutAI = buildPRBody('', releases);
        const prUrl = await createPR(prTitle, prBodyWithoutAI, targetBranch, {
          headBranch: baseBranch,
        });
        console.log(`✅ PR created: ${prUrl}`);
        prNumber = prUrl.split('/').pop() || '';

        if (autoMerge) {
          await enableAutoMerge(prNumber);
        }
      }
    } else if (!existingPR) {
      // No AI command configured, create PR without AI summary
      const prBodyWithoutAI = buildPRBody('', releases);
      const prUrl = await createPR(prTitle, prBodyWithoutAI, targetBranch, {
        headBranch: baseBranch,
      });
      console.log(`✅ PR created: ${prUrl}`);
      prNumber = prUrl.split('/').pop() || '';

      if (autoMerge) {
        await enableAutoMerge(prNumber);
      }
    } else {
      // EXISTING PR: Mark as ready if it was a draft, then update
      prNumber = existingPR;

      // Convert draft PR to ready (if it was a draft placeholder)
      await markPRReady(prNumber);

      const prBodyWithoutAI = buildPRBody('', releases);
      await updatePR(existingPR, prBodyWithoutAI, prTitle);
      console.log(
        'ℹ️  Auto-merge not enabled for existing PR - enable manually if needed'
      );
      const repoName = await getRepoName();
      console.log(
        `✅ PR updated: https://github.com/${repoName}/pull/${existingPR}`
      );

      // For existing PR, generate AI summary from actual PR diff
      if (finalAiCommand) {
        console.log(
          `\n🤖 Generating AI summary from PR diff${
            model ? ` with model: ${model}` : ''
          }...`
        );
        try {
          const prDiff = await getPRDiff(prNumber);
          const aiSummary = await generateAISummary(
            changelog,
            releases,
            prDiff,
            finalAiCommand,
            {
              maxLinesPerFile,
            }
          );

          // Update PR with AI summary
          const prBodyWithAI = buildPRBody(aiSummary, releases);
          await updatePR(prNumber, prBodyWithAI);
          console.log('✅ PR description updated with AI summary');
        } catch (error) {
          console.warn('⚠️  Failed to generate AI summary:', error);
          console.log('   PR updated without AI summary');
        }
      }
    }

    // Add tracking comment
    console.log('📋 Adding update tracking comment...');
    await addUpdateComment(prNumber, 'publish');

    // Open in browser
    await openPRInBrowser(prNumber);

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
