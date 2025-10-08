/**
 * MCP Prompts - Pre-built templates for common tasks
 */

/**
 * List all available prompts
 */
export function listPrompts() {
  return {
    prompts: [
      {
        name: "discover-and-chat",
        description: "Complete workflow: discover providers, list models, and chat",
        arguments: [
          {
            name: "question",
            description: "The question to ask the AI",
            required: true,
          },
        ],
      },
      {
        name: "compare-providers",
        description: "Compare responses from multiple providers",
        arguments: [
          {
            name: "question",
            description: "The question to ask all providers",
            required: true,
          },
        ],
      },
      {
        name: "list-capabilities",
        description: "Show all available providers and their models",
      },
    ],
  };
}

/**
 * Get a specific prompt
 */
export function getPrompt(name: string, args: Record<string, unknown> = {}) {
  switch (name) {
    case "discover-and-chat":
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text",
              text: `I want to chat with an AI model. Here's my question: "${args.question || 'Hello!'}"

Please follow these steps:
1. Call anygpt_list_providers to see what providers are available
2. Call anygpt_list_models with the default provider to see available models
3. Call anygpt_chat_completion with the question using the default provider and a suitable model
4. Show me the response`,
            },
          },
        ],
      };

    case "compare-providers":
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text",
              text: `I want to compare how different AI providers respond to the same question: "${args.question || 'What is AI?'}"

Please:
1. Call anygpt_list_providers to see all configured providers
2. For each provider, call anygpt_list_models to get a suitable model
3. Call anygpt_chat_completion for each provider with the same question
4. Compare and summarize the responses`,
            },
          },
        ],
      };

    case "list-capabilities":
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text",
              text: `Please show me all the AI capabilities available in this AnyGPT server:

1. Call anygpt_list_providers to see all configured providers
2. For each provider, call anygpt_list_models to see available models
3. Present the information in a clear, organized format showing:
   - Provider name and type
   - Whether it's the default
   - List of available models
   - Any notable model features or capabilities`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
