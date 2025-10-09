import { execa } from 'execa';
import type { PackageRelease } from './changelog.js';
import { truncateDiff, formatTruncationStats } from './diff-truncation.js';

export interface AIGeneratedContent {
  title: string;
  summary: string;
}

export async function generateAISummary(
  changelog: string,
  releases: PackageRelease[],
  diff: string,
  command: string,
  options: {
    maxLinesPerFile?: number;
  } = {}
): Promise<AIGeneratedContent> {
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

    const prompt = `Generate a PR title and summary for this release.

IMPORTANT:
- Focus ONLY on actual functional changes, new features, and bug fixes
- **ESPECIALLY highlight any new packages being added** - these are major features
- Ignore version bumps, dependency updates, and package.json changes
- Be concise but comprehensive - adjust length based on complexity${newPackagesNote}

Code Changes (diff):
${truncatedDiff}

Changelog:
${changelog}

Provide your response in this EXACT format:

TITLE: <concise PR title, max 80 chars, describing the main change>

SUMMARY:
<bullet points of what actually changed in the code>

Example:
TITLE: Add model tag resolution system

SUMMARY:
- Implemented tag-based model selection (@reasoning, @fast)
- Enhanced CLI with tag resolution support
- Added comprehensive test coverage`;

    // Execute the command with prompt via stdin
    // The command should be fully configured in nx.json (e.g., "npx anygpt chat --stdin --model fast --max-tokens 1000")
    const [cmd, ...args] = command.split(' ');

    const { stdout } = await execa(cmd, args, {
      input: prompt,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const output = stdout.trim();

    // Parse the structured output
    const titleMatch = output.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const summaryMatch = output.match(/SUMMARY:\s*([\s\S]+?)$/i);

    if (!titleMatch || !summaryMatch) {
      // Fallback: use first line as title, rest as summary
      const lines = output.split('\n');
      return {
        title: lines[0].trim(),
        summary: lines.slice(1).join('\n').trim() || output,
      };
    }

    return {
      title: titleMatch[1].trim(),
      summary: summaryMatch[1].trim(),
    };
  } catch (error) {
    console.log('⚠️  AI generation failed, using fallback');
    console.error(error);
    // Return empty strings to signal failure
    return {
      title: '',
      summary: '',
    };
  }
}
