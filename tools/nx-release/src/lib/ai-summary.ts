import { execa } from 'execa';
import type { PackageRelease } from './changelog.js';
import { truncateDiff, formatTruncationStats } from './diff-truncation.js';

/**
 * Generate AI summary from diff and changelog
 */
export async function generateAISummary(
  changelog: string,
  releases: PackageRelease[],
  diff: string,
  command: string,
  options: {
    maxLinesPerFile?: number;
  } = {}
): Promise<string> {
  const { maxLinesPerFile = 150 } = options;
  try {
    // Truncate diff per-file to prevent large files from dominating
    const { diff: truncatedDiff, stats } = truncateDiff(diff, maxLinesPerFile);

    if (stats.truncatedFiles > 0) {
      console.log(`   📊 Diff stats: ${formatTruncationStats(stats)}`);
    }

    // Identify new packages (first release = v0.1.0 or v0.2.0 with lots of new files)
    const newPackages = releases
      .filter((r) => r.version.match(/^0\.[12]\.0$/))
      .map((r) => r.name);

    const newPackagesNote =
      newPackages.length > 0
        ? `\n\nNEW PACKAGES (first release): ${newPackages.join(
            ', '
          )}\n- These are brand new packages being added to the monorepo\n- Treat these as major new features, not just bug fixes`
        : '';

    const prompt = `Generate a focused summary of the actual code changes in this release.

IMPORTANT:
- Focus ONLY on actual functional changes, new features, and bug fixes
- **ESPECIALLY highlight any new packages being added** - these are major features
- Ignore version bumps, dependency updates, and package.json changes
- Use bullet points for clarity
- Be concise but comprehensive - adjust length based on complexity${newPackagesNote}

Code Changes (diff):
${truncatedDiff}

Changelog:
${changelog}

Provide a clear summary of what actually changed in the code. Keep it brief for simple changes, more detailed for complex ones.`;

    // Execute the command with prompt via stdin
    // The command should be fully configured in nx.json (e.g., "npx anygpt chat --stdin --model fast --max-tokens 1000")
    const [cmd, ...args] = command.split(' ');

    const { stdout } = await execa(cmd, args, {
      input: prompt,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return stdout.trim();
  } catch (error) {
    console.log('⚠️  AI summary generation failed');
    console.error(error);
    return '';
  }
}

/**
 * Generate a concise PR title from the summary and changelog
 */
export async function generateAITitle(
  summary: string,
  changelog: string,
  releases: PackageRelease[],
  command: string
): Promise<string> {
  try {
    const releasesList = releases
      .map((r) => `${r.name}@${r.version}`)
      .join(', ');

    const prompt = `Generate a concise PR title (max 80 characters) for this release.

Packages being released:
${releasesList}

Summary of changes:
${summary}

Changelog:
${changelog}

Provide ONLY the title text, nothing else. Make it descriptive but concise.`;

    const [cmd, ...args] = command.split(' ');

    const { stdout } = await execa(cmd, args, {
      input: prompt,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return stdout.trim();
  } catch (error) {
    console.log('⚠️  AI title generation failed');
    console.error(error);
    return '';
  }
}
