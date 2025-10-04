import type { ConnectorConfig } from './base/index.js';
import type { IConnector } from '../types/connector.js';

export interface ConnectorFactory {
  create(config: ConnectorConfig): IConnector;
  getProviderId(): string;
}

export class ConnectorRegistry {
  private factories = new Map<string, ConnectorFactory>();
  private instances = new Map<string, IConnector>();

  registerConnector(factory: ConnectorFactory): void {
    const connectorType = factory.getProviderId(); // This is actually the connector type, not provider ID
    // Allow multiple providers to use the same connector type - only register if not already present
    if (!this.factories.has(connectorType)) {
      this.factories.set(connectorType, factory);
    }
  }

  createConnector(providerId: string, config: ConnectorConfig = {}): IConnector {
    const factory = this.factories.get(providerId);
    if (!factory) {
      throw new Error(`No connector registered for provider: ${providerId}`);
    }

    // Create new instance
    const connector = factory.create(config);
    
    // Store instance for reuse if needed
    const instanceKey = `${providerId}_${JSON.stringify(config)}`;
    this.instances.set(instanceKey, connector);
    
    return connector;
  }

  getConnector(providerId: string, config: ConnectorConfig = {}): IConnector {
    const instanceKey = `${providerId}_${JSON.stringify(config)}`;
    
    // Return existing instance if available
    if (this.instances.has(instanceKey)) {
      const existing = this.instances.get(instanceKey);
      if (existing) {
        return existing;
      }
    }

    // Create new instance
    return this.createConnector(providerId, config);
  }

  hasConnector(providerId: string): boolean {
    return this.factories.has(providerId);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.factories.keys());
  }

  unregisterConnector(providerId: string): boolean {
    // Remove factory
    const hadFactory = this.factories.delete(providerId);
    
    // Remove all instances for this provider
    const instancesToRemove = Array.from(this.instances.keys())
      .filter(key => key.startsWith(`${providerId}_`));
    
    instancesToRemove.forEach(key => this.instances.delete(key));
    
    return hadFactory;
  }

  clear(): void {
    this.factories.clear();
    this.instances.clear();
  }

  // Utility method to get all models from all registered providers
  async getAllModels(): Promise<Array<{ provider: string; models: unknown[] }>> {
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
