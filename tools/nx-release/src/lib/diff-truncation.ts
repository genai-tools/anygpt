/**
 * Smart diff truncation that preserves context while limiting size
 * Truncates per-file to prevent large files from dominating the diff
 */

export interface TruncationStats {
  totalFiles: number;
  truncatedFiles: number;
  originalLines: number;
  truncatedLines: number;
}

/**
 * Truncate a git diff intelligently, limiting lines per file
 * 
 * @param diff - The full git diff output
 * @param maxLinesPerFile - Maximum lines to keep per file (default: 100)
 * @returns Truncated diff with stats
 */
export function truncateDiff(
  diff: string,
  maxLinesPerFile = 100
): { diff: string; stats: TruncationStats } {
  if (!diff || diff.trim().length === 0) {
    return {
      diff: '',
      stats: {
        totalFiles: 0,
        truncatedFiles: 0,
        originalLines: 0,
        truncatedLines: 0,
      },
    };
  }

  const lines = diff.split('\n');
  const result: string[] = [];
  const stats: TruncationStats = {
    totalFiles: 0,
    truncatedFiles: 0,
    originalLines: lines.length,
    truncatedLines: 0,
  };

  let currentFileHeader: string[] = [];
  let currentFileLines: string[] = [];
  let inFileContent = false;

  const flushCurrentFile = () => {
    if (currentFileHeader.length === 0) return;

    stats.totalFiles++;
    const contentLines = currentFileLines.length;

    if (contentLines > maxLinesPerFile) {
      // Truncate this file
      stats.truncatedFiles++;
      const keepLines = Math.floor(maxLinesPerFile * 0.8); // Keep 80% of limit
      const contextLines = maxLinesPerFile - keepLines;

      // Keep first portion (beginning of changes)
      const firstPart = currentFileLines.slice(0, keepLines);
      
      // Keep last portion (end of changes) for context
      const lastPart = currentFileLines.slice(-contextLines);

      result.push(...currentFileHeader);
      result.push(...firstPart);
      result.push('');
      result.push(
        `... [truncated ${contentLines - maxLinesPerFile} lines] ...`
      );
      result.push('');
      result.push(...lastPart);
    } else {
      // Keep entire file
      result.push(...currentFileHeader);
      result.push(...currentFileLines);
    }

    // Reset for next file
    currentFileHeader = [];
    currentFileLines = [];
    inFileContent = false;
  };

  for (const line of lines) {
    // Detect file header (diff --git a/... b/...)
    if (line.startsWith('diff --git ')) {
      // Flush previous file
      flushCurrentFile();

      // Start new file
      currentFileHeader = [line];
      inFileContent = false;
    }
    // File metadata lines (index, ---, +++, new file, deleted file, etc.)
    else if (
      !inFileContent &&
      (line.startsWith('index ') ||
        line.startsWith('---') ||
        line.startsWith('+++') ||
        line.startsWith('new file') ||
        line.startsWith('deleted file') ||
        line.startsWith('similarity index') ||
        line.startsWith('rename from') ||
        line.startsWith('rename to') ||
        line.startsWith('Binary files'))
    ) {
      currentFileHeader.push(line);
    }
    // Hunk header (@@ ... @@)
    else if (line.startsWith('@@')) {
      inFileContent = true;
      currentFileLines.push(line);
    }
    // Content lines (if we're in a file)
    else if (currentFileHeader.length > 0) {
      currentFileLines.push(line);
    }
    // Lines before any file (global diff header)
    else {
      result.push(line);
    }
  }

  // Flush last file
  flushCurrentFile();

  stats.truncatedLines = result.length;

  return {
    diff: result.join('\n'),
    stats,
  };
}

/**
 * Format truncation stats for logging
 */
export function formatTruncationStats(stats: TruncationStats): string {
  if (stats.totalFiles === 0) {
    return 'No files in diff';
  }

  const reduction =
    stats.originalLines > 0
      ? Math.round(
          ((stats.originalLines - stats.truncatedLines) / stats.originalLines) *
            100
        )
      : 0;

  const parts = [
    `${stats.totalFiles} file${stats.totalFiles !== 1 ? 's' : ''}`,
  ];

  if (stats.truncatedFiles > 0) {
    parts.push(
      `${stats.truncatedFiles} truncated`,
      `${stats.originalLines} → ${stats.truncatedLines} lines (-${reduction}%)`
    );
  } else {
    parts.push(`${stats.originalLines} lines (no truncation needed)`);
  }

  return parts.join(', ');
}
