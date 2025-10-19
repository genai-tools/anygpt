/**
 * Rule Engine Types
 * 
 * A simple, type-safe rule engine for matching and transforming objects.
 * Can be easily extracted into a separate package later.
 */

/**
 * Rule selector operators
 */
export type RuleOperator<V> = {
  /** Exact match */
  eq?: V;
  /** Regex or glob pattern match */
  match?: string | RegExp | Array<string | RegExp>;
  /** Value is in array */
  in?: V[];
};

/**
 * Shortcut value types:
 * - Direct value: eq operator (e.g., 'github' -> { eq: 'github' })
 * - RegExp: match operator (e.g., /^github/ -> { match: /^github/ })
 * - Array: in operator (e.g., ['a', 'b'] -> { in: ['a', 'b'] })
 */
export type RuleValue<V> = 
  | V                           // Direct value -> eq
  | RegExp                      // RegExp -> match
  | V[]                         // Array -> in
  | RuleOperator<V>;            // Explicit operator

/**
 * Valid value types for rule matching
 * - Primitives: string, number, boolean
 * - Arrays of primitives
 * - No functions, objects, or complex types
 */
export type ValidValue = 
  | string 
  | number 
  | boolean 
  | string[] 
  | number[] 
  | boolean[];

/**
 * Rule condition - specify which fields to match
 */
export type RuleCondition<T> = {
  [K in keyof T]?: T[K] extends string
    ? RuleValue<string>
    : T[K] extends number
    ? RuleValue<number>
    : T[K] extends boolean
    ? RuleValue<boolean>
    : T[K] extends Array<infer U>
    ? RuleValue<U>
    : never;
};

/**
 * Logical operators for composing conditions
 */
export type LogicalCondition<T> = 
  | { and: Array<RuleCondition<T> | LogicalCondition<T>> }
  | { or: Array<RuleCondition<T> | LogicalCondition<T>> }
  | { not: RuleCondition<T> | LogicalCondition<T> };

/**
 * Rule definition
 * 
 * Note: T cannot have fields named 'and', 'or', or 'not' as they are reserved
 * for logical operators. T must only contain primitive values or arrays of primitives.
 */
export interface Rule<T extends Record<string, ValidValue>> {
  /** Conditions to match (supports logical operators) */
  when: RuleCondition<T> | LogicalCondition<T>;
  /** Values to set (replace) when matched */
  set?: Partial<T>;
  /** Values to append to arrays when matched */
  push?: Partial<T>;
}
