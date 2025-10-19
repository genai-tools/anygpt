import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

//#region src/configuration-loader.ts
/**
* Configuration loader for discovery engine
*/
var ConfigurationLoader = class {
	/**
	* Get default configuration
	*/
	getDefaultConfig() {
		return {
			enabled: true,
			cache: {
				enabled: true,
				ttl: 3600
			},
			sources: [],
			rules: []
		};
	}
	/**
	* Validate discovery configuration
	*/
	validate(config) {
		const errors = [];
		if (typeof config.enabled !== "boolean") errors.push("enabled must be a boolean");
		if (config.cache !== void 0) if (typeof config.cache !== "object" || config.cache === null) errors.push("cache must be an object");
		else {
			if (typeof config.cache.enabled !== "boolean") errors.push("cache.enabled must be a boolean");
			if (typeof config.cache.ttl !== "number" || config.cache.ttl <= 0) errors.push("cache.ttl must be a positive number");
		}
		if (config.sources !== void 0) if (!Array.isArray(config.sources)) errors.push("sources must be an array");
		else config.sources.forEach((source, index) => {
			if (typeof source.type !== "string") errors.push(`sources[${index}].type must be a string`);
			if (typeof source.path !== "string") errors.push(`sources[${index}].path must be a string`);
		});
		if (config.rules !== void 0) {
			if (!Array.isArray(config.rules)) errors.push("rules must be an array");
		}
		return {
			valid: errors.length === 0,
			errors
		};
	}
	/**
	* Merge partial configuration with defaults
	*/
	mergeWithDefaults(partial) {
		const defaults = this.getDefaultConfig();
		return {
			enabled: partial.enabled ?? defaults.enabled,
			cache: partial.cache ?? defaults.cache,
			sources: partial.sources ?? defaults.sources,
			rules: partial.rules ?? defaults.rules
		};
	}
};

//#endregion
//#region src/search-engine.ts
/**
* Search engine for tool discovery with relevance scoring
*/
var SearchEngine = class {
	tools = [];
	/**
	* Index tools for search
	* 
	* @param tools - Array of tool metadata to index
	*/
	index(tools) {
		this.tools = tools;
	}
	/**
	* Search for tools with relevance scoring
	* 
	* @param query - Search query
	* @param options - Search options
	* @returns Array of search results sorted by relevance
	*/
	search(query, options) {
		const queryLower = query.toLowerCase();
		const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 0);
		let filteredTools = this.tools;
		if (options?.server) filteredTools = filteredTools.filter((t) => t.server === options.server);
		if (!options?.includeDisabled) filteredTools = filteredTools.filter((t) => t.enabled);
		const results = [];
		for (const tool of filteredTools) {
			const relevance = this.calculateRelevance(tool, queryLower, queryTokens);
			if (relevance > 0) results.push({
				server: tool.server,
				tool: tool.name,
				summary: tool.summary,
				relevance,
				tags: tool.tags
			});
		}
		results.sort((a, b) => b.relevance - a.relevance);
		if (options?.limit && options.limit > 0) return results.slice(0, options.limit);
		return results;
	}
	/**
	* Calculate relevance score for a tool
	* 
	* @param tool - Tool metadata
	* @param query - Lowercase query string
	* @param queryTokens - Query split into tokens
	* @returns Relevance score (0-1)
	*/
	calculateRelevance(tool, query, queryTokens) {
		const toolNameLower = tool.name.toLowerCase();
		const summaryLower = tool.summary.toLowerCase();
		const tagsLower = tool.tags.map((t) => t.toLowerCase());
		let score = 0;
		if (toolNameLower === query) score += 1;
		else if (toolNameLower.includes(query)) score += .8;
		if (summaryLower.includes(query)) score += .6;
		for (const token of queryTokens) {
			if (toolNameLower.includes(token)) score += .4;
			if (summaryLower.includes(token)) score += .2;
		}
		for (const tag of tagsLower) {
			if (query.includes(tag) || tag.includes(query)) score += .3;
			for (const token of queryTokens) if (tag.includes(token)) score += .15;
		}
		return Math.min(score, 1);
	}
};

