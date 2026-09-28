const { OpenAIEmbeddings } = require('@langchain/openai');
const config = require('../../config/env');

/**
 * Local Lightweight Deterministic Vectorizer fallback.
 * Generates normalized 384-dimensional embeddings from text tokens using hashing + n-grams.
 * Guaranteed 100% availability offline without consuming external API credits.
 */
class LocalDeterministicEmbeddings {
  constructor(dimensions = 384) {
    this.dimensions = dimensions;
  }

  _vectorize(text) {
    const vector = new Array(this.dimensions).fill(0);
    const words = (text || '').toLowerCase().match(/\b\w+\b/g) || [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash * 31 + word.charCodeAt(j)) & 0xffffffff;
      }
      const idx = Math.abs(hash) % this.dimensions;
      vector[idx] += 1;
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = vector[i] / norm;
    }

    return vector;
  }

  async embedDocuments(documents) {
    return documents.map((doc) => this._vectorize(doc));
  }

  async embedQuery(text) {
    return this._vectorize(text);
  }
}

class EmbeddingService {
  /**
   * Factory returning an active Embeddings provider.
   * If OPENROUTER_API_KEY is available and external embeddings are configured, uses OpenAIEmbeddings.
   * Otherwise gracefully uses the LocalDeterministicEmbeddings engine.
   */
  static createEmbeddingModel() {
    const provider = (process.env.EMBEDDING_PROVIDER || 'local').toLowerCase().trim();

    if (provider === 'openrouter' && config.providers.openrouter.apiKey) {
      try {
        return new OpenAIEmbeddings({
          modelName: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
          apiKey: config.providers.openrouter.apiKey,
          configuration: {
            baseURL: 'https://openrouter.ai/api/v1',
          },
        });
      } catch (e) {
        console.warn('[EmbeddingService] Failed to init OpenRouter embeddings, falling back to local:', e.message);
      }
    }

    // Default fast deterministic vectorizer
    return new LocalDeterministicEmbeddings(384);
  }
}

module.exports = EmbeddingService;
