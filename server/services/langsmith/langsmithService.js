const { Client } = require('langsmith');
const config = require('../../config/env');

class LangSmithService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    if (config.langsmith.apiKey) {
      try {
        this.client = new Client({
          apiKey: config.langsmith.apiKey,
          apiUrl: config.langsmith.endpoint,
        });
      } catch (err) {
        console.error('Failed to initialize LangSmith client:', err.message);
        this.client = null;
      }
    }
  }

  isConfigured() {
    return Boolean(config.langsmith.apiKey);
  }

  /**
   * Health and connectivity status for LangSmith
   */
  async getStatus() {
    if (!this.isConfigured()) {
      return {
        configured: false,
        tracing: false,
        project: config.langsmith.project,
        endpoint: config.langsmith.endpoint,
        status: 'unconfigured',
        message: 'LANGSMITH_API_KEY is not configured.',
      };
    }

    if (!this.client) {
      this.initClient();
    }

    try {
      const project = await this.client.readProject({ projectName: config.langsmith.project });

      return {
        configured: true,
        tracing: config.langsmith.tracing,
        status: 'connected',
        projectId: project.id,
        projectName: project.name,
        endpoint: config.langsmith.endpoint,
        dashboardUrl: `https://smith.langchain.com/o/default/projects/p/${project.id}`,
        lastCheck: new Date().toISOString(),
      };
    } catch (err) {
      return {
        configured: true,
        tracing: config.langsmith.tracing,
        status: 'error',
        error: err.message,
        endpoint: config.langsmith.endpoint,
        projectName: config.langsmith.project,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch recent runs from LangSmith project
   */
  async getRecentRuns(limit = 10) {
    if (!this.client) {
      return [];
    }

    try {
      const runs = [];
      const iterator = this.client.listRuns({
        projectName: config.langsmith.project,
        limit,
      });

      for await (const r of iterator) {
        runs.push({
          id: r.id,
          name: r.name,
          runType: r.run_type,
          status: r.status,
          startTime: r.start_time,
          endTime: r.end_time,
          totalTokens: r.total_tokens,
          error: r.error,
          url: `https://smith.langchain.com/o/default/projects/p/${r.session_id}/r/${r.id}`,
        });
      }

      return runs;
    } catch (err) {
      console.warn('Error fetching LangSmith runs:', err.message);
      return [];
    }
  }

  /**
   * Helper to create LangSmith trace tags and metadata for LangChain / LangGraph calls
   */
  getTraceConfig({ tags = [], metadata = {}, runName } = {}) {
    return {
      runName: runName || 'OmniChat-Execution',
      tags: ['omnichat-ai', ...tags],
      metadata: {
        environment: config.env,
        project: config.langsmith.project,
        ...metadata,
      },
    };
  }
}

module.exports = new LangSmithService();
