/**
 * Simple glob pattern matcher for model filtering
 * Supports: *, ?, [abc], {a,b,c}, ! for negation, and regex patterns
 * 
 * Regex patterns should be wrapped in /.../ or /.../<flags>
 * Examples:
 *   - /gpt-[45]/ - matches gpt-4 or gpt-5
 *   - /^claude.*sonnet$/i - case-insensitive match
 */

/**
 * Check if a pattern is a regex pattern (wrapped in /.../)
 */
function isRegexPattern(pattern: string): boolean {
  return pattern.startsWith('/') && pattern.lastIndexOf('/') > 0;
}

/**
 * Parse a regex pattern string into a RegExp object
 */
function parseRegexPattern(pattern: string): RegExp {
  const lastSlash = pattern.lastIndexOf('/');
  const regexBody = pattern.substring(1, lastSlash);
  const flags = pattern.substring(lastSlash + 1);
  return new RegExp(regexBody, flags || 'i'); // default to case-insensitive
}

/**
 * Convert a glob pattern to a regular expression
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except glob wildcards
  const regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // Handle brace expansion: {a,b,c} -> (a|b|c)
    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.replace(/,/g, '|')})`)
    // Handle character classes: [abc] stays as [abc]
    .replace(/\\\[([^\]]+)\\\]/g, '[$1]')
    // Handle wildcards
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regex}$`, 'i'); // case-insensitive
}

/**
 * Check if a model ID matches any of the glob/regex patterns
 * Supports negation patterns starting with !, regex patterns wrapped in /.../, and RegExp objects
 * 
 * @param modelId - The model ID to test
 * @param patterns - Array of glob strings, regex strings, or RegExp objects (can include negation patterns with !)
 * @returns true if the model matches (considering both positive and negative patterns)
 */
export function matchesGlobPatterns(modelId: string, patterns: (string | RegExp)[]): boolean {
  if (!patterns || patterns.length === 0) {
    return true; // No patterns = allow all
  }

  const positivePatterns: RegExp[] = [];
  const negativePatterns: RegExp[] = [];

  // Separate positive and negative patterns, handle glob, regex strings, and RegExp objects
  for (const pattern of patterns) {
    // Handle RegExp objects directly
    if (pattern instanceof RegExp) {
      positivePatterns.push(pattern);
      continue;
    }
    
    // Handle string patterns
    if (pattern.startsWith('!')) {
      const actualPattern = pattern.substring(1);
      if (isRegexPattern(actualPattern)) {
        negativePatterns.push(parseRegexPattern(actualPattern));
      } else {
        negativePatterns.push(globToRegex(actualPattern));
      }
    } else {
      if (isRegexPattern(pattern)) {
        positivePatterns.push(parseRegexPattern(pattern));
      } else {
        positivePatterns.push(globToRegex(pattern));
      }
    }
  }

  // If there are negative patterns, check them first
  for (const negPattern of negativePatterns) {
    if (negPattern.test(modelId)) {
      return false; // Explicitly excluded
    }
  }

  // If there are no positive patterns, allow (only negations were specified)
  if (positivePatterns.length === 0) {
    return true;
  }

  // Check if matches any positive pattern
  for (const posPattern of positivePatterns) {
    if (posPattern.test(modelId)) {
      return true;
    }
  }

  return false; // Doesn't match any positive pattern
}
