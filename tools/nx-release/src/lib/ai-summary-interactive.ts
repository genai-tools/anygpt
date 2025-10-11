import { execa } from 'execa';
import ora from 'ora';
import type { PackageRelease } from './changelog.js';

interface FileStats {
  path: string;
  additions: number;
  deletions: number;
  changes: number;
}

interface FileRequest {
  path: string;
  maxLines?: number;
}

/**
 * Parse git diff to extract file statistics
 */
function extractFileStats(diff: string): FileStats[] {
  const stats: FileStats[] = [];
  const lines = diff.split('\n');

  let currentFile = '';
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    // New file header
    if (line.startsWith('diff --git')) {
      // Save previous file if exists
      if (currentFile) {
        stats.push({
          path: currentFile,
          additions,
          deletions,
          changes: additions + deletions,
        });
      }

      // Extract file path (format: diff --git a/path b/path)
      const match = line.match(/diff --git a\/(.+?)\s+b\//);
      currentFile = match ? match[1] : '';
      additions = 0;
      deletions = 0;
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  // Save last file
  if (currentFile) {
    stats.push({
      path: currentFile,
      additions,
      deletions,
      changes: additions + deletions,
    });
  }

  return stats.sort((a, b) => b.changes - a.changes);
}

/**
 * Extract specific file diff with optional line limit
 */
function extractFileDiff(
  fullDiff: string,
  filePath: string,
  maxLines?: number
): string {
  const lines = fullDiff.split('\n');
  const result: string[] = [];
  let inTargetFile = false;
  let fileLineCount = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      // Check if this is our target file
      // Format: diff --git a/path/file.ts b/path/file.ts
      const match = line.match(/diff --git a\/(.+?)\s+b\//);
      const currentPath = match ? match[1] : '';

      if (currentPath === filePath) {
        inTargetFile = true;
        fileLineCount = 0;
        result.push(line);
      } else if (inTargetFile) {
        // We've moved to a different file, stop
        break;
      }
    } else if (inTargetFile) {
      if (maxLines && fileLineCount >= maxLines) {
        result.push(`... (truncated at ${maxLines} lines)`);
        break;
      }
      result.push(line);
      fileLineCount++;
    }
  }

  return result.join('\n');
}

/**
 * Interactive AI summary generation with context selection
 */
export async function generateInteractiveAISummary(
  changelog: string,
  releases: PackageRelease[],
  diff: string,
  command: string,
  options: {
    maxLinesPerFile?: number;
    verbose?: boolean;
  } = {}
): Promise<string> {
  const { maxLinesPerFile = 200, verbose = false } = options;
  try {
    console.log('🤖 Starting interactive AI summary generation...');

    // Step 1: Extract file statistics
    const fileStats = extractFileStats(diff);
    const totalFiles = fileStats.length;
    const totalChanges = fileStats.reduce((sum, f) => sum + f.changes, 0);

    console.log(
      `   📊 Analyzed ${totalFiles} files with ${totalChanges} total changes`
    );

    // Step 2: Ask AI to select files it wants to see
    const statsPrompt = `You are analyzing a monorepo release to generate a package-centric summary. Your goal is to explain what's being released in each package.

PACKAGES BEING RELEASED:
${releases.map((r) => `- ${r.name}@${r.version}`).join('\n')}

CHANGED FILES (sorted by number of changes):
${fileStats
  .slice(0, 50) // Limit to top 50 files
  .map(
    (f, i) =>
      `${i + 1}. ${f.path} (+${f.additions}/-${f.deletions}, ${
        f.changes
      } changes)`
  )
  .join('\n')}

CHANGELOG SUMMARY:
${changelog.substring(0, 2000)}${changelog.length > 2000 ? '...' : ''}

Your task: Select files that will help you explain the main changes in EACH package being released.
Focus on files that show:
- New features or capabilities added to each package
- Major bug fixes or improvements per package
- Breaking changes or API updates per package
- New packages being introduced

Based on this information, which files would you like to examine in detail?

Respond with a JSON array of file requests. Each request should have:
- "path": the exact file path from the list above
- "maxLines": optional, max lines of diff to see (default: ${maxLinesPerFile}, max: ${
      maxLinesPerFile * 2
    })

Focus on:
1. Core implementation files (not tests, configs, or generated files)
2. Files with significant changes that indicate new features or important fixes
3. A balanced selection (aim for 5-10 files max to stay within token limits)
4. Limit total lines across all files to ~${
      maxLinesPerFile * 10
    } lines to avoid token limits

Example response:
[
  {"path": "packages/cli/src/commands/chat.ts", "maxLines": ${Math.min(
    300,
    maxLinesPerFile * 2
  )}},
  {"path": "packages/router/src/tag-registry.ts", "maxLines": ${maxLinesPerFile}},
  {"path": "packages/config/src/loader.ts"}
]

Respond with ONLY the JSON array, no other text.`;

    const spinner = ora('Asking AI to select relevant files...').start();

    if (verbose) {
      console.log('\n[VERBOSE] AI Selection Prompt:');
      console.log('---');
      console.log(statsPrompt.substring(0, 500) + '...');
      console.log('---');
    }

    let fileRequests: FileRequest[];
    try {
      const [cmd, ...args] = command.split(' ');
      if (verbose) {
        console.log(`[VERBOSE] Running command: ${cmd} ${args.join(' ')}`);
      }

      const { stdout: selectionResponse } = await execa(cmd, args, {
        input: statsPrompt,
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf8',
      });

      spinner.succeed('AI file selection complete');

      if (verbose) {
        console.log('[VERBOSE] AI Selection Response:');
        console.log(selectionResponse);
      }

      // Parse AI's file selection
      // Extract JSON from response (AI might wrap it in markdown)
      const jsonMatch = selectionResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      fileRequests = JSON.parse(jsonMatch[0]);
      console.log(`   ✅ AI selected ${fileRequests.length} files to examine`);
    } catch (error) {
      spinner.fail('AI file selection failed, using fallback');
      console.warn(
        `   ⚠️  Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // Fallback: select top 5 files by changes, excluding tests/configs
      fileRequests = fileStats
        .filter(
          (f) =>
            !f.path.includes('.test.') &&
            !f.path.includes('.spec.') &&
            !f.path.includes('package.json') &&
            !f.path.includes('package-lock.json')
        )
        .slice(0, 5)
        .map((f) => ({ path: f.path, maxLines: maxLinesPerFile }));
      console.log(
        `   📋 Fallback: selected ${fileRequests.length} files (max ${maxLinesPerFile} lines each)`
      );
    }

    // Step 3: Extract requested file diffs
    console.log('   📄 Step 2: Extracting requested file diffs...');
    const extractedFiles: string[] = [];
    const skippedFiles: string[] = [];

    const requestedDiffs = fileRequests
      .map((req) => {
        const fileDiff = extractFileDiff(diff, req.path, req.maxLines);
        if (!fileDiff) {
          skippedFiles.push(req.path);
          return null;
        }
        extractedFiles.push(req.path);
        return `\n=== ${req.path} ===\n${fileDiff}`;
      })
      .filter(Boolean)
      .join('\n\n');

    const diffSize = requestedDiffs.length;
    console.log(
      `   📊 Extracted ${extractedFiles.length}/${
        fileRequests.length
      } files (${diffSize.toLocaleString()} characters)`
    );
    if (skippedFiles.length > 0) {
      console.log(
        `   ℹ️  Skipped ${
          skippedFiles.length
        } file(s) not found in diff (likely new files): ${skippedFiles
          .slice(0, 3)
          .join(', ')}${skippedFiles.length > 3 ? '...' : ''}`
      );
    }

    // Step 4: Generate summary with selected context
    const summarySpinner = ora(
      'Generating summary with selected context...'
    ).start();

    if (verbose) {
      console.log('\n[VERBOSE] Summary Prompt (first 500 chars):');
      console.log('---');
    }

    try {
      const summaryPrompt = `You are writing a release summary for a monorepo. Organize your summary BY PACKAGE to explain what's being released.

PACKAGES BEING RELEASED:
${releases.map((r) => `- ${r.name}@${r.version}`).join('\n')}

SELECTED CODE CHANGES:
${requestedDiffs}

FULL CHANGELOG:
${changelog}

INSTRUCTIONS:
- Structure your summary by package (e.g., "**@anygpt/cli@1.1.0**")
- For EACH package, list the main changes/features (2-4 bullet points per package)
- Focus on what users/developers will care about: new features, breaking changes, important fixes
- Use this format:
  **@package/name@version**
  - Main feature or change
  - Another important change
  
- Ignore: version bumps, dependency updates, internal refactoring (unless user-facing)
- Be concise but informative
- DO NOT include "TITLE:" or other headers

Respond with ONLY the formatted bullet points organized by package.`;

      if (verbose) {
        console.log(summaryPrompt.substring(0, 500) + '...');
        console.log('---');
        console.log(
          `[VERBOSE] Prompt size: ${summaryPrompt.length} characters`
        );
      }

      const [cmd, ...args] = command.split(' ');
      const { stdout: summary } = await execa(cmd, args, {
        input: summaryPrompt,
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf8',
      });

      summarySpinner.succeed('Summary generation complete');

      if (verbose) {
        console.log('[VERBOSE] AI Summary Response:');
        console.log(summary);
      }

      const cleanedSummary = summary
        .trim()
        .replace(/^```\s*\n?/gm, '')
        .replace(/\n?```\s*$/gm, '')
        .replace(/^TITLE:\s*.+?$/im, '')
        .replace(/^SUMMARY:\s*$/im, '')
        .trim();

      console.log(`   ✅ Generated summary (${cleanedSummary.length} chars)`);

      return cleanedSummary;
    } catch (error) {
      summarySpinner.fail('Summary generation failed');
      console.error(
        `   ⚠️  Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return '';
    }
  } catch (error) {
    console.error('⚠️  Interactive AI summary generation failed:', error);
    return '';
  }
}
