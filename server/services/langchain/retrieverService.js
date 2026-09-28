const { Document } = require('@langchain/core/documents');
const EmbeddingService = require('./embeddingService');
const DocumentService = require('./documentService');

let MemoryVectorStore = null;
try {
  const classic = require('@langchain/classic/vectorstores/memory');
  MemoryVectorStore = classic.MemoryVectorStore;
} catch (e) {
  // fallback to custom lightweight vector store below
}

/**
 * Robust In-Memory Vector Store with Cosine Similarity Search
 */
class LocalVectorStore {
  constructor(embeddings) {
    this.embeddings = embeddings;
    this.documents = [];
    this.vectors = [];
  }

  async addDocuments(docs) {
    for (const doc of docs) {
      const vec = await this.embeddings.embedQuery(doc.pageContent);
      this.documents.push(doc);
      this.vectors.push(vec);
    }
  }

  cosineSimilarity(a, b) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  async similaritySearch(query, k = 4) {
    if (this.documents.length === 0) return [];
    const queryVec = await this.embeddings.embedQuery(query);

    const scored = this.documents.map((doc, idx) => ({
      doc,
      score: this.cosineSimilarity(queryVec, this.vectors[idx]),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((s) => s.doc);
  }
}

class RetrieverService {
  constructor() {
    this.vectorStoreCache = new Map();
  }

  async getVectorStoreForDocument(documentId) {
    const cacheKey = `doc_${documentId}`;
    if (this.vectorStoreCache.has(cacheKey)) {
      return this.vectorStoreCache.get(cacheKey);
    }

    const chunks = await DocumentService.getChunksByDocumentId(documentId);
    if (!chunks || chunks.length === 0) {
      throw new Error(`No document chunks found in database for Document ID ${documentId}.`);
    }

    const embeddings = EmbeddingService.createEmbeddingModel();
    let vectorStore;

    if (MemoryVectorStore) {
      try {
        vectorStore = new MemoryVectorStore(embeddings);
      } catch (e) {
        vectorStore = new LocalVectorStore(embeddings);
      }
    } else {
      vectorStore = new LocalVectorStore(embeddings);
    }

    const langchainDocs = chunks.map(
      (c) =>
        new Document({
          pageContent: c.content,
          metadata: c.metadata || {},
        })
    );

    await vectorStore.addDocuments(langchainDocs);
    this.vectorStoreCache.set(cacheKey, vectorStore);
    return vectorStore;
  }

  async searchSimilarChunks({ documentId, query, k = 4 }) {
    const vectorStore = await this.getVectorStoreForDocument(documentId);
    const results = await vectorStore.similaritySearch(query, k);

    return results.map((doc, idx) => ({
      index: idx,
      content: doc.pageContent,
      metadata: doc.metadata || {},
      document: doc.metadata?.document || 'Document',
      page: doc.metadata?.page || 1,
    }));
  }

  clearCache(documentId) {
    this.vectorStoreCache.delete(`doc_${documentId}`);
  }
}

module.exports = new RetrieverService();
