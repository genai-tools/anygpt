import "minimatch";

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
			toolRules: []
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
		if (config.toolRules !== void 0) if (!Array.isArray(config.toolRules)) errors.push("toolRules must be an array");
		else config.toolRules.forEach((rule, index) => {
			if (!Array.isArray(rule.pattern)) errors.push(`toolRules[${index}].pattern must be an array`);
			if (rule.server !== void 0 && typeof rule.server !== "string") errors.push(`toolRules[${index}].server must be a string`);
			if (rule.enabled !== void 0 && typeof rule.enabled !== "boolean") errors.push(`toolRules[${index}].enabled must be a boolean`);
			if (rule.tags !== void 0 && !Array.isArray(rule.tags)) errors.push(`toolRules[${index}].tags must be an array`);
		});
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
			toolRules: partial.toolRules ?? defaults.toolRules
		};
	}
};

//#endregion
//#region ../config/dist/index.js
var ConnectorRegistry = class {
	factories = /* @__PURE__ */ new Map();
	registerConnector(factory) {
		const connectorType = factory.getProviderId();
		if (!this.factories.has(connectorType)) this.factories.set(connectorType, factory);
	}
	createConnector(providerId, config$1 = {}) {
		const factory = this.factories.get(providerId);
		if (!factory) throw new Error(`No connector registered for provider: ${providerId}`);
		return factory.create(config$1);
	}
	getConnector(providerId, config$1 = {}) {
		return this.createConnector(providerId, config$1);
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
/**
* Simple glob pattern matcher for model filtering
* Supports: *, ?, [abc], {a,b,c}, ! for negation, and regex patterns
* 
* Regex patterns should be wrapped in /.../ or /.../<flags>
* Examples:
*   - /gpt-[45]/ - matches gpt-4 or gpt-5
*   - /^claude.*sonnet$/i - case-insensitive match
*/
/**
* Check if a pattern is a regex pattern (wrapped in /.../)
*/
function isRegexPattern(pattern) {
	return pattern.startsWith("/") && pattern.lastIndexOf("/") > 0;
}
/**
* Parse a regex pattern string into a RegExp object
*/
function parseRegexPattern(pattern) {
	const lastSlash = pattern.lastIndexOf("/");
	const regexBody = pattern.substring(1, lastSlash);
	const flags = pattern.substring(lastSlash + 1);
	return new RegExp(regexBody, flags || "i");
}
/**
* Convert a glob pattern to a regular expression
*/
function globToRegex(pattern) {
	const regex = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\{([^}]+)\}/g, (_, group) => `(${group.replace(/,/g, "|")})`).replace(/\\\[([^\]]+)\\\]/g, "[$1]").replace(/\*/g, ".*").replace(/\?/g, ".");
	return new RegExp(`^${regex}$`, "i");
}
/**
* Check if a model ID matches any of the glob/regex patterns
* Supports negation patterns starting with !, regex patterns wrapped in /.../, and RegExp objects
* 
* @param modelId - The model ID to test
* @param patterns - Array of glob strings, regex strings, or RegExp objects (can include negation patterns with !)
* @returns true if the model matches (considering both positive and negative patterns)
*/
function matchesGlobPatterns(modelId, patterns) {
	if (!patterns || patterns.length === 0) return true;
	const positivePatterns = [];
	const negativePatterns = [];
	for (const pattern of patterns) {
		if (pattern instanceof RegExp) {
			positivePatterns.push(pattern);
			continue;
		}
		if (pattern.startsWith("!")) {
			const actualPattern = pattern.substring(1);
			if (isRegexPattern(actualPattern)) negativePatterns.push(parseRegexPattern(actualPattern));
			else negativePatterns.push(globToRegex(actualPattern));
		} else if (isRegexPattern(pattern)) positivePatterns.push(parseRegexPattern(pattern));
		else positivePatterns.push(globToRegex(pattern));
	}
	for (const negPattern of negativePatterns) if (negPattern.test(modelId)) return false;
	if (positivePatterns.length === 0) return true;
	for (const posPattern of positivePatterns) if (posPattern.test(modelId)) return true;
	return false;
}

//#endregion
//#region src/pattern-matcher.ts
/**
* Pattern matcher for tool filtering
* Reuses glob-matcher from @anygpt/config
*/
var PatternMatcher = class {
	/**
	* Check if a tool name matches any of the patterns
	* 
	* @param toolName - Tool name to match
	* @param patterns - Array of glob or regex patterns
	* @returns true if tool matches any pattern
	*/
	matchTool(toolName, patterns) {
		return matchesGlobPatterns(toolName, patterns);
	}
	/**
	* Check if a tool matches a specific rule
	* 
	* @param toolName - Tool name to match
	* @param serverName - Server name
	* @param rule - Tool rule to check
	* @returns true if tool matches the rule
	*/
	matchRule(toolName, serverName, rule) {
		if (rule.server && rule.server !== serverName) return false;
		return this.matchTool(toolName, rule.pattern);
	}
	/**
	* Find all rules that match a tool
	* 
	* @param toolName - Tool name to match
	* @param serverName - Server name
	* @param rules - Array of tool rules
	* @returns Array of matching rules
	*/
	findMatchingRules(toolName, serverName, rules) {
		return rules.filter((rule) => this.matchRule(toolName, serverName, rule));
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
//#region src/tool-metadata-manager.ts
/**
* Tool metadata manager for storing and filtering tools
*/
var ToolMetadataManager = class {
	tools = /* @__PURE__ */ new Map();
	patternMatcher = new PatternMatcher();
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
	* Apply filtering rules to all tools
	* 
	* @param rules - Array of tool rules
	*/
	applyRules(rules) {
		const hasWhitelist = rules.some((r) => r.enabled === true);
		for (const tool of this.tools.values()) {
			let enabled = !hasWhitelist;
			const tags = [...tool.tags];
			for (const rule of rules) {
				if (!this.patternMatcher.matchRule(tool.name, tool.server, rule)) continue;
				if (rule.enabled !== void 0) enabled = rule.enabled;
				if (rule.tags) tags.push(...rule.tags);
			}
			tool.enabled = enabled;
			tool.tags = [...new Set(tags)];
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
	constructor(config, mcpServers) {
		this.config = config;
		this.mcpServers = mcpServers || {};
		this.searchEngine = new SearchEngine();
		this.metadataManager = new ToolMetadataManager();
		this.cache = new CachingLayer();
		this.executionProxy = new ToolExecutionProxy();
		this.applyConfiguration();
	}
	/**
	* List all available MCP servers
	* 
	* @returns Array of server metadata
	*/
	async listServers() {
		if (this.config.cache?.enabled) {
			const cached = this.cache.getServerList();
			if (cached) return cached;
		}
		const servers = Object.entries(this.mcpServers).map(([name, config]) => {
			const tools = this.metadataManager.getToolsByServer(name, true);
			const enabledTools = tools.filter((t) => t.enabled);
			return {
				name,
				description: config.description || `MCP server: ${name}`,
				toolCount: tools.length,
				enabledCount: enabledTools.length,
				status: "connected",
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
		return this.executionProxy.execute(server, tool, args);
	}
	/**
	* Reload configuration
	*/
	async reload() {
		this.cache.invalidateAll();
		this.applyConfiguration();
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
		if (this.config.toolRules && this.config.toolRules.length > 0) this.metadataManager.applyRules(this.config.toolRules);
	}
};

//#endregion
export { CachingLayer, ConfigurationLoader, DiscoveryEngine, PatternMatcher, SearchEngine, ToolExecutionProxy, ToolMetadataManager };
//# sourceMappingURL=index.js.map