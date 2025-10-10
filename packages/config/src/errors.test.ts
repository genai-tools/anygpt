/**
 * Tests for custom error types
 */

import { describe, it, expect } from 'vitest';
import {
  ConfigError,
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  ConnectorLoadError,
} from './errors.js';

describe('errors', () => {
  describe('ConfigError', () => {
    it('should create base error with message', () => {
      const error = new ConfigError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ConfigError');
    });

    it('should capture stack trace', () => {
      const error = new ConfigError('Test error');

      expect(error.stack).toBeDefined();
    });
  });

  describe('ConfigNotFoundError', () => {
    it('should create error with search paths', () => {
      const searchPaths = [
        './.anygpt/anygpt.config.ts',
        './anygpt.config.ts',
        '~/.anygpt/anygpt.config.ts',
      ];
      const error = new ConfigNotFoundError(searchPaths);

      expect(error).toBeInstanceOf(ConfigError);
      expect(error.name).toBe('ConfigNotFoundError');
      expect(error.searchPaths).toEqual(searchPaths);
      expect(error.message).toContain('./.anygpt/anygpt.config.ts');
      expect(error.message).toContain('Create a config file');
    });

    it('should format search paths in message', () => {
      const searchPaths = ['path1', 'path2'];
      const error = new ConfigNotFoundError(searchPaths);

      expect(error.message).toContain('path1');
      expect(error.message).toContain('path2');
    });
  });

  describe('ConfigParseError', () => {
    it('should create error with file path and original error', () => {
      const originalError = new Error('Syntax error');
      const error = new ConfigParseError('/path/to/config.ts', originalError);

      expect(error).toBeInstanceOf(ConfigError);
      expect(error.name).toBe('ConfigParseError');
      expect(error.filePath).toBe('/path/to/config.ts');
      expect(error.originalError).toBe(originalError);
      expect(error.message).toContain('/path/to/config.ts');
      expect(error.message).toContain('Syntax error');
    });

    it('should handle non-Error original error', () => {
      const error = new ConfigParseError('/path/to/config.ts', 'String error');

      expect(error.message).toContain('String error');
    });

    it('should include helpful suggestion', () => {
      const error = new ConfigParseError(
        '/path/to/config.ts',
        new Error('Test')
      );

      expect(error.message).toContain('Check your configuration file syntax');
    });
  });

  describe('ConfigValidationError', () => {
    it('should create error with validation errors', () => {
      const errors = [
        'Provider "openai" is missing connector',
        'Invalid model configuration',
      ];
      const error = new ConfigValidationError(errors);

      expect(error).toBeInstanceOf(ConfigError);
      expect(error.name).toBe('ConfigValidationError');
      expect(error.errors).toEqual(errors);
      expect(error.message).toContain('Provider "openai" is missing connector');
      expect(error.message).toContain('Invalid model configuration');
    });

    it('should format multiple errors', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      const error = new ConfigValidationError(errors);

      expect(error.message).toContain('Error 1');
      expect(error.message).toContain('Error 2');
      expect(error.message).toContain('Error 3');
    });

    it('should include helpful suggestion', () => {
      const error = new ConfigValidationError(['Test error']);

      expect(error.message).toContain('Fix the errors above');
    });
  });

  describe('ConnectorLoadError', () => {
    it('should create error with connector details', () => {
      const originalError = new Error('Module not found');
      const error = new ConnectorLoadError(
        '@anygpt/openai',
        'openai-main',
        originalError
      );

      expect(error).toBeInstanceOf(ConfigError);
      expect(error.name).toBe('ConnectorLoadError');
      expect(error.connectorPackage).toBe('@anygpt/openai');
      expect(error.providerId).toBe('openai-main');
      expect(error.originalError).toBe(originalError);
      expect(error.message).toContain('@anygpt/openai');
      expect(error.message).toContain('openai-main');
      expect(error.message).toContain('Module not found');
    });

    it('should include installation suggestion', () => {
      const error = new ConnectorLoadError(
        '@anygpt/openai',
        'openai',
        new Error('Test')
      );

      expect(error.message).toContain('npm install @anygpt/openai');
    });

    it('should handle non-Error original error', () => {
      const error = new ConnectorLoadError(
        '@anygpt/openai',
        'openai',
        'String error'
      );

      expect(error.message).toContain('String error');
    });
  });

  describe('Error inheritance', () => {
    it('should allow catching all config errors', () => {
      const errors = [
        new ConfigNotFoundError([]),
        new ConfigParseError('path', new Error()),
        new ConfigValidationError([]),
        new ConnectorLoadError('pkg', 'id', new Error()),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(ConfigError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('should allow specific error catching', () => {
      const error = new ConfigParseError('path', new Error());

      try {
        throw error;
      } catch (e) {
        expect(e).toBeInstanceOf(ConfigParseError);
        expect(e).toBeInstanceOf(ConfigError);
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});
