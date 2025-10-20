import { query } from "@anthropic-ai/claude-agent-sdk";
import Anthropic from "@anthropic-ai/sdk";

//#region ../../router/dist/index.js
var ConnectorRegistry = class {
	factories = /* @__PURE__ */ new Map();
	registerConnector(factory) {
		const connectorType = factory.getProviderId();
		if (!this.factories.has(connectorType)) this.factories.set(connectorType, factory);
	}
	createConnector(providerId, config = {}) {
		const factory = this.factories.get(providerId);
		if (!factory) throw new Error(`No connector registered for provider: ${providerId}`);
		return factory.create(config);
	}
	getConnector(providerId, config = {}) {
		return this.createConnector(providerId, config);
	}
	hasConnector(providerId) {
		return this.factories.has(providerId);
	}
	getAvailableProviders() {
		return Array.from(this.factories.keys());
	}
	unregisterConnector(providerId) {
		return this.factories.delete(providerId);
	}
	clear() {
		this.factories.clear();
	}
	async getAllModels() {
		const results = [];
		for (const [providerId, factory] of this.factories) try {
			const models = await factory.create({}).listModels();
			results.push({
				provider: providerId,
				models
			});
		} catch (error) {
			console.warn(`Failed to get models from ${providerId}:`, error);
		}
		return results;
	}
};
new ConnectorRegistry();
var NoOpLogger = class {
	debug() {}
	info() {}
	warn() {}
	error() {}
};
var BaseConnector = class {
	config;
	userConfig;
	logger;
	providerId;
	static packageName;
	constructor(providerId, config = {}) {
		this.providerId = providerId;
		this.userConfig = { ...config };
		this.config = {
			timeout: 3e4,
			maxRetries: 3,
			...config
		};
		this.logger = config.logger || new NoOpLogger();
	}
	getUserConfig() {
		return { ...this.userConfig };
	}
	getEffectiveConfig() {
		return { ...this.config };
	}
	validateRequest(request) {
		const validated = { ...request };
		if (validated.temperature !== void 0) validated.temperature = Math.max(0, Math.min(2, validated.temperature));
		if (validated.top_p !== void 0) validated.top_p = Math.max(0, Math.min(1, validated.top_p));
		if (validated.frequency_penalty !== void 0) validated.frequency_penalty = Math.max(-2, Math.min(2, validated.frequency_penalty));
		if (validated.presence_penalty !== void 0) validated.presence_penalty = Math.max(-2, Math.min(2, validated.presence_penalty));
		return validated;
	}
	isInitialized() {
		return true;
	}
	getProviderId() {
		return this.providerId;
	}
	getConfig() {
		return { ...this.config };
	}
	handleError(error, operation) {
		if (error instanceof Error) throw new Error(`${this.providerId} ${operation} failed: ${error.message}`);
		throw new Error(`${this.providerId} ${operation} failed: Unknown error`);
	}
	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
};

