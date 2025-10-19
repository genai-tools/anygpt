import { describe, it, expect } from 'vitest';
import { RuleEngine } from './engine.js';
import type { Rule } from './types.js';

interface TestObject {
  name: string;
  count: number;
  tags: string[];
  enabled?: boolean;
}

describe('RuleEngine', () => {
  describe('eq operator', () => {
    it('should match exact string value', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { eq: 'test' } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match different string value', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { eq: 'test' } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'other', count: 1, tags: [] });
      expect(result.enabled).toBeUndefined();
    });

    it('should match exact number value', () => {
      const rules: Rule<TestObject>[] = [
        { when: { count: { eq: 5 } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 5, tags: [] });
      expect(result.enabled).toBe(true);
    });
  });

  describe('in operator', () => {
    it('should match when value is in array', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { in: ['foo', 'bar', 'baz'] } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'bar', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match when value is not in array', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { in: ['foo', 'bar'] } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'baz', count: 1, tags: [] });
      expect(result.enabled).toBeUndefined();
    });

    it('should match when array value contains element from in array', () => {
      const rules: Rule<TestObject>[] = [
        { when: { tags: { in: ['safe'] } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 1, tags: ['safe', 'fast'] });
      expect(result.enabled).toBe(true);
    });

    it('should not match when array value has no common elements', () => {
      const rules: Rule<TestObject>[] = [
        { when: { tags: { in: ['safe'] } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 1, tags: ['dangerous'] });
      expect(result.enabled).toBeUndefined();
    });
  });

  describe('match operator', () => {
    it('should match regex pattern', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { match: /^test/ } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test-123', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match regex pattern', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { match: /^test/ } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'other-123', count: 1, tags: [] });
      expect(result.enabled).toBeUndefined();
    });

    it('should match glob pattern with *', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { match: 'test-*' } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test-123', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should match glob pattern with ?', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { match: 'test-?' } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test-1', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should match any pattern in array', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { match: [/^foo/, 'bar-*'] } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result1 = engine.apply({ name: 'foo-123', count: 1, tags: [] });
      expect(result1.enabled).toBe(true);
      
      const result2 = engine.apply({ name: 'bar-456', count: 1, tags: [] });
      expect(result2.enabled).toBe(true);
    });
  });

  describe('not operator', () => {
    it('should negate condition', () => {
      const rules: Rule<TestObject>[] = [
        { when: { not: { name: { eq: 'test' } } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'other', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match when negated condition is true', () => {
      const rules: Rule<TestObject>[] = [
        { when: { not: { name: { eq: 'test' } } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 1, tags: [] });
      expect(result.enabled).toBeUndefined();
    });

    it('should negate in operator', () => {
      const rules: Rule<TestObject>[] = [
        { when: { not: { name: { in: ['foo', 'bar'] } } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'baz', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });
  });

  describe('and operator', () => {
    it('should match when all conditions are true', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            and: [
              { name: { eq: 'test' } },
              { count: { eq: 5 } }
            ]
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 5, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match when any condition is false', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            and: [
              { name: { eq: 'test' } },
              { count: { eq: 5 } }
            ]
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 10, tags: [] });
      expect(result.enabled).toBeUndefined();
    });
  });

  describe('or operator', () => {
    it('should match when any condition is true', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            or: [
              { name: { eq: 'foo' } },
              { name: { eq: 'bar' } }
            ]
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'bar', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match when all conditions are false', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            or: [
              { name: { eq: 'foo' } },
              { name: { eq: 'bar' } }
            ]
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'baz', count: 1, tags: [] });
      expect(result.enabled).toBeUndefined();
    });
  });

  describe('implicit AND (multiple fields)', () => {
    it('should match when all fields match', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            name: { eq: 'test' },
            count: { eq: 5 }
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 5, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match when any field does not match', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            name: { eq: 'test' },
            count: { eq: 5 }
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 10, tags: [] });
      expect(result.enabled).toBeUndefined();
    });
  });

  describe('nested logical operators', () => {
    it('should handle (A or B) and C', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            and: [
              {
                or: [
                  { name: { eq: 'foo' } },
                  { name: { eq: 'bar' } }
                ]
              },
              { count: { eq: 5 } }
            ]
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result1 = engine.apply({ name: 'foo', count: 5, tags: [] });
      expect(result1.enabled).toBe(true);
      
      const result2 = engine.apply({ name: 'bar', count: 5, tags: [] });
      expect(result2.enabled).toBe(true);
      
      const result3 = engine.apply({ name: 'foo', count: 10, tags: [] });
      expect(result3.enabled).toBeUndefined();
    });

    it('should handle not(A and B)', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            not: {
              and: [
                { name: { eq: 'test' } },
                { count: { eq: 5 } }
              ]
            }
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result1 = engine.apply({ name: 'test', count: 10, tags: [] });
      expect(result1.enabled).toBe(true);
      
      const result2 = engine.apply({ name: 'other', count: 5, tags: [] });
      expect(result2.enabled).toBe(true);
      
      const result3 = engine.apply({ name: 'test', count: 5, tags: [] });
      expect(result3.enabled).toBeUndefined();
    });
  });

  describe('multiple rules', () => {
    it('should apply all matching rules in order', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { eq: 'test' } }, set: { enabled: true } },
        { when: { count: { eq: 5 } }, set: { count: 10 } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 5, tags: [] });
      expect(result.enabled).toBe(true);
      expect(result.count).toBe(10);
    });

    it('should override values from earlier rules', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { eq: 'test' } }, set: { count: 5 } },
        { when: { name: { eq: 'test' } }, set: { count: 10 } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 1, tags: [] });
      expect(result.count).toBe(10);
    });
  });

  describe('applyAll', () => {
    it('should apply rules to multiple objects', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: { eq: 'test' } }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const items = [
        { name: 'test', count: 1, tags: [] },
        { name: 'other', count: 2, tags: [] }
      ];
      
      const results = engine.applyAll(items);
      expect(results[0].enabled).toBe(true);
      expect(results[1].enabled).toBeUndefined();
    });
  });

  describe('shortcut syntax', () => {
    it('should support direct value as eq shortcut', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: 'github' }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should not match different value with direct value shortcut', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: 'github' }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'gitlab', count: 1, tags: [] });
      expect(result.enabled).toBeUndefined();
    });

    it('should support regex as match shortcut', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: /^github/ }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github-official', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should support array as in shortcut', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: ['github', 'gitlab'] }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result1 = engine.apply({ name: 'github', count: 1, tags: [] });
      expect(result1.enabled).toBe(true);
      
      const result2 = engine.apply({ name: 'gitlab', count: 1, tags: [] });
      expect(result2.enabled).toBe(true);
      
      const result3 = engine.apply({ name: 'bitbucket', count: 1, tags: [] });
      expect(result3.enabled).toBeUndefined();
    });

    it('should support number direct value', () => {
      const rules: Rule<TestObject>[] = [
        { when: { count: 5 }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 5, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should support number array', () => {
      const rules: Rule<TestObject>[] = [
        { when: { count: [1, 2, 3] }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 2, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should mix shortcuts and explicit operators', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: {
            name: 'github',                    // Direct value (eq)
            count: { eq: 5 }                   // Explicit operator
          },
          set: { enabled: true }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github', count: 5, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should support mixed array with regex and strings', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: [/^github/, 'gitlab'] }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      // Should match regex
      const result1 = engine.apply({ name: 'github-official', count: 1, tags: [] });
      expect(result1.enabled).toBe(true);
      
      // Should match exact string
      const result2 = engine.apply({ name: 'gitlab', count: 1, tags: [] });
      expect(result2.enabled).toBe(true);
      
      // Should not match
      const result3 = engine.apply({ name: 'bitbucket', count: 1, tags: [] });
      expect(result3.enabled).toBeUndefined();
    });

    it('should support mixed array with multiple regex patterns', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: [/^github/, /^gitlab/, 'bitbucket'] }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result1 = engine.apply({ name: 'github-official', count: 1, tags: [] });
      expect(result1.enabled).toBe(true);
      
      const result2 = engine.apply({ name: 'gitlab-ce', count: 1, tags: [] });
      expect(result2.enabled).toBe(true);
      
      const result3 = engine.apply({ name: 'bitbucket', count: 1, tags: [] });
      expect(result3.enabled).toBe(true);
      
      const result4 = engine.apply({ name: 'other', count: 1, tags: [] });
      expect(result4.enabled).toBeUndefined();
    });
  });

  describe('default rule', () => {
    it('should apply default values to all items', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: 'github' }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules, { enabled: false, count: 0 });
      
      // Item with matching rule - rule overrides default
      const result1 = engine.apply({ name: 'github', count: 5, tags: [] });
      expect(result1.enabled).toBe(true); // Rule overrides default
      expect(result1.count).toBe(0); // Default applied (item value is overridden)
      
      // Item without matching rule - only defaults applied
      const result2 = engine.apply({ name: 'gitlab', count: 5, tags: [] });
      expect(result2.enabled).toBe(false); // Default applied
      expect(result2.count).toBe(0); // Default applied
    });

    it('should work without default rule', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: 'github' }, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github', count: 5, tags: [] });
      expect(result.enabled).toBe(true);
    });
  });

  describe('push operation', () => {
    it('should append to arrays', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: { name: 'github' },
          push: { tags: ['safe', 'verified'] }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github', count: 1, tags: ['fast'] });
      expect(result.tags).toEqual(['fast', 'safe', 'verified']);
    });

    it('should work with set and push together', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: { name: 'github' },
          set: { enabled: true },
          push: { tags: ['safe'] }
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
      expect(result.tags).toEqual(['safe']);
    });

    it('should handle multiple push rules', () => {
      const rules: Rule<TestObject>[] = [
        { when: { name: 'github' }, push: { tags: ['safe'] } },
        { when: { name: 'github' }, push: { tags: ['verified'] } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github', count: 1, tags: ['fast'] });
      expect(result.tags).toEqual(['fast', 'safe', 'verified']);
    });

    it('should only push to arrays', () => {
      const rules: Rule<TestObject>[] = [
        {
          when: { name: 'github' },
          push: { count: 5 as unknown as number[] } // Invalid - count is not an array
        }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'github', count: 1, tags: [] });
      expect(result.count).toBe(1); // Not changed
    });
  });

  describe('edge cases', () => {
    it('should handle empty rules array', () => {
      const rules: Rule<TestObject>[] = [];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 1, tags: [] });
      expect(result).toEqual({ name: 'test', count: 1, tags: [] });
    });

    it('should handle empty condition object', () => {
      const rules: Rule<TestObject>[] = [
        { when: {}, set: { enabled: true } }
      ];
      const engine = new RuleEngine(rules);
      
      const result = engine.apply({ name: 'test', count: 1, tags: [] });
      expect(result.enabled).toBe(true);
    });

    it('should handle null/undefined operator values', () => {
      const engine = new RuleEngine<TestObject>([]);
      
      // @ts-expect-error - testing edge case
      const result = engine['matchesOperator']('test', null);
      expect(result).toBe(true);
      
      // @ts-expect-error - testing edge case
      const result2 = engine['matchesOperator']('test', undefined);
      expect(result2).toBe(true);
    });

    it('should handle non-object operator as eq shortcut', () => {
      const engine = new RuleEngine<TestObject>([]);
      
      // @ts-expect-error - testing edge case
      const result = engine['matchesOperator']('test', 'test');
      expect(result).toBe(true);
      
      // @ts-expect-error - testing edge case
      const result2 = engine['matchesOperator']('test', 'other');
      expect(result2).toBe(false);
    });

    it('should handle empty operator object', () => {
      const engine = new RuleEngine<TestObject>([]);
      
      const result = engine['matchesOperator']('test', {});
      expect(result).toBe(true);
    });
  });
});