//#endregion
//#region ../rules/dist/index.js
/**
* Rule Engine - applies rules to objects
* 
* Note: T cannot have fields named 'and', 'or', or 'not' as they are reserved
* for logical operators. T must only contain primitive values (string, number, boolean)
* or arrays of primitives.
*/
var RuleEngine = class {
	constructor(rules, defaultRule) {
		this.rules = rules;
		this.defaultRule = defaultRule;
	}
	/**
	* Apply all matching rules to an object
	*/
	apply(item) {
		let result = this.defaultRule ? {
			...item,
			...this.defaultRule
		} : { ...item };
		for (const rule of this.rules) if (this.matches(item, rule.when)) {
			if (rule.set) result = {
				...result,
				...rule.set
			};
			if (rule.push) for (const key in rule.push) {
				const pushValue = rule.push[key];
				const currentValue = result[key];
				if (Array.isArray(currentValue) && Array.isArray(pushValue)) result = {
					...result,
					[key]: [...currentValue, ...pushValue]
				};
			}
		}
		return result;
	}
	/**
	* Apply rules to multiple objects
	*/
	applyAll(items) {
		return items.map((item) => this.apply(item));
	}
	/**
	* Check if an object matches a condition
	*/
	matches(item, condition) {
		if ("and" in condition && Array.isArray(condition.and)) return condition.and.every((c) => this.matches(item, c));
		if ("or" in condition && Array.isArray(condition.or)) return condition.or.some((c) => this.matches(item, c));
		if ("not" in condition && condition.not) return !this.matches(item, condition.not);
		const fieldCondition = condition;
		for (const key in fieldCondition) {
			const operator = fieldCondition[key];
			const value = item[key];
			if (!this.matchesOperator(value, operator)) return false;
		}
		return true;
	}
	/**
	* Check if a value matches a pattern (regex or exact match)
	*/
	matchesPattern(value, pattern) {
		if (pattern instanceof RegExp) return pattern.test(String(value));
		return value === pattern;
	}
	/**
	* Normalize shortcut syntax to full operator format
	*/
	normalizeOperator(operator) {
		if (!operator) return null;
		if (typeof operator === "object" && !Array.isArray(operator) && !(operator instanceof RegExp)) return operator;
		if (operator instanceof RegExp) return { match: operator };
		if (Array.isArray(operator)) return { in: operator };
		return { eq: operator };
	}
	/**
	* Check if a value matches an operator
	*/
	matchesOperator(value, operator) {
		const normalized = this.normalizeOperator(operator);
		if (!normalized) return true;
		const op = normalized;
		if ("eq" in op) return value === op["eq"];
		if ("in" in op && Array.isArray(op["in"])) {
			const inArray = op["in"];
			if (Array.isArray(value)) return value.some((v) => inArray.some((pattern) => this.matchesPattern(v, pattern)));
			return inArray.some((pattern) => this.matchesPattern(value, pattern));
		}
		if ("match" in op) {
			const matchValue = op["match"];
			return (Array.isArray(matchValue) ? matchValue : [matchValue]).some((pattern) => {
				if (pattern instanceof RegExp) return pattern.test(String(value));
				const regexPattern = String(pattern).replace(/\*/g, "___GLOB_STAR___").replace(/\?/g, "___GLOB_QUESTION___").replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/___GLOB_STAR___/g, ".*").replace(/___GLOB_QUESTION___/g, ".");
				return (/* @__PURE__ */ new RegExp(`^${regexPattern}$`)).test(String(value));
			});
		}
		return true;
	}
};

