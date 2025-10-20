import { Command } from "commander";
import { existsSync, mkdirSync, promises, writeFileSync } from "fs";
import { extname, join } from "path";
import { homedir } from "os";
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto";
import { buildTagRegistry, listAvailableTags, resolveConfig, resolveModel, resolveModelConfig, setupRouter, setupRouterFromFactory } from "@anygpt/config";
import { GenAIGateway } from "@anygpt/router";
import { pathToFileURL } from "url";
import * as readline from "node:readline";
import { AIProvider } from "@anygpt/ai-provider";
import { Readable } from "stream";
import { DiscoveryEngine } from "@anygpt/mcp-discovery";
import logUpdate from "log-update";
import chalk from "chalk";

//#region src/utils/encryption.ts
const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 1e5;
/**
* Derive encryption key from password using PBKDF2
*/
function deriveKey(password, salt) {
	return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
}
/**
* Encrypt data using AES-256-CBC with password-derived key
*/
function encrypt(data, password) {
	const salt = randomBytes(SALT_LENGTH);
	const iv = randomBytes(IV_LENGTH);
	const key = deriveKey(password, salt);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	let encrypted = cipher.update(data, "utf8", "base64");
	encrypted += cipher.final("base64");
	return {
		encrypted,
		salt: salt.toString("base64"),
		iv: iv.toString("base64")
	};
}
/**
* Decrypt data using AES-256-CBC with password-derived key
*/
function decrypt(encryptedData, password) {
	const salt = Buffer.from(encryptedData.salt, "base64");
	const iv = Buffer.from(encryptedData.iv, "base64");
	const key = deriveKey(password, salt);
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	let decrypted = decipher.update(encryptedData.encrypted, "base64", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}
/**
* Generate a secure random password for automatic encryption
*/
function generateSecurePassword() {
	return randomBytes(32).toString("base64");
}

//#endregion
//#region src/utils/keyManager.ts
const ANYGPT_DIR = join(homedir(), ".anygpt");
const KEY_FILE = join(ANYGPT_DIR, ".encryption-key");
/**
* Get or create encryption key for conversations
* Priority: ENV var > stored key file > generate new key
*/
async function getEncryptionKey() {
	const envKey = process.env.ANYGPT_ENCRYPTION_KEY;
	if (envKey) return envKey;
	try {
		return (await promises.readFile(KEY_FILE, "utf-8")).trim();
	} catch {}
	const newKey = generateSecurePassword();
	await ensureAnygptDir();
	await promises.writeFile(KEY_FILE, newKey, { mode: 384 });
	console.log("🔐 Generated new encryption key for conversation storage");
	console.log("💡 Key stored securely in ~/.anygpt/.encryption-key");
	return newKey;
}
/**
* Check if encryption is enabled
*/
function isEncryptionEnabled() {
	return process.env.ANYGPT_NO_ENCRYPTION !== "true";
}
/**
* Ensure .anygpt directory exists
*/
async function ensureAnygptDir() {
	try {
		await promises.mkdir(ANYGPT_DIR, {
			recursive: true,
			mode: 448
		});
	} catch {}
}

//#endregion
//#region src/utils/conversations.ts
const CONVERSATIONS_DIR = join(homedir(), ".anygpt");
const CONVERSATIONS_FILE = join(CONVERSATIONS_DIR, "conversations.json");
function getConversationMessagesFile(conversationId) {
	return join(CONVERSATIONS_DIR, `${conversationId}.messages.json`);
}
/**
* Ensure the conversations directory exists
*/
async function ensureConversationsDir() {
	try {
		await promises.mkdir(CONVERSATIONS_DIR, { recursive: true });
	} catch (error) {}
}
/**
* Load conversations from storage
*/
async function loadConversations() {
	await ensureConversationsDir();
	try {
		const data = await promises.readFile(CONVERSATIONS_FILE, "utf-8");
		return JSON.parse(data);
	} catch (error) {
		return { conversations: {} };
	}
}
/**
* Save conversations to storage
*/
async function saveConversations(storage) {
	await ensureConversationsDir();
	await promises.writeFile(CONVERSATIONS_FILE, JSON.stringify(storage, null, 2));
}
/**
* Create a new conversation
*/
async function createConversation(name, provider, model, responseId) {
	const storage = await loadConversations();
	const id = generateConversationId();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	storage.conversations[id] = {
		id,
		name,
		provider,
		model,
		lastResponseId: responseId,
		createdAt: now,
		updatedAt: now,
		messageCount: 0,
		totalTokens: 0,
		inputTokens: 0,
		outputTokens: 0
	};
	await saveConversations(storage);
	return id;
}
/**
* Update conversation with new response
*/
async function updateConversation(conversationId, responseId) {
	const storage = await loadConversations();
	if (!storage.conversations[conversationId]) throw new Error(`Conversation ${conversationId} not found`);
	storage.conversations[conversationId].lastResponseId = responseId;
	storage.conversations[conversationId].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
	storage.conversations[conversationId].messageCount++;
	await saveConversations(storage);
}
/**
* Update conversation with token usage
*/
async function updateConversationTokens(conversationId, inputTokens, outputTokens, totalTokens) {
	const storage = await loadConversations();
	if (!storage.conversations[conversationId]) throw new Error(`Conversation ${conversationId} not found`);
	const conversation$1 = storage.conversations[conversationId];
	conversation$1.inputTokens += inputTokens;
	conversation$1.outputTokens += outputTokens;
	conversation$1.totalTokens += totalTokens;
	conversation$1.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
	await saveConversations(storage);
}
/**
* Replace all messages in a conversation
*/
async function replaceConversationMessages(conversationId, newMessages) {
	await ensureConversationsDir();
	const messagesFile = getConversationMessagesFile(conversationId);
	const conversationMessages = { messages: newMessages };
	const dataToWrite = JSON.stringify(conversationMessages, null, 2);
	if (isEncryptionEnabled()) {
		const key = await getEncryptionKey();
		const encryptedData = encrypt(dataToWrite, key);
		await promises.writeFile(messagesFile, JSON.stringify(encryptedData, null, 2), { mode: 384 });
	} else await promises.writeFile(messagesFile, dataToWrite, { mode: 384 });
}
/**
* Get conversation by ID
*/
async function getConversation(conversationId) {
	return (await loadConversations()).conversations[conversationId] || null;
}
/**
* List all conversations
*/
async function listConversations() {
	const storage = await loadConversations();
	return Object.values(storage.conversations).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
/**
* Delete a conversation
*/
async function deleteConversation(conversationId) {
	const storage = await loadConversations();
	if (!storage.conversations[conversationId]) throw new Error(`Conversation ${conversationId} not found`);
	delete storage.conversations[conversationId];
	await saveConversations(storage);
}
/**
* Generate a unique conversation ID
*/
function generateConversationId() {
	return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
* Find conversation by name (partial match)
*/
async function findConversationByName(name) {
	const storage = await loadConversations();
	const conversations = Object.values(storage.conversations);
	let found = conversations.find((conv) => conv.name.toLowerCase() === name.toLowerCase());
	if (!found) found = conversations.find((conv) => conv.name.toLowerCase().includes(name.toLowerCase()));
	return found || null;
}
/**
* Add a message to a conversation
*/
async function addMessageToConversation(conversationId, role, content) {
	await ensureConversationsDir();
	const messagesFile = getConversationMessagesFile(conversationId);
	let conversationMessages;
	try {
		const fileContent = await promises.readFile(messagesFile, "utf-8");
		if (isEncryptionEnabled()) try {
			const encryptedData = JSON.parse(fileContent);
			const key = await getEncryptionKey();
			const decryptedContent = decrypt(encryptedData, key);
			conversationMessages = JSON.parse(decryptedContent);
		} catch {
			conversationMessages = JSON.parse(fileContent);
		}
		else conversationMessages = JSON.parse(fileContent);
	} catch {
		conversationMessages = { messages: [] };
	}
	conversationMessages.messages.push({
		role,
		content,
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	});
	const dataToWrite = JSON.stringify(conversationMessages, null, 2);
	if (isEncryptionEnabled()) {
		const key = await getEncryptionKey();
		const encryptedData = encrypt(dataToWrite, key);
		await promises.writeFile(messagesFile, JSON.stringify(encryptedData, null, 2), { mode: 384 });
	} else await promises.writeFile(messagesFile, dataToWrite, { mode: 384 });
}
/**
* Get all messages from a conversation
*/
async function getConversationMessages(conversationId) {
	const messagesFile = getConversationMessagesFile(conversationId);
	try {
		const fileContent = await promises.readFile(messagesFile, "utf-8");
		let conversationMessages;
		if (isEncryptionEnabled()) try {
			const encryptedData = JSON.parse(fileContent);
			const key = await getEncryptionKey();
			const decryptedContent = decrypt(encryptedData, key);
			conversationMessages = JSON.parse(decryptedContent);
		} catch {
			conversationMessages = JSON.parse(fileContent);
		}
		else conversationMessages = JSON.parse(fileContent);
		return conversationMessages.messages;
	} catch {
		return [];
	}
}

//#endregion
//#region src/utils/cli-context.ts
var ConsoleLogger = class {
	constructor(logLevel = "quiet") {
		this.logLevel = logLevel;
	}
	getLogLevel() {
		if (process.env.VERBOSE === "debug") return "debug";
		if (process.env.VERBOSE === "true") return "info";
		const verboseIndex = process.argv.findIndex((arg) => arg === "--verbose" || arg === "-v");
		if (verboseIndex !== -1) {
			if (process.argv[verboseIndex + 1] === "debug") return "debug";
			return "info";
		}
		return this.logLevel;
	}
	debug(message, ...args) {
		if (this.getLogLevel() === "debug") console.log("[DEBUG]", message, ...args);
	}
	info(message, ...args) {
		const level = this.getLogLevel();
		if (level === "info" || level === "debug") console.log(message, ...args);
	}
	warn(message, ...args) {
		console.warn(message, ...args);
	}
	error(message, ...args) {
		console.error(message, ...args);
	}
};
const consoleLogger = new ConsoleLogger();
/**
* Global config and router setup - shared by all commands
*/
async function setupCLIContext(configPath) {
	try {
		const resolvedConfigPath = configPath || "./.anygpt/anygpt.config.ts";
		let loadedConfig = (await import(new URL(resolvedConfigPath, `file://${process.cwd()}/`).href)).default;
		loadedConfig = await resolveConfig(loadedConfig);
		if (loadedConfig.providers && Object.values(loadedConfig.providers).some((p) => typeof p === "object" && p !== null && "connector" in p && typeof p.connector === "object" && p.connector !== null && "client" in p.connector)) {
			const { router, config } = await setupRouterFromFactory(loadedConfig, consoleLogger);
			consoleLogger.debug("Building tag registry...");
			const tagRegistry = await buildTagRegistry(config.providers || {}, config.defaults?.modelRules);
			consoleLogger.debug(`Tag registry built with ${tagRegistry.tags.size} tags`);
			return {
				router,
				config: loadedConfig,
				configSource: resolvedConfigPath,
				providers: config.providers || {},
				tagRegistry,
				logger: consoleLogger,
				defaults: {
					provider: config.defaults?.provider,
					model: config.defaults?.model,
					timeout: config.defaults?.timeout,
					maxRetries: config.defaults?.maxRetries,
					logging: config.defaults?.logging,
					providers: config.defaults?.providers,
					aliases: config.defaults?.aliases,
					modelRules: config.defaults?.modelRules
				}
			};
		} else return {
			router: null,
			config: loadedConfig,
			configSource: resolvedConfigPath,
			providers: {},
			logger: consoleLogger,
			defaults: {
				provider: loadedConfig.settings?.defaultProvider,
				model: void 0
			}
		};
	} catch {
		const { router, config } = await setupRouter({ configPath }, consoleLogger);
		return {
			router,
			config,
			configSource: configPath || "fallback config search",
			providers: {},
			logger: consoleLogger,
			defaults: {
				provider: config.settings?.defaultProvider,
				model: void 0
			}
		};
	}
}
/**
* Wrapper for command actions that need CLI context
*/
function withCLIContext(commandFn) {
	return async (...args) => {
		let currentCommand = args[args.length - 1];
		while (currentCommand.parent && typeof currentCommand.parent === "object" && "opts" in currentCommand.parent) currentCommand = currentCommand.parent;
		const globalOpts = currentCommand.opts?.() || {};
		try {
			const context = await setupCLIContext(globalOpts.config);
			await commandFn(context, ...args);
		} catch (error) {
			console.error("Error:", error instanceof Error ? error.message : error);
			process.exit(1);
		}
	};
}

//#endregion
//#region src/commands/conversation/state.ts
const STATE_FILE = join(homedir(), ".anygpt", "current-conversation");
async function setCurrentConversation(conversationId) {
	try {
		await promises.mkdir(join(homedir(), ".anygpt"), { recursive: true });
		await promises.writeFile(STATE_FILE, conversationId);
	} catch {
		console.error("Error setting current conversation");
	}
}
async function getCurrentConversation() {
	try {
		return (await promises.readFile(STATE_FILE, "utf-8")).trim() || null;
	} catch {
		return null;
	}
}
async function clearCurrentConversation() {
	try {
		await promises.unlink(STATE_FILE);
	} catch {}
}

//#endregion
//#region src/commands/conversation/start.ts
async function conversationStartCommand(options, configPath) {
	const context = await setupCLIContext(configPath);
	const provider = options.provider || context.defaults.provider;
	const model = options.model || context.defaults.model;
	if (!provider) throw new Error("No provider specified. Either provide --provider or set defaults.provider in config.");
	if (!model) throw new Error("No model specified. Either provide --model or set defaults.model in config.");
	const name = options.name || `${provider}/${model} - ${(/* @__PURE__ */ new Date()).toLocaleString()}`;
	const conversationId = await createConversation(name, provider, model, "pending");
	console.log(`🎯 Started new conversation: ${name}`);
	console.log(`📝 Conversation ID: ${conversationId}`);
	console.log(`💡 Use 'anygpt conversation message "your message"' to chat`);
	await setCurrentConversation(conversationId);
}

//#endregion
//#region src/commands/conversation/end.ts
async function conversationEndCommand() {
	const currentId = await getCurrentConversation();
	if (!currentId) {
		console.log("❌ No active conversation to end");
		return;
	}
	const conversation$1 = await getConversation(currentId);
	if (conversation$1) {
		console.log(`✅ Ended conversation: ${conversation$1.name}`);
		console.log(`📊 Messages: ${conversation$1.messageCount}`);
	}
	await clearCurrentConversation();
}

//#endregion
//#region src/commands/conversation/list.ts
async function conversationListCommand() {
	const conversations = await listConversations();
	if (conversations.length === 0) {
		console.log("📭 No conversations found");
		return;
	}
	const currentId = await getCurrentConversation();
	console.log("📋 Conversations:");
	console.log("");
	for (const conv of conversations) {
		const isActive = conv.id === currentId ? "🟢" : "⚪";
		const updatedAt = new Date(conv.updatedAt).toLocaleString();
		console.log(`${isActive} ${conv.name}`);
		console.log(`   ID: ${conv.id}`);
		console.log(`   Provider: ${conv.provider}/${conv.model}`);
		console.log(`   Messages: ${conv.messageCount}`);
		console.log(`   Tokens: ${conv.totalTokens || 0} total (${conv.inputTokens || 0} input, ${conv.outputTokens || 0} output)`);
		console.log(`   Updated: ${updatedAt}`);
		console.log("");
	}
}

//#endregion
//#region src/commands/conversation/message.ts
async function conversationMessageCommand(message, options, configPath) {
	let targetConversationId = options.conversation;
	if (!targetConversationId) targetConversationId = await getCurrentConversation() || void 0;
	const context = await setupCLIContext(configPath);
	if (!context.router) throw new Error("Failed to initialize router");
	let conversation$1;
	if (!targetConversationId) {
		console.log("🚀 No active conversation found. Starting a new one...");
		const provider = context.defaults.provider;
		const model = context.defaults.model;
		if (!provider) throw new Error("No default provider configured. Please configure a default provider or specify --conversation <id>.");
		if (!model) throw new Error("No default model configured. Please configure a default model or specify --conversation <id>.");
		const name = `${provider}/${model} - ${(/* @__PURE__ */ new Date()).toLocaleString()}`;
		targetConversationId = await createConversation(name, provider, model, "pending");
		console.log(`🎯 Started new conversation: ${name}`);
		console.log(`📝 Conversation ID: ${targetConversationId}`);
		await setCurrentConversation(targetConversationId);
		conversation$1 = await getConversation(targetConversationId);
	} else {
		conversation$1 = await getConversation(targetConversationId);
		if (!conversation$1) conversation$1 = await findConversationByName(targetConversationId);
		if (!conversation$1) throw new Error(`Conversation '${targetConversationId}' not found`);
	}
	const validConversation = conversation$1;
	console.log(`🔄 ${validConversation.name}`);
	console.log(`👤 ${message}`);
	await handleChatApi(context.router, validConversation, message);
}
async function handleChatApi(router, conversation$1, message) {
	const messages = [...(await getConversationMessages(conversation$1.id)).map((msg) => ({
		role: msg.role,
		content: msg.content
	})), {
		role: "user",
		content: message
	}];
	await addMessageToConversation(conversation$1.id, "user", message);
	const response = await router.chatCompletion({
		provider: conversation$1.provider,
		model: conversation$1.model,
		messages
	});
	const assistantMessage = response.choices[0].message.content || "";
	await updateConversationTokens(conversation$1.id, response.usage.prompt_tokens || 0, response.usage.completion_tokens || 0, response.usage.total_tokens);
	const updatedConversation = await getConversation(conversation$1.id);
	console.log(`🤖 ${assistantMessage}`);
	console.log(`📊 Current: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
	console.log(`📈 Total: ${updatedConversation?.inputTokens || 0} input + ${updatedConversation?.outputTokens || 0} output = ${updatedConversation?.totalTokens || 0} tokens`);
	console.log(`💬 Context: ${messages.length} messages (Chat API + local context)`);
	await addMessageToConversation(conversation$1.id, "assistant", assistantMessage);
	await updateConversation(conversation$1.id, "chat-with-context");
}

//#endregion
//#region src/commands/conversation/context.ts
/**
* Show detailed context statistics for a conversation
*/
async function conversationContextCommand(options = {}) {
	let targetConversationId = options.conversation;
	if (!targetConversationId) targetConversationId = await getCurrentConversation() || void 0;
	if (!targetConversationId) throw new Error("No active conversation. Use --conversation <id> or start a conversation first.");
	const conversation$1 = await getConversation(targetConversationId);
	if (!conversation$1) throw new Error(`Conversation ${targetConversationId} not found`);
	const messages = await getConversationMessages(targetConversationId);
	const stats = calculateContextStats(messages, conversation$1);
	displayContextStats(conversation$1, stats);
}
function calculateContextStats(messages, conversation$1) {
	const userMessages = messages.filter((m) => m.role === "user");
	const assistantMessages = messages.filter((m) => m.role === "assistant");
	const systemMessages = messages.filter((m) => m.role === "system");
	const totalCharacters = messages.reduce((sum, msg) => sum + msg.content.length, 0);
	const messageLengths = messages.map((msg) => msg.content.length);
	const createdAt = new Date(conversation$1.createdAt);
	const updatedAt = new Date(conversation$1.updatedAt);
	const now = /* @__PURE__ */ new Date();
	return {
		totalMessages: messages.length,
		userMessages: userMessages.length,
		assistantMessages: assistantMessages.length,
		systemMessages: systemMessages.length,
		totalCharacters,
		estimatedTokens: Math.ceil(totalCharacters / 4),
		averageMessageLength: Math.round(totalCharacters / messages.length),
		longestMessage: Math.max(...messageLengths, 0),
		shortestMessage: Math.min(...messageLengths, 0),
		conversationAge: formatDuration(now.getTime() - createdAt.getTime()),
		lastActivity: formatDuration(now.getTime() - updatedAt.getTime())
	};
}
function displayContextStats(conversation$1, stats) {
	console.log(`📊 Context Statistics for: ${conversation$1.name}`);
	console.log(`🆔 ID: ${conversation$1.id}`);
	console.log(`🤖 Provider: ${conversation$1.provider}/${conversation$1.model}`);
	console.log("");
	console.log("💬 Messages:");
	console.log(`   Total: ${stats.totalMessages}`);
	console.log(`   👤 User: ${stats.userMessages}`);
	console.log(`   🤖 Assistant: ${stats.assistantMessages}`);
	if (stats.systemMessages > 0) console.log(`   ⚙️  System: ${stats.systemMessages}`);
	console.log("");
	console.log("🎯 Token Usage:");
	console.log(`   Input tokens: ${conversation$1.inputTokens || 0}`);
	console.log(`   Output tokens: ${conversation$1.outputTokens || 0}`);
	console.log(`   Total tokens: ${conversation$1.totalTokens || 0}`);
	console.log(`   Estimated context: ~${stats.estimatedTokens} tokens`);
	console.log("");
	console.log("📝 Content Analysis:");
	console.log(`   Total characters: ${stats.totalCharacters.toLocaleString()}`);
	console.log(`   Average message: ${stats.averageMessageLength} characters`);
	console.log(`   Longest message: ${stats.longestMessage} characters`);
	console.log(`   Shortest message: ${stats.shortestMessage} characters`);
	console.log("");
	console.log("⏰ Timeline:");
	console.log(`   Conversation age: ${stats.conversationAge}`);
	console.log(`   Last activity: ${stats.lastActivity} ago`);
	console.log(`   Created: ${new Date(conversation$1.createdAt).toLocaleString()}`);
	console.log(`   Updated: ${new Date(conversation$1.updatedAt).toLocaleString()}`);
	console.log("");
	console.log("💡 Optimization Suggestions:");
	if (stats.estimatedTokens > 8e3) console.log("   ⚠️  Large context detected - consider using context condensation");
	if (stats.totalMessages > 50) console.log("   📉 Long conversation - sliding window optimization could reduce costs");
	if ((conversation$1.totalTokens || 0) > 1e4) console.log("   💸 High token usage - monitor costs carefully");
	if (stats.averageMessageLength > 500) console.log("   📏 Long messages - consider breaking into smaller interactions");
}
function formatDuration(ms) {
	const seconds = Math.floor(ms / 1e3);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
	if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
	return `${seconds} second${seconds > 1 ? "s" : ""}`;
}

//#endregion
//#region src/utils/config.ts
const IMPORTABLE_EXTENSIONS = [
	".js",
	".ts",
	".mjs",
	".cjs",
	".jsx",
	".tsx"
];
function isImportableModule(ext) {
	return IMPORTABLE_EXTENSIONS.includes(ext);
}
async function loadConfig(configPath) {
	if (configPath) return await loadConfigFromPath(configPath);
	return getDefaultConfig();
}
async function loadConfigFromPath(path) {
	if (existsSync(path)) return await loadConfigFromFilePath(path);
	try {
		const module = await import(path);
		return module.default || module;
	} catch {
		console.error("Error loading config");
		throw new Error("Failed to load config");
	}
}
async function loadConfigFromFilePath(path) {
	const ext = extname(path);
	if (ext === ".json") return (await import(pathToFileURL(path).href, { with: { type: "json" } })).default;
	else if (isImportableModule(ext) || !ext) {
		const module = await import(pathToFileURL(path).href);
		return module.default || module;
	}
	throw new Error(`Unsupported config file extension: ${ext}`);
}
function getDefaultConfig() {
	return { providers: { openai: {
		type: "openai",
		api: {
			url: "https://api.openai.com/v1",
			token: process.env.OPENAI_API_KEY
		}
	} } };
}

//#endregion
//#region src/commands/conversation/condense.ts
/**
* Condense conversation context using AI summarization
*/
async function conversationCondenseCommand(options = {}) {
	let targetConversationId = options.conversation;
	if (!targetConversationId) targetConversationId = await getCurrentConversation() || void 0;
	if (!targetConversationId) throw new Error("No active conversation. Use --conversation <id> or start a conversation first.");
	const conversation$1 = await getConversation(targetConversationId);
	if (!conversation$1) throw new Error(`Conversation ${targetConversationId} not found`);
	const messages = await getConversationMessages(targetConversationId);
	if (messages.length < 5) {
		console.log("⚠️  Conversation too short to condense (need at least 5 messages)");
		return;
	}
	const keepRecent = options.keepRecent || 3;
	if (messages.length <= keepRecent + 2) {
		console.log(`⚠️  Conversation only has ${messages.length} messages, keeping recent ${keepRecent} would leave too few to summarize`);
		return;
	}
	const messagesToSummarize = messages.slice(0, -keepRecent);
	const recentMessages = messages.slice(-keepRecent);
	console.log(`🔄 Condensing conversation: ${conversation$1.name}`);
	console.log(`📊 Summarizing ${messagesToSummarize.length} messages, keeping ${recentMessages.length} recent`);
	const currentTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
	console.log(`📏 Current estimated context: ~${currentTokens} tokens`);
	if (options.dryRun) {
		console.log("🧪 Dry run - showing what would be summarized:");
		displaySummarizationPreview$1(messagesToSummarize, recentMessages);
		return;
	}
	const config = await loadConfig();
	if (!config.providers?.[conversation$1.provider]) throw new Error(`Provider '${conversation$1.provider}' not found in config`);
	const gateway = new GenAIGateway(config);
	const summary = await createAISummary$1(gateway, conversation$1, messagesToSummarize);
	const originalTokens = messagesToSummarize.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
	const summaryTokens = Math.ceil(summary.length / 4);
	const tokenSavings = originalTokens - summaryTokens;
	const savingsPercent = Math.round(tokenSavings / originalTokens * 100);
	console.log("");
	console.log("📋 Generated Summary:");
	console.log("─".repeat(60));
	console.log(summary);
	console.log("─".repeat(60));
	console.log("");
	console.log(`💾 Token Optimization:`);
	console.log(`   Original: ~${originalTokens} tokens`);
	console.log(`   Summary: ~${summaryTokens} tokens`);
	console.log(`   Savings: ~${tokenSavings} tokens (${savingsPercent}%)`);
	console.log("");
	console.log("⚠️  This will replace the older messages with the summary.");
	console.log("   Recent messages will be preserved.");
	console.log("   This action cannot be undone.");
	console.log("");
	console.log("💡 Applying condensation:");
	console.log(`   1. Replace ${messagesToSummarize.length} older messages with 1 summary`);
	console.log(`   2. Keep ${recentMessages.length} recent messages unchanged`);
	console.log(`   3. Update conversation metadata`);
	console.log("");
	const newMessages = [{
		role: "system",
		content: `[CONVERSATION SUMMARY]: ${summary}`,
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}, ...recentMessages];
	await replaceConversationMessages(conversation$1.id, newMessages);
	console.log("✅ Conversation condensed successfully!");
	console.log(`📊 Messages: ${messages.length} → ${newMessages.length}`);
	console.log(`💾 Token savings: ~${tokenSavings} tokens (${savingsPercent}%)`);
	console.log("");
	console.log("🎯 Your current conversation now has optimized context");
	console.log("💬 Continue chatting with reduced token costs");
}
async function createAISummary$1(gateway, conversation$1, messages) {
	const summarizationPrompt = `Please create a concise summary of this conversation that preserves the key information, context, and important details. The summary should be much shorter than the original but retain all essential information that might be needed for future conversation context.

Conversation to summarize:
${messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n")}

Please provide a clear, structured summary that captures:
1. Key topics discussed
2. Important information shared (names, preferences, etc.)
3. Main questions asked and answers provided
4. Any ongoing context that should be preserved

Summary:`;
	console.log("🤖 Generating AI summary...");
	const response = await gateway.chatCompletion({
		provider: conversation$1.provider,
		model: conversation$1.model,
		messages: [{
			role: "user",
			content: summarizationPrompt
		}]
	});
	await updateConversationTokens(conversation$1.id, response.usage.prompt_tokens || 0, response.usage.completion_tokens || 0, response.usage.total_tokens);
	console.log(`📊 Summarization cost: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
	return response.choices[0].message.content || "Summary generation failed";
}
function displaySummarizationPreview$1(messagesToSummarize, recentMessages) {
	console.log("");
	console.log("📝 Messages to be summarized:");
	messagesToSummarize.forEach((msg, i) => {
		const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content;
		console.log(`   ${i + 1}. [${msg.role}] ${preview}`);
	});
	console.log("");
	console.log("✅ Messages to be kept (recent):");
	recentMessages.forEach((msg, i) => {
		const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content;
		console.log(`   ${i + 1}. [${msg.role}] ${preview}`);
	});
}

//#endregion
//#region src/commands/conversation/fork.ts
/**
* Fork a conversation - create a new conversation with the same history
*/
async function conversationForkCommand(options = {}) {
	let sourceConversationId = options.conversation;
	if (!sourceConversationId) sourceConversationId = await getCurrentConversation() || void 0;
	if (!sourceConversationId) throw new Error("No active conversation. Use --conversation <id> or start a conversation first.");
	const sourceConversation = await getConversation(sourceConversationId);
	if (!sourceConversation) throw new Error(`Conversation ${sourceConversationId} not found`);
	const messages = await getConversationMessages(sourceConversationId);
	const newProvider = options.provider || sourceConversation.provider;
	const newModel = options.model || sourceConversation.model;
	const newName = options.name || `${sourceConversation.name} (Fork)`;
	console.log(`🔀 Forking conversation: ${sourceConversation.name}`);
	console.log(`📊 Copying ${messages.length} messages`);
	console.log(`🤖 Target: ${newProvider}/${newModel}`);
	const newConversationId = await createConversation(newName, newProvider, newModel, "forked");
	for (const message of messages) await addMessageToConversation(newConversationId, message.role, message.content);
	await setCurrentConversation(newConversationId);
	console.log("");
	console.log(`✅ Fork created successfully!`);
	console.log(`🆔 New conversation ID: ${newConversationId}`);
	console.log(`🎯 Now active: ${newName}`);
	console.log("");
	console.log("💡 Use cases:");
	console.log("   • Test different models with same context");
	console.log("   • Experiment with different conversation paths");
	console.log("   • Create backups before major changes");
}

//#endregion
//#region src/commands/conversation/summarize.ts
/**
* Create a new conversation with AI-generated summary of older messages
*/
async function conversationSummarizeCommand(options = {}) {
	let sourceConversationId = options.conversation;
	if (!sourceConversationId) sourceConversationId = await getCurrentConversation() || void 0;
	if (!sourceConversationId) throw new Error("No active conversation. Use --conversation <id> or start a conversation first.");
	const sourceConversation = await getConversation(sourceConversationId);
	if (!sourceConversation) throw new Error(`Conversation ${sourceConversationId} not found`);
	const messages = await getConversationMessages(sourceConversationId);
	if (messages.length < 5) {
		console.log("⚠️  Conversation too short to summarize (need at least 5 messages)");
		return;
	}
	const keepRecent = options.keepRecent || 3;
	if (messages.length <= keepRecent + 2) {
		console.log(`⚠️  Conversation only has ${messages.length} messages, keeping recent ${keepRecent} would leave too few to summarize`);
		return;
	}
	const messagesToSummarize = messages.slice(0, -keepRecent);
	const recentMessages = messages.slice(-keepRecent);
	console.log(`📝 Summarizing conversation: ${sourceConversation.name}`);
	console.log(`📊 Summarizing ${messagesToSummarize.length} messages, keeping ${recentMessages.length} recent`);
	const originalTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
	console.log(`📏 Original estimated context: ~${originalTokens} tokens`);
	if (options.dryRun) {
		console.log("🧪 Dry run - showing what would be summarized:");
		displaySummarizationPreview(messagesToSummarize, recentMessages);
		return;
	}
	const config = await loadConfig();
	if (!config.providers?.[sourceConversation.provider]) throw new Error(`Provider '${sourceConversation.provider}' not found in config`);
	const gateway = new GenAIGateway(config);
	const summary = await createAISummary(gateway, sourceConversation, messagesToSummarize);
	const summaryTokens = Math.ceil(summary.length / 4);
	const recentTokens = recentMessages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
	const newTotalTokens = summaryTokens + recentTokens;
	const tokenSavings = originalTokens - newTotalTokens;
	const savingsPercent = Math.round(tokenSavings / originalTokens * 100);
	console.log("");
	console.log("📋 Generated Summary:");
	console.log("─".repeat(60));
	console.log(summary);
	console.log("─".repeat(60));
	console.log("");
	console.log(`💾 Token Optimization:`);
	console.log(`   Original: ~${originalTokens} tokens`);
	console.log(`   New total: ~${newTotalTokens} tokens (${summaryTokens} summary + ${recentTokens} recent)`);
	console.log(`   Savings: ~${tokenSavings} tokens (${savingsPercent}%)`);
	console.log("");
	const newProvider = options.provider || sourceConversation.provider;
	const newModel = options.model || sourceConversation.model;
	const newName = options.name || `${sourceConversation.name} (Summarized)`;
	console.log(`🆕 Creating new conversation: ${newName}`);
	const newConversationId = await createConversation(newName, newProvider, newModel, "summarized");
	await addMessageToConversation(newConversationId, "system", `[CONVERSATION SUMMARY]: ${summary}`);
	for (const message of recentMessages) await addMessageToConversation(newConversationId, message.role, message.content);
	await setCurrentConversation(newConversationId);
	console.log("");
	console.log(`✅ Summarized conversation created!`);
	console.log(`🆔 New conversation ID: ${newConversationId}`);
	console.log(`🎯 Now active: ${newName}`);
	console.log(`💰 Token savings: ${savingsPercent}% reduction`);
	console.log("");
	console.log("💡 Original conversation preserved unchanged");
}
async function createAISummary(gateway, conversation$1, messages) {
	const summarizationPrompt = `Please create a concise summary of this conversation that preserves the key information, context, and important details. The summary should be much shorter than the original but retain all essential information that might be needed for future conversation context.

Conversation to summarize:
${messages.map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n")}

Please provide a clear, structured summary that captures:
1. Key topics discussed
2. Important information shared (names, preferences, etc.)
3. Main questions asked and answers provided
4. Any ongoing context that should be preserved

Summary:`;
	console.log("🤖 Generating AI summary...");
	const response = await gateway.chatCompletion({
		provider: conversation$1.provider,
		model: conversation$1.model,
		messages: [{
			role: "user",
			content: summarizationPrompt
		}]
	});
	console.log(`📊 Summarization cost: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
	return response.choices[0].message.content || "Summary generation failed";
}
function displaySummarizationPreview(messagesToSummarize, recentMessages) {
	console.log("");
	console.log("📝 Messages to be summarized:");
	messagesToSummarize.forEach((msg, i) => {
		const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content;
		console.log(`   ${i + 1}. [${msg.role}] ${preview}`);
	});
	console.log("");
	console.log("✅ Messages to be kept (recent):");
	recentMessages.forEach((msg, i) => {
		const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content;
		console.log(`   ${i + 1}. [${msg.role}] ${preview}`);
	});
}

//#endregion
//#region src/commands/conversation/show.ts
/**
* Show full conversation history
*/
async function conversationShowCommand(options = {}) {
	let targetConversationId = options.conversation;
	if (!targetConversationId) targetConversationId = await getCurrentConversation() || void 0;
	if (!targetConversationId) throw new Error("No active conversation. Use --conversation <id> or start a conversation first.");
	const conversation$1 = await getConversation(targetConversationId);
	if (!conversation$1) throw new Error(`Conversation ${targetConversationId} not found`);
	const messages = await getConversationMessages(targetConversationId);
	if (messages.length === 0) {
		console.log("📭 No messages in this conversation yet");
		return;
	}
	const displayMessages = options.limit ? messages.slice(-options.limit) : messages;
	const format = options.format || "full";
	console.log(`💬 Conversation: ${conversation$1.name}`);
	console.log(`🆔 ID: ${conversation$1.id}`);
	console.log(`🤖 Provider: ${conversation$1.provider}/${conversation$1.model}`);
	console.log(`📊 Messages: ${messages.length} total${options.limit ? ` (showing last ${displayMessages.length})` : ""}`);
	console.log(`🎯 Tokens: ${conversation$1.totalTokens || 0} total`);
	console.log("");
	if (format === "json") {
		console.log(JSON.stringify(displayMessages, null, 2));
		return;
	}
	console.log("📝 Messages:");
	console.log("─".repeat(80));
	displayMessages.forEach((message, index) => {
		const messageNumber = options.limit ? messages.length - displayMessages.length + index + 1 : index + 1;
		const timestamp = new Date(message.timestamp).toLocaleString();
		const roleIcon = getRoleIcon(message.role);
		const roleName = message.role.toUpperCase();
		if (format === "compact") {
			const preview = message.content.length > 100 ? message.content.substring(0, 100) + "..." : message.content;
			console.log(`${messageNumber}. ${roleIcon} [${roleName}] ${preview}`);
		} else {
			console.log(`${messageNumber}. ${roleIcon} ${roleName} (${timestamp})`);
			console.log("");
			const content = message.content;
			if (content.length > 500) content.split("\n").forEach((line) => {
				if (line.trim()) console.log(`   ${line}`);
				else console.log("");
			});
			else content.split("\n").forEach((line) => console.log(`   ${line}`));
			console.log("");
			console.log("─".repeat(80));
		}
	});
	if (format !== "compact") {
		console.log("");
		console.log("📈 Summary:");
		console.log(`   Total messages: ${messages.length}`);
		console.log(`   User messages: ${messages.filter((m) => m.role === "user").length}`);
		console.log(`   Assistant messages: ${messages.filter((m) => m.role === "assistant").length}`);
		console.log(`   System messages: ${messages.filter((m) => m.role === "system").length}`);
		console.log(`   Total characters: ${messages.reduce((sum, m) => sum + m.content.length, 0).toLocaleString()}`);
		console.log(`   Estimated tokens: ~${Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4)}`);
		if (conversation$1.totalTokens > 0) console.log(`   Actual tokens used: ${conversation$1.totalTokens}`);
	}
}
function getRoleIcon(role) {
	switch (role) {
		case "user": return "👤";
		case "assistant": return "🤖";
		case "system": return "⚙️";
		default: return "❓";
	}
}

//#endregion
//#region src/commands/conversation/continue.ts
async function conversationContinueCommand(conversationIdentifier) {
	let conversation$1 = await getConversation(conversationIdentifier);
	if (!conversation$1) conversation$1 = await findConversationByName(conversationIdentifier);
	if (!conversation$1) throw new Error(`Conversation '${conversationIdentifier}' not found`);
	await setCurrentConversation(conversation$1.id);
	console.log(`🔄 Switched to conversation: ${conversation$1.name}`);
	console.log(`📝 ID: ${conversation$1.id}`);
	console.log(`🤖 Provider: ${conversation$1.provider}/${conversation$1.model}`);
	console.log(`📊 Messages: ${conversation$1.messageCount}`);
}

//#endregion
//#region src/commands/conversation/delete.ts
async function conversationDeleteCommand(conversationIdentifier) {
	let conversation$1 = await getConversation(conversationIdentifier);
	if (!conversation$1) conversation$1 = await findConversationByName(conversationIdentifier);
	if (!conversation$1) throw new Error(`Conversation '${conversationIdentifier}' not found`);
	await deleteConversation(conversation$1.id);
	if (await getCurrentConversation() === conversation$1.id) await clearCurrentConversation();
	console.log(`🗑️ Deleted conversation: ${conversation$1.name}`);
}

//#endregion
//#region src/commands/chat.ts
async function chatCommand(context, message, options) {
	let actualMessage = message;
	if (options.stdin) {
		const chunks = [];
		for await (const chunk of process.stdin) chunks.push(chunk);
		actualMessage = Buffer.concat(chunks).toString("utf-8").trim();
	}
	if (!actualMessage) throw new Error("No message provided. Either pass a message argument or use --stdin flag to read from stdin.");
	if (options.model && options.tag) throw new Error("Cannot specify both --model and --tag. Use --model for direct model names or --tag for tag resolution.");
	let providerId = options.provider || context.defaults.provider;
	if (!providerId) throw new Error("No provider specified. Use --provider or configure a default provider.");
	let modelId;
	if (options.tag) {
		let tagToResolve = options.tag;
		let explicitProvider;
		if (options.tag.includes(":")) {
			const parts = options.tag.split(":", 2);
			explicitProvider = parts[0];
			tagToResolve = parts[1];
			if (explicitProvider) providerId = explicitProvider;
		}
		if (context.tagRegistry) {
			const resolution = context.tagRegistry.resolve(tagToResolve, providerId);
			if (!resolution) throw new Error(`Tag '${tagToResolve}' not found in provider '${providerId}'. Run 'anygpt list-tags --provider ${providerId}' to see available tags.`);
			providerId = resolution.provider;
			modelId = resolution.model;
		} else {
			const resolution = resolveModel(tagToResolve, {
				providers: context.providers,
				aliases: context.defaults.aliases,
				defaultProvider: context.defaults.provider
			}, providerId);
			if (!resolution) throw new Error(`Tag '${tagToResolve}' not found in provider '${providerId}'. Run 'anygpt list-tags --provider ${providerId}' to see available tags.`);
			providerId = resolution.provider;
			modelId = resolution.model;
		}
		if (explicitProvider) context.logger.info(`🔗 Resolved tag '${options.tag}' → ${modelId}`);
		else context.logger.info(`🔗 Resolved tag '${tagToResolve}' → ${providerId}:${modelId}`);
	} else if (options.model) {
		modelId = options.model;
		context.logger.info(`📌 Using direct model: ${providerId}:${modelId}`);
	} else {
		const defaultTag = context.defaults.providers?.[providerId]?.tag;
		const defaultModel = context.defaults.providers?.[providerId]?.model || context.defaults.model;
		if (defaultTag && !defaultModel) {
			if (context.tagRegistry) {
				const resolution = context.tagRegistry.resolve(defaultTag, providerId);
				if (!resolution) throw new Error(`Could not resolve default tag '${defaultTag}' for provider '${providerId}'.\nRun 'anygpt list-tags --provider ${providerId}' to see available tags.`);
				providerId = resolution.provider;
				modelId = resolution.model;
			} else {
				const resolution = resolveModel(defaultTag, {
					providers: context.providers,
					aliases: context.defaults.aliases,
					defaultProvider: context.defaults.provider
				}, providerId);
				if (!resolution) throw new Error(`Could not resolve default tag '${defaultTag}' for provider '${providerId}'.\nRun 'anygpt list-tags --provider ${providerId}' to see available tags.`);
				providerId = resolution.provider;
				modelId = resolution.model;
			}
			context.logger.info(`📌 Using default tag '${defaultTag}' → ${modelId}`);
		} else if (defaultModel) {
			modelId = defaultModel;
			context.logger.info(`📌 Using default model: ${providerId}:${modelId}`);
		} else throw new Error("No model specified. Use --model <model-name>, --tag <tag>, or configure a default model.\nRun 'anygpt list-tags' to see available tags.");
	}
	context.logger.info(`📤 Request: provider=${providerId}, model=${modelId}`);
	context.logger.info(`💬 Message length: ${actualMessage.length} chars`);
	context.logger.info("");
	try {
		const startTime = Date.now();
		const providerConfig = (context.config?.providers || {})[providerId];
		const globalRules = context.defaults?.modelRules;
		const modelConfig = resolveModelConfig(modelId, providerId, providerConfig, globalRules);
		context.logger.debug("Model config:", {
			model: modelId,
			provider: providerId,
			max_tokens: modelConfig.max_tokens,
			useLegacyMaxTokens: modelConfig.useLegacyMaxTokens,
			useLegacyCompletionAPI: modelConfig.useLegacyCompletionAPI,
			fallbackToChatCompletion: modelConfig.fallbackToChatCompletion
		});
		const requestParams = {
			provider: providerId,
			model: modelId,
			messages: [{
				role: "user",
				content: actualMessage
			}],
			...(options.maxTokens || modelConfig.max_tokens) && {
				max_tokens: options.maxTokens || modelConfig.max_tokens,
				useLegacyMaxTokens: modelConfig.useLegacyMaxTokens
			},
			...modelConfig.useLegacyCompletionAPI !== void 0 && { useLegacyCompletionAPI: modelConfig.useLegacyCompletionAPI },
			...modelConfig.fallbackToChatCompletion !== void 0 && { fallbackToChatCompletion: modelConfig.fallbackToChatCompletion },
			...modelConfig.reasoning && { reasoning: modelConfig.reasoning },
			...modelConfig.extra_body && { extra_body: modelConfig.extra_body }
		};
		const response = await context.router.chatCompletion(requestParams);
		const duration = Date.now() - startTime;
		const reply = response.choices[0]?.message?.content;
		const finishReason = response.choices[0]?.finish_reason;
		if (finishReason && finishReason !== "stop") context.logger.debug(`⚠️  Finish reason: ${finishReason}`);
		if (reply) console.log(reply);
		else console.log("No response received");
		context.logger.info("");
		context.logger.info(`⏱️  Response time: ${duration}ms`);
		if (response.usage) context.logger.info(`📊 Tokens: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} total`);
		if (response.model) context.logger.info(`🤖 Model used: ${response.model}`);
		if (reply) context.logger.info(`📝 Response length: ${reply.length} chars`);
		const hasVerboseFlag = process.argv.some((arg) => arg === "--verbose" || arg === "-v");
		if (options.usage && response.usage && !hasVerboseFlag) {
			console.log("");
			console.log(`📊 Usage: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("422")) throw new Error(`Model '${modelId}' not found or not supported by provider '${providerId}'.\n\nTroubleshooting:\n  1. Run 'anygpt list-tags --provider ${providerId}' to see available tags\n  2. Run 'anygpt list-models --provider ${providerId}' to see available models\n  3. Use --tag instead of --model if you want tag resolution\n\nOriginal error: ${errorMessage}`);
		if (errorMessage.includes("401") || errorMessage.includes("403")) throw new Error(`Authentication failed for provider '${providerId}'.\nCheck your API credentials in the configuration.\n\nOriginal error: ${errorMessage}`);
		if (errorMessage.startsWith("❌")) {
			console.error(errorMessage);
			process.exit(1);
		}
		throw new Error(`❌ Chat request failed: ${errorMessage}`);
	}
}

//#endregion
//#region src/chat-loop/chat-loop.ts
/**
* Interactive chat loop with REPL and history management
*/
var ChatLoop = class {
	history = [];
	running = false;
	rl = null;
	options = {};
	commands = {};
	constructor() {
		this.setupCommands();
	}
	/**
	* Setup built-in commands
	*/
	setupCommands() {
		this.commands = {
			exit: {
				handler: () => {
					this.stop();
				},
				description: "Exit the chat"
			},
			quit: {
				handler: () => {
					this.stop();
				},
				description: "Exit the chat (alias for /exit)"
			},
			help: {
				handler: () => {
					console.log("\nAvailable commands:");
					for (const [cmd, { description }] of Object.entries(this.commands)) console.log(`  /${cmd} - ${description}`);
					console.log("");
				},
				description: "Show this help message"
			},
			clear: {
				handler: () => {
					this.clearHistory();
					console.log("History cleared.");
				},
				description: "Clear message history"
			},
			history: {
				handler: () => {
					const history = this.getHistory();
					if (history.length === 0) {
						console.log("No messages in history.");
						return;
					}
					console.log(`\nMessage history (${history.length} messages):`);
					for (const msg of history) {
						const time = msg.timestamp.toLocaleTimeString();
						console.log(`[${time}] ${msg.role}: ${msg.content}`);
					}
					console.log("");
				},
				description: "Show message history"
			}
		};
	}
	/**
	* Start the chat loop
	*/
	async start(options = {}) {
		if (this.running) throw new Error("Chat loop is already running");
		this.options = {
			prompt: options.prompt || "> ",
			maxHistory: options.maxHistory || 100,
			onMessage: options.onMessage || this.defaultMessageHandler.bind(this)
		};
		this.running = true;
		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			prompt: this.options.prompt,
			historySize: this.options.maxHistory
		});
		this.rl.on("SIGINT", () => {
			console.log("\n(To exit, type /exit or press Ctrl+C again)");
			this.rl?.prompt();
		});
		this.rl.on("line", async (input) => {
			const trimmed = input.trim();
			if (!trimmed) {
				this.rl?.prompt();
				return;
			}
			if (trimmed.startsWith("/")) {
				await this.handleCommand(trimmed);
				this.rl?.prompt();
				return;
			}
			this.addMessage({
				role: "user",
				content: trimmed,
				timestamp: /* @__PURE__ */ new Date()
			});
			try {
				if (!this.options.onMessage) throw new Error("No message handler configured");
				const response = await this.options.onMessage(trimmed);
				this.addMessage({
					role: "assistant",
					content: response,
					timestamp: /* @__PURE__ */ new Date()
				});
				console.log(response);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				console.error(`Error: ${errorMsg}`);
			}
			this.rl?.prompt();
		});
		this.rl.on("close", () => {
			this.running = false;
		});
		console.log("Chat started. Type /help for commands, /exit to quit.\n");
		this.rl.prompt();
		return new Promise((resolve) => {
			this.rl?.on("close", () => {
				resolve();
			});
		});
	}
	/**
	* Stop the chat loop
	*/
	async stop() {
		if (!this.running) return;
		this.running = false;
		if (this.rl) {
			this.rl.close();
			this.rl = null;
		}
	}
	/**
	* Add a message to history
	*/
	addMessage(message) {
		this.history.push(message);
		const maxHistory = this.options.maxHistory || 100;
		if (this.history.length > maxHistory) this.history = this.history.slice(-maxHistory);
	}
	/**
	* Get all messages from history
	*/
	getHistory() {
		return [...this.history];
	}
	/**
	* Clear message history
	*/
	clearHistory() {
		this.history = [];
	}
	/**
	* Check if chat loop is running
	*/
	isRunning() {
		return this.running;
	}
	/**
	* Default message handler (echo)
	*/
	async defaultMessageHandler(message) {
		return `Echo: ${message}`;
	}
	/**
	* Handle command execution
	*/
	async handleCommand(input) {
		const parts = input.slice(1).split(" ");
		const command = parts[0].toLowerCase();
		const args = parts.slice(1);
		const cmd = this.commands[command];
		if (!cmd) {
			console.log(`Unknown command: /${command}. Type /help for available commands.`);
			return;
		}
		try {
			await cmd.handler(args);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			console.error(`Command error: ${errorMsg}`);
		}
	}
};

