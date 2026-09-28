const { StringOutputParser } = require('@langchain/core/output_parsers');
const retrieverService = require('./retrieverService');
const ModelFactory = require('./modelFactory');
const PromptService = require('./promptService');
const MemoryService = require('./memoryService');
const DocumentService = require('./documentService');

class RagService {
  /**
   * Executes complete RAG pipeline:
   * 1. Similarity search in vector store
   * 2. Assembly of grounded context
   * 3. Prompt execution with conversation history
   * 4. Return answer + verified source citations
   */
  static async query({
    provider = 'openrouter',
    model,
    documentId,
    conversationId,
    question,
    k = 4,
  }) {
    if (!question || !question.trim()) {
      throw new Error('A question is required for RAG document query.');
    }

    // If no documentId was specified, pick the most recent document for the conversation or user
    let targetDocId = documentId;
    if (!targetDocId) {
      const docs = await DocumentService.listDocuments(1, conversationId);
      if (docs.length === 0) {
        throw new Error('No uploaded documents found. Please upload a PDF or text document first.');
      }
      targetDocId = docs[0].id;
    }

    // 1. Retrieve most relevant document chunks via vector similarity
    const relevantChunks = await retrieverService.searchSimilarChunks({
      documentId: targetDocId,
      query: question,
      k,
    });

    if (relevantChunks.length === 0) {
      return {
        answer: 'No relevant context could be found in the uploaded documents to answer your question.',
        sources: [],
      };
    }

    // 2. Format context string with clear document & page boundaries
    const contextString = relevantChunks
      .map(
        (c) =>
          `--- SOURCE: ${c.document} (Page ${c.page}) ---\n${c.content.trim()}`
      )
      .join('\n\n');

    // 3. Prepare Chat Model & Prompt
    const chatModel = ModelFactory.createModel({
      provider,
      model,
      temperature: 0.2, // low temperature for high precision grounding
    });

    const prompt = PromptService.getRagPrompt();
    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(chatModel).pipe(outputParser);

    // 4. Retrieve message history if conversationId provided
    const history = conversationId
      ? await MemoryService.getConversationHistory(conversationId, 6)
      : [];

    // 5. Generate Answer
    const answer = await chain.invoke({
      context: contextString,
      question: question.trim(),
      history,
    });

    // 6. Format unique Source Citations
    const seenSources = new Set();
    const sources = [];

    for (const chunk of relevantChunks) {
      const key = `${chunk.document}_p${chunk.page}`;
      if (!seenSources.has(key)) {
        seenSources.add(key);
        sources.push({
          document: chunk.document,
          page: chunk.page,
          snippet: chunk.content.slice(0, 160) + (chunk.content.length > 160 ? '...' : ''),
        });
      }
    }

    return {
      answer: answer.trim(),
      sources,
      documentId: targetDocId,
      provider,
      model,
    };
  }
}

module.exports = RagService;
