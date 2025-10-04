/**
 * E2E test configuration
 * Uses mock connector with fixtures loaded from separate files
 */

import { config } from '@anygpt/config';
import { mock, exactMatch } from '@anygpt/mock';

// Inline fixtures - minimal, purpose-driven
const chatFixtures = [
  exactMatch('test message', 'This is a test response', 'basic-chat'),
];

const conversationFixtures = [
  exactMatch('first message', 'Response to first message', 'conversation-first'),
  exactMatch('second message', 'Response to second message', 'conversation-second'),
];

export default config({
  defaults: {
    provider: 'mock',
    model: 'mock-gpt-4'
  },
  providers: {
    mock: {
      name: 'Mock Provider for E2E Testing',
      connector: mock({ 
        fixtures: [
          ...chatFixtures,
          ...conversationFixtures
        ]
      })
    }
  }
});