//#endregion
//#region src/tool-metadata-manager.ts
/**
* Tool metadata manager for storing and filtering tools
*/
var ToolMetadataManager = class {
	tools = /* @__PURE__ */ new Map();
	/**
	* Add or update a tool
	* 
	* @param tool - Tool metadata to add
	*/
	addTool(tool) {
		const key = this.getToolKey(tool.server, tool.name);
		this.tools.set(key, tool);
	}
	/**
	* Add multiple tools at once
	* 
	* @param tools - Array of tool metadata to add
	*/
	addTools(tools) {
		for (const tool of tools) this.addTool(tool);
	}
	/**
	* Clear all tools for a specific server
	* 
	* @param server - Server name
	*/
	clearServerTools(server) {
		const keysToDelete = [];
		for (const [key, tool] of this.tools.entries()) if (tool.server === server) keysToDelete.push(key);
		for (const key of keysToDelete) this.tools.delete(key);
	}
	/**
	* Clear all tools
	*/
	clearAll() {
		this.tools.clear();
	}
	/**
	* Get a specific tool
	* 
	* @param server - Server name
	* @param tool - Tool name
	* @returns Tool metadata or null if not found
	*/
	getTool(server, tool) {
		const key = this.getToolKey(server, tool);
		return this.tools.get(key) || null;
	}
	/**
	* Get all tools from a specific server
	* 
	* @param server - Server name
	* @param includeDisabled - Include disabled tools
	* @returns Array of tool metadata
	*/
	getToolsByServer(server, includeDisabled = false) {
		const tools = [];
		for (const tool of this.tools.values()) if (tool.server === server) {
			if (includeDisabled || tool.enabled) tools.push(tool);
		}
		return tools;
	}
	/**
	* Get all tools from all servers
	* 
	* @param includeDisabled - Include disabled tools
	* @returns Array of tool metadata
	*/
	getAllTools(includeDisabled = false) {
		const tools = [];
		for (const tool of this.tools.values()) if (includeDisabled || tool.enabled) tools.push(tool);
		return tools;
	}
	/**
	* Apply filtering rules to all tools using rule engine
	* 
	* @param rules - Array of rules from @anygpt/rules
	*/
	applyRules(rules) {
		if (!rules || rules.length === 0) return;
		const engine = new RuleEngine(rules);
		for (const tool of this.tools.values()) {
			const target = {
				server: tool.server,
				name: tool.name,
				enabled: tool.enabled,
				tags: [...tool.tags]
			};
			const result = engine.apply(target);
			tool.enabled = result.enabled;
			tool.tags = [...new Set(result.tags)];
		}
	}
	/**
	* Get total tool count for a server
	* 
	* @param server - Server name
	* @returns Total tool count
	*/
	getToolCount(server) {
		let count = 0;
		for (const tool of this.tools.values()) if (tool.server === server) count++;
		return count;
	}
	/**
	* Get enabled tool count for a server
	* 
	* @param server - Server name
	* @returns Enabled tool count
	*/
	getEnabledCount(server) {
		let count = 0;
		for (const tool of this.tools.values()) if (tool.server === server && tool.enabled) count++;
		return count;
	}
	/**
	* Generate a unique key for a tool
	* 
	* @param server - Server name
	* @param tool - Tool name
	* @returns Unique key
	*/
	getToolKey(server, tool) {
		return `${server}:${tool}`;
	}
};

//#endregion
//#region src/caching-layer.ts
/**
* Caching layer for discovery engine
* Supports TTL-based caching for servers and tool summaries
* Indefinite caching for tool details
*/
var CachingLayer = class {
	cache = /* @__PURE__ */ new Map();
	/**
	* Cache server list with TTL
	* 
	* @param servers - Array of server metadata
	* @param ttl - Time-to-live in seconds
	*/
	cacheServerList(servers, ttl) {
		this.cache.set("servers", {
			data: servers,
			expiresAt: Date.now() + ttl * 1e3
		});
	}
	/**
	* Get cached server list
	* 
	* @returns Cached server list or null if not cached/expired
	*/
	getServerList() {
		return this.get("servers");
	}
	/**
	* Cache tool summaries for a specific server with TTL
	* 
	* @param server - Server name
	* @param tools - Array of tool metadata
	* @param ttl - Time-to-live in seconds
	*/
	cacheToolSummaries(server, tools, ttl) {
		const key = `tools:${server}`;
		this.cache.set(key, {
			data: tools,
			expiresAt: Date.now() + ttl * 1e3
		});
	}
	/**
	* Get cached tool summaries for a specific server
	* 
	* @param server - Server name
	* @returns Cached tool summaries or null if not cached/expired
	*/
	getToolSummaries(server) {
		const key = `tools:${server}`;
		return this.get(key);
	}
	/**
	* Cache tool details indefinitely
	* 
	* @param server - Server name
	* @param tool - Tool name
	* @param details - Tool metadata with full details
	*/
	cacheToolDetails(server, tool, details) {
		const key = `tool:${server}:${tool}`;
		this.cache.set(key, {
			data: details,
			expiresAt: null
		});
	}
	/**
	* Get cached tool details
	* 
	* @param server - Server name
	* @param tool - Tool name
	* @returns Cached tool details or null if not cached
	*/
	getToolDetails(server, tool) {
		const key = `tool:${server}:${tool}`;
		return this.get(key);
	}
	/**
	* Invalidate a specific cache key
	* 
	* @param key - Cache key to invalidate (e.g., 'servers', 'tools:github')
	*/
	invalidate(key) {
		this.cache.delete(key);
	}
	/**
	* Invalidate all caches
	*/
	invalidateAll() {
		this.cache.clear();
	}
	/**
	* Get cached value if not expired
	* 
	* @param key - Cache key
	* @returns Cached value or null if not cached/expired
	*/
	get(key) {
		const entry = this.cache.get(key);
		if (!entry) return null;
		if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}
		return entry.data;
	}
};

