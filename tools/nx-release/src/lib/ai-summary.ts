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

    const prompt = `Analyze the code changes and provide a bullet-point summary.

RULES:
- DO NOT include any "TITLE:" or headers
- Start directly with bullet points using "-" or "*"
- Focus on functional changes, new features, and bug fixes
- Ignore version bumps and dependency updates${newPackagesNote}

Code Changes:
${truncatedDiff}

Changelog:
${changelog}

Respond with ONLY bullet points describing the changes. Example format:
- Added tag-based model resolution system
- Enhanced CLI with new commands
- Fixed bug in router configuration`;

    // Execute the command with prompt via stdin
    const [cmd, ...args] = command.split(' ');

    const { stdout } = await execa(cmd, args, {
      input: prompt,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let summary = stdout.trim();

    console.log(`🔍 Raw AI output (${summary.length} chars):`);
    console.log(summary);
    console.log('--- END RAW OUTPUT ---');

    // Strip markdown code blocks if present
    summary = summary.replace(/^```\s*\n?/gm, '').replace(/\n?```\s*$/gm, '');

    // Strip out TITLE: and SUMMARY: prefixes if AI included them
    // (AI sometimes ignores instructions and uses old format)
    summary = summary.replace(/^TITLE:\s*.+?$/im, '');
    summary = summary.replace(/^SUMMARY:\s*$/im, '');
    summary = summary.trim();

    console.log(
      `✅ Cleaned summary (${summary.length} chars): ${summary.substring(
        0,
        200
      )}...`
    );

    return summary;
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
