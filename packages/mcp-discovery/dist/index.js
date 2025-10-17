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
export { ConfigurationLoader, PatternMatcher, SearchEngine, ToolMetadataManager };
//# sourceMappingURL=index.js.map