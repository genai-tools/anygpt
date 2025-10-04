/**
 * Custom error classes for the router package
 * Following TypeScript best practices for error handling
 */

/**
 * Base error class for all router-related errors
 */
export class RouterError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'RouterError';
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when a connector is not found for a provider
 */
export class ConnectorNotFoundError extends RouterError {
  constructor(public readonly providerId: string) {
    super(
      `Connector not found for provider: ${providerId}`,
      'CONNECTOR_NOT_FOUND'
    );
    this.name = 'ConnectorNotFoundError';
  }
}

/**
 * Error thrown when a provider is not configured
 */
export class ProviderNotConfiguredError extends RouterError {
  constructor(public readonly providerId: string) {
    super(
      `Provider '${providerId}' is not configured`,
      'PROVIDER_NOT_CONFIGURED'
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends RouterError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a connector operation fails
 */
export class ConnectorError extends RouterError {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly originalError?: Error
  ) {
    super(message, 'CONNECTOR_ERROR');
    this.name = 'ConnectorError';
    
    // Preserve original error stack if available
    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

/**
 * Error thrown when a model is not supported
 */
export class ModelNotSupportedError extends RouterError {
  constructor(
    public readonly modelId: string,
    public readonly providerId: string
  ) {
    super(
      `Model '${modelId}' is not supported by provider '${providerId}'`,
      'MODEL_NOT_SUPPORTED'
    );
    this.name = 'ModelNotSupportedError';
  }
}

/**
 * Error thrown when a timeout occurs
 */
export class TimeoutError extends RouterError {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      'TIMEOUT'
    );
    this.name = 'TimeoutError';
  }
}