//#endregion
//#region src/tool-execution-proxy.ts
/**
* Tool execution proxy for connecting to MCP servers
* 
* Note: This is the initial implementation that provides the interface.
* Full MCP SDK integration will be added in the next iteration.
*/
var ToolExecutionProxy = class {
	connections = /* @__PURE__ */ new Map();
	/**
	* Execute a tool on a remote MCP server
	* 
	* @param server - Server name
	* @param tool - Tool name
	* @param args - Tool arguments
	* @returns Execution result
	*/
	async execute(server, tool, args) {
		if (args === null || args === void 0) return {
			success: false,
			error: {
				code: "INVALID_ARGUMENTS",
				message: "Tool arguments cannot be null or undefined",
				server,
				tool
			}
		};
		if (!this.isConnected(server)) return {
			success: false,
			error: {
				code: "SERVER_NOT_CONNECTED",
				message: `Server ${server} is not connected`,
				server,
				tool
			}
		};
		return {
			success: false,
			error: {
				code: "NOT_IMPLEMENTED",
				message: "Tool execution proxy is not yet fully implemented",
				server,
				tool
			}
		};
	}
	/**
	* Connect to an MCP server
	* 
	* @param server - Server name
	* @param _config - Server configuration (unused in stub implementation)
	*/
	async connect(server, _config) {
		this.connections.set(server, true);
	}
	/**
	* Disconnect from an MCP server
	* 
	* @param server - Server name
	*/
	async disconnect(server) {
		this.connections.delete(server);
	}
	/**
	* Check if connected to a server
	* 
	* @param server - Server name
	* @returns true if connected
	*/
	isConnected(server) {
		return this.connections.get(server) === true;
	}
};

