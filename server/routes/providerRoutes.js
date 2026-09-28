const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');

// List supported providers and their configuration status
router.get('/', providerController.listProviders);

// Provider models endpoints
router.get('/huggingface/models', providerController.getHuggingFaceModels);
router.get('/openrouter/models', providerController.getOpenRouterModels);
router.get('/:provider/models', providerController.getModelsByProvider);

module.exports = router;
