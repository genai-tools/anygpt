/**
 * Tests for ErrorHandler - retry logic and error classification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler, RetryDecision, ErrorContext } from './error-handler.js';
import { TimeoutError, ConnectorError } from './errors.js';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = new ErrorHandler({
      maxRetries: 3,
      backoffType: 'exponential',
      baseDelay: 1000,
      maxDelay: 10000,
      jitter: true,
    });
  });

  describe('isRetryable', () => {
    it('should identify rate limit errors as retryable', () => {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      
      expect(handler.isRetryable(error)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new TimeoutError('request', 5000);
      
      expect(handler.isRetryable(error)).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      const error = new Error('ECONNRESET');
      (error as any).code = 'ECONNRESET';
      
      expect(handler.isRetryable(error)).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      const error = new Error('Internal server error');
      (error as any).status = 500;
      
      expect(handler.isRetryable(error)).toBe(true);
    });

    it('should NOT retry authentication errors (401)', () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      
      expect(handler.isRetryable(error)).toBe(false);
    });

    it('should NOT retry forbidden errors (403)', () => {
      const error = new Error('Forbidden');
      (error as any).status = 403;
      
      expect(handler.isRetryable(error)).toBe(false);
    });

    it('should NOT retry not found errors (404)', () => {
      const error = new Error('Not found');
      (error as any).status = 404;
      
      expect(handler.isRetryable(error)).toBe(false);
    });

    it('should NOT retry bad request errors (400)', () => {
      const error = new Error('Bad request');
      (error as any).status = 400;
      
      expect(handler.isRetryable(error)).toBe(false);
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff delays', () => {
      const handlerNoJitter = new ErrorHandler({
        maxRetries: 3,
        backoffType: 'exponential',
        baseDelay: 1000,
        jitter: false,
      });

      expect(handlerNoJitter.calculateDelay(0)).toBe(1000); // 1s
      expect(handlerNoJitter.calculateDelay(1)).toBe(2000); // 2s
      expect(handlerNoJitter.calculateDelay(2)).toBe(4000); // 4s
    });

    it('should calculate linear backoff delays', () => {
      const handlerLinear = new ErrorHandler({
        maxRetries: 3,
        backoffType: 'linear',
        baseDelay: 1000,
        jitter: false,
      });

      expect(handlerLinear.calculateDelay(0)).toBe(1000); // 1s
      expect(handlerLinear.calculateDelay(1)).toBe(2000); // 2s
      expect(handlerLinear.calculateDelay(2)).toBe(3000); // 3s
    });

    it('should respect maxDelay cap', () => {
      const handlerCapped = new ErrorHandler({
        maxRetries: 10,
        backoffType: 'exponential',
        baseDelay: 1000,
        maxDelay: 5000,
        jitter: false,
      });

      expect(handlerCapped.calculateDelay(10)).toBeLessThanOrEqual(5000);
    });

    it('should add jitter when enabled', () => {
      const delays = new Set<number>();
      
      // Generate multiple delays to check for variation
      for (let i = 0; i < 10; i++) {
        delays.add(handler.calculateDelay(0));
      }

      // With jitter, we should get different values
      expect(delays.size).toBeGreaterThan(1);
    });

    it('should keep jitter within 0-500ms range', () => {
      const baseDelay = 1000;
      const handlerWithJitter = new ErrorHandler({
        maxRetries: 3,
        backoffType: 'exponential',
        baseDelay,
        jitter: true,
      });

      for (let i = 0; i < 100; i++) {
        const delay = handlerWithJitter.calculateDelay(0);
        expect(delay).toBeGreaterThanOrEqual(baseDelay);
        expect(delay).toBeLessThanOrEqual(baseDelay + 500);
      }
    });
  });

  describe('shouldRetry', () => {
    it('should allow retry on first attempt with retryable error', () => {
      const error = new Error('Rate limit');
      (error as any).status = 429;
      
      const context: ErrorContext = {
        error,
        attempt: 0,
        providerId: 'openai',
        operation: 'chatCompletion',
      };

      const decision = handler.shouldRetry(context);
      
      expect(decision.shouldRetry).toBe(true);
      expect(decision.delay).toBeGreaterThan(0);
      expect(decision.reason).toContain('retryable');
    });

    it('should NOT retry after max attempts', () => {
      const error = new Error('Rate limit');
      (error as any).status = 429;
      
      const context: ErrorContext = {
        error,
        attempt: 3, // maxRetries = 3
        providerId: 'openai',
        operation: 'chatCompletion',
      };

      const decision = handler.shouldRetry(context);
      
      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toContain('Max retries');
    });

    it('should NOT retry non-retryable errors', () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      
      const context: ErrorContext = {
        error,
        attempt: 0,
        providerId: 'openai',
        operation: 'chatCompletion',
      };

      const decision = handler.shouldRetry(context);
      
      expect(decision.shouldRetry).toBe(false);
      expect(decision.reason).toContain('not retryable');
    });

    it('should include attempt number in decision', () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      
      const context: ErrorContext = {
        error,
        attempt: 1,
        providerId: 'openai',
        operation: 'chatCompletion',
      };

      const decision = handler.shouldRetry(context);
      
      expect(decision.shouldRetry).toBe(true);
      expect(decision.nextAttempt).toBe(2);
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await handler.executeWithRetry(
        operation,
        { providerId: 'openai', operation: 'test' }
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failure and succeed', async () => {
      const error = new Error('Rate limit');
      (error as any).status = 429;
      
      const operation = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      // Speed up test by reducing delays
      const fastHandler = new ErrorHandler({
        maxRetries: 3,
        backoffType: 'exponential',
        baseDelay: 10,
        jitter: false,
      });

      const result = await fastHandler.executeWithRetry(
        operation,
        { providerId: 'openai', operation: 'test' }
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exceeded', async () => {
      const error = new Error('Rate limit');
      (error as any).status = 429;
      
      const operation = vi.fn().mockRejectedValue(error);

      const fastHandler = new ErrorHandler({
        maxRetries: 2,
        backoffType: 'exponential',
        baseDelay: 10,
        jitter: false,
      });

      await expect(
        fastHandler.executeWithRetry(
          operation,
          { providerId: 'openai', operation: 'test' }
        )
      ).rejects.toThrow('Max retries (2) exceeded');

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should NOT retry non-retryable errors', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.executeWithRetry(
          operation,
          { providerId: 'openai', operation: 'test' }
        )
      ).rejects.toThrow('Unauthorized');

      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });

    it('should respect custom retry config', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      
      const operation = vi.fn().mockRejectedValue(error);

      const customHandler = new ErrorHandler({
        maxRetries: 1,
        backoffType: 'linear',
        baseDelay: 10,
        jitter: false,
      });

      await expect(
        customHandler.executeWithRetry(
          operation,
          { providerId: 'openai', operation: 'test' }
        )
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('getRetryConfig', () => {
    it('should return current retry configuration', () => {
      const config = handler.getRetryConfig();
      
      expect(config.maxRetries).toBe(3);
      expect(config.backoffType).toBe('exponential');
      expect(config.baseDelay).toBe(1000);
    });
  });
});
