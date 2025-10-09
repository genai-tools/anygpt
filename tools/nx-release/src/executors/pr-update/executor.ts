import type { ExecutorContext } from '@nx/devkit';
import type { PrUpdateExecutorSchema } from './schema.js';
import { getCurrentBranch } from '../../lib/git-operations.js';
import {
  extractChangelog,
  buildPRTitle,
  type PackageRelease,
} from '../../lib/changelog.js';
import { generateAISummary } from '../../lib/ai-summary.js';
import { execa } from 'execa';
import {
  getExistingPR,
  buildPRBody,
  updatePR,
  getPRDiff,
  getRepoName,
  addUpdateComment,
  markPRReady,
} from '../../lib/pr-creation.js';

async function getPackageVersionDiff(
  baseBranch: string,
  targetBranch: string
): Promise<PackageRelease[]> {
  const releases: PackageRelease[] = [];

  // Use safe glob patterns to find package.json files
  const patterns = [
    'packages/*/package.json',
    'packages/connectors/*/package.json',
  ];

  for (const pattern of patterns) {
    try {
      const { stdout } = await execa('bash', [
        '-c',
        `ls ${pattern} 2>/dev/null || true`,
      ]);
      const files = stdout.split('\n').filter(Boolean);

      for (const file of files) {
        try {
          // Get version from main branch
          const { stdout: mainContent } = await execa('git', [
            'show',
            `${baseBranch}:${file}`,
          ]);
          const mainPkg = JSON.parse(mainContent);

          // Get version from target branch
          let targetVersion: string | null = null;
          try {
            const { stdout: targetContent } = await execa('git', [
              'show',
              `origin/${targetBranch}:${file}`,
            ]);
            const targetPkg = JSON.parse(targetContent);
            targetVersion = targetPkg.version;
          } catch {
            // File doesn't exist in target branch (new package)
            targetVersion = null;
          }

          // If versions differ, this package has changes
          if (mainPkg.version !== targetVersion) {
            releases.push({
              name: mainPkg.name,
              version: mainPkg.version,
            });
          }
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // Pattern didn't match any files
    }
  }

  return releases;
}

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

    // Get packages with version differences between main and production
    console.log('📦 Comparing package versions between branches...');
    const releases = await getPackageVersionDiff(baseBranch, targetBranch);
    console.log(`📦 Found ${releases.length} package(s) with new versions`);

    // Create a map of package names to versions for filtering changelog
    const targetVersions = new Map(releases.map((r) => [r.name, r.version]));

    // Extract changelog (only for packages being released)
    console.log('📋 Extracting changelog...');
    const { changelog } = await extractChangelog(
      changelogPatterns,
      targetVersions
    );

    // Build PR title from releases
    const prTitle = buildPRTitle(releases);

    // Convert draft PR to ready (if it was a draft placeholder)
    await markPRReady(existingPR);

    // Update PR with new title and body (without AI summary initially)
    console.log(`\n📝 Updating PR #${existingPR}...`);
    const prBodyWithoutAI = buildPRBody('', releases);
    await updatePR(existingPR, prBodyWithoutAI, prTitle);

    // Generate AI summary from actual PR diff if enabled
    if (finalAiCommand) {
      console.log(
        `\n🤖 Generating AI summary from PR diff${
          model ? ` with model: ${model}` : ''
        }...`
      );
      try {
        const prDiff = await getPRDiff(existingPR);

        // Step 1: Generate summary
        const aiSummary = await generateAISummary(
          changelog,
          releases,
          prDiff,
          finalAiCommand,
          {
            maxLinesPerFile,
          }
        );

        // Step 2: Update PR with summary
        const prBodyWithAI = buildPRBody(aiSummary, releases);
        await updatePR(existingPR, prBodyWithAI);
        console.log('✅ PR description updated with AI summary');

        // Step 3: Generate title from summary and update
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
            await updatePR(existingPR, prBodyWithAI, aiTitle);
            console.log(`✅ PR title updated: "${aiTitle}"`);
          }
        }
      } catch (error) {
        console.warn('⚠️  Failed to generate AI content:', error);
        console.log('   PR updated without AI enhancements');
      }
    }

    // Add tracking comment
    console.log('📋 Adding update tracking comment...');
    await addUpdateComment(existingPR, 'pr-update');

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
