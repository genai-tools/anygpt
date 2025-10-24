import { execa } from 'execa';
import { readFile } from 'node:fs/promises';
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
} from '../../lib/git-operations.js';
import {
  extractChangelog,
  extractReleasesFromTags,
  buildPRTitle,
} from '../../lib/changelog.js';
import {
  getExistingPR,
  buildPRBody,
  createPR,
  updatePR,
  enableAutoMerge,
  openPRInBrowser,
  getRepoName,
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
    autoMerge = true,
    skipPublish = true,
    prDescriptionFile,
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

    // Pull latest and fetch target branch
    console.log(`📥 Pulling latest changes from ${baseBranch}...`);
    await pullLatest(baseBranch);
    console.log(`📥 Fetching ${targetBranch} from remote...`);
    await execa('git', ['fetch', 'origin', targetBranch]);

    // Get current commit SHA before release
    const beforeSha = await getCurrentCommitSha();

    // Get list of existing tags before release
    const existingTags = await getTagsAtCommit(beforeSha);

    // Check for existing PR
    const existingPR = await getExistingPR(baseBranch, targetBranch);

    // Run nx release (version + changelog + commit + tag)
    console.log('\n📝 Running nx release...');

    // Helper function to run nx release and handle errors
    const runNxRelease = async (firstRelease = false) => {
      const args = ['nx', 'release'];
      if (firstRelease) {
        args.push('--first-release');
      }
      if (skipPublish) {
        args.push('--skip-publish');
      }

      try {
        // Capture output to check for errors, but still show it
        const result = await execa('npx', args, {
          all: true,
          reject: false,
        });

        // If command failed, check the output
        if (result.exitCode !== 0) {
          const output = result.all || '';

          // Check for "No changes were detected"
          if (output.includes('No changes were detected')) {
            console.log(output); // Show the output
            console.log('\n❌ No version changes were made');
            console.log('ℹ️  No changes detected - nothing to release');
            return { handled: true, success: true };
          }

          // Check for missing git tags (new package)
          if (
            !firstRelease &&
            output.includes('No git tags matching pattern')
          ) {
            console.log(output); // Show the output
            console.log('\n⚠️  Detected new package(s) without git tags');
            console.log('🔄 Retrying with --first-release flag...\n');
            return { handled: false, retry: true };
          }

          // Other error - show output and throw
          console.log(output);
          throw new Error(
            `nx release failed with exit code ${result.exitCode}`
          );
        }

        // Success - show output
        console.log(result.all);
        return { handled: true, success: true };
      } catch (err) {
        // Re-throw if it's our error
        if (err instanceof Error && err.message.includes('nx release failed')) {
          throw err;
        }
        // Otherwise wrap it
        throw new Error(`Failed to run nx release: ${err}`);
      }
    };

    // Try running nx release
    const result = await runNxRelease();

    // If it needs retry with --first-release, do it
    if (!result.handled && result.retry) {
      const retryResult = await runNxRelease(true);
      if (!retryResult.success) {
        return { success: false };
      }
    } else if (!result.success) {
      return { success: false };
    }

    // Check if nx created a new commit (version bump)
    const afterSha = await getCurrentCommitSha();

    if (beforeSha === afterSha) {
      // No version bump, but check if there are other commits to push
      const hasUnpushed = await hasUnpushedCommits(baseBranch);

      if (!hasUnpushed) {
        console.log('\n❌ No version changes were made');

        // Check if there are commits on main that aren't on production
        const { stdout: commitsBehind } = await execa('git', [
          'rev-list',
          '--count',
          `origin/${targetBranch}..origin/${baseBranch}`,
        ]);
        const commitsToSync = parseInt(commitsBehind.trim(), 10);

        if (commitsToSync > 0) {
          console.log(
            `\n📋 Found ${commitsToSync} commit(s) on ${baseBranch} not yet on ${targetBranch}`
          );
          console.log('📝 Updating PR to sync these commits...');

          // Update or create PR to sync commits
          if (existingPR) {
            const repoName = await getRepoName();
            console.log(
              `✅ PR already exists and will include these commits: https://github.com/${repoName}/pull/${existingPR}`
            );

            // Run pr-update to regenerate AI summary and update PR description
            console.log('\n🔄 Running pr-update to refresh PR description...');
            await execa('npx', ['nx', 'pr-update'], { stdio: 'inherit' });

            // Re-enable auto-merge in case it was disabled or PR was reopened
            if (autoMerge) {
              await enableAutoMerge(existingPR, targetBranch);
            }

            await openPRInBrowser(existingPR);
          } else {
            const prTitle = `Sync: ${commitsToSync} commit(s) from ${baseBranch}`;
            const prBody = `## 📦 Sync Commits\n\nThis PR syncs ${commitsToSync} commit(s) from \`${baseBranch}\` to \`${targetBranch}\`.\n\n**No package version changes** - these are infrastructure, tooling, or documentation updates.`;
            const prUrl = await createPR(prTitle, prBody, targetBranch, {
              draft: false,
              headBranch: baseBranch,
            });
            console.log(`✅ PR created: ${prUrl}`);

            const prNumber = prUrl.split('/').pop() || '';
            if (autoMerge) {
              await enableAutoMerge(prNumber, targetBranch);
            }
            await openPRInBrowser();
          }
        } else {
          // No commits to sync
          if (!existingPR) {
            console.log(
              '📝 Creating draft PR to keep release workflow ready...'
            );
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

        // Use custom description file if provided, otherwise use default
        let prBody: string;
        if (prDescriptionFile) {
          console.log(
            `📄 Using custom PR description from: ${prDescriptionFile}`
          );
          try {
            prBody = await readFile(prDescriptionFile, 'utf-8');
          } catch (error) {
            console.warn(`⚠️  Failed to read ${prDescriptionFile}:`, error);
            console.log('   Falling back to default PR body');
            prBody = buildPRBody('', []);
          }
        } else {
          prBody = buildPRBody('', []);
        }

        const prUrl = await createPR(prTitle, prBody, targetBranch, {
          draft: false,
          headBranch: baseBranch,
        });
        console.log(`✅ PR created: ${prUrl}`);

        const prNumber = prUrl.split('/').pop() || '';

        if (autoMerge) {
          await enableAutoMerge(prNumber, targetBranch);
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

        // Run pr-update to regenerate AI summary and update PR description
        // Skip if using custom PR description file
        if (!prDescriptionFile) {
          console.log('\n🔄 Running pr-update to refresh PR description...');
          await execa('npx', ['nx', 'pr-update'], { stdio: 'inherit' });
        } else {
          console.log('ℹ️  Using custom PR description - skipping pr-update');
          // Update PR with custom description
          const customPrBody = await readFile(prDescriptionFile, 'utf-8');
          await updatePR(existingPR, customPrBody);
        }

        // Re-enable auto-merge in case it was disabled or PR was reopened
        if (autoMerge) {
          await enableAutoMerge(existingPR, targetBranch);
        }

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
    await extractChangelog(changelogPatterns);

    // Build PR body - use custom file if provided, otherwise use default
    let prBody: string;
    if (prDescriptionFile) {
      console.log(`📄 Using custom PR description from: ${prDescriptionFile}`);
      try {
        prBody = await readFile(prDescriptionFile, 'utf-8');
      } catch (error) {
        console.warn(`⚠️  Failed to read ${prDescriptionFile}:`, error);
        console.log('   Falling back to default PR body');
        prBody = buildPRBody('', releases);
      }
    } else {
      prBody = buildPRBody('', releases);
    }

    let prNumber: string;

    // Create or update PR with basic info (no AI yet)
    if (!existingPR) {
      // Create new PR with generic title - pr-update will set the AI-generated title
      console.log('\n📝 Creating PR to production...');
      const genericTitle = 'Release';
      const prUrl = await createPR(genericTitle, prBody, targetBranch, {
        headBranch: baseBranch,
      });
      console.log(`✅ PR created: ${prUrl}`);
      prNumber = prUrl.split('/').pop() || '';

      if (autoMerge) {
        await enableAutoMerge(prNumber, targetBranch);
      }
    } else {
      // Update existing PR - keep existing title, pr-update will update if needed
      prNumber = existingPR;
      await markPRReady(prNumber);
      // Don't update title for existing PR - pr-update will handle it
      await updatePR(prNumber, prBody);

      const repoName = await getRepoName();
      console.log(
        `✅ PR updated: https://github.com/${repoName}/pull/${prNumber}`
      );
    }

    // Now run pr-update to add AI-generated content
    // Skip if using custom PR description file (already has complete content)
    if (finalAiCommand && !prDescriptionFile) {
      console.log('\n🔄 Running pr-update to add AI-generated content...');
      try {
        await execa('npx', ['nx', 'pr-update'], { stdio: 'inherit' });
      } catch (error) {
        console.warn('⚠️  Failed to generate AI content:', error);
        console.log('   PR created/updated without AI enhancements');
      }
    } else if (prDescriptionFile) {
      console.log('ℹ️  Using custom PR description - skipping pr-update');
    }

    await openPRInBrowser(prNumber);
    console.log('\n🎉 Release complete!');
    return { success: true };
  } catch (error) {
    console.error('\n❌ Release failed:', error);
    if (error instanceof Error && 'stderr' in error) {
      console.error((error as { stderr?: string }).stderr);
    }
    return { success: false };
  }
}
