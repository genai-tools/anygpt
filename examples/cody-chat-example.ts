/**
 * Example: Using Cody connector for chat completions
 * 
 * This example demonstrates how to use the Cody CLI connector
 * to chat with Sourcegraph's Cody AI assistant.
 */

import { cody } from '@anygpt/cody';

async function main() {
  console.log('🤖 Cody Chat Example\n');

  // Create a Cody connector
  const connector = cody({
    // Optional: specify working directory for better context
    workingDirectory: process.cwd(),
  });

  // Example 1: Simple question
  console.log('Example 1: Simple Question');
  console.log('─'.repeat(50));
  
  const response1 = await connector.chatCompletion({
    messages: [
      { role: 'user', content: 'What is TypeScript and why should I use it?' }
    ]
  });
  
  console.log('Question: What is TypeScript and why should I use it?');
  console.log('Answer:', response1.choices[0].message.content);
  console.log('Tokens:', response1.usage.total_tokens);
  console.log();

  // Example 2: Code explanation
  console.log('Example 2: Code Explanation');
  console.log('─'.repeat(50));
  
  const codeSnippet = `
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
  `.trim();
  
  const response2 = await connector.chatCompletion({
    messages: [
      { role: 'user', content: `Explain this code and suggest improvements:\n\n${codeSnippet}` }
    ]
  });
  
  console.log('Code:', codeSnippet);
  console.log('Explanation:', response2.choices[0].message.content);
  console.log();

  // Example 3: Multi-turn conversation
  console.log('Example 3: Multi-turn Conversation');
  console.log('─'.repeat(50));
  
  const response3 = await connector.chatCompletion({
    messages: [
      { role: 'system', content: 'You are a helpful coding assistant.' },
      { role: 'user', content: 'What is a closure in JavaScript?' },
      { role: 'assistant', content: 'A closure is a function that has access to variables in its outer scope, even after the outer function has returned.' },
      { role: 'user', content: 'Can you give me a practical example?' }
    ]
  });
  
  console.log('Follow-up question: Can you give me a practical example?');
  console.log('Answer:', response3.choices[0].message.content);
  console.log();

  // Example 4: Using Response API
  console.log('Example 4: Response API');
  console.log('─'.repeat(50));
  
  const response4 = await connector.response({
    model: 'cody-default',
    input: 'What are the benefits of using async/await over promises?'
  });
  
  console.log('Question: What are the benefits of using async/await over promises?');
  console.log('Answer:', response4.output[0].content?.[0].text);
  console.log('Status:', response4.status);
  console.log();

  console.log('✅ All examples completed!');
}

// Run the examples
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
