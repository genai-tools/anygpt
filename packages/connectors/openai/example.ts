/**
 * Example usage of the decoupled OpenAI connector
 */

import { GenAIRouter } from '@anygpt/router';
import { OpenAIConnectorFactory } from '@anygpt/openai';

// Create a router instance
const router = new GenAIRouter({
  providers: {
    'openai-main': {
      type: 'openai',
      api: {
        url: 'https://api.openai.com/v1',
        token: process.env.OPENAI_API_KEY || ''
      }
    },
    'ollama-local': {
      type: 'openai', // Uses OpenAI-compatible API
      api: {
        url: 'http://localhost:11434/v1',
        token: '' // Ollama typically doesn't require a token
      }
    }
  }
});

// Register the OpenAI connector (supports OpenAI and compatible APIs)
router.registerConnector(new OpenAIConnectorFactory());

// Now you can use the router with different providers
async function example() {
  // Use OpenAI
  const openaiResponse = await router.chatCompletion({
    provider: 'openai-main',
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello from OpenAI!' }]
  });

  // Use Ollama (OpenAI-compatible)
  const ollamaResponse = await router.chatCompletion({
    provider: 'ollama-local',
    model: 'llama2',
    messages: [{ role: 'user', content: 'Hello from Ollama!' }]
  });

  console.log('OpenAI Response:', openaiResponse);
  console.log('Ollama Response:', ollamaResponse);
}

export { example };
