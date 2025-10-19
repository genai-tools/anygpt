/**
 * Rule Engine
 * 
 * A simple, type-safe rule engine for matching and transforming objects.
 * 
 * @example
 * ```typescript
 * interface Server {
 *   name: string;
 *   tags: string[];
 *   enabled?: boolean;
 * }
 * 
 * const rules: Rule<Server>[] = [
 *   {
 *     when: { name: { eq: 'github' } },
 *     set: { enabled: true }
 *   },
 *   {
 *     when: { not: { name: { in: ['docker', 'anygpt'] } } },
 *     set: { enabled: true }
 *   },
 *   {
 *     when: {
 *       and: [
 *         { name: { match: /^github/ } },
 *         { tags: { in: ['safe'] } }
 *       ]
 *     },
 *     set: { enabled: true }
 *   }
 * ];
 * 
 * const engine = new RuleEngine(rules);
 * const result = engine.apply({ name: 'github', tags: ['safe'] });
 * ```
 */

export { RuleEngine } from './engine.js';
export type { Rule, RuleCondition, LogicalCondition, RuleOperator } from './types.js';
