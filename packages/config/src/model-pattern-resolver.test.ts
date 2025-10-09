/**
 * Unit tests for model pattern resolver
 */

import { describe, it, expect } from 'vitest';
import { resolveModelConfig } from './model-pattern-resolver.js';
import type { FactoryProviderConfig, ModelRule } from './factory.js';
import type { IConnector } from '@anygpt/types';

// Mock connector for testing
const mockConnector: IConnector = {} as IConnector;

describe('resolveModelConfig', () => {
  describe('reasoning configuration', () => {
    it('should convert reasoning: true to { effort: "medium" }', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*o1*'],
            reasoning: true
          }
        ]
      };

      const resolved = resolveModelConfig('o1-preview', 'openai', providerConfig);
      
      expect(resolved.reasoning).toEqual({ effort: 'medium' });
    });

    it('should preserve explicit reasoning effort configuration', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*o1*'],
            reasoning: { effort: 'high' }
          }
        ]
      };

      const resolved = resolveModelConfig('o1-preview', 'openai', providerConfig);
      
      expect(resolved.reasoning).toEqual({ effort: 'high' });
    });

    it('should support minimal effort level', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*o3-mini*'],
            reasoning: { effort: 'minimal' }
          }
        ]
      };

      const resolved = resolveModelConfig('o3-mini-2025-01-31', 'openai', providerConfig);
      
      expect(resolved.reasoning).toEqual({ effort: 'minimal' });
    });

    it('should support string shorthand for reasoning effort', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*o1*'],
            reasoning: 'high'  // String shorthand
          }
        ]
      };

      const resolved = resolveModelConfig('o1-preview', 'openai', providerConfig);
      
      expect(resolved.reasoning).toEqual({ effort: 'high' });
    });

    it('should support all effort levels as string shorthand', () => {
      const testCases: Array<{ effort: 'minimal' | 'low' | 'medium' | 'high' }> = [
        { effort: 'minimal' },
        { effort: 'low' },
        { effort: 'medium' },
        { effort: 'high' }
      ];

      testCases.forEach(({ effort }) => {
        const providerConfig: FactoryProviderConfig = {
          connector: mockConnector,
          modelRules: [
            {
              pattern: ['*test*'],
              reasoning: effort
            }
          ]
        };

        const resolved = resolveModelConfig('test-model', 'openai', providerConfig);
        expect(resolved.reasoning).toEqual({ effort });
      });
    });

    it('should handle reasoning: false by not setting reasoning', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*gpt-4*'],
            reasoning: false
          }
        ]
      };

      const resolved = resolveModelConfig('gpt-4', 'openai', providerConfig);
      
      expect(resolved.reasoning).toBeUndefined();
    });

    it('should apply reasoning from global rules when no provider rule matches', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector
      };

      const globalRules: ModelRule[] = [
        {
          pattern: ['*extended-thinking*'],
          reasoning: true
        }
      ];

      const resolved = resolveModelConfig(
        'claude-3-7-sonnet-extended-thinking',
        'anthropic',
        providerConfig,
        globalRules
      );
      
      expect(resolved.reasoning).toEqual({ effort: 'medium' });
    });

    it('should prioritize provider rules over global rules', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*o1*'],
            reasoning: { effort: 'low' }
          }
        ]
      };

      const globalRules: ModelRule[] = [
        {
          pattern: ['*o1*'],
          reasoning: { effort: 'high' }
        }
      ];

      const resolved = resolveModelConfig('o1-preview', 'openai', providerConfig, globalRules);
      
      expect(resolved.reasoning).toEqual({ effort: 'low' });
    });

    it('should prioritize explicit model metadata over rules', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        models: {
          'o1-preview': {
            tags: [],
            reasoning: { effort: 'high' }
          }
        },
        modelRules: [
          {
            pattern: ['*o1*'],
            reasoning: true
          }
        ]
      };

      const resolved = resolveModelConfig('o1-preview', 'openai', providerConfig);
      
      expect(resolved.reasoning).toEqual({ effort: 'high' });
    });
  });

  describe('tag accumulation', () => {
    it('should accumulate tags from multiple matching rules', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*gpt-4*'],
            tags: ['gpt4']
          },
          {
            pattern: ['*turbo*'],
            tags: ['turbo']
          }
        ]
      };

      const resolved = resolveModelConfig('gpt-4-turbo', 'openai', providerConfig);
      
      expect(resolved.tags).toContain('gpt4');
      expect(resolved.tags).toContain('turbo');
    });
  });

  describe('enabled flag', () => {
    it('should apply enabled flag from first matching rule', () => {
      const providerConfig: FactoryProviderConfig = {
        connector: mockConnector,
        modelRules: [
          {
            pattern: ['*nano*'],
            enabled: false
          }
        ]
      };

      const resolved = resolveModelConfig('gpt-4-nano', 'openai', providerConfig);
      
      expect(resolved.enabled).toBe(false);
    });
  });
});
