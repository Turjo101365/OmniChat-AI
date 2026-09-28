const { StateGraph, Annotation, START, END, MemorySaver } = require('@langchain/langgraph');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const ModelFactory = require('../langchain/modelFactory');
const MemoryService = require('../langchain/memoryService');
const retrieverService = require('../langchain/retrieverService');
const DocumentService = require('../langchain/documentService');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const UsageLog = require('../../models/UsageLog');
const config = require('../../config/env');
const langsmithService = require('../langsmith/langsmithService');

// Define State Schema for the Agent Graph
const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  input: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  task: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'chat',
  }),
  documentId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  conversationId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  provider: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'openrouter',
  }),
  model: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  customSystemPrompt: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  context: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  sources: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  response: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  steps: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  tokenUsage: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

class GraphService {
  constructor() {
    this.memorySaver = new MemorySaver();
    this.workflow = this.buildWorkflow();
    this.app = this.workflow.compile({ checkpointer: this.memorySaver });
  }

  /**
   * Constructs the Multi-Node LangGraph StateGraph
   */
  buildWorkflow() {
    return new StateGraph(AgentState)
      // 1. Classifier Node: Analyzes intent and determines task
      .addNode('classifier', async (state) => {
        const query = (state.input || '').toLowerCase();
        let determinedTask = state.task;

        // If explicit task wasn't specified, intelligently infer
        if (!state.task || state.task === 'chat') {
          if (
            state.documentId ||
            query.includes('document') ||
            query.includes('uploaded file') ||
            query.includes('according to the pdf')
          ) {
            determinedTask = 'rag';
          } else if (
            query.startsWith('summarize') ||
            query.startsWith('summary of') ||
            query.includes('give me a summary')
          ) {
            determinedTask = 'summary';
          } else if (
            query.includes('step by step') ||
            query.includes('explain how') ||
            query.includes('analyze') ||
            query.includes('solve this')
          ) {
            determinedTask = 'reasoning';
          } else {
            determinedTask = 'chat';
          }
        }

        return {
          task: determinedTask,
          steps: [{ node: 'classifier', task: determinedTask, timestamp: Date.now() }],
        };
      })

      // 2. Retriever Node: Retrieves document chunks from vector store when task is RAG
      .addNode('retriever', async (state) => {
        let sources = [];
        let contextText = '';

        try {
          let targetDocId = state.documentId;
          if (!targetDocId) {
            const docs = await DocumentService.listDocuments(1, state.conversationId);
            if (docs.length > 0) {
              targetDocId = docs[0].id;
            }
          }

          if (targetDocId) {
            const chunks = await retrieverService.searchSimilarChunks({
              documentId: targetDocId,
              query: state.input,
              k: 4,
            });

            if (chunks.length > 0) {
              contextText = chunks
                .map((c) => `--- SOURCE: ${c.document} (Page ${c.page}) ---\n${c.content.trim()}`)
                .join('\n\n');

              const seen = new Set();
              for (const c of chunks) {
                const key = `${c.document}_p${c.page}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  sources.push({
                    document: c.document,
                    page: c.page,
                    snippet: c.content.slice(0, 160) + (c.content.length > 160 ? '...' : ''),
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn('LangGraph retriever warning:', err.message);
        }

        return {
          context: contextText,
          sources,
          steps: [{ node: 'retriever', chunksFound: sources.length, timestamp: Date.now() }],
        };
      })

      // 3. Generator Node: Invokes LLM with task-specific instructions & context
      .addNode('generator', async (state) => {
        const provider = state.provider || 'openrouter';
        const model = state.model || '';

        const chatModel = ModelFactory.createModel({
          provider,
          model,
          streaming: false,
        });

        // Determine System Prompt based on intent
        let systemPromptText = state.customSystemPrompt || 'You are an advanced, helpful AI assistant.';
        if (state.task === 'rag' && state.context) {
          systemPromptText =
            'You are an expert AI researcher. Answer the question using ONLY the provided document context below.\n' +
            'Cite sources clearly. If the answer cannot be found in the context, politely state that.\n\n' +
            `DOCUMENT CONTEXT:\n${state.context}`;
        } else if (state.task === 'reasoning') {
          systemPromptText =
            'You are an analytical AI reasoning engine. Provide a structured, step-by-step breakdown of your thinking ' +
            'before presenting your final comprehensive answer.';
        } else if (state.task === 'summary') {
          systemPromptText =
            'You are an executive summarizer. Synthesize the core ideas into concise bullet points followed by actionable takeaways.';
        }

        const messagesToSend = [
          new SystemMessage(systemPromptText),
          ...state.messages,
          new HumanMessage(state.input),
        ];

        const responseObj = await chatModel.invoke(messagesToSend);
        const textContent =
          typeof responseObj.content === 'string'
            ? responseObj.content
            : JSON.stringify(responseObj.content);

        return {
          response: textContent.trim(),
          tokenUsage: responseObj.response_metadata?.tokenUsage || null,
          steps: [{ node: 'generator', provider, model, timestamp: Date.now() }],
        };
      })

      // 4. Refiner Node: Appends citations or formatting enhancements
      .addNode('refiner', async (state) => {
        let finalResponse = state.response;

        // If RAG sources were used, append clean markdown citations footer if not already present
        if (state.sources && state.sources.length > 0 && !finalResponse.includes('📚 **Sources & References**')) {
          const citations = state.sources
            .map((s, idx) => `[${idx + 1}] **${s.document}** (Page ${s.page}): "${s.snippet}"`)
            .join('\n');
          finalResponse = `${finalResponse}\n\n---\n📚 **Sources & References:**\n${citations}`;
        }

        return {
          response: finalResponse,
          steps: [{ node: 'refiner', timestamp: Date.now() }],
        };
      })

      // Edges configuration
      .addEdge(START, 'classifier')
      .addConditionalEdges(
        'classifier',
        (state) => (state.task === 'rag' ? 'retriever' : 'generator'),
        ['retriever', 'generator']
      )
      .addEdge('retriever', 'generator')
      .addEdge('generator', 'refiner')
      .addEdge('refiner', END);
  }

  /**
   * Synchronously process chat request through LangGraph with MySQL persistence and LangSmith tracing
   */
  async processChat({
    userId = 1,
    conversationId = null,
    provider = 'openrouter',
    model,
    message,
    task = 'chat',
    documentId = null,
    customSystemPrompt,
  }) {
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new Error('Message is required.');
    }

    // 1. Get or create conversation in MySQL
    let activeConv = null;
    if (conversationId) {
      activeConv = await Conversation.findById(conversationId);
    }
    if (!activeConv) {
      const title = message.trim().slice(0, 45) + (message.length > 45 ? '...' : '');
      activeConv = await Conversation.create({
        userId,
        title,
        provider: `langgraph (${provider})`,
        model: model || 'default',
      });
    }

    const convId = activeConv.id;
    const threadId = `thread-${convId}`;

    // 2. Persist user message in MySQL
    const userMsg = await Message.create({
      conversationId: convId,
      role: 'user',
      content: message.trim(),
      provider: 'langgraph',
      model: model || 'langgraph-model',
    });

    // 3. Retrieve conversation history from MySQL for graph context
    const history = await MemoryService.getConversationHistory(convId, 10);

    // 4. Configure LangSmith trace settings
    const traceConfig = langsmithService.getTraceConfig({
      runName: 'LangGraph-AgentExecution',
      tags: ['langgraph', 'agent', provider, task],
      metadata: {
        conversationId: convId,
        threadId,
        userId,
        provider,
        model: model || 'default',
        engine: 'langgraph',
      },
    });

    // 5. Invoke LangGraph
    const initialState = {
      messages: history,
      input: message.trim(),
      task,
      documentId: documentId ? parseInt(documentId, 10) : null,
      conversationId: convId,
      provider,
      model,
      customSystemPrompt,
    };

    const graphResult = await this.app.invoke(initialState, {
      configurable: { thread_id: threadId },
      ...traceConfig,
    });

    const assistantContent = graphResult.response || 'No response generated.';
    const sources = graphResult.sources || [];
    const steps = graphResult.steps || [];

    // 6. Persist assistant message in MySQL
    const tokenMetadata = {
      task: graphResult.task,
      engine: 'langgraph',
      stepsCount: steps.length,
      hasSources: sources.length > 0,
      sources,
      provider,
      model,
    };

    const assistantMsg = await Message.create({
      conversationId: convId,
      role: 'assistant',
      content: assistantContent,
      provider: 'langgraph',
      model: model || 'langgraph-model',
      tokenUsage: tokenMetadata,
    });

    // 7. Record usage log
    await UsageLog.create({
      userId,
      conversationId: convId,
      provider: 'langgraph',
      model: model || 'langgraph-model',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });

    // 8. Update conversation
    await Conversation.update(convId, {
      provider: `langgraph (${provider})`,
      model: model || 'default',
    });

    return {
      conversationId: convId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      task: graphResult.task,
      sources,
      steps,
      provider,
      model,
      langsmithProject: config.langsmith.project,
    };
  }

  /**
   * Get current state of a thread from checkpointer
   */
  async getThreadState(threadId) {
    try {
      const state = await this.app.getState({ configurable: { thread_id: threadId } });
      return state;
    } catch (err) {
      return null;
    }
  }
}

module.exports = new GraphService();
