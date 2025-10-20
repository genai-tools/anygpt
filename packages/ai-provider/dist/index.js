//#region src/ai-provider.ts
/**
* AI Provider wrapper that uses @anygpt/router for provider-agnostic AI interactions
*/
var AIProvider = class {
	router;
	config;
	constructor(router, config) {
		this.router = router;
		this.config = config;
	}
	/**
	* Send a chat request and get a response
	*/
	async chat(request) {
		const routerRequest = {
			provider: this.config.provider,
			model: request.model || this.config.model,
			messages: this.convertMessages(request.messages),
			...request.tools && { tools: this.convertTools(request.tools) },
			...request.tool_executor && { tool_executor: request.tool_executor },
			...request.temperature !== void 0 && { temperature: request.temperature },
			...request.maxTokens && { max_tokens: request.maxTokens }
		};
		const response = await this.router.chatCompletion(routerRequest);
		return this.convertResponse(response);
	}
	/**
	* Stream a chat response
	*/
	async *stream(request) {
		throw new Error("Streaming not yet implemented");
	}
	/**
	* Convert messages to router format
	*/
	convertMessages(messages) {
		return messages.map((msg) => ({
			role: msg.role,
			content: msg.content,
			...msg.name && { name: msg.name },
			...msg.toolCallId && { tool_call_id: msg.toolCallId },
			...msg.toolCalls && { tool_calls: msg.toolCalls }
		}));
	}
	/**
	* Convert tools to router format
	*/
	convertTools(tools) {
		return tools;
	}
	/**
	* Convert router response to our format
	*/
	convertResponse(response) {
		const choice = response.choices[0];
		const message = choice.message;
		const toolCalls = message.tool_calls?.map((tc) => ({
			id: tc.id,
			type: "function",
			function: {
				name: tc.function.name,
				arguments: tc.function.arguments
			}
		}));
		return {
			message: message.content || "",
			toolCalls,
			finishReason: this.normalizeFinishReason(choice.finish_reason),
			usage: {
				promptTokens: response.usage?.prompt_tokens || 0,
				completionTokens: response.usage?.completion_tokens || 0,
				totalTokens: response.usage?.total_tokens || 0
			},
			model: response.model
		};
	}
	/**
	* Normalize finish reason across providers
	*/
	normalizeFinishReason(reason) {
		switch (reason) {
			case "stop": return "stop";
			case "tool_calls":
			case "function_call": return "tool_calls";
			case "length":
			case "max_tokens": return "length";
			case "content_filter": return "content_filter";
			default: return "stop";
		}
	}
};

//#endregion
export { AIProvider };
//# sourceMappingURL=index.js.map