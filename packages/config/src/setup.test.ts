import { describe, it, expect, vi } from 'vitest';
import { setupRouterFromFactory } from './setup.js';
import { config } from './factory.js';
import { mock } from '@anygpt/mock';
import type { Logger } from '@anygpt/types';

describe('setupRouterFromFactory', () => {
  it('should inject logger into connectors when provided', async () => {
    // Create a mock logger that tracks calls
    const mockLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Create a mock connector
    const mockConnector = mock();

    // Create config
    const testConfig = config({
      providers: {
        mock: {
          connector: mockConnector,
        },
      },
    });

    // Setup router WITH logger
    const { router } = await setupRouterFromFactory(testConfig, mockLogger);

    // Verify the connector received the logger by checking if it's the same instance
    // We can't directly access protected properties, but we can verify behavior
    // by checking that the logger functions are our mocks
    const connectorLogger = (mockConnector as any).logger;
    
    expect(connectorLogger).toBe(mockLogger);
    expect(connectorLogger.debug).toBe(mockLogger.debug);
  });

  it('should not override logger when none provided', async () => {
    const mockConnector = mock();
    
    // Connector starts with NoOpLogger from BaseConnector constructor
    const originalLogger = (mockConnector as any).logger;

    const testConfig = config({
      providers: {
        mock: {
          connector: mockConnector,
        },
      },
    });

    // Setup router WITHOUT logger
    await setupRouterFromFactory(testConfig);

    // Connector should still have its original logger (NoOpLogger)
    const connectorLogger = (mockConnector as any).logger;
    expect(connectorLogger).toBe(originalLogger);
  });

  it('should inject logger into multiple connectors', async () => {
    const mockLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const connector1 = mock();
    const connector2 = mock();

    const testConfig = config({
      providers: {
        mock1: { connector: connector1 },
        mock2: { connector: connector2 },
      },
    });

    await setupRouterFromFactory(testConfig, mockLogger);

    // Both connectors should have the same logger instance
    expect((connector1 as any).logger).toBe(mockLogger);
    expect((connector2 as any).logger).toBe(mockLogger);
  });
});