//#endregion
//#region src/commands/chat-interactive.ts
/**
* Start an interactive chat session with AI
*/
async function chatInteractiveCommand(context, options) {
	const chatLoop = new ChatLoop();
	const providerId = options.provider || context.defaults.provider || "openai";
	const modelId = options.model || context.defaults.model || "gpt-4o-mini";
	console.log("🤖 Interactive AI Chat");
	console.log(`Provider: ${providerId}`);
	console.log(`Model: ${modelId}`);
	console.log("Type /help for commands, /exit to quit.\n");
	const aiProvider = new AIProvider(context.router, {
		provider: providerId,
		model: modelId
	});
	await chatLoop.start({
		prompt: "💬 ",
		maxHistory: 50,
		onMessage: async (message) => {
			if (options.echo) return `Echo: ${message}`;
			try {
				const messages = chatLoop.getHistory().map((msg) => ({
					role: msg.role,
					content: msg.content
				}));
				context.logger.debug("Sending request to AI...");
				const response = await aiProvider.chat({ messages });
				context.logger.info(`📊 Tokens: ${response.usage.promptTokens} input + ${response.usage.completionTokens} output = ${response.usage.totalTokens} total`);
				return response.message;
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				context.logger.error(`AI Error: ${errorMsg}`);
				return `❌ Error: ${errorMsg}`;
			}
		}
	});
	console.log("\n👋 Chat ended. Goodbye!");
}