//#endregion
//#region src/index.ts
/**
* Connector for Claude Agent SDK
* Provides agentic capabilities with built-in tool support
*/
var ClaudeAgentConnector = class extends BaseConnector {
	static packageName = "@anygpt/claude-agent";
	config;
	client;
	constructor(config = {}) {
		super("claude-agent", config);
		this.config = config;
		this.client = new Anthropic({
			apiKey: config.apiKey || process.env["ANTHROPIC_API_KEY"] || "",
			baseURL: config.baseURL || process.env["ANTHROPIC_BASE_URL"]
		});
	}
	/**
	* List available models from Anthropic API
	*/
	async listModels() {
		try {
			this.logger.debug("[Claude Agent] Fetching models from API...");
			const response = await this.client.models.list();
			this.logger.debug("[Claude Agent] Models fetched:", { count: response.data.length });
			return response.data.map((model) => ({
				id: model.id,
				provider: this.providerId,
				display_name: model.display_name || model.id,
				capabilities: {
					input: { text: true },
					output: {
						text: true,
						function_calling: true,
						streaming: false
					}
				}
			}));
		} catch (error) {
			this.logger.debug(`[${this.providerId}] Failed to fetch models from API: ${error instanceof Error ? error.message : String(error)}. Will use default models.`);
			return [{
				id: "claude-sonnet-4",
				provider: this.providerId,
				display_name: "Claude Sonnet 4",
				capabilities: {
					input: { text: true },
					output: {
						text: true,
						function_calling: true,
						streaming: false
					}
				}
			}, {
				id: "claude-opus-4",
				provider: this.providerId,
				display_name: "Claude Opus 4",
				capabilities: {
					input: { text: true },
					output: {
						text: true,
						function_calling: true,
						streaming: false
					}
				}
			}];
		}
	}
	/**
	* Response method (not supported by Agent SDK)
	*/
	async response(_request) {
		throw new Error("Response method not supported by Claude Agent SDK. Use chatCompletion instead.");
	}
	/**
	* Chat completion using Claude Agent SDK
	* Converts OpenAI-style messages to Agent SDK format
	*/
	async chatCompletion(request) {
		const { messages, model, max_tokens, temperature } = request;
		const prompt = messages.map((msg) => {
			if (msg.role === "system") return `System: ${msg.content}`;
			else if (msg.role === "user") return `User: ${msg.content}`;
			else return `Assistant: ${msg.content}`;
		}).join("\n\n");
		const options = {
			apiKey: this.config.apiKey || process.env["ANTHROPIC_API_KEY"],
			model: model || this.config.model || "claude-sonnet-4",
			max_tokens: max_tokens || this.config.maxTokens || 4096,
			temperature: temperature ?? this.config.temperature,
			system_prompt: this.config.systemPrompt,
			mcp_servers: this.config.mcpServers,
			permissions: this.config.permissions,
			env: {
				...process.env,
				...this.config.baseURL && { ANTHROPIC_BASE_URL: this.config.baseURL },
				...this.config.apiKey && { ANTHROPIC_API_KEY: this.config.apiKey }
			}
		};
		this.logger.debug("[Claude Agent] Starting query execution with options:", {
			model: options.model,
			maxTokens: max_tokens || this.config.maxTokens,
			hasMcpServers: !!this.config.mcpServers
		});
		const queryGenerator = query({
			prompt,
			options
		});
		const collectedMessages = [];
		let finalContent = "";
		try {
			for await (const message of queryGenerator) {
				collectedMessages.push(message);
				if (message.type === "assistant" && "content" in message) {
					const content = message.content;
					if (Array.isArray(content)) {
						for (const block of content) if (block.type === "text" && "text" in block) finalContent += block.text;
					} else if (typeof content === "string") finalContent += content;
				}
			}
		} catch (error) {
			this.logger.error("[Claude Agent] Tool execution failed:", error);
			throw error;
		}
		this.logger.debug("[Claude Agent] Tool execution completed:", {
			messageCount: collectedMessages.length,
			contentLength: finalContent.length
		});
		return {
			id: `chatcmpl-${Date.now()}`,
			object: "chat.completion",
			created: Math.floor(Date.now() / 1e3),
			model: model || this.config.model || "claude-sonnet-4",
			provider: this.providerId,
			choices: [{
				index: 0,
				message: {
					role: "assistant",
					content: finalContent || "No response generated"
				},
				finish_reason: "stop"
			}],
			usage: {
				prompt_tokens: 0,
				completion_tokens: 0,
				total_tokens: 0
			}
		};
	}
};
/**
* Factory for creating Claude Agent connectors
*/
var ClaudeAgentConnectorFactory = class {
	getProviderId() {
		return "claude-agent";
	}
	create(config) {
		return new ClaudeAgentConnector(config);
	}
};
var src_default = ClaudeAgentConnectorFactory;
/**
* Factory function for cleaner syntax
*/
function claudeAgent(config = {}, providerId) {
	const connector = new ClaudeAgentConnector(typeof config === "string" ? { apiKey: config } : config);
	if (providerId) Object.defineProperty(connector, "providerId", {
		value: providerId,
		writable: false,
		enumerable: true,
		configurable: false
	});
	return connector;
}

//#endregion
export { ClaudeAgentConnector, ClaudeAgentConnectorFactory, claudeAgent, src_default as default };
//# sourceMappingURL=index.js.map