//#endregion
//#region src/mcp-client.ts
/**
* MCP Client Manager - handles connections to MCP servers
*/
var MCPClientManager = class {
	connections = /* @__PURE__ */ new Map();
	/**
	* Connect to an MCP server
	*/
	async connect(serverName, config) {
		let stderrOutput = "";
		try {
			const transport = new StdioClientTransport({
				command: config.command,
				args: config.args || [],
				env: config.env ? {
					...process.env,
					...config.env
				} : process.env,
				stderr: "pipe"
			});
			const stderrStream = transport.stderr;
			if (stderrStream) stderrStream.on("data", (chunk) => {
				stderrOutput += chunk.toString();
			});
			const client = new Client({
				name: "anygpt-discovery",
				version: "1.0.0"
			}, { capabilities: {} });
			await client.connect(transport);
			const connection = {
				client,
				transport,
				serverName,
				status: "connected"
			};
			this.connections.set(serverName, connection);
			return connection;
		} catch (error) {
			let errorMessage = stderrOutput.trim();
			if (!errorMessage && error instanceof Error) {
				errorMessage = error.message;
				if (errorMessage.includes("ENOENT")) errorMessage = `Command not found: ${config.command}`;
				else if (errorMessage.includes("EACCES")) errorMessage = `Permission denied: ${config.command}`;
				else if (errorMessage.includes("spawn")) errorMessage = `Failed to spawn: ${config.command} ${config.args?.join(" ") || ""}`;
			} else if (!errorMessage) errorMessage = String(error);
			const errorConnection = {
				client: null,
				transport: null,
				serverName,
				status: "error",
				error: errorMessage || "Unknown error"
			};
			this.connections.set(serverName, errorConnection);
			return errorConnection;
		}
	}
	/**
	* Disconnect from an MCP server
	*/
	async disconnect(serverName) {
		const connection = this.connections.get(serverName);
		if (connection) try {
			if (connection.status === "connected" && connection.client) await connection.client.close();
			if (connection.transport) await connection.transport.close();
			connection.status = "disconnected";
		} catch (error) {}
		this.connections.delete(serverName);
	}
	/**
	* Disconnect from all servers
	*/
	async disconnectAll() {
		const disconnectPromises = Array.from(this.connections.keys()).map((name) => this.disconnect(name));
		await Promise.all(disconnectPromises);
	}
	/**
	* Get connection for a server
	*/
	getConnection(serverName) {
		return this.connections.get(serverName);
	}
	/**
	* List tools from a connected server
	*/
	async listTools(serverName) {
		const connection = this.connections.get(serverName);
		if (!connection || connection.status !== "connected") return [];
		try {
			return (await connection.client.listTools()).tools.map((tool) => ({
				name: tool.name,
				summary: tool.description || "",
				description: tool.description,
				server: serverName,
				enabled: true,
				tags: [],
				inputSchema: tool.inputSchema
			}));
		} catch (error) {
			console.error(`Failed to list tools from ${serverName}:`, error);
			return [];
		}
	}
	/**
	* Execute a tool on a connected server
	*/
	async executeTool(serverName, toolName, args) {
		const connection = this.connections.get(serverName);
		if (!connection || connection.status !== "connected") throw new Error(`Server ${serverName} is not connected`);
		try {
			return await connection.client.callTool({
				name: toolName,
				arguments: args
			});
		} catch (error) {
			throw new Error(`Failed to execute tool ${toolName} on ${serverName}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	/**
	* Check if a server is connected
	*/
	isConnected(serverName) {
		return this.connections.get(serverName)?.status === "connected";
	}
	/**
	* Get all connection statuses
	*/
	getConnectionStatuses() {
		const statuses = /* @__PURE__ */ new Map();
		for (const [name, conn] of this.connections.entries()) statuses.set(name, conn.status);
		return statuses;
	}
};

//#endregion
//#region src/discovery-engine.ts
/**
* Main discovery engine facade that coordinates all components
*/
var DiscoveryEngine = class {
	config;
	mcpServers;
	searchEngine;
	metadataManager;
	cache;
	executionProxy;
	clientManager;
	initialized = false;
	constructor(config, mcpServers) {
		this.config = config;
		this.mcpServers = mcpServers || {};
		this.searchEngine = new SearchEngine();
		this.metadataManager = new ToolMetadataManager();
		this.cache = new CachingLayer();
		this.executionProxy = new ToolExecutionProxy();
		this.clientManager = new MCPClientManager();
		this.applyConfiguration();
	}
	/**
	* Initialize connections and discover tools from all servers
	* 
	* @param onProgress - Optional callback for progress updates
	*/
	async initialize(onProgress) {
		if (this.initialized) return;
		const { Readable } = await import("node:stream");
		const serverEntries = Object.entries(this.mcpServers);
		await Readable.from(serverEntries).map(async ([name, config]) => {
			if (config.enabled === false) {
				onProgress?.({
					server: name,
					status: "error",
					error: "Server is disabled"
				});
				return;
			}
			try {
				onProgress?.({
					server: name,
					status: "connecting",
					message: "Connecting to server..."
				});
				const connection = await this.clientManager.connect(name, config);
				if (connection.status === "connected") {
					onProgress?.({
						server: name,
						status: "discovering",
						message: "Discovering tools..."
					});
					const tools = await this.clientManager.listTools(name);
					this.metadataManager.addTools(tools);
					onProgress?.({
						server: name,
						status: "connected",
						toolCount: tools.length
					});
				} else onProgress?.({
					server: name,
					status: "error",
					error: connection.error || "Failed to connect"
				});
			} catch (error) {
				onProgress?.({
					server: name,
					status: "error",
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}, { concurrency: 5 }).toArray();
		if (this.config.rules && this.config.rules.length > 0) this.metadataManager.applyRules(this.config.rules);
		this.initialized = true;
	}
	/**
	* List all available MCP servers
	* 
	* @returns Array of server metadata
	*/
	async listServers() {
		await this.initialize();
		if (this.config.cache?.enabled) {
			const cached = this.cache.getServerList();
			if (cached) return cached;
		}
		const statuses = this.clientManager.getConnectionStatuses();
		const servers = Object.entries(this.mcpServers).map(([name, config]) => {
			const tools = this.metadataManager.getToolsByServer(name, true);
			const enabledTools = tools.filter((t) => t.enabled);
			return {
				name,
				description: config.description || `MCP server: ${name}`,
				toolCount: tools.length,
				enabledCount: enabledTools.length,
				status: statuses.get(name) || "disconnected",
				config: {
					command: config.command,
					args: config.args || [],
					env: config.env
				}
			};
		});
		if (this.config.cache?.enabled && this.config.cache.ttl) this.cache.cacheServerList(servers, this.config.cache.ttl);
		return servers;
	}
	/**
	* Search for tools across all servers
	* 
	* @param query - Search query
	* @param options - Search options
	* @returns Array of search results
	*/
	async searchTools(query, options) {
		await this.initialize();
		const tools = this.metadataManager.getAllTools(options?.includeDisabled);
		this.searchEngine.index(tools);
		return this.searchEngine.search(query, options);
	}
	/**
	* List tools from a specific server
	* 
	* @param server - Server name
	* @param includeDisabled - Include disabled tools
	* @returns Array of tool metadata
	*/
	async listTools(server, includeDisabled = false) {
		await this.initialize();
		if (this.config.cache?.enabled && !includeDisabled) {
			const cached = this.cache.getToolSummaries(server);
			if (cached) return cached;
		}
		const tools = this.metadataManager.getToolsByServer(server, includeDisabled);
		if (this.config.cache?.enabled && this.config.cache.ttl && !includeDisabled) this.cache.cacheToolSummaries(server, tools, this.config.cache.ttl);
		return tools;
	}
	/**
	* Get detailed information about a specific tool
	* 
	* @param server - Server name
	* @param tool - Tool name
	* @returns Tool metadata or null if not found
	*/
	async getToolDetails(server, tool) {
		if (this.config.cache?.enabled) {
			const cached = this.cache.getToolDetails(server, tool);
			if (cached) return cached;
		}
		const toolMetadata = this.metadataManager.getTool(server, tool);
		if (this.config.cache?.enabled && toolMetadata) this.cache.cacheToolDetails(server, tool, toolMetadata);
		return toolMetadata;
	}
	/**
	* Execute a tool from any discovered MCP server
	* 
	* @param server - Server name
	* @param tool - Tool name
	* @param args - Tool arguments
	* @returns Execution result
	*/
	async executeTool(server, tool, args) {
		await this.initialize();
		const toolMetadata = this.metadataManager.getTool(server, tool);
		if (!toolMetadata) return {
			success: false,
			error: {
				code: "TOOL_NOT_FOUND",
				message: `Tool ${tool} not found on server ${server}`,
				server,
				tool
			}
		};
		if (!toolMetadata.enabled) return {
			success: false,
			error: {
				code: "TOOL_DISABLED",
				message: `Tool ${tool} is disabled`,
				server,
				tool
			}
		};
		try {
			return {
				success: true,
				result: await this.clientManager.executeTool(server, tool, args)
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "EXECUTION_ERROR",
					message: error instanceof Error ? error.message : String(error),
					server,
					tool
				}
			};
		}
	}
	/**
	* Reload configuration
	*/
	async reload() {
		await this.clientManager.disconnectAll();
		this.cache.invalidateAll();
		this.metadataManager.clearAll();
		this.initialized = false;
		await this.initialize();
	}
	/**
	* Cleanup and disconnect from all servers
	*/
	async dispose() {
		await this.clientManager.disconnectAll();
		this.initialized = false;
	}
	/**
	* Get current configuration
	* 
	* @returns Current discovery configuration
	*/
	getConfig() {
		return this.config;
	}
	/**
	* Apply configuration to components
	*/
	applyConfiguration() {
		if (this.config.rules && this.config.rules.length > 0) this.metadataManager.applyRules(this.config.rules);
	}
};

//#endregion
export { CachingLayer, ConfigurationLoader, DiscoveryEngine, MCPClientManager, SearchEngine, ToolExecutionProxy, ToolMetadataManager };
//# sourceMappingURL=index.js.map