//#endregion
//#region src/commands/config.ts
async function configCommand(context, options) {
	try {
		const config = context.config;
		const configSource = context.configSource;
		if (options.json) console.log(JSON.stringify(processConfigForDisplay(config), null, 2));
		else {
			console.log("📋 AnyGPT Configuration");
			console.log("═".repeat(50));
			console.log(`📁 Source: ${configSource}`);
			console.log();
			printConfigTree(processConfigForDisplay(config));
		}
	} catch (error) {
		throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : error}`);
	}
}
/**
* Process config for display - convert connector instances to declarative format
* No sanitization needed since we use tokenEnv instead of storing secrets
*/
function processConfigForDisplay(config) {
	return JSON.parse(JSON.stringify(config, (key, value) => {
		if (key === "connector" && typeof value === "object" && value !== null) {
			if (value.type && typeof value.type === "string") return value;
			if (value.constructor) {
				const connectorInfo = { type: value.constructor.packageName || `@anygpt/${value.constructor.name.toLowerCase().replace("connector", "")}` };
				try {
					if (value.getUserConfig && typeof value.getUserConfig === "function") {
						const userConfig = value.getUserConfig();
						if (userConfig && typeof userConfig === "object" && Object.keys(userConfig).length > 0) connectorInfo.options = userConfig;
					} else if (value.config || value.getConfig) {
						const connectorConfig = value.config || value.getConfig?.();
						if (connectorConfig && typeof connectorConfig === "object" && Object.keys(connectorConfig).length > 0) connectorInfo.options = connectorConfig;
					}
				} catch {
					connectorInfo.options = "[Unable to serialize]";
				}
				return connectorInfo;
			}
		}
		return value;
	}));
}
/**
* Print configuration as a tree structure
*/
function printConfigTree(config, indent = "") {
	for (const [key, value] of Object.entries(config)) if (value === null || value === void 0) console.log(`${indent}├─ ${key}: ${value}`);
	else if (typeof value === "object" && !Array.isArray(value)) {
		console.log(`${indent}├─ ${key}:`);
		printConfigTree(value, indent + "│  ");
	} else if (Array.isArray(value)) {
		console.log(`${indent}├─ ${key}: [${value.length} items]`);
		value.forEach((item, i) => {
			if (typeof item === "object") {
				console.log(`${indent}│  ├─ [${i}]:`);
				printConfigTree(item, indent + "│  │  ");
			} else console.log(`${indent}│  ├─ [${i}]: ${item}`);
		});
	} else {
		const displayValue = typeof value === "string" && value.length > 50 ? value.substring(0, 47) + "..." : value;
		console.log(`${indent}├─ ${key}: ${displayValue}`);
	}
}

//#endregion
//#region src/commands/list-models.ts
/**
* Create default config from generic environment variables
*/
function createDefaultConfig() {
	const config = {};
	if (process.env.SRC_ACCESS_TOKEN) config.accessToken = process.env.SRC_ACCESS_TOKEN;
	if (process.env.SRC_ENDPOINT) config.endpoint = process.env.SRC_ENDPOINT;
	if (process.env.OPENAI_API_KEY) config.apiKey = process.env.OPENAI_API_KEY;
	if (process.env.OPENAI_API_URL) config.apiUrl = process.env.OPENAI_API_URL;
	return config;
}
/**
* Dynamically import and create a connector from a package name
*/
async function createConnectorFromPackage(packageName, config) {
	try {
		const defaultExport = (await import(packageName)).default;
		if (!defaultExport) throw new Error(`Package ${packageName} has no default export`);
		const finalConfig = {
			...createDefaultConfig(),
			...config
		};
		if (typeof defaultExport === "function") {
			if (defaultExport.prototype && typeof defaultExport.prototype.create === "function") return new defaultExport().create(finalConfig);
			return defaultExport(finalConfig);
		}
		if (typeof defaultExport === "object" && "listModels" in defaultExport) return defaultExport;
		throw new Error(`Package ${packageName} does not export a valid connector or factory`);
	} catch (error) {
		if (error instanceof Error && error.message.includes("Cannot resolve module")) throw new Error(`Package ${packageName} is not installed. Install it with: npm install ${packageName}`);
		throw error;
	}
}
/**
* Check if a string looks like a package name (contains @ or / or starts with a letter)
*/
function isPackageName(provider) {
	return provider.includes("@") || provider.includes("/") || /^[a-z]/.test(provider);
}
async function listModelsCommand(context, options) {
	const providerSpec = options.provider || context.defaults.provider;
	if (!providerSpec) throw new Error("No provider specified. Use --provider or configure a default provider.");
	try {
		let models;
		let providerId;
		try {
			models = await context.router.listModels(providerSpec);
			providerId = providerSpec;
		} catch (routerError) {
			if (isPackageName(providerSpec)) {
				console.log(`📦 Importing connector from package: ${providerSpec}`);
				models = await (await createConnectorFromPackage(providerSpec)).listModels();
				providerId = providerSpec;
			} else throw routerError;
		}
		let modelsWithTags = models;
		const providerConfig = context.providers[providerId];
		const globalRules = context.defaults?.modelRules;
		modelsWithTags = models.map((model) => {
			const config = resolveModelConfig(model.id, providerId, providerConfig, globalRules);
			return {
				...model,
				resolvedTags: options.tags || options.filterTags ? config.tags || [] : void 0,
				enabled: config.enabled !== false
			};
		});
		if (options.tags || options.filterTags) {
			if (options.filterTags) {
				const filters = options.filterTags.split(",").map((t) => t.trim());
				const includeTags = filters.filter((t) => !t.startsWith("!")).map((t) => t.toLowerCase());
				const excludeTags = filters.filter((t) => t.startsWith("!")).map((t) => t.substring(1).toLowerCase());
				modelsWithTags = modelsWithTags.filter((model) => {
					const modelTags = (model.resolvedTags || []).map((t) => t.toLowerCase());
					for (const excludeTag of excludeTags) if (modelTags.includes(excludeTag)) return false;
					if (includeTags.length > 0) return includeTags.some((includeTag) => modelTags.includes(includeTag));
					return true;
				});
			}
		}
		if (options.enabled !== void 0) modelsWithTags = modelsWithTags.filter((model) => model.enabled === options.enabled);
		if (options.json) console.log(JSON.stringify(modelsWithTags, null, 2));
		else {
			console.log(`\n📋 Available models from provider '${providerId}':\n`);
			if (modelsWithTags.length === 0) console.log("  No models available");
			else if (options.tags) for (const model of modelsWithTags) {
				const statusIcon = model.enabled ? "✅" : "❌";
				console.log(`  ${statusIcon} ${model.id}`);
				if (model.resolvedTags && model.resolvedTags.length > 0) console.log(`    Tags: ${model.resolvedTags.join(", ")}`);
				else console.log(`    Tags: (none)`);
				console.log();
			}
			else {
				const maxIdLength = Math.max(...modelsWithTags.map((m) => m.id.length), 10);
				const maxProviderLength = Math.max(...modelsWithTags.map((m) => (m.provider || "").length), 10);
				const maxDisplayLength = Math.max(...modelsWithTags.map((m) => (m.display_name || "").length), 15);
				console.log(`  ${"✓".padEnd(3)}  ${"Model ID".padEnd(maxIdLength)}  ${"Provider".padEnd(maxProviderLength)}  ${"Display Name".padEnd(maxDisplayLength)}`);
				console.log(`  ${"─".repeat(3)}  ${"─".repeat(maxIdLength)}  ${"─".repeat(maxProviderLength)}  ${"─".repeat(maxDisplayLength)}`);
				for (const model of modelsWithTags) {
					const statusIcon = model.enabled ? "✅" : "❌";
					const provider = model.provider || "-";
					const displayName = model.display_name || "-";
					console.log(`  ${statusIcon.padEnd(3)}  ${model.id.padEnd(maxIdLength)}  ${provider.padEnd(maxProviderLength)}  ${displayName.padEnd(maxDisplayLength)}`);
				}
			}
			const enabledCount = modelsWithTags.filter((m) => m.enabled).length;
			const disabledCount = modelsWithTags.length - enabledCount;
			console.log(`\n✅ Found ${modelsWithTags.length} model${modelsWithTags.length !== 1 ? "s" : ""} (${enabledCount} enabled, ${disabledCount} disabled)\n`);
		}
	} catch (error) {
		throw new Error(`Failed to list models: ${error instanceof Error ? error.message : error}`);
	}
}

//#endregion
//#region src/commands/list-tags.ts
/**
* List all available tags and their model mappings from configuration
* This makes tag resolution discoverable without calling provider APIs
*/
async function listTagsCommand(context, options) {
	const result = listAvailableTags({
		providers: context.providers,
		aliases: context.defaults.aliases,
		defaultProvider: context.defaults.provider,
		globalModelRules: context.defaults.modelRules
	});
	const filteredTags = options.provider ? result.tags.filter((t) => t.provider === options.provider) : result.tags;
	const filteredAliases = options.provider ? result.aliases.filter((a) => a.provider === options.provider) : result.aliases;
	if (options.json) {
		console.log(JSON.stringify({
			providers: result.providers,
			tags: filteredTags,
			aliases: filteredAliases
		}, null, 2));
		return;
	}
	console.log("\n🏷️  Available Tags and Model Mappings\n");
	console.log("📦 Configured Providers:");
	for (const provider of result.providers) {
		const defaultMarker = provider.isDefault ? " (default)" : "";
		const name = provider.name ? ` - ${provider.name}` : "";
		console.log(`  • ${provider.id}${name}${defaultMarker}`);
	}
	console.log();
	const tagsByProvider = /* @__PURE__ */ new Map();
	for (const tag of filteredTags) {
		if (!tagsByProvider.has(tag.provider)) tagsByProvider.set(tag.provider, []);
		const providerTags = tagsByProvider.get(tag.provider);
		if (providerTags) providerTags.push(tag);
	}
	console.log("🏷️  Tags (showing unique tags with provider mappings):");
	const tagToProviders = /* @__PURE__ */ new Map();
	for (const tagInfo of filteredTags) {
		if (!tagToProviders.has(tagInfo.tag)) tagToProviders.set(tagInfo.tag, []);
		const providers = tagToProviders.get(tagInfo.tag);
		if (providers) providers.push({
			provider: tagInfo.provider,
			providerName: tagInfo.providerName || tagInfo.provider,
			model: tagInfo.model,
			isDefault: tagInfo.isDefault || false
		});
	}
	const sortedTags = Array.from(tagToProviders.keys()).sort();
	for (const tag of sortedTags) {
		const providers = tagToProviders.get(tag);
		if (!providers) continue;
		if (providers.length === 1) {
			const p = providers[0];
			const defaultMarker = p.isDefault ? " ⭐" : "";
			const providerTag = `${p.provider}:${tag}`;
			console.log(`  • ${tag.padEnd(15)} (${providerTag.padEnd(20)}) → ${p.providerName}${defaultMarker}: ${p.model}`);
		} else {
			console.log(`  • ${tag.padEnd(15)} → [${providers.length} providers]`);
			for (const p of providers) {
				const defaultMarker = p.isDefault ? " ⭐" : "";
				const providerTag = `${p.provider}:${tag}`;
				console.log(`      - ${providerTag.padEnd(20)} → ${p.providerName}${defaultMarker}: ${p.model}`);
			}
		}
	}
	if (filteredAliases.length > 0) {
		console.log("\n🔗 Aliases:");
		for (const alias of filteredAliases) {
			const providerName = alias.providerName || alias.provider;
			if (alias.model) console.log(`  • ${alias.alias} → ${providerName}:${alias.model}`);
			else if (alias.tag && alias.resolvedModel) console.log(`  • ${alias.alias} → ${providerName}:${alias.tag} (${alias.resolvedModel})`);
			else if (alias.tag) console.log(`  • ${alias.alias} → ${providerName}:${alias.tag}`);
		}
	}
	console.log("\n💡 Usage Examples:");
	console.log("  # Use a tag (with resolution):");
	console.log("  anygpt chat --tag sonnet \"Hello\"");
	console.log("  anygpt chat --tag opus \"Hello\"");
	console.log();
	console.log("  # Use provider:tag syntax (recommended for clarity):");
	console.log("  anygpt chat --tag provider1:sonnet \"Hello\"");
	console.log("  anygpt chat --tag provider2:gemini \"Hello\"");
	console.log();
	console.log("  # Or specify provider separately:");
	console.log("  anygpt chat --provider provider1 --tag sonnet \"Hello\"");
	console.log();
	console.log("  # Use direct model name (no resolution):");
	console.log("  anygpt chat --model \"ml-asset:static-model/claude-sonnet-4-5\" \"Hello\"");
	console.log();
	const totalTags = new Set(filteredTags.map((t) => t.tag)).size;
	console.log(`✅ Found ${totalTags} unique tag${totalTags !== 1 ? "s" : ""} across ${tagsByProvider.size} provider${tagsByProvider.size !== 1 ? "s" : ""}\n`);
}

//#endregion
//#region src/commands/benchmark/model-selector.ts
/**
* Select models to benchmark based on options
*/
async function selectModels(context, options) {
	const { router, providers } = context;
	if (options.models) return selectFromModelsList(options);
	else if (options.model && options.provider) return selectSingleModel(options);
	else if (options.provider) return await selectFromProvider(context, options);
	else if (options.all) return await selectFromAllProviders(context, options);
	else return await selectDefaultModels(context, options);
}
/**
* Parse --models flag (comma-separated list)
*/
function selectFromModelsList(options) {
	const modelsToTest = [];
	if (options.provider) return options.models.split(",").map((m) => m.trim()).map((modelId) => ({
		provider: options.provider,
		model: modelId
	}));
	else {
		const modelSpecs = options.models.split(",");
		for (const spec of modelSpecs) {
			const trimmed = spec.trim();
			const colonIndex = trimmed.indexOf(":");
			if (colonIndex > 0) {
				const provider = trimmed.substring(0, colonIndex);
				const model = trimmed.substring(colonIndex + 1);
				modelsToTest.push({
					provider,
					model
				});
			}
		}
	}
	return modelsToTest;
}
/**
* Select single model (--model and --provider)
*/
function selectSingleModel(options) {
	return [{
		provider: options.provider,
		model: options.model
	}];
}
/**
* Select all models from a specific provider
*/
async function selectFromProvider(context, options) {
	const { router, providers } = context;
	const provider = options.provider;
	try {
		let models = await router.listModels(provider);
		const providerConfig = providers[provider];
		const globalRules = context.defaults?.modelRules;
		if (models.length === 0 && providerConfig.models) {
			context.logger.info(`[verbose] Provider '${provider}' connector returned no models. Using ${Object.keys(providerConfig.models).length} models from config.`);
			models = Object.keys(providerConfig.models).map((id) => ({
				id,
				provider,
				display_name: id,
				capabilities: {
					input: { text: true },
					output: { text: true }
				}
			}));
		}
		if (models.length === 0) throw new Error(`No models available for provider '${provider}'. The connector does not support listing models and no models are defined in the config. Please add models to your config under providers.${provider}.models`);
		const modelsToTest = models.filter((m) => {
			const config = resolveModelConfig(m.id, provider, providerConfig, globalRules);
			if (config.enabled === false) return false;
			return applyTagFilter(config.tags || [], options.filterTags);
		}).map((m) => ({
			provider,
			model: m.id
		}));
		if (!options.json) {
			const filterMsg = options.filterTags ? ` (filtered by tags: ${options.filterTags})` : "";
			console.log(`🔍 Filtered to ${modelsToTest.length} enabled models${filterMsg}`);
		}
		return modelsToTest;
	} catch (error) {
		console.error(`Error listing models for provider ${provider}:`, error);
		process.exit(1);
	}
}
/**
* Select models from all providers
*/
async function selectFromAllProviders(context, options) {
	const { router, providers } = context;
	const providerNames = Object.keys(providers);
	const globalRules = context.defaults?.modelRules;
	const modelsToTest = [];
	for (const provider of providerNames) try {
		const models = await router.listModels(provider);
		const providerConfig = providers[provider];
		for (const model of models) {
			const config = resolveModelConfig(model.id, provider, providerConfig, globalRules);
			if (config.enabled === false) continue;
			if (!applyTagFilter(config.tags || [], options.filterTags)) continue;
			modelsToTest.push({
				provider,
				model: model.id
			});
		}
	} catch (error) {
		console.error(`Skipping provider ${provider}: ${error}`);
	}
	return modelsToTest;
}
/**
* Select models from the default provider
* Behaves exactly like --provider=<default_provider>
*/
async function selectDefaultModels(context, options) {
	const { providers } = context;
	const defaultProvider = context.defaults?.provider;
	if (!defaultProvider) {
		console.error("No default provider configured");
		return [];
	}
	if (!providers[defaultProvider]) {
		console.error(`Default provider '${defaultProvider}' not found in config`);
		return [];
	}
	return await selectFromProvider(context, {
		...options,
		provider: defaultProvider
	});
}
/**
* Apply tag filtering to a model
*/
function applyTagFilter(modelTags, filterTags) {
	if (!filterTags) return true;
	const filters = filterTags.split(",").map((t) => t.trim());
	const includeTags = filters.filter((t) => !t.startsWith("!")).map((t) => t.toLowerCase());
	const excludeTags = filters.filter((t) => t.startsWith("!")).map((t) => t.substring(1).toLowerCase());
	const tags = modelTags.map((t) => t.toLowerCase());
	for (const excludeTag of excludeTags) if (tags.includes(excludeTag)) return false;
	if (includeTags.length > 0) return includeTags.some((includeTag) => tags.includes(includeTag));
	return true;
}

//#endregion
//#region src/commands/benchmark/executor.ts
/**
* Execute benchmark for a single model with iterations
*/
async function benchmarkModel(context, provider, model, prompt, options, outputDir) {
	const { router, providers } = context;
	const iterations = options.iterations || 1;
	const maxTokens = options.maxTokens;
	const iterationResults = [];
	for (let i = 0; i < iterations; i++) {
		if (!options.json && iterations > 1) process.stdout.write(`⏳ ${model} (${i + 1}/${iterations}) `);
		else if (!options.json) process.stdout.write(`⏳ ${model} `);
		const startTime = Date.now();
		let result;
		try {
			const providerConfig = providers[provider];
			const globalRules = context.defaults?.modelRules;
			const modelConfig = resolveModelConfig(model, provider, providerConfig, globalRules);
			const effectiveMaxTokens = maxTokens ?? modelConfig.max_tokens;
			if (process.env.DEBUG_BENCHMARK) {
				console.log(`\n[DEBUG] Calling router.chatCompletion with:`);
				console.log(`  provider: ${provider}`);
				console.log(`  model: ${model}`);
				console.log(`  prompt: ${prompt}`);
				console.log(`  max_tokens: ${effectiveMaxTokens}`);
				console.log(`  reasoning: ${JSON.stringify(modelConfig?.reasoning)}`);
			}
			const response = await router.chatCompletion({
				provider,
				model,
				messages: [{
					role: "user",
					content: prompt
				}],
				...effectiveMaxTokens !== void 0 && { max_tokens: effectiveMaxTokens },
				...modelConfig.useLegacyCompletionAPI !== void 0 && { useLegacyCompletionAPI: modelConfig.useLegacyCompletionAPI },
				...modelConfig.fallbackToChatCompletion !== void 0 && { fallbackToChatCompletion: modelConfig.fallbackToChatCompletion },
				...modelConfig.useLegacyMaxTokens !== void 0 && { useLegacyMaxTokens: modelConfig.useLegacyMaxTokens },
				...modelConfig.reasoning && { reasoning: modelConfig.reasoning },
				...modelConfig.extra_body && { extra_body: modelConfig.extra_body }
			});
			const responseTime = Date.now() - startTime;
			const responseContent = response.choices[0]?.message?.content || "";
			const responseSize = responseContent.length;
			result = {
				provider,
				model,
				status: "success",
				responseTime,
				responseSize,
				tokenUsage: response.usage ? {
					prompt: response.usage.prompt_tokens,
					completion: response.usage.completion_tokens,
					total: response.usage.total_tokens
				} : void 0,
				finishReason: response.choices[0]?.finish_reason,
				response: responseContent
			};
			if (!options.json) {
				process.stdout.clearLine(0);
				process.stdout.cursorTo(0);
				console.log(`✅ ${model} ${responseTime}ms (${responseSize} chars)`);
			}
			if (outputDir) saveResponseToFile(outputDir, provider, model, i + 1, iterations, prompt, result, responseContent);
		} catch (error) {
			const responseTime = Date.now() - startTime;
			result = {
				provider,
				model,
				status: "error",
				responseTime,
				responseSize: 0,
				error: error instanceof Error ? error.message : String(error)
			};
			if (!options.json) {
				process.stdout.clearLine(0);
				process.stdout.cursorTo(0);
				console.log(`❌ ${model} ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		iterationResults.push(result);
	}
	return calculateAverageResult(iterationResults, provider, model, iterations);
}
/**
* Execute benchmarks in parallel using Readable.from().map()
*/
async function executeParallel(context, modelsToTest, prompt, options, outputDir) {
	const concurrency = options.concurrency || 3;
	const results = [];
	if (!options.json) console.log(`⚡ Running in parallel mode (concurrency: ${concurrency})\n`);
	const stream = Readable.from(modelsToTest).map(async ({ provider, model }) => {
		return await benchmarkModel(context, provider, model, prompt, options, outputDir);
	}, { concurrency });
	for await (const result of stream) results.push(result);
	return results;
}
/**
* Execute benchmarks sequentially (original behavior)
*/
async function executeSequential(context, modelsToTest, prompt, options, outputDir) {
	const results = [];
	for (const { provider, model } of modelsToTest) {
		const result = await benchmarkModel(context, provider, model, prompt, options, outputDir);
		results.push(result);
	}
	return results;
}
/**
* Calculate average result from multiple iterations
*/
function calculateAverageResult(iterationResults, provider, model, iterations) {
	if (iterations > 1) {
		const successfulRuns = iterationResults.filter((r) => r.status === "success");
		if (successfulRuns.length > 0) {
			const avgTime = successfulRuns.reduce((sum, r) => sum + r.responseTime, 0) / successfulRuns.length;
			const avgSize = successfulRuns.reduce((sum, r) => sum + r.responseSize, 0) / successfulRuns.length;
			const avgTokens = successfulRuns[0].tokenUsage ? {
				prompt: Math.round(successfulRuns.reduce((sum, r) => sum + (r.tokenUsage?.prompt || 0), 0) / successfulRuns.length),
				completion: Math.round(successfulRuns.reduce((sum, r) => sum + (r.tokenUsage?.completion || 0), 0) / successfulRuns.length),
				total: Math.round(successfulRuns.reduce((sum, r) => sum + (r.tokenUsage?.total || 0), 0) / successfulRuns.length)
			} : void 0;
			return {
				provider,
				model,
				status: "success",
				responseTime: Math.round(avgTime),
				responseSize: Math.round(avgSize),
				tokenUsage: avgTokens,
				finishReason: successfulRuns[0].finishReason,
				response: successfulRuns[0].response
			};
		} else return iterationResults[0];
	} else return iterationResults[0];
}
/**
* Save individual response to file
*/
function saveResponseToFile(outputDir, provider, model, iteration, totalIterations, prompt, result, responseContent) {
	const sanitizedProvider = provider.replace(/[^a-z0-9]/gi, "_");
	const sanitizedModel = model.replace(/[^a-z0-9]/gi, "_");
	const filename = `${sanitizedProvider}_${sanitizedModel}_${iteration}.txt`;
	const filepath = join(outputDir, filename);
	const fileContent = `# Benchmark Result
Provider: ${provider}
Model: ${model}
Iteration: ${iteration}/${totalIterations}
Response Time: ${result.responseTime}ms
Response Size: ${result.responseSize} chars
Finish Reason: ${result.finishReason}
${result.tokenUsage ? `Token Usage: ${result.tokenUsage.prompt} prompt + ${result.tokenUsage.completion} completion = ${result.tokenUsage.total} total` : ""}

## Prompt
${prompt}

## Response
${responseContent}
`;
	writeFileSync(filepath, fileContent, "utf-8");
}

