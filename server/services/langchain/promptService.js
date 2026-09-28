const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');

class PromptService {
  /**
   * General Conversational Chat Prompt Template with message history
   */
  static getGeneralChatPrompt(customSystemPrompt) {
    const systemText =
      customSystemPrompt ||
      'You are OmniChat AI, an intelligent, helpful, and precise AI assistant. Answer the user clearly and accurately.';

    return ChatPromptTemplate.fromMessages([
      ['system', systemText],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);
  }

  /**
   * RAG Prompt Template: strictly grounded on retrieved document context
   */
  static getRagPrompt() {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a knowledgeable document analysis assistant.
Use exclusively the provided document context to answer the user's question.
If the answer cannot be found or deduced from the provided context, clearly say: "I could not find the answer to that in the uploaded documents."
Do NOT invent or fabricate facts outside the context. Always be concise, clear, and cite relevant sections or facts where possible.

Context:
{context}`,
      ],
      new MessagesPlaceholder('history'),
      ['human', '{question}'],
    ]);
  }

  /**
   * Summarization Prompt Template
   */
  static getSummarizationPrompt() {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are an expert summarizer. Provide a clean, structured summary with key takeaways and bullet points of the following content.',
      ],
      ['human', 'Content to summarize:\n\n{input}'],
    ]);
  }

  /**
   * Structured Output Extraction Prompt Template
   */
  static getStructuredPrompt() {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a structured data extractor. Analyze the input and respond ONLY with a valid JSON object following this format:
{
  "summary": "Brief summary",
  "key_points": ["point 1", "point 2"],
  "entities": ["entity 1", "entity 2"]
}`,
      ],
      ['human', '{input}'],
    ]);
  }
}

module.exports = PromptService;
