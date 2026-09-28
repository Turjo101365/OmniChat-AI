const langsmithService = require('../services/langsmith/langsmithService');

class LangSmithController {
  /**
   * GET /api/langsmith/status
   */
  static async getStatus(req, res, next) {
    try {
      const status = await langsmithService.getStatus();
      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/langsmith/runs
   */
  static async getRuns(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '10', 10);
      const runs = await langsmithService.getRecentRuns(limit);
      return res.status(200).json({
        success: true,
        count: runs.length,
        data: runs,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LangSmithController;