//#endregion
//#region src/commands/benchmark/reporter.ts
/**
* Output benchmark results in table or JSON format
*/
function outputResults(results, options) {
	if (options.json) console.log(JSON.stringify(results, null, 2));
	else {
		printResultsTable(results);
		printSummary(results);
		printErrorReport(results);
	}
}
/**
* Print results in table format
*/
function printResultsTable(results) {
	console.log("\n📊 Benchmark Results:\n");
	const sortedResults = [...results].sort((a, b) => {
		if (a.status === "success" && b.status === "error") return -1;
		if (a.status === "error" && b.status === "success") return 1;
		return a.responseTime - b.responseTime;
	});
	const maxProviderLen = Math.max(...sortedResults.map((r) => r.provider.length), 8);
	const maxModelLen = Math.max(...sortedResults.map((r) => r.model.length), 5);
	const providerWidth = Math.min(maxProviderLen, 20);
	const modelWidth = Math.min(maxModelLen, 60);
	const totalWidth = providerWidth + modelWidth + 40;
	const headerLine = "─".repeat(totalWidth);
	console.log(`┌${headerLine}┐`);
	console.log(`│ ${"Provider".padEnd(providerWidth)} │ ${"Model".padEnd(modelWidth)} │ Status │  Time   │  Size │ Tokens │`);
	console.log(`├${headerLine}┤`);
	for (const result of sortedResults) {
		const provider = result.provider.substring(0, providerWidth).padEnd(providerWidth);
		const model = result.model.substring(0, modelWidth).padEnd(modelWidth);
		const status = result.status === "success" ? "✅ OK " : "❌ ERR";
		const time = `${result.responseTime}ms`.padEnd(7);
		const size = `${result.responseSize}ch`.padEnd(5);
		const tokens = result.tokenUsage ? `${result.tokenUsage.total}`.padEnd(6) : "-".padEnd(6);
		console.log(`│ ${provider} │ ${model} │ ${status} │ ${time} │ ${size} │ ${tokens} │`);
	}
	console.log(`└${headerLine}┘`);
}
/**
* Print summary statistics
*/
function printSummary(results) {
	const successful = results.filter((r) => r.status === "success");
	const failed = results.filter((r) => r.status === "error");
	if (successful.length > 0) {
		const fastest = successful.reduce((min, r) => r.responseTime < min.responseTime ? r : min);
		const slowest = successful.reduce((max, r) => r.responseTime > max.responseTime ? r : max);
		console.log("\n📈 Summary:");
		console.log(`  Total: ${results.length} models`);
		console.log(`  Successful: ${successful.length}`);
		console.log(`  Failed: ${failed.length}`);
		console.log(`  Fastest: ${fastest.responseTime}ms (${fastest.provider}:${fastest.model})`);
		console.log(`  Slowest: ${slowest.responseTime}ms (${slowest.provider}:${slowest.model})`);
		console.log(`  Average: ${Math.round(successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length)}ms`);
	}
}
/**
* Print error report for failed models
*/
function printErrorReport(results) {
	const failed = results.filter((r) => r.status === "error");
	if (failed.length > 0) {
		console.log("\n❌ Error Report:\n");
		for (const result of failed) {
			console.log(`  ${result.provider}:${result.model}`);
			console.log(`    ${result.error}`);
			console.log("");
		}
	}
}
/**
* Save summary JSON to file
*/
function saveSummaryJson(outputDir, prompt, maxTokens, iterations, results) {
	const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
	const summaryFile = join(outputDir, `benchmark-summary-${timestamp}.json`);
	const summary = {
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		prompt,
		maxTokens,
		iterations,
		totalModels: results.length,
		successful: results.filter((r) => r.status === "success").length,
		failed: results.filter((r) => r.status === "error").length,
		results: results.map((r) => ({
			provider: r.provider,
			model: r.model,
			status: r.status,
			responseTime: r.responseTime,
			responseSize: r.responseSize,
			tokenUsage: r.tokenUsage,
			finishReason: r.finishReason,
			error: r.error,
			responsePreview: r.response ? r.response.substring(0, 200) : void 0
		}))
	};
	writeFileSync(summaryFile, JSON.stringify(summary, null, 2), "utf-8");
	console.log(`\n💾 Summary saved to: ${summaryFile}`);
}

