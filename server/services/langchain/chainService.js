const { StringOutputParser } = require('@langchain/core/output_parsers');
const ModelFactory = require('./modelFactory');
const PromptService = require('./promptService');
const MemoryService = require('./memoryService');

class ChainService {
  /**
   * Constructs a modern Runnable conversational chain:
   * PromptTemplate -> ChatModel -> StringOutputParser
   */
  static createChatChain({
    provider = 'openrouter',
    model,
    streaming = false,
    customSystemPrompt,
  }) {
    const chatModel = ModelFactory.createModel({
      provider,
      model,
      streaming,
    });

    const prompt = PromptService.getGeneralChatPrompt(customSystemPrompt);
    const outputParser = new StringOutputParser();

    const chain = prompt.pipe(chatModel).pipe(outputParser);

    return {
      chain,
      model: chatModel,
    };
  }

  /**
   * Invokes chat chain synchronously with MySQL conversation memory
   */
  static async invokeChatChain({
    provider = 'openrouter',
    model,
    conversationId,
    message,
    customSystemPrompt,
  }) {
    // 1. Get previous messages from MySQL
    const history = await MemoryService.getConversationHistory(conversationId);

    // 2. Build Runnable chain
    const { chain } = this.createChatChain({
      provider,
      model,
      streaming: false,
      customSystemPrompt,
    });

    // 3. Execute chain with input and history
    const responseText = await chain.invoke({
      input: message,
      history,
    });

    return {
      content: responseText.trim(),
      provider,
      model,
    };
  }

  /**
   * Streams token chunks from Runnable chain for Server-Sent Events (SSE)
   */
  static async streamChatChain({
    provider = 'openrouter',
    model,
    conversationId,
    message,
    customSystemPrompt,
    onToken,
  }) {
    const history = await MemoryService.getConversationHistory(conversationId);

    const { chain } = this.createChatChain({
      provider,
      model,
      streaming: true,
      customSystemPrompt,
    });

    const stream = await chain.stream({
      input: message,
      history,
    });

    let fullText = '';
    for await (const chunk of stream) {
      fullText += chunk;
      if (onToken) {
        onToken(chunk);
      }
    }

    return fullText;
  }

  /**
   * Invokes summarization Runnable chain
   */
  static async invokeSummarizationChain({
    provider = 'openrouter',
    model,
    text,
  }) {
    const chatModel = ModelFactory.createModel({
      provider,
      model,
    });
    const prompt = PromptService.getSummarizationPrompt();
    const chain = prompt.pipe(chatModel).pipe(new StringOutputParser());

    const result = await chain.invoke({ input: text });
    return result.trim();
  }

  /**
   * Invokes structured JSON output extraction
   */
  static async invokeStructuredChain({
    provider = 'openrouter',
    model,
    text,
  }) {
    const chatModel = ModelFactory.createModel({
      provider,
      model,
      temperature: 0.1,
    });
    const prompt = PromptService.getStructuredPrompt();
    const chain = prompt.pipe(chatModel).pipe(new StringOutputParser());

    const raw = await chain.invoke({ input: text });
    try {
      // Find JSON block if wrapped in markdown
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(raw);
    } catch (err) {
      return { summary: raw, key_points: [], entities: [] };
    }
  }
}

module.exports = ChainService;
