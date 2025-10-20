/**
 * Rule Engine Implementation
 */

import type {
  Rule,
  RuleCondition,
  LogicalCondition,
  ValidRuleTarget,
} from './types.js';

/**
 * Rule Engine - applies rules to objects
 *
 * Note: T cannot have fields named 'and', 'or', or 'not' as they are reserved
 * for logical operators. T must only contain primitive values (string, number, boolean)
 * or arrays of primitives.
 */
export class RuleEngine<T extends ValidRuleTarget<T>> {
  constructor(private rules: Rule<T>[], private defaultRule?: Partial<T>) {}

  /**
   * Apply all matching rules to an object
   */
  apply(item: T): T {
    // Start with default values if provided
    let result = this.defaultRule
      ? { ...item, ...this.defaultRule }
      : { ...item };

    // Apply matching rules (can override defaults)
    for (const rule of this.rules) {
      if (this.matches(item, rule.when)) {
        // Apply set (replace values)
        if (rule.set) {
          result = { ...result, ...rule.set };
        }

        // Apply push (append to arrays)
        if (rule.push) {
          for (const key in rule.push) {
            const pushValue = rule.push[key];
            const currentValue = result[key];

            // Only push to arrays
            if (Array.isArray(currentValue) && Array.isArray(pushValue)) {
              result = {
                ...result,
                [key]: [...currentValue, ...pushValue],
              } as T;
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Apply rules to multiple objects
   */
  applyAll(items: T[]): T[] {
    return items.map((item) => this.apply(item));
  }

  /**
   * Check if an object matches a condition
   */
  private matches(
    item: T,
    condition: RuleCondition<T> | LogicalCondition<T>
  ): boolean {
    // Check if it's a logical condition
    if ('and' in condition && Array.isArray(condition.and)) {
      return condition.and.every((c: RuleCondition<T> | LogicalCondition<T>) =>
        this.matches(item, c)
      );
    }

    if ('or' in condition && Array.isArray(condition.or)) {
      return condition.or.some((c: RuleCondition<T> | LogicalCondition<T>) =>
        this.matches(item, c)
      );
    }

    if ('not' in condition && condition.not) {
      return !this.matches(
        item,
        condition.not as RuleCondition<T> | LogicalCondition<T>
      );
    }

    // It's a field condition - multiple fields are implicitly AND
    const fieldCondition = condition as RuleCondition<T>;

    // All fields must match (implicit AND)
    for (const key in fieldCondition) {
      const operator = fieldCondition[key];
      const value = item[key];

      if (!this.matchesOperator(value, operator)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a value matches a pattern (regex or exact match)
   */
  private matchesPattern(value: unknown, pattern: unknown): boolean {
    // RegExp pattern
    if (pattern instanceof RegExp) {
      return pattern.test(String(value));
    }

    // Exact match
    return value === pattern;
  }

  /**
   * Normalize shortcut syntax to full operator format
   */
  private normalizeOperator(operator: unknown): Record<string, unknown> | null {
    if (!operator) return null;

    // Already an operator object
    if (
      typeof operator === 'object' &&
      !Array.isArray(operator) &&
      !(operator instanceof RegExp)
    ) {
      return operator as Record<string, unknown>;
    }

    // RegExp -> { match: regex }
    if (operator instanceof RegExp) {
      return { match: operator };
    }

    // Array -> { in: array }
    if (Array.isArray(operator)) {
      return { in: operator };
    }

    // Direct value -> { eq: value }
    return { eq: operator };
  }

  /**
   * Check if a value matches an operator
   */
  private matchesOperator(value: unknown, operator: unknown): boolean {
    const normalized = this.normalizeOperator(operator);
    if (!normalized) return true;

    const op = normalized;

    // eq - exact match
    if ('eq' in op) {
      return value === op['eq'];
    }

    // in - value is in array (supports mixed types: regex, strings, etc.)
    if ('in' in op && Array.isArray(op['in'])) {
      const inArray = op['in'] as unknown[];

      if (Array.isArray(value)) {
        // If value is array, check if any element matches any pattern
        return value.some((v) =>
          inArray.some((pattern) => this.matchesPattern(v, pattern))
        );
      }

      // If value is scalar, check if it matches any pattern in the array
      return inArray.some((pattern) => this.matchesPattern(value, pattern));
    }

    // match - regex or glob pattern
    if ('match' in op) {
      const matchValue = op['match'];
      const patterns = Array.isArray(matchValue) ? matchValue : [matchValue];

      return patterns.some((pattern: unknown) => {
        if (pattern instanceof RegExp) {
          return pattern.test(String(value));
        }

        // Convert glob pattern to regex
        const regexPattern = String(pattern)
          .replace(/\*/g, '___GLOB_STAR___') // Temporarily replace *
          .replace(/\?/g, '___GLOB_QUESTION___') // Temporarily replace ?
          .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
          .replace(/___GLOB_STAR___/g, '.*') // * -> .*
          .replace(/___GLOB_QUESTION___/g, '.'); // ? -> .

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(String(value));
      });
    }

    return true;
  }
}