//#endregion
//#region src/commands/benchmark/index.ts
async function benchmarkCommand(context, options) {
	const prompt = await getPrompt(options);
	const modelsToTest = await selectModels(context, options);
	if (modelsToTest.length === 0) {
		console.error("No models to benchmark. Specify --provider, --model, --models, or --all");
		process.exit(1);
	}
	const iterations = options.iterations || 1;
	const maxTokens = options.maxTokens;
	let outputDir;
	if (options.output) {
		outputDir = options.output;
		if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
		if (!options.json) console.log(`📁 Output directory: ${outputDir}\n`);
	}
	if (!options.json) {
		console.log(`🔬 Benchmarking ${modelsToTest.length} model(s) with ${iterations} iteration(s)\n`);
		console.log(`Prompt: "${prompt}"`);
		if (maxTokens !== void 0) console.log(`Max tokens: ${maxTokens}`);
		console.log();
	}
	const results = options.parallel ? await executeParallel(context, modelsToTest, prompt, options, outputDir) : await executeSequential(context, modelsToTest, prompt, options, outputDir);
	if (outputDir && !options.json) saveSummaryJson(outputDir, prompt, maxTokens, iterations, results);
	outputResults(results, options);
}
/**
* Get prompt from stdin, option, or default
*/
async function getPrompt(options) {
	let prompt = options.prompt;
	if (options.stdin || !process.stdin.isTTY && !options.prompt) {
		const chunks = [];
		for await (const chunk of process.stdin) chunks.push(chunk);
		prompt = Buffer.concat(chunks).toString("utf-8").trim();
	}
	if (!prompt) prompt = "What is 2+2? Answer in one sentence.";
	return prompt;
}

