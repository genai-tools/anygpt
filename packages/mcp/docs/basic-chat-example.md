# Basic Chat Example

Here's a complete example of using AnyGPT to chat with an AI model:

## 1. Discover what's available

```javascript
const providers = await anygpt_list_providers();
console.log("Available providers:", providers.providers.map(p => p.id));
```

## 2. List models from the default provider

```javascript
const { models } = await anygpt_list_models({
  provider: providers.default_provider
});
console.log("Available models:", models.map(m => m.id));
```

## 3. Send a chat message

```javascript
const response = await anygpt_chat_completion({
  provider: providers.default_provider,
  model: models[0].id,
  messages: [
    { role: "user", content: "What is the capital of France?" }
  ]
});
console.log("Response:", response.choices[0].message.content);
```

## Simplified Version (using defaults)

If you're happy with the defaults, you can skip the discovery steps:

```javascript
const response = await anygpt_chat_completion({
  messages: [
    { role: "user", content: "What is the capital of France?" }
  ]
});
```

The server will use the configured default provider and model.
