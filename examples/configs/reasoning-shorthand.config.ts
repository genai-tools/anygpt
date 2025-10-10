/**
 * Example: Reasoning Shorthand Configuration
 * 
 * Demonstrates three ways to configure reasoning effort:
 * 1. Boolean: reasoning: true (uses 'medium')
 * 2. String: reasoning: 'high' (direct effort level) ✨ RECOMMENDED
 * 3. Object: reasoning: { effort: 'high' } (explicit form)
 */

import { config } from '@anygpt/config';
import { openai } from '@anygpt/openai';

export default config({
  defaults: {
    provider: 'openai',
    modelRules: [
      // Boolean shorthand: reasoning: true
      // Automatically enables reasoning with 'medium' effort
      {
        pattern: [
          /\bo[13]\b/,           // o1, o3 models
          /thinking/,            // Claude thinking models
          /extended-thinking/    // Claude extended thinking
        ],
        tags: ['reasoning'],
        reasoning: true          // Implicit 'medium' effort
      },
      
      // String shorthand (RECOMMENDED): reasoning: 'minimal' | 'low' | 'medium' | 'high'
      // Direct and concise - just specify the effort level as a string
      {
        pattern: [/o3-mini/],
        tags: ['reasoning', 'mini'],
        reasoning: 'minimal'     // ✨ String shorthand - clean and explicit
      },
      {
        pattern: [/o1-preview/],
        tags: ['reasoning', 'preview'],
        reasoning: 'low'         // ✨ String shorthand
      },
      {
        pattern: [/extended-thinking/],
        tags: ['reasoning', 'extended'],
        reasoning: 'high'        // ✨ String shorthand
      },
      
      // Object form: reasoning: { effort: '...' }
      // Use when you need additional reasoning properties in the future
      {
        pattern: [/special-model/],
        reasoning: { effort: 'medium' }  // Explicit object form
      },
      
      // Disable reasoning for standard models
      {
        pattern: [/gpt-4/, /gpt-3\.5/],
        reasoning: false
      }
    ]
  },
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }
});