//#endregion
//#region src/commands/mcp/search.ts
/**
* Search for tools across all MCP servers
*/
async function mcpSearchCommand(context, query, options) {
	const { config, logger } = context;
	const discoveryConfig = config.discovery || {
		enabled: true,
		cache: {
			enabled: true,
			ttl: 3600
		}
	};
	const engine = new DiscoveryEngine(discoveryConfig, config.mcp?.servers);
	try {
		const results = await engine.searchTools(query, {
			server: options.server,
			limit: options.limit || 10
		});
		if (options.json) {
			console.log(JSON.stringify(results, null, 2));
			return;
		}
		if (results.length === 0) {
			console.log(`\nNo tools found matching "${query}"`);
			if (options.server) console.log(`  (searched in server: ${options.server})`);
			return;
		}
		console.log(`\n🔍 Search Results for "${query}" (${results.length})\n`);
		for (const result of results) {
			console.log(`  ${result.tool}`);
			console.log(`    ${result.summary}`);
			if (result.relevance !== void 0 && result.relevance !== null) console.log(`    Relevance: ${result.relevance.toFixed(2)}`);
			if (result.tags && result.tags.length > 0) console.log(`    Tags: ${result.tags.join(", ")}`);
			console.log("");
		}
	} catch (error) {
		logger.error("Failed to search tools:", error);
		throw error;
	} finally {
		await engine.dispose();
	}
}

