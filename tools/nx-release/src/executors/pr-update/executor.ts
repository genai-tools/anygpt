import type { ExecutorContext } from '@nx/devkit';
import type { PrUpdateExecutorSchema } from './schema.js';
import { getCurrentBranch } from '../../lib/git-operations.js';
import { extractChangelog } from '../../lib/changelog.js';
import { generateAISummary } from '../../lib/ai-summary.js';
import {
  getExistingPR,
  buildPRBody,
  updatePR,
  getPRDiff,
  getRepoName,
  addChangelogComment,
  markPRReady,
} from '../../lib/pr-creation.js';

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
    model,
    maxLinesPerFile = 150,
    diffPaths = ['packages/*/src/**', 'packages/connectors/*/src/**'],
  } = options;

  // Override model in aiCommand if model parameter is provided
  const finalAiCommand =
    model && aiCommand
      ? aiCommand.replace(/--model\s+\S+/, `--model ${model}`)
      : aiCommand;

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

    // Extract changelog and releases from CHANGELOG files
    // This gives us the actual packages that have new versions to publish
    console.log('📋 Extracting changelog...');
    const { changelog, releases } = await extractChangelog(changelogPatterns);

    console.log(`📦 Found ${releases.length} package(s) with new versions`);

    // Convert draft PR to ready (if it was a draft placeholder)
    await markPRReady(existingPR);

    // Update PR first (without AI summary)
    console.log(`\n📝 Updating PR #${existingPR}...`);
    const prBodyWithoutAI = buildPRBody('', releases);
    await updatePR(existingPR, prBodyWithoutAI);

    // Generate AI summary from actual PR diff if enabled
    if (finalAiCommand) {
      console.log(
        `\n🤖 Generating AI summary from PR diff${
          model ? ` with model: ${model}` : ''
        }...`
      );
      try {
        const prDiff = await getPRDiff(existingPR);
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
        await updatePR(existingPR, prBodyWithAI);
        console.log('✅ PR description updated with AI summary');
      } catch (error) {
        console.warn('⚠️  Failed to generate AI summary:', error);
        console.log('   PR updated without AI summary');
      }
    }

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
