const providerManager = require('../services/providers/providerManager');

class ProviderController {
  static async listProviders(req, res, next) {
    try {
      const providers = await providerManager.getProvidersList();
      res.status(200).json({
        success: true,
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHuggingFaceModels(req, res, next) {
    try {
      const models = await providerManager.getModels('huggingface');
      res.status(200).json({
        success: true,
        provider: 'huggingface',
        data: models,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOpenRouterModels(req, res, next) {
    try {
      const models = await providerManager.getModels('openrouter');
      res.status(200).json({
        success: true,
        provider: 'openrouter',
        data: models,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getModelsByProvider(req, res, next) {
    try {
      const { provider } = req.params;
      const models = await providerManager.getModels(provider);
      res.status(200).json({
        success: true,
        provider,
        data: models,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProviderController;