//#endregion
//#region src/commands/mcp/inspect.ts
/**
* Unified inspect command:
* - No target: List all servers (like old mcp list)
* - <server> target: Inspect server config + tools (like old mcp tools)
* - <tool> target: Inspect tool details (old mcp inspect)
*/
async function mcpInspectCommand(context, target, options = {}) {
	const { config, logger } = context;
	const discoveryConfig = config.discovery || {
		enabled: true,
		cache: {
			enabled: true,
			ttl: 3600
		}
	};
	const engine = new DiscoveryEngine(discoveryConfig, config.mcp?.servers);
	try {
		if (options.server && !target) {
			await inspectServer(engine, config, options.server, options);
			return;
		}
		if (!target) {
			await listAllServers(engine, config, options);
			return;
		}
		await resolveAndInspect(engine, config, target, options);
	} catch (error) {
		logUpdate.clear();
		logger.error("Failed to inspect:", error);
		throw error;
	} finally {
		await engine.dispose();
		setTimeout(() => {
			if (!process.exitCode) process.exit(0);
		}, 100);
	}
}
/**
* List all servers (Case 1: no target)
*/
async function listAllServers(engine, config, options) {
	const serverNames = Object.keys(config.mcp?.servers || {}).filter((name) => {
		const isDisabled = (config.mcp?.servers?.[name])?.enabled === false;
		if (options.enabled) return !isDisabled;
		if (options.disabled) return isDisabled;
		return true;
	});
	const serverCount = serverNames.length;
	const serverStatus = /* @__PURE__ */ new Map();
	const cleanup = () => {
		logUpdate.clear();
		engine.dispose().catch(() => {});
		process.exit(130);
	};
	process.once("SIGINT", cleanup);
	process.once("SIGTERM", cleanup);
	const renderDashboard = () => {
		const lines = ["\n📦 MCP Servers\n"];
		for (const name of serverNames) {
			const status = serverStatus.get(name);
			let icon = "🟡";
			let statusText = "Waiting...";
			if (status) {
				if (status.status === "connecting") {
					icon = "🟡";
					statusText = "Connecting...";
				} else if (status.status === "discovering") {
					icon = "🟡";
					statusText = "Discovering...";
				} else if (status.status === "connected") {
					icon = "🟢";
					statusText = `${status.toolCount} tools`;
				} else if (status.status === "error") {
					icon = "🔴";
					statusText = "unavailable";
				}
			}
			const serverConfig = config.mcp?.servers?.[name];
			const source = serverConfig?.source;
			const isDisabled = serverConfig?.enabled === false;
			if (isDisabled) {
				icon = "⚪";
				const toolCount = serverConfig?.metadata?.toolCount;
				statusText = toolCount !== void 0 ? chalk.gray(`${toolCount} tools (disabled)`) : chalk.gray("disabled");
			}
			const plainTextName = source ? `${name}(${source})` : name;
			const paddingNeeded = Math.max(0, 45 - plainTextName.length);
			const serverNameWithSource = source ? `${name}${chalk.gray(`(${source})`)}` : name;
			const serverName = isDisabled ? chalk.gray(serverNameWithSource) : chalk.bold.cyan(serverNameWithSource);
			lines.push(`  ${icon} ${serverName}${" ".repeat(paddingNeeded)} ${statusText}`);
			if (status?.status === "error" && status.error && !isDisabled) {
				const errorLines = status.error.split("\n").map((line) => line.trim() ? chalk.red(`     ${line}`) : "").filter((line) => line);
				lines.push(...errorLines);
				const cmd = `${serverConfig.command} ${serverConfig.args?.join(" ") || ""}`.trim();
				lines.push(chalk.gray(`     Command: ${cmd}`));
			}
		}
		const disabledCount = serverNames.filter((name) => {
			return (config.mcp?.servers?.[name])?.enabled === false;
		}).length;
		const completed = Array.from(serverStatus.values()).filter((s) => s.status === "connected" || s.status === "error").length;
		const connected = Array.from(serverStatus.values()).filter((s) => s.status === "connected").length;
		if (completed < serverCount) lines.push(`\n  Progress: ${completed}/${serverCount}`);
		else {
			const actualFailed = serverCount - connected - disabledCount;
			const totalActive = serverCount - disabledCount;
			if (options.disabled && disabledCount > 0) lines.push(`\n  ${chalk.gray(`${disabledCount} disabled ${disabledCount === 1 ? "server" : "servers"}`)}`);
			else if (options.enabled) if (actualFailed === 0) lines.push(`\n  ${chalk.green(`✓ All ${connected} servers loaded`)}`);
			else lines.push(`\n  ${chalk.yellow(`⚠ ${connected}/${totalActive} servers loaded`)} ${chalk.gray(`(${actualFailed} failed)`)}`);
			else if (actualFailed === 0 && disabledCount === 0) lines.push(`\n  ${chalk.green(`✓ All ${serverCount} servers loaded`)}`);
			else if (actualFailed === 0 && disabledCount > 0) lines.push(`\n  ${chalk.green(`✓ All ${totalActive} servers loaded`)} ${chalk.gray(`(${disabledCount} disabled)`)}`);
			else {
				const failedText = actualFailed > 0 ? chalk.gray(`${actualFailed} failed`) : "";
				const disabledText = disabledCount > 0 ? chalk.gray(`${disabledCount} disabled`) : "";
				const parts = [failedText, disabledText].filter(Boolean).join(", ");
				lines.push(`\n  ${chalk.yellow(`⚠ ${connected}/${totalActive} servers loaded`)} ${chalk.gray(`(${parts})`)}`);
			}
		}
		logUpdate(lines.join("\n"));
	};
	renderDashboard();
	await engine.initialize((progress) => {
		serverStatus.set(progress.server, {
			status: progress.status,
			error: progress.error,
			toolCount: progress.toolCount
		});
		renderDashboard();
	});
	const servers = await engine.listServers();
	process.removeAllListeners("SIGINT");
	process.removeAllListeners("SIGTERM");
	renderDashboard();
	if (options.json) {
		logUpdate.clear();
		console.log(JSON.stringify(servers, null, 2));
		return;
	}
	if (servers.length === 0) {
		logUpdate.clear();
		console.log("No MCP servers configured.");
		console.log("\nTo add MCP servers, configure them in your AnyGPT config file.");
		return;
	}
	if (options.tools) {
		console.log("");
		for (const server of servers) if (server.status === "connected") {
			const tools = await engine.listTools(server.name, true);
			if (tools.length > 0) {
				const enabledCount = tools.filter((t) => t.enabled).length;
				const totalCount = tools.length;
				console.log(`  ${chalk.bold.cyan(server.name)}:`);
				if (options.compact) {
					const statsText = enabledCount === totalCount ? chalk.green(`(${enabledCount}/${totalCount} enabled)`) : chalk.yellow(`(${enabledCount}/${totalCount} enabled)`);
					const toolNames = tools.map((t) => t.enabled ? t.name : chalk.gray(t.name));
					console.log(`     ${toolNames.join(", ")} ` + statsText);
				} else {
					const statsText = enabledCount === totalCount ? chalk.green(`(${enabledCount}/${totalCount} enabled)`) : chalk.yellow(`(${enabledCount}/${totalCount} enabled)`);
					console.log(`     ${statsText}`);
					for (const tool of tools) {
						const toolName = tool.enabled ? chalk.white(tool.name) : chalk.gray(tool.name);
						const description = tool.description || tool.summary || "No description";
						console.log(`       • ${toolName}`);
						console.log(chalk.gray(`         ${description}`));
					}
				}
				console.log("");
			}
		}
	}
}
/**
* Initialize engine with timeout
*/
async function initializeWithTimeout(engine, timeoutMs = 1e4) {
	const timeoutPromise = new Promise((_, reject) => {
		setTimeout(() => reject(/* @__PURE__ */ new Error("Initialization timeout")), timeoutMs);
	});
	try {
		await Promise.race([engine.initialize(), timeoutPromise]);
	} catch (error) {
		if (error instanceof Error && error.message === "Initialization timeout") console.log(chalk.yellow("\n⚠ Initialization timed out after 10s, showing available servers only\n"));
		else throw error;
	}
}
/**
* Inspect specific server (Case 2: --server or server target)
*/
async function inspectServer(engine, config, serverName, options) {
	process.stdout.write("🔄 Initializing MCP servers...");
	await initializeWithTimeout(engine);
	process.stdout.write("\r\x1B[K");
	const serverConfig = config.mcp?.servers?.[serverName];
	if (!serverConfig) {
		console.log(`\n✗ Server "${serverName}" not found in configuration\n`);
		return;
	}
	if (options.json) {
		const tools = await engine.listTools(serverName, true);
		console.log(JSON.stringify({
			server: serverName,
			config: serverConfig,
			tools
		}, null, 2));
		return;
	}
	console.log(`\n📦 Server: ${chalk.bold.cyan(serverName)}\n`);
	const isDisabled = serverConfig.enabled === false;
	console.log(`  Status: ${isDisabled ? chalk.gray("disabled") : chalk.green("enabled")}`);
	const fullCommand = serverConfig.args && serverConfig.args.length > 0 ? `${serverConfig.command} ${serverConfig.args.join(" ")}` : serverConfig.command;
	console.log(`  Command: ${fullCommand}`);
	if (serverConfig.source) console.log(`  Source: ${chalk.gray(serverConfig.source)}`);
	if (options.tools !== false) try {
		const tools = await engine.listTools(serverName, true);
		if (tools.length === 0) console.log(`\n  No tools available`);
		else {
			const enabledCount = tools.filter((t) => t.enabled).length;
			const totalCount = tools.length;
			console.log(`\n  Tools (${enabledCount}/${totalCount} enabled):\n`);
			for (const tool of tools) {
				const toolName = tool.enabled ? chalk.white(tool.name) : chalk.gray(tool.name);
				const description = tool.description || tool.summary || "No description";
				console.log(`    • ${toolName}`);
				console.log(chalk.gray(`      ${description}`));
			}
		}
	} catch (error) {
		console.log(`\n  ${chalk.red("Failed to load tools")}`);
		if (error instanceof Error) console.log(chalk.gray(`  ${error.message}`));
	}
	console.log("");
}
/**
* Inspect specific tool (Case 3: tool target)
*/
async function inspectTool(engine, toolName, serverName, options) {
	const tool = await engine.getToolDetails(serverName, toolName);
	if (!tool) {
		console.log(`\nTool "${toolName}" not found in server "${serverName}"`);
		return;
	}
	if (options.json) {
		console.log(JSON.stringify(tool, null, 2));
		return;
	}
	console.log(`\n🔍 Tool: ${chalk.bold.cyan(tool.name)}\n`);
	console.log(`  Server: ${tool.server}`);
	const description = tool.description || tool.summary;
	if (description) console.log(`  Description: ${description}`);
	console.log(`  Enabled: ${tool.enabled ? chalk.green("✓ Yes") : chalk.gray("✗ No")}`);
	if (tool.tags.length > 0) console.log(`  Tags: ${tool.tags.join(", ")}`);
	if (tool.parameters && tool.parameters.length > 0) {
		console.log(`\n  Parameters:`);
		for (const param of tool.parameters) {
			const required = param.required ? chalk.yellow("(required)") : chalk.gray("(optional)");
			console.log(`    • ${chalk.white(param.name)}: ${chalk.cyan(param.type)} ${required}`);
			if (param.description) console.log(chalk.gray(`      ${param.description}`));
			if (param.default !== void 0) console.log(chalk.gray(`      Default: ${JSON.stringify(param.default)}`));
		}
	}
	if (options.examples && tool.examples && tool.examples.length > 0) {
		console.log(`\n  Examples:`);
		for (const example of tool.examples) {
			console.log(`    ${example.description}`);
			console.log(`    Parameters: ${JSON.stringify(example.parameters, null, 2)}`);
			console.log("");
		}
	}
	console.log("");
}
/**
* Resolve target and inspect (Case 3: target provided)
*/
async function resolveAndInspect(engine, config, target, options) {
	process.stdout.write("🔄 Initializing MCP servers...");
	await initializeWithTimeout(engine);
	process.stdout.write("\r\x1B[K");
	if (config.mcp?.servers?.[target]) {
		await inspectServer(engine, config, target, options);
		return;
	}
	let resolvedServer;
	if (options.server) resolvedServer = options.server;
	else {
		process.stdout.write("🔍 Searching for tool across servers...");
		const allServers = await engine.listServers();
		process.stdout.write("\r\x1B[K");
		const matchingTools = [];
		for (const server of allServers) if (server.status === "connected") {
			if ((await engine.listTools(server.name, false)).find((t) => t.name === target)) matchingTools.push({
				server: server.name,
				tool: target
			});
		}
		if (matchingTools.length === 1) {
			resolvedServer = matchingTools[0].server;
			console.log(`\n${chalk.gray(`Auto-resolved from server "${resolvedServer}"`)}`);
		} else if (matchingTools.length > 1) {
			console.log(`\n${chalk.yellow("⚠ Ambiguous:")} "${target}" matches multiple items:\n`);
			for (const match of matchingTools) console.log(`  ${chalk.cyan("Tool:")} ${target} ${chalk.gray(`(server: ${match.server})`)}`);
			console.log(`\n${chalk.gray("Use:")} anygpt mcp inspect ${target} --server=<name>\n`);
			return;
		} else {
			console.log(`\n${chalk.red("✗")} "${target}" not found (not a server or tool)\n`);
			return;
		}
	}
	await inspectTool(engine, target, resolvedServer, options);
}

