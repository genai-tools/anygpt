/**
 * ErrorHandler - Handles errors with retry logic and exponential backoff
 */

import { MaxRetriesExceededError } from './errors.js';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Backoff strategy: exponential or linear */
  backoffType: 'exponential' | 'linear';
  /** Base delay in milliseconds */
  baseDelay: number;
  /** Maximum delay cap in milliseconds */
  maxDelay?: number;
  /** Add random jitter (0-500ms) to prevent thundering herd */
  jitter?: boolean;
}

/**
 * Context information for error handling
 */
export interface ErrorContext {
  /** The error that occurred */
  error: Error;
  /** Current attempt number (0-indexed) */
  attempt: number;
  /** Provider ID where error occurred */
  providerId: string;
  /** Operation being performed */
  operation: string;
  /** Additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Decision about whether to retry
 */
export interface RetryDecision {
  /** Whether to retry the operation */
  shouldRetry: boolean;
  /** Delay before next retry in milliseconds */
  delay?: number;
  /** Next attempt number */
  nextAttempt?: number;
  /** Reason for the decision */
  reason: string;
}

/**
 * ErrorHandler manages retry logic with exponential backoff
 */
export class ErrorHandler {
  private config: Required<RetryConfig>;

  constructor(config: RetryConfig) {
    this.config = {
      maxRetries: config.maxRetries,
      backoffType: config.backoffType,
      baseDelay: config.baseDelay,
      maxDelay: config.maxDelay ?? 30000, // Default 30s max
      jitter: config.jitter ?? true,
    };
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: Error): boolean {
    // Check for HTTP status codes
    const status = (error as any).status || (error as any).statusCode;
    if (status !== undefined) {
      // Retryable: 429 (rate limit), 5xx (server errors)
      if (status === 429 || (status >= 500 && status < 600)) {
        return true;
      }
      // Not retryable: 4xx client errors (except 429)
      if (status >= 400 && status < 500) {
        return false;
      }
    }

    // Check for network errors
    const code = (error as any).code;
    if (code) {
      const networkErrors = [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ENETUNREACH',
        'EAI_AGAIN',
      ];
      if (networkErrors.includes(code)) {
        return true;
      }
    }

    // Check for timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return true;
    }

    // Default: not retryable
    return false;
  }

  /**
   * Calculate delay for retry attempt with backoff
   */
  calculateDelay(attempt: number): number {
    let delay: number;

    if (this.config.backoffType === 'exponential') {
      // Exponential: baseDelay * 2^attempt
      delay = this.config.baseDelay * Math.pow(2, attempt);
    } else {
      // Linear: baseDelay * (attempt + 1)
      delay = this.config.baseDelay * (attempt + 1);
    }

    // Apply max delay cap
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter if enabled (random 0-500ms)
    if (this.config.jitter) {
      delay += Math.random() * 500;
    }

    return Math.floor(delay);
  }

  /**
   * Decide whether to retry based on context
   */
  shouldRetry(context: ErrorContext): RetryDecision {
    // Check if max retries exceeded
    if (context.attempt >= this.config.maxRetries) {
      return {
        shouldRetry: false,
        reason: `Max retries (${this.config.maxRetries}) exceeded`,
      };
    }

    // Check if error is retryable
    if (!this.isRetryable(context.error)) {
      return {
        shouldRetry: false,
        reason: `Error is not retryable: ${context.error.message}`,
      };
    }

    // Calculate delay for next retry
    const delay = this.calculateDelay(context.attempt);

    return {
      shouldRetry: true,
      delay,
      nextAttempt: context.attempt + 1,
      reason: `Error is retryable, will retry after ${delay}ms`,
    };
  }

  /**
   * Execute an operation with automatic retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'error' | 'attempt'>
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        const errorContext: ErrorContext = {
          ...context,
          error: error as Error,
          attempt,
        };

        const decision = this.shouldRetry(errorContext);

        if (!decision.shouldRetry) {
          // If max retries exceeded, throw specific error
          if (errorContext.attempt >= this.config.maxRetries) {
            throw new MaxRetriesExceededError(
              context.providerId,
              context.operation,
              this.config.maxRetries,
              error as Error
            );
          }
          // Otherwise, throw original error
          throw error;
        }

        // Wait before retrying
        if (decision.delay) {
          await this.sleep(decision.delay);
        }

        attempt = decision.nextAttempt!;
      }
    }
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a default ErrorHandler instance
 */
export function createErrorHandler(config?: Partial<RetryConfig>): ErrorHandler {
  return new ErrorHandler({
    maxRetries: config?.maxRetries ?? 3,
    backoffType: config?.backoffType ?? 'exponential',
    baseDelay: config?.baseDelay ?? 1000,
    maxDelay: config?.maxDelay,
    jitter: config?.jitter,
  });
}
