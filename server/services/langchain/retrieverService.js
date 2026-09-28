const { MemoryVectorStore } = require('@langchain/core/vectorstores');
const { Document } = require('@langchain/core/documents');
const EmbeddingService = require('./embeddingService');
const DocumentService = require('./documentService');

class RetrieverService {
  constructor() {
    // In-memory cache of vector stores by documentId or conversationId
    this.vectorStoreCache = new Map();
  }

  /**
   * Initializes or loads a vector store populated with chunks from MySQL
   */
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
    const vectorStore = new MemoryVectorStore(embeddings);

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

  /**
   * Performs vector similarity search with top-K results
   */
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

  /**
   * Clears cache for a document on deletion
   */
  clearCache(documentId) {
    this.vectorStoreCache.delete(`doc_${documentId}`);
  }
}

module.exports = new RetrieverService();