//#endregion
//#region src/commands/mcp/execute.ts
/**
* Execute a tool from any discovered MCP server
*/
async function mcpExecuteCommand(context, toolName, argsOrOptions, optionsIfArgs) {
	let positionalArgs;
	let options;
	if (Array.isArray(argsOrOptions)) {
		positionalArgs = argsOrOptions;
		options = optionsIfArgs || {};
	} else {
		positionalArgs = [];
		options = argsOrOptions;
	}
	const serverName = options.server;
	const { config, logger } = context;
	const discoveryConfig = config.discovery || {
		enabled: true,
		cache: {
			enabled: true,
			ttl: 3600
		}
	};
	const engine = new DiscoveryEngine(discoveryConfig, config.mcp?.servers);
	try {
		process.stdout.write("🔄 Initializing MCP servers...");
		await engine.initialize();
		process.stdout.write("\r\x1B[K");
		let resolvedServer;
		if (serverName) resolvedServer = serverName;
		else {
			process.stdout.write("🔍 Searching for tool across servers...");
			const allServers = await engine.listServers();
			process.stdout.write("\r\x1B[K");
			const matchingTools = [];
			for (const server of allServers) if (server.status === "connected") {
				if ((await engine.listTools(server.name, false)).find((t) => t.name === toolName)) matchingTools.push({
					server: server.name,
					tool: toolName
				});
			}
			if (matchingTools.length === 1) {
				resolvedServer = matchingTools[0].server;
				console.log(`\n🔍 Auto-resolved tool "${toolName}" from server "${resolvedServer}"\n`);
			} else if (matchingTools.length > 1) {
				console.log(`\n⚠ Multiple servers provide tool "${toolName}":\n`);
				for (const match of matchingTools) console.log(`  - ${match.server}`);
				console.log(`\nPlease specify the server: npx anygpt mcp execute ${toolName} --server <server-name>\n`);
				return;
			} else {
				console.log(`\n✗ Tool "${toolName}" not found on any connected server\n`);
				return;
			}
		}
		let args = {};
		if (options.args) try {
			args = JSON.parse(options.args);
		} catch (error) {
			throw new Error(`Invalid JSON arguments: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
		else if (positionalArgs.length > 0) {
			const tool = await engine.getToolDetails(resolvedServer, toolName);
			if (tool && tool.parameters && tool.parameters.length > 0) for (let i = 0; i < positionalArgs.length && i < tool.parameters.length; i++) {
				const param = tool.parameters[i];
				args[param.name] = positionalArgs[i];
			}
			else {
				if (positionalArgs.length > 0) args["query"] = positionalArgs[0];
				if (positionalArgs.length > 1) args["max_results"] = positionalArgs[1];
			}
		}
		const result = await engine.executeTool(resolvedServer, toolName, args);
		if (options.json) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		if (result.success) {
			console.log(`\n✓ Tool executed successfully\n`);
			const resultData = result.result;
			if (resultData && typeof resultData === "object" && "content" in resultData) {
				const content = resultData.content;
				if (Array.isArray(content)) for (const item of content) if (item.type === "text" && item.text) console.log(item.text);
				else console.log(JSON.stringify(item, null, 2));
				else console.log(JSON.stringify(resultData, null, 2));
			} else console.log(JSON.stringify(resultData, null, 2));
		} else {
			console.log(`\n✗ Tool execution failed\n`);
			if (result.error) {
				console.log(`Error: ${result.error.message}`);
				console.log(`Code: ${result.error.code}`);
				if (result.error.details) console.log(`Details: ${JSON.stringify(result.error.details, null, 2)}`);
			}
		}
		console.log("");
	} catch (error) {
		logger.error("Failed to execute tool:", error);
		throw error;
	} finally {
		await engine.dispose();
	}
}

//#endregion
//#region src/commands/mcp/config.ts
/**
* Show MCP discovery configuration
*/
async function mcpConfigShowCommand(context, options) {
	const { config, logger } = context;
	try {
		const discoveryConfig = config.discovery || {
			enabled: true,
			cache: {
				enabled: true,
				ttl: 3600
			}
		};
		if (options.json) {
			console.log(JSON.stringify(discoveryConfig, null, 2));
			return;
		}
		console.log(`\n⚙️  MCP Discovery Configuration\n`);
		console.log(`  Enabled: ${discoveryConfig.enabled ? "✓ Yes" : "✗ No"}`);
		if (discoveryConfig.cache) {
			console.log(`\n  Cache:`);
			console.log(`    Enabled: ${discoveryConfig.cache.enabled ? "✓ Yes" : "✗ No"}`);
			console.log(`    TTL: ${discoveryConfig.cache.ttl}s`);
		}
		if (discoveryConfig.sources && discoveryConfig.sources.length > 0) {
			console.log(`\n  Sources (${discoveryConfig.sources.length}):`);
			for (const source of discoveryConfig.sources) console.log(`    • ${source.type}: ${source.path || source.url || "default"}`);
		}
		if (discoveryConfig.toolRules && discoveryConfig.toolRules.length > 0) {
			console.log(`\n  Tool Rules (${discoveryConfig.toolRules.length}):`);
			for (const rule of discoveryConfig.toolRules) {
				const patterns = Array.isArray(rule.pattern) ? rule.pattern.join(", ") : rule.pattern;
				const status = rule.enabled === true ? "✓ enabled" : rule.enabled === false ? "✗ disabled" : "default";
				console.log(`    • ${patterns} → ${status}`);
				if (rule.server) console.log(`      Server: ${rule.server}`);
				if (rule.tags && rule.tags.length > 0) console.log(`      Tags: ${rule.tags.join(", ")}`);
			}
		}
		const serverCount = Object.keys(config.mcp?.servers || {}).length;
		if (serverCount > 0) {
			console.log(`\n  MCP Servers (${serverCount}):`);
			for (const [name, serverConfig] of Object.entries(config.mcp?.servers || {})) {
				const cfg = serverConfig;
				console.log(`    • ${name}`);
				console.log(`      Command: ${cfg.command} ${cfg.args?.join(" ") || ""}`);
				if (cfg.env && Object.keys(cfg.env).length > 0) console.log(`      Env vars: ${Object.keys(cfg.env).join(", ")}`);
			}
		} else console.log(`\n  MCP Servers: None configured`);
		console.log("");
	} catch (error) {
		logger.error("Failed to show config:", error);
		throw error;
	}
}
/**
* Validate MCP discovery configuration
*/
async function mcpConfigValidateCommand(context, options) {
	const { config, logger } = context;
	const discoveryConfig = config.discovery || {
		enabled: true,
		cache: {
			enabled: true,
			ttl: 3600
		}
	};
	const engine = new DiscoveryEngine(discoveryConfig, config.mcp?.servers);
	try {
		if (options.json) {
			console.log(JSON.stringify({
				valid: true,
				config: discoveryConfig
			}, null, 2));
			return;
		}
		console.log(`\n✓ Configuration is valid\n`);
	} catch (error) {
		if (options.json) {
			console.log(JSON.stringify({
				valid: false,
				error: error instanceof Error ? error.message : "Unknown error"
			}, null, 2));
			return;
		}
		console.log(`\n✗ Configuration is invalid\n`);
		logger.error("Validation failed:", error);
		throw error;
	} finally {
		await engine.dispose();
	}
}
/**
* Reload MCP discovery configuration
*/
async function mcpConfigReloadCommand(context, options) {
	const { config, logger } = context;
	const discoveryConfig = config.discovery || {
		enabled: true,
		cache: {
			enabled: true,
			ttl: 3600
		}
	};
	const engine = new DiscoveryEngine(discoveryConfig, config.mcp?.servers);
	try {
		await engine.reload();
		if (options.json) {
			console.log(JSON.stringify({ reloaded: true }, null, 2));
			return;
		}
		console.log(`\n✓ Configuration reloaded successfully\n`);
	} catch (error) {
		logger.error("Failed to reload config:", error);
		throw error;
	} finally {
		await engine.dispose();
	}
}

//#endregion
//#region src/index.ts
const program = new Command();
program.name("anygpt").description("AnyGPT - Universal AI Gateway CLI").version("0.0.1").option("-c, --config <path>", "path to config file").option("-v, --verbose [level]", "verbose output: no value = info (metrics), \"debug\" = debug logs");
program.command("chat").description("Send chat message (stateless)").option("--provider <name>", "provider name from config").option("--type <type>", "provider type (openai, anthropic, google)").option("--url <url>", "API endpoint URL").option("--token <token>", "API token").option("--model <model>", "direct model name (no tag resolution, passed as-is to provider)").option("--tag <tag>", "tag name for model resolution (e.g., \"sonnet\", \"openai:gemini\", \"cody:opus\")").option("--max-tokens <number>", "maximum tokens to generate", parseInt).option("--usage", "show token usage statistics").option("--stdin", "read message from stdin instead of argument").argument("[message]", "message to send (optional if --stdin is used)").action(withCLIContext(chatCommand));
program.command("chat-interactive").alias("repl").description("Start interactive chat session with AI").option("--echo", "use simple echo mode (no AI)").option("--model <model>", "model to use (e.g., gpt-4o-mini, claude-3-5-sonnet)").option("--provider <provider>", "provider to use (e.g., openai, anthropic)").action(withCLIContext(chatInteractiveCommand));
program.command("config").description("Show resolved configuration").option("--json", "output as JSON").action(withCLIContext(configCommand));
program.command("list-models").description("List available models from a provider").option("--provider <name>", "provider name from config (uses default from config if not specified)").option("--tags", "show resolved tags for each model").option("--filter-tags <tags>", "filter models by tags (comma-separated, use ! prefix to exclude). Examples: \"reasoning\", \"!reasoning\", \"claude,sonnet\"").option("--enabled [value]", "filter by enabled status (true/false, default: true if flag present)", (val) => {
	if (val === "false" || val === "0") return false;
	if (val === "true" || val === "1") return true;
	return true;
}).option("--json", "output as JSON").action(withCLIContext(listModelsCommand));
program.command("list-tags").description("List all available tags and their model mappings").option("--provider <name>", "filter by provider name").option("--json", "output as JSON").action(withCLIContext(listTagsCommand));
program.command("benchmark").description("Benchmark models across providers").option("--provider <name>", "benchmark all models from this provider").option("--model <model>", "specific model to benchmark (requires --provider)").option("--models <list>", "comma-separated list of provider:model pairs (e.g., \"openai:gpt-4o,anthropic:claude-3-5-sonnet\")").option("--prompt <text>", "prompt to use for benchmarking (default: \"What is 2+2? Answer in one sentence.\")").option("--stdin", "read prompt from stdin").option("--max-tokens <number>", "maximum tokens to generate (optional, some models may not support this)", (val) => parseInt(val, 10)).option("--iterations <number>", "number of iterations per model", (val) => parseInt(val, 10), 1).option("--all", "benchmark all models from all providers").option("--filter-tags <tags>", "filter models by tags (comma-separated, use ! prefix to exclude)").option("--parallel", "run models in parallel instead of sequentially").option("--concurrency <number>", "max parallel requests when using --parallel (default: 3)", (val) => parseInt(val, 10), 3).option("--output <directory>", "directory to save response files").option("--json", "output as JSON").action(withCLIContext(benchmarkCommand));
const conversation = program.command("conversation").description("Manage stateful conversations");
conversation.command("start").description("Start a new conversation").option("--provider <name>", "provider name from config (uses default from config if not specified)").option("--model <model>", "model name (uses default from config if not specified)").option("--name <name>", "conversation name").action(async (options, command) => {
	const globalOpts = command.parent.parent.opts();
	try {
		await conversationStartCommand(options, globalOpts.config);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("end").description("End the current conversation").action(async () => {
	try {
		await conversationEndCommand();
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("list").description("List all conversations").action(async () => {
	try {
		await conversationListCommand();
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("continue <id>").description("Continue a specific conversation").action(async (id) => {
	try {
		await conversationContinueCommand(id);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("delete <id>").description("Delete a conversation").action(async (id) => {
	try {
		await conversationDeleteCommand(id);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("message <message>").description("Send a message in the current conversation").option("--conversation <id>", "conversation ID to send message to").action(async (message, options, command) => {
	const globalOpts = command.parent.parent.opts();
	try {
		await conversationMessageCommand(message, options, globalOpts.config);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("context").description("Show detailed context statistics for the current conversation").option("--conversation <id>", "conversation ID to analyze").action(async (options) => {
	try {
		await conversationContextCommand(options);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("condense").description("Condense conversation context using AI summarization").option("--conversation <id>", "conversation ID to condense").option("--keep-recent <number>", "number of recent messages to keep", "3").option("--dry-run", "show what would be condensed without applying changes").action(async (options) => {
	try {
		const condenseOptions = {
			...options,
			keepRecent: parseInt(options.keepRecent) || 3
		};
		await conversationCondenseCommand(condenseOptions);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("fork").description("Fork conversation - create new conversation with same history").option("--conversation <id>", "conversation ID to fork").option("--model <model>", "model for the new conversation").option("--provider <provider>", "provider for the new conversation").option("--name <name>", "name for the new conversation").action(async (options) => {
	try {
		await conversationForkCommand(options);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("summarize").description("Create new conversation with AI-generated summary").option("--conversation <id>", "conversation ID to summarize").option("--keep-recent <number>", "number of recent messages to keep", "3").option("--model <model>", "model for the new conversation").option("--provider <provider>", "provider for the new conversation").option("--name <name>", "name for the new conversation").option("--dry-run", "show what would be summarized without creating new conversation").action(async (options) => {
	try {
		const summarizeOptions = {
			...options,
			keepRecent: parseInt(options.keepRecent) || 3
		};
		await conversationSummarizeCommand(summarizeOptions);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
conversation.command("show").description("Show full conversation history").option("--conversation <id>", "conversation ID to show").option("--limit <number>", "limit number of messages to show (shows last N messages)").option("--format <format>", "output format: full, compact, or json", "full").action(async (options) => {
	try {
		const showOptions = {
			...options,
			limit: options.limit ? parseInt(options.limit) : void 0
		};
		await conversationShowCommand(showOptions);
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
});
const mcp = program.command("mcp").description("Manage MCP servers and tools");
mcp.command("inspect [target]").description("Inspect servers and tools (no target = list all servers, <server> = inspect server, <tool> = inspect tool)").option("--server <name>", "specify server to inspect or disambiguate tool").option("--tools", "show tools when listing servers or inspecting server").option("--compact", "show tools in compact format (use with --tools)").option("--args", "show detailed parameter schemas for tools").option("--examples", "show usage examples for tools").option("--enabled", "show only enabled servers (when listing)").option("--disabled", "show only disabled servers (when listing)").option("--all", "show all servers including disabled (when listing)").option("--json", "output as JSON").action(withCLIContext(mcpInspectCommand));
mcp.command("search <query>").description("Search for tools across all MCP servers").option("--server <name>", "filter by server name").option("--limit <number>", "maximum number of results", parseInt, 10).option("--json", "output as JSON").action(withCLIContext(mcpSearchCommand));
mcp.command("execute <tool> [args...]").description("Execute a tool (auto-resolves server if tool name is unique)").option("--server <name>", "specify server name (optional if tool is unique)").option("--args <json>", "tool arguments as JSON string (overrides positional args)").option("--json", "output as JSON").option("--stream", "stream output (if supported)").action(withCLIContext(mcpExecuteCommand));
const mcpConfig = mcp.command("config").description("Manage MCP discovery configuration");
mcpConfig.command("show").description("Show current configuration").option("--json", "output as JSON").action(withCLIContext(mcpConfigShowCommand));
mcpConfig.command("validate").description("Validate configuration").option("--json", "output as JSON").action(withCLIContext(mcpConfigValidateCommand));
mcpConfig.command("reload").description("Reload configuration").option("--json", "output as JSON").action(withCLIContext(mcpConfigReloadCommand));
program.parse();

//#endregion
export {  };
//# sourceMappingURL=src-KcZw2Fgx.js.map