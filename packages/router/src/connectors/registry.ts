import type { ConnectorConfig } from './base/index.js';
import type { IConnector } from '../types/connector.js';

export interface ConnectorFactory {
  create(config: ConnectorConfig): IConnector;
  getProviderId(): string;
}

export class ConnectorRegistry {
  private factories = new Map<string, ConnectorFactory>();

  registerConnector(factory: ConnectorFactory): void {
    const connectorType = factory.getProviderId(); // This is actually the connector type, not provider ID
    // Allow multiple providers to use the same connector type - only register if not already present
    if (!this.factories.has(connectorType)) {
      this.factories.set(connectorType, factory);
    }
  }

  createConnector(
    providerId: string,
    config: ConnectorConfig = {}
  ): IConnector {
    const factory = this.factories.get(providerId);
    if (!factory) {
      throw new Error(`No connector registered for provider: ${providerId}`);
    }

    return factory.create(config);
  }

  getConnector(providerId: string, config: ConnectorConfig = {}): IConnector {
    // Connectors are stateless, just create a new instance
    // For factory configs, the factory returns the pre-instantiated connector
    return this.createConnector(providerId, config);
  }

  hasConnector(providerId: string): boolean {
    return this.factories.has(providerId);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.factories.keys());
  }

  unregisterConnector(providerId: string): boolean {
    return this.factories.delete(providerId);
  }

  clear(): void {
    this.factories.clear();
  }

  // Utility method to get all models from all registered providers
  async getAllModels(): Promise<
    Array<{ provider: string; models: unknown[] }>
  > {
    const results = [];

    for (const [providerId, factory] of this.factories) {
      try {
        const connector = factory.create({});
        const models = await connector.listModels();
        results.push({ provider: providerId, models });
      } catch (error) {
        console.warn(`Failed to get models from ${providerId}:`, error);
      }
    }

    return results;
  }
}

// Global registry instance
export const globalConnectorRegistry = new ConnectorRegistry();

export default ConnectorRegistry;
