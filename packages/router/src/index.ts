// Main router exports
export * from './lib/router.js';
export { default } from './lib/router.js';
export { default as GenAIRouter } from './lib/router.js';
export { default as GenAIGateway } from './lib/router.js'; // Backward compatibility
export { createRouter, createGateway } from './lib/router.js';

// Type exports - centralized from types directory
export type * from './types/index.js';

// Connector exports (base classes and registry)
export { BaseConnector } from './connectors/base/index.js';
export { ConnectorRegistry } from './connectors/registry.js';

// Configuration helper
export { defineConfig } from './config.js';
export type { RouterConfig, GatewayConfig, ProviderConfig, ApiConfig } from './config.js';

// Error exports
export * from './errors.js';

// Error handler exports
export { ErrorHandler, createErrorHandler } from './error-handler.js';
export type { RetryConfig, ErrorContext, RetryDecision } from './error-handler.js';
