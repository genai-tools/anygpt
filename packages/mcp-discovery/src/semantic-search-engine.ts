import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import type { ToolMetadata, SearchOptions, SearchResult } from './types.js';

/**
 * Semantic search engine using embeddings for tool discovery
 */
export class SemanticSearchEngine {
  private embedder: FeatureExtractionPipeline | null = null;
  private tools: ToolMetadata[] = [];
  private toolEmbeddings: Map<string, number[]> = new Map();
  private initialized = false;
  private logger?: { debug: (message: string) => void };

  constructor(logger?: { debug: (message: string) => void }) {
    this.logger = logger;
  }

  /**
   * Initialize the embedding model
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger?.debug('[SemanticSearch] Loading embedding model...');
    // Use default model for feature-extraction with auto dtype to suppress warnings
    this.embedder = await pipeline('feature-extraction', null, { dtype: 'fp32' });
    this.initialized = true;
    this.logger?.debug('[SemanticSearch] Model loaded successfully');
  }

  /**
   * Index tools for semantic search
   * 
   * @param tools - Array of tool metadata to index
   */
  async index(tools: ToolMetadata[]): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.tools = tools;
    this.toolEmbeddings.clear();

    this.logger?.debug(`[SemanticSearch] Indexing ${tools.length} tools...`);

    for (const tool of tools) {
      // Create searchable text from tool metadata
      const searchText = [
        tool.server,
        tool.name,
        tool.summary,
        tool.description,
        ...(tool.tags || []),
      ].filter(Boolean).join(' ');

      // Generate embedding
      const embedding = await this.embed(searchText);
      this.toolEmbeddings.set(`${tool.server}::${tool.name}`, embedding);
    }

    this.logger?.debug('[SemanticSearch] Indexing complete');
  }

  /**
   * Search for tools using semantic similarity
   * 
   * @param query - Search query
   * @param options - Search options
   * @returns Array of search results sorted by relevance
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    if (!this.initialized || this.toolEmbeddings.size === 0) {
      throw new Error('Semantic search not initialized. Call initialize() and index() first.');
    }

    // Filter tools
    let filteredTools = this.tools;

    // Filter by server if specified
    if (options?.server) {
      filteredTools = filteredTools.filter(t => t.server === options.server);
    }

    // Filter by enabled status (exclude disabled by default)
    if (!options?.includeDisabled) {
      filteredTools = filteredTools.filter(t => t.enabled);
    }

    // Generate query embedding
    const queryEmbedding = await this.embed(query);

    // Calculate similarity scores
    const results: SearchResult[] = [];

    for (const tool of filteredTools) {
      const toolKey = `${tool.server}::${tool.name}`;
      const toolEmbedding = this.toolEmbeddings.get(toolKey);

      if (!toolEmbedding) continue;

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, toolEmbedding);

      results.push({
        server: tool.server,
        tool: tool.name,
        summary: tool.summary,
        relevance: similarity,
        tags: tool.tags,
        inputSchema: tool.inputSchema
      });
    }

    // Sort by relevance (descending)
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply limit if specified
    if (options?.limit && options.limit > 0) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Generate embedding for text
   */
  private async embed(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedder not initialized');
    }

    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true
    });

    // Convert tensor to array
    return Array.from(output.data as Float32Array);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
