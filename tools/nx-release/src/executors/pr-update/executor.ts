import type { ExecutorContext } from '@nx/devkit';
import type { PrUpdateExecutorSchema } from './schema.js';
import {
  getCurrentBranch,
  getCurrentCommitSha,
  getDiff,
} from '../../lib/git-operations.js';
import {
  extractChangelog,
  extractReleasesFromTags,
} from '../../lib/changelog.js';
import { generateAISummary } from '../../lib/ai-summary.js';
import {
  getExistingPR,
  buildPRBody,
  updatePR,
  getPRBaseCommit,
  getRepoName,
  addChangelogComment,
} from '../../lib/pr-creation.js';
import { execa } from 'execa';

export default async function runExecutor(
  options: PrUpdateExecutorSchema,
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
    diffPaths = ['packages/*/src/**', 'packages/connectors/*/src/**'],
  } = options;

  try {
    console.log('🔄 Updating release PR...\n');

    // Check branch
    const branch = await getCurrentBranch();
    if (branch !== baseBranch) {
      console.error(
        `❌ Error: Must be on ${baseBranch} branch (currently on ${branch})`
      );
      return { success: false };
    }

    // Check for existing PR
    const existingPR = await getExistingPR(baseBranch, targetBranch);
    if (!existingPR) {
      console.error(
        `❌ Error: No open PR found from ${baseBranch} to ${targetBranch}`
      );
      return { success: false };
    }

    console.log(`📋 Found PR #${existingPR}`);

    // Get current commit SHA
    const currentSha = await getCurrentCommitSha();

    // Get diff from target branch HEAD
    let diffForAI = '';
    if (aiCommand) {
      console.log('📊 Getting diff for AI analysis...');
      const prBaseCommit = await getPRBaseCommit(existingPR, targetBranch);
      console.log(
        `   Using ${targetBranch} branch HEAD: ${prBaseCommit.substring(0, 7)}`
      );
      diffForAI = await getDiff(prBaseCommit, currentSha, diffPaths);
    }

    // Get all tags that exist in main but not in target branch
    const { stdout: mainTags } = await execa('git', [
      'tag',
      '--merged',
      baseBranch,
    ]);
    const { stdout: targetTags } = await execa('git', [
      'tag',
      '--merged',
      `origin/${targetBranch}`,
    ]);

    const mainTagSet = new Set(mainTags.split('\n').filter(Boolean));
    const targetTagSet = new Set(targetTags.split('\n').filter(Boolean));
    const newTags = Array.from(mainTagSet).filter((tag) => !targetTagSet.has(tag));

    console.log(`📦 Found ${newTags.length} new release(s)`);

    // Extract package releases from new tags
    const releases = extractReleasesFromTags(newTags);

    // Extract changelog
    console.log('📋 Extracting changelog...');
    const { changelog } = await extractChangelog(changelogPatterns);

    // Generate AI summary if enabled
    let aiSummary = '';
    if (aiCommand && diffForAI) {
      console.log('🤖 Generating AI summary...');
      aiSummary = await generateAISummary(
        changelog,
        releases,
        diffForAI,
        aiCommand,
        {
          maxLinesPerFile,
        }
      );
    }

    // Create PR body
    const prBody = buildPRBody(aiSummary, releases);

    // Update PR
    console.log(`\n📝 Updating PR #${existingPR}...`);
    await updatePR(existingPR, prBody);

    // Update changelog comment
    console.log('📋 Adding changelog comment...');
    await addChangelogComment(existingPR, changelog);

    const repoName = await getRepoName();
    console.log(
      `✅ PR updated: https://github.com/${repoName}/pull/${existingPR}`
    );

    console.log('\n🎉 PR update complete!');

    return { success: true };
  } catch (error) {
    console.error('\n❌ PR update failed:', error);
    if (error instanceof Error && 'stderr' in error) {
      console.error((error as { stderr?: string }).stderr);
    }
    return { success: false };
  }
